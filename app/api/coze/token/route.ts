import { createSign, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COZE_API_ORIGIN = 'https://api.coze.com';
const SESSION_COOKIE = 'cc_coze_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function createJwt(sessionName: string): string {
  const appId = process.env.COZE_OAUTH_APP_ID;
  const keyId = process.env.COZE_OAUTH_PUBLIC_KEY_ID;
  const privateKey = process.env.COZE_OAUTH_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!appId || !keyId || !privateKey) {
    throw new Error('Coze OAuth environment variables are incomplete.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId }));
  const payload = base64Url(JSON.stringify({
    iss: appId,
    aud: 'api.coze.com',
    iat: now,
    exp: now + 600,
    jti: randomUUID(),
    session_name: sessionName,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(unsignedToken).end().sign(privateKey);

  return `${unsignedToken}.${base64Url(signature)}`;
}

export async function POST(request: NextRequest) {
  const botId = process.env.COZE_BOT_ID;
  if (!botId) {
    return NextResponse.json({ error: 'Chatbot chưa được cấu hình.' }, { status: 503 });
  }

  const existingSession = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionName = existingSession && /^cc_[a-f0-9-]{36}$/.test(existingSession)
    ? existingSession
    : `cc_${randomUUID()}`;

  try {
    const oauthResponse = await fetch(`${COZE_API_ORIGIN}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${createJwt(sessionName)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration_seconds: 900,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      }),
      cache: 'no-store',
    });

    const oauthData = await oauthResponse.json() as {
      access_token?: string;
      expires_in?: number;
      error_code?: string;
    };

    if (!oauthResponse.ok || !oauthData.access_token) {
      console.error('Coze OAuth token request failed', oauthResponse.status, oauthData.error_code ?? 'unknown_error');
      return NextResponse.json({ error: 'Không thể kết nối chatbot.' }, { status: 502 });
    }

    const response = NextResponse.json({
      token: oauthData.access_token,
      expiresAt: oauthData.expires_in,
      botId,
      userId: sessionName,
    });
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set(SESSION_COOKIE, sessionName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error('Coze OAuth setup failed', error instanceof Error ? error.message : 'unknown_error');
    return NextResponse.json({ error: 'Không thể kết nối chatbot.' }, { status: 500 });
  }
}
