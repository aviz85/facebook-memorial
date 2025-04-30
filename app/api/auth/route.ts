import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      // Create a secure, HTTP-only cookie that expires in 24 hours
      const cookieStore = cookies();
      cookieStore.set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'סיסמה שגויה' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    );
  }
}

// API route to check if the user is authenticated
export async function GET() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get('admin_auth')?.value === 'true';
  
  return NextResponse.json({ isAuthenticated });
}

// API route to logout
export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.set('admin_auth', '', { 
    expires: new Date(0),
    path: '/' 
  });
  
  return NextResponse.json({ success: true });
} 