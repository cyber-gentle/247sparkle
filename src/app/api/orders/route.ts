import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { koboToNaira, nairaToKobo } from '@/lib/money';
import { initializePayment } from '@/lib/paystack';

const createOrderSchema = z.object({
  serviceType: z.enum(['LAUNDRY', 'HOME_CLEANING', 'OFFICE_CLEANING', 'FUMIGATION']),
  pickupOption: z.enum(['HOME_PICKUP', 'PARTNER_DROPOFF', 'ON_SITE']).optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  scheduledDate: z.string().optional(), // YYYY-MM-DD
  scheduledTime: z.string().optional(), // HH:MM
  items: z
    .array(
      z.object({
        itemName: z.string(),
        quantity: z.number().min(1),
        isWhiteGroup: z.boolean().default(false),
      })
    )
    .optional(),
  propertyType: z.string().optional(), // For fumigation
});

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'order-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['CUSTOMER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get user email for payment
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total amount server-side from the Pricing table. Any item the
    // pricing table doesn't know is a hard error — silently skipping it would
    // create underpriced (or zero-priced) orders.
    let totalKobo = 0;
    const pricedItems: {
      itemName: string;
      quantity: number;
      isWhiteGroup: boolean;
      unitPrice: number;
      unitPriceKobo: number;
      subtotal: number;
      subtotalKobo: number;
    }[] = [];

    if (validatedData.serviceType === 'LAUNDRY') {
      if (!validatedData.items || validatedData.items.length === 0) {
        return NextResponse.json(
          { error: 'A laundry order must contain at least one item' },
          { status: 400 }
        );
      }

      for (const item of validatedData.items) {
        const pricing = await prisma.pricing.findFirst({
          where: {
            serviceType: 'LAUNDRY',
            itemName: item.itemName,
          },
        });

        if (!pricing) {
          return NextResponse.json({ error: `Unknown item: ${item.itemName}` }, { status: 400 });
        }

        const unitPriceKobo = pricing.unitPriceKobo || nairaToKobo(pricing.unitPrice);
        const subtotalKobo = unitPriceKobo * item.quantity;
        totalKobo += subtotalKobo;
        pricedItems.push({
          itemName: item.itemName,
          quantity: item.quantity,
          isWhiteGroup: item.isWhiteGroup,
          unitPrice: koboToNaira(unitPriceKobo),
          unitPriceKobo,
          subtotal: koboToNaira(subtotalKobo),
          subtotalKobo,
        });
      }
    } else if (validatedData.serviceType === 'FUMIGATION') {
      const pricing = await prisma.pricing.findFirst({
        where: {
          serviceType: 'FUMIGATION',
          itemName: validatedData.propertyType,
        },
      });

      if (!pricing) {
        return NextResponse.json(
          { error: 'Unknown property type for fumigation' },
          { status: 400 }
        );
      }

      totalKobo = pricing.unitPriceKobo || nairaToKobo(pricing.unitPrice);
    } else {
      // HOME_CLEANING / OFFICE_CLEANING have no pricing rows — they're
      // quotation-based. Refuse instead of creating an unpayable ₦0 order.
      return NextResponse.json(
        {
          error:
            'Cleaning services are priced per request. Please use the contact page to request a quotation.',
        },
        { status: 400 }
      );
    }

    if (totalKobo <= 0) {
      return NextResponse.json({ error: 'Order total could not be determined' }, { status: 400 });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        serviceType: validatedData.serviceType,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        pickupOption: validatedData.pickupOption,
        pickupAddress: validatedData.pickupAddress,
        deliveryAddress: validatedData.deliveryAddress,
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : undefined,
        scheduledTime: validatedData.scheduledTime,
        totalAmount: koboToNaira(totalKobo),
        totalKobo,
        items: pricedItems.length > 0 ? { create: pricedItems } : undefined,
      },
      include: {
        items: true,
      },
    });

    // Initialize Paystack payment
    try {
      const paystackResponse = await initializePayment(user.email, totalKobo, {
        orderId: order.id,
        customerId: customer.id,
      });

      // Update order with Paystack reference
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paystackReference: paystackResponse.data.reference,
        },
      });

      return NextResponse.json(
        {
          message: 'Order created successfully',
          order: {
            id: order.id,
            totalAmount: order.totalAmount,
            paymentUrl: paystackResponse.data.authorization_url,
            reference: paystackResponse.data.reference,
          },
        },
        { status: 201 }
      );
    } catch (paymentError: any) {
      console.error('Payment initialization error:', paymentError);

      // Return order created but with payment error
      return NextResponse.json(
        {
          message: 'Order created but payment initialization failed',
          order: {
            id: order.id,
            totalAmount: order.totalAmount,
          },
          error: 'Payment initialization failed. You can retry payment from the order page.',
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    console.error('Create order error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

/**
 * GET /api/orders - Get customer's orders
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['CUSTOMER']);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: true,
        rider: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            currentLatitude: true,
            currentLongitude: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
