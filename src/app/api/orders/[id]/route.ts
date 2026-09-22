import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireSession } from '@/lib/api-auth';
import { RIDER_TASK_FEE_NAIRA } from '@/lib/commission-rates';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;

  try {
    const userId = auth.session.userId;
    const userRole = auth.session.role;

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: true,
        rider: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
        partner: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        certificate: true,
        commissions: {
          select: {
            riderId: true,
            amount: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'CUSTOMER' && order.customer.userId === userId) ||
      (userRole === 'RIDER' && order.rider?.userId === userId) ||
      (userRole === 'PARTNER' && order.partner?.userId === userId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isRider = userRole === 'RIDER';
    const riderCommission = isRider
      ? order.commissions?.find((c) => c.riderId === order.rider?.id)
      : null;
    const taskFee = isRider ? (riderCommission?.amount ?? RIDER_TASK_FEE_NAIRA) : undefined;

    // Format the response
    const formattedOrder = {
      id: order.id,
      serviceType: order.serviceType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      // Needed by the order page to verify payment after returning from
      // Paystack checkout (the callback_url lands there with ?payment=return).
      paystackReference: isRider ? undefined : order.paystackReference,
      // Total amount is confidential: never exposed to riders.
      totalAmount: isRider ? undefined : order.totalAmount,
      taskFee,
      createdAt: order.createdAt,
      pickupOption: order.pickupOption,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      items: order.items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: isRider ? undefined : item.unitPrice,
        subtotal: isRider ? undefined : item.subtotal,
        isWhiteGroup: item.isWhiteGroup,
      })),
      customer: {
        fullName: order.customer.user.fullName,
        email: order.customer.user.email,
        phone: order.customer.user.phone,
      },
      rider: order.rider
        ? {
            id: order.rider.id,
            fullName: order.rider.user.fullName,
            phone: order.rider.user.phone,
            availabilityStatus: order.rider.availabilityStatus,
            // Live location for the customer's order-tracking map (null until
            // the rider's device reports a position).
            latitude: order.rider.currentLatitude,
            longitude: order.rider.currentLongitude,
            lastLocationUpdate: order.rider.lastLocationUpdate,
          }
        : null,
      partner: order.partner
        ? {
            id: order.partner.id,
            businessName: order.partner.businessName,
          }
        : null,
      certificate: order.certificate
        ? {
            certificateNumber: order.certificate.certificateNumber,
            issuedAt: order.certificate.issuedAt,
            propertyType: order.certificate.propertyType,
            propertyAddress: order.certificate.propertyAddress,
          }
        : null,
    };

    return NextResponse.json({ order: formattedOrder }, { status: 200 });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
