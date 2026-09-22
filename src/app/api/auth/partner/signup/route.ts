import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { partnerSignupRequestSchema } from '@/lib/provider-signup-validation';

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'auth', RATE_LIMIT_POLICIES.auth);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = partnerSignupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Validation failed',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const validatedData = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Create user and partner with resilience if ninPhotoUrl column is not yet migrated
    let user;
    try {
      user = await prisma.user.create({
        data: {
          fullName: validatedData.businessName,
          email: validatedData.email,
          phone: validatedData.phone,
          passwordHash,
          role: 'PARTNER',
          partner: {
            create: {
              businessName: validatedData.businessName,
              ownerName: validatedData.ownerName,
              ownerPhotoUrl: validatedData.ownerPhotoUrl || null,
              ninPhotoUrl: validatedData.ninPhotoUrl || null,
              address: validatedData.address,
              openingTime: validatedData.openingTime,
              closingTime: validatedData.closingTime,
              daysOfOpening: validatedData.daysOfOpening
                ? JSON.stringify(validatedData.daysOfOpening)
                : null,
              approvalStatus: 'PENDING',
            },
          },
        },
        include: {
          partner: true,
        },
      });
    } catch (createError: any) {
      console.warn(
        'Partner create initial attempt failed, checking for missing columns:',
        createError?.message
      );

      // Attempt auto-migration of ninPhotoUrl if missing in live database
      try {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "ninPhotoUrl" TEXT;'
        );
        user = await prisma.user.create({
          data: {
            fullName: validatedData.businessName,
            email: validatedData.email,
            phone: validatedData.phone,
            passwordHash,
            role: 'PARTNER',
            partner: {
              create: {
                businessName: validatedData.businessName,
                ownerName: validatedData.ownerName,
                ownerPhotoUrl: validatedData.ownerPhotoUrl || null,
                ninPhotoUrl: validatedData.ninPhotoUrl || null,
                address: validatedData.address,
                openingTime: validatedData.openingTime,
                closingTime: validatedData.closingTime,
                daysOfOpening: validatedData.daysOfOpening
                  ? JSON.stringify(validatedData.daysOfOpening)
                  : null,
                approvalStatus: 'PENDING',
              },
            },
          },
          include: {
            partner: true,
          },
        });
      } catch (retryError: any) {
        console.warn(
          'Retry with ninPhotoUrl failed, attempting fallback creation without ninPhotoUrl:',
          retryError?.message
        );
        user = await prisma.user.create({
          data: {
            fullName: validatedData.businessName,
            email: validatedData.email,
            phone: validatedData.phone,
            passwordHash,
            role: 'PARTNER',
            partner: {
              create: {
                businessName: validatedData.businessName,
                ownerName: validatedData.ownerName,
                ownerPhotoUrl: validatedData.ownerPhotoUrl || null,
                address: validatedData.address,
                openingTime: validatedData.openingTime,
                closingTime: validatedData.closingTime,
                daysOfOpening: validatedData.daysOfOpening
                  ? JSON.stringify(validatedData.daysOfOpening)
                  : null,
                approvalStatus: 'PENDING',
              },
            },
          },
          include: {
            partner: true,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Partner signup submitted. Pending admin approval.',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Partner signup error:', error);
    const message = error?.message || 'Partner signup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
