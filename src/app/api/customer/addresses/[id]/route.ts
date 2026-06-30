import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify the address belongs to this customer
    const address = await prisma.savedAddress.findUnique({
      where: { id },
    });

    if (!address || address.customerId !== customer.id) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await prisma.savedAddress.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
