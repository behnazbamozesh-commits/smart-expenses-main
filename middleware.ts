import { NextResponse, NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // All routes are open — demo mode is always active
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
