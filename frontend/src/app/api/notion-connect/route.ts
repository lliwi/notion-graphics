import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const backendUrl = process.env.NEXT_INTERNAL_API_URL ?? 'http://backend:3000';

  let location: string | null = null;
  try {
    const response = await fetch(`${backendUrl}/integrations/notion/connect`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
    });
    location = response.headers.get('location');
  } catch {
    return NextResponse.redirect(new URL('/dashboard?error=notion_connect_failed', request.url));
  }

  if (!location) {
    return NextResponse.redirect(new URL('/dashboard?error=notion_connect_failed', request.url));
  }

  return NextResponse.redirect(location);
}
