import { NextResponse } from 'next/server';

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: '247Sparkle',
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: noStoreHeaders }
  );
}
