import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isSameOriginTokenRequest, signUserToken } from "@/lib/auth-token";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "no-store, private", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  const bindings = env as unknown as Record<string, string | undefined>;
  const issuer = bindings.PANTRY_AUTH_ISSUER;
  const key = bindings.PANTRY_AUTH_PRIVATE_JWK;
  // No local fallback: the authenticated headers are trusted only behind Sites dispatch.
  if (!issuer?.startsWith("https://") || !key) return Response.json({ error: "Auth unavailable" }, { status: 503, headers: responseHeaders });
  if (!isSameOriginTokenRequest(request, issuer)) return Response.json({ error: "Forbidden" }, { status: 403, headers: responseHeaders });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401, headers: responseHeaders });
  try {
    const token = await signUserToken(user.userId, issuer, JSON.parse(key));
    return Response.json({ token }, { headers: responseHeaders });
  } catch {
    return Response.json({ error: "Auth unavailable" }, { status: 503, headers: responseHeaders });
  }
}
