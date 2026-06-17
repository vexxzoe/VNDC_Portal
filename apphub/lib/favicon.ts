/**
 * Attempt to resolve a favicon URL for the given app URL.
 * Strategy (in order):
 *  1. Google Favicon API — works for any reachable public domain
 *  2. Direct /favicon.ico path on the origin
 *  3. Return null if both fail
 *
 * This runs SERVER-SIDE only (called from the API route) to avoid CORS.
 */

function extractOrigin(url: string): { origin: string; domain: string } | null {
  try {
    const parsed = new URL(url);
    return { origin: parsed.origin, domain: parsed.hostname };
  } catch {
    return null;
  }
}

async function isReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    // Accept any 2xx or 3xx — we just need proof the resource exists
    return res.ok || (res.status >= 300 && res.status < 400);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFavicon(url: string): Promise<string | null> {
  const parsed = extractOrigin(url);
  if (!parsed) return null;

  const { origin, domain } = parsed;

  // 1. Google Favicon API — always returns an image URL even if it's a
  //    generic placeholder, so we check with a HEAD request first.
  //    Google returns a 1×1 transparent gif for unknown domains, so we
  //    accept it unconditionally — it's the most reliable cross-domain source.
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const googleReachable = await isReachable(googleUrl);
  if (googleReachable) return googleUrl;

  // 2. Direct /favicon.ico on the app's own origin
  const directUrl = `${origin}/favicon.ico`;
  const directReachable = await isReachable(directUrl);
  if (directReachable) return directUrl;

  return null;
}
