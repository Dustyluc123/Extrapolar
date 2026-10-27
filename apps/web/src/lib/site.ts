// Endereço público do site, usado nas URLs absolutas das meta tags (og:url, og:image).
// Ordem: SITE_URL (definido na Vercel ou à mão) → domínio de produção que a Vercel informa no
// build (VERCEL_PROJECT_PRODUCTION_URL) → localhost, para o desenvolvimento.
export const LOCAL_SITE_URL = "http://localhost:4321";

export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  const explicit = env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return LOCAL_SITE_URL;
}

export const SITE_URL = resolveSiteUrl(process.env);

/** URL absoluta de um caminho do site (ex.: "/og/extrapolar.png"). */
export function absoluteUrl(path: string, site: string = SITE_URL): string {
  return new URL(path, `${site}/`).toString();
}

/** Domínio para mostrar nas imagens de prévia; null em localhost. */
export function displayHost(site: string = SITE_URL): string | null {
  const host = new URL(site).host;
  return host.startsWith("localhost") || host.startsWith("127.") ? null : host;
}
