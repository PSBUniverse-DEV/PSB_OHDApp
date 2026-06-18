/**
 * Authentication Logout Endpoint
 * POST /api/auth/logout
 * Invalidates session and clears cookies
 */

import { NextResponse } from 'next/server';
import { invalidateSession } from '@/core/auth/session.service';
import { getClearPSBSessionCookieHeader, getPSBSessionCookieFromRequest } from '@/core/auth/cookies.utils';

export async function POST(request) {
  try {
    // Get token from request
    const token = getPSBSessionCookieFromRequest(request);

    // Invalidate session in database
    if (token) {
      await invalidateSession(token);
    }

    // Create response with cleared cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear session cookie
    response.headers.set('Set-Cookie', getClearPSBSessionCookieHeader());

    return response;
  } catch (error) {
    console.error('Logout endpoint error:', error);

    // Still clear the cookie even if database operation fails
    const response = NextResponse.json(
      { success: true, message: 'Logout complete' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', getClearPSBSessionCookieHeader());

    return response;
  }
}

export async function OPTIONS(request) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
