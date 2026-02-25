import crypto from 'node:crypto';

type SignedPayload = {
  orgId: string;
  fileId: string;
  operation: 'upload' | 'download';
  exp: number;
};

function hmac(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSignedUrlToken(payload: Omit<SignedPayload, 'exp'>, secret: string, expiresInSeconds: number) {
  const completePayload: SignedPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  const encodedPayload = Buffer.from(JSON.stringify(completePayload), 'utf8').toString('base64url');
  const signature = hmac(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySignedUrlToken(token: string, secret: string): SignedPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = hmac(encodedPayload, secret);
  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SignedPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
