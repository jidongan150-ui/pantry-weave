import {env} from 'cloudflare:workers';
import RecipeApp from '@/components/recipe-app';
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const bindings = env as unknown as Record<string, string | undefined>;
  const convexUrl = bindings.CONVEX_URL || process.env.CONVEX_URL || '';
  const user = convexUrl ? await getChatGPTUser() : null;
  return <RecipeApp convexUrl={convexUrl} signedIn={!!user} signInPath={chatGPTSignInPath('/')} signOutPath={chatGPTSignOutPath('/')} />;
}
