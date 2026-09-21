import type { AuthConfig } from "convex/server";

// Public verification material only; the private signing key stays in Sites.
import { issuer, jwks } from "./auth_public";
export default {
  providers: [{ type: "customJwt", issuer, jwks, applicationID: "pantry-weave", algorithm: "RS256" }],
} satisfies AuthConfig;
