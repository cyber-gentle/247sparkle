import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * POST /api/riders/location - Update rider's current location
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'RIDER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = locationSchema.parse(body);

    // Update rider's location
    const rider = await prisma.rider.update({
      where: { userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Location updated successfully',
        rider: {
          id: rider.id,
          latitude: rider.currentLatitude,
          longitude: rider.currentLongitude,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update location error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/riders/location - Get rider's current location
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'RIDER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rider = await prisma.rider.findUnique({
      where: { userId },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });

    if (!rider) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        rider: {
          id: rider.id,
          latitude: rider.currentLatitude,
          longitude: rider.currentLongitude,
          lastUpdate: rider.lastLocationUpdate,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get location error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}
