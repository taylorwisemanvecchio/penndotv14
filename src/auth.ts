import NextAuth from 'next-auth';
import { authConfig } from '@/config/auth.config';
import { NextRequest } from 'next/server';

// Custom GET handler to exclude /api/chat
export async function GET(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/chat')) {
    return new Response('Not Found', { status: 404 });
  }
  const { handlers } = NextAuth(authConfig);
  return handlers.GET(req);
}

// Custom POST handler to exclude /api/chat
export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/chat')) {
    return new Response('Not Found', { status: 404 });
  }
  const { handlers } = NextAuth(authConfig);
  return handlers.POST(req);
}

// Export other functions as-is
export const {
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  ...authConfig,
});
