export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Guard: if OAuth env vars are not configured, return "/" instead of
  // crashing with "TypeError: Invalid URL" (new URL(undefined) throws).
  if (!oauthPortalUrl || !appId) {
    console.warn(
      "[getLoginUrl] VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not defined. " +
        "OAuth login is disabled. Set these env vars to enable it."
    );
    return "/";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
