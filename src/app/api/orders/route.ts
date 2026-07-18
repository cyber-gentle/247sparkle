import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
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
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    let totalAmount = 0;
    let pricedItems: {
      itemName: string;
      quantity: number;
      isWhiteGroup: boolean;
      unitPrice: number;
      subtotal: number;
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

        const subtotal = pricing.unitPrice * item.quantity;
        totalAmount += subtotal;
        pricedItems.push({
          itemName: item.itemName,
          quantity: item.quantity,
          isWhiteGroup: item.isWhiteGroup,
          unitPrice: pricing.unitPrice,
          subtotal,
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

      totalAmount = pricing.unitPrice;
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

    if (totalAmount <= 0) {
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
        totalAmount,
        items: pricedItems.length > 0 ? { create: pricedItems } : undefined,
      },
      include: {
        items: true,
      },
    });

    // Initialize Paystack payment
    try {
      const paystackResponse = await initializePayment(user.email, totalAmount, {
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
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
