import { describe, expect, it } from 'vitest';
import { createSignedUrlToken, verifySignedUrlToken } from '../src/services/fileSigning';

describe('file url signing', () => {
  const secret = 'super_secret_signing_key_1234567890123456';

  it('creates verifiable signed token', () => {
    const token = createSignedUrlToken({ orgId: 'org_1', fileId: 'file_1', operation: 'upload' }, secret, 60);
    const payload = verifySignedUrlToken(token, secret);

    expect(payload?.orgId).toBe('org_1');
    expect(payload?.fileId).toBe('file_1');
    expect(payload?.operation).toBe('upload');
  });

  it('rejects tampered token', () => {
    const token = createSignedUrlToken({ orgId: 'org_1', fileId: 'file_1', operation: 'download' }, secret, 60);
    const tampered = `${token}abc`;
    expect(verifySignedUrlToken(tampered, secret)).toBeNull();
  });

  it('rejects expired token', () => {
    const token = createSignedUrlToken({ orgId: 'org_1', fileId: 'file_1', operation: 'download' }, secret, -1);
    expect(verifySignedUrlToken(token, secret)).toBeNull();
  });
});
