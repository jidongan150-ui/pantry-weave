import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, jwtVerify } from 'jose';
import { signUserToken, isSameOriginTokenRequest, AUTH_AUDIENCE } from '../lib/auth-token.ts';

test('auth tokens have a verified subject, bound audience and five-minute expiry', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
  const jwk = { ...await exportJWK(privateKey), kid: 'test-only' };
  const token = await signUserToken('alice', 'https://pantry.example', jwk);
  const { payload } = await jwtVerify(token, publicKey, { issuer: 'https://pantry.example', audience: AUTH_AUDIENCE });
  assert.equal(payload.sub, 'alice');
  assert.equal(payload.exp - payload.iat, 300);
  assert.equal(payload.email, undefined);
  await assert.rejects(jwtVerify(token, publicKey, { audience: 'another-app' }));
  await assert.rejects(jwtVerify(token, publicKey, { issuer: 'https://evil.example' }));
});

test('token endpoint rejects cross-origin, missing-origin and mismatched-host requests', () => {
  const issuer = 'https://pantry.example';
  const request = (origin, url = issuer) => new Request(url + '/api/convex-token', { method: 'POST', headers: origin ? { origin } : {} });
  assert.equal(isSameOriginTokenRequest(request(issuer), issuer), true);
  assert.equal(isSameOriginTokenRequest(request('https://evil.example'), issuer), false);
  assert.equal(isSameOriginTokenRequest(request(null), issuer), false);
  assert.equal(isSameOriginTokenRequest(request(issuer, 'https://evil.example'), issuer), false);
});
