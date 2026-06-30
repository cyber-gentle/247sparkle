import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const addressSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});

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

    const addresses = await prisma.savedAddress.findMany({
      where: { customerId: customer.id },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // If this is the first address or marked as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.savedAddress.create({
      data: {
        customerId: customer.id,
        label: validatedData.label,
        address: validatedData.address,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        isDefault: validatedData.isDefault || false,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Create address error:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
