import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const isAuthorized =
      userRole === 'ADMIN' ||
      (userRole === 'CUSTOMER' && order.customer.userId === userId) ||
      (userRole === 'RIDER' && order.rider?.userId === userId) ||
      (userRole === 'PARTNER' && order.partner?.userId === userId);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      serviceType: order.serviceType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      pickupOption: order.pickupOption,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      scheduledDate: order.scheduledDate,
      scheduledTime: order.scheduledTime,
      items: order.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        isWhiteGroup: item.isWhiteGroup,
      })),
      customer: {
        fullName: order.customer.user.fullName,
        email: order.customer.user.email,
        phone: order.customer.user.phone,
      },
      rider: order.rider ? {
        id: order.rider.id,
        fullName: order.rider.user.fullName,
        phone: order.rider.user.phone,
        availabilityStatus: order.rider.availabilityStatus,
      } : null,
      partner: order.partner ? {
        id: order.partner.id,
        businessName: order.partner.businessName,
      } : null,
      certificate: order.certificate ? {
        certificateNumber: order.certificate.certificateNumber,
        issuedAt: order.certificate.issuedAt,
        propertyType: order.certificate.propertyType,
        propertyAddress: order.certificate.propertyAddress,
      } : null,
    };

    return NextResponse.json({ order: formattedOrder }, { status: 200 });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
