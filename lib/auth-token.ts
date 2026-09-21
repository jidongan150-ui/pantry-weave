import { importJWK, SignJWT, type JWK } from "jose";

export const AUTH_AUDIENCE = "pantry-weave";
export const AUTH_TOKEN_SECONDS = 300;

// Only the Sites worker holds this signing key. Never import its value into a client component.
export async function signUserToken(userId: string, issuer: string, privateKey: JWK) {
  if (!userId || !privateKey.kid || privateKey.kty !== "RSA" || !privateKey.d) throw new Error("Invalid auth configuration");
  const key = await importJWK(privateKey, "RS256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: privateKey.kid })
    .setSubject(userId).setIssuer(issuer).setAudience(AUTH_AUDIENCE)
    .setIssuedAt().setExpirationTime(`${AUTH_TOKEN_SECONDS}s`).sign(key);
}

export function isSameOriginTokenRequest(request: Request, issuer: string) {
  try {
    const origin = new URL(issuer).origin;
    return new URL(request.url).origin === origin && request.headers.get("origin") === origin
      && request.headers.get("sec-fetch-site") !== "cross-site";
  } catch { return false; }
}
