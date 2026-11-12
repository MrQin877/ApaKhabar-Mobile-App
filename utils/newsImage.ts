import { BACKEND_BASE_URL } from "@/services/apiConfig";
function localHost(host: string) {
  return ["localhost", "127.0.0.1", "[::1]", "0.0.0.0", "10.0.2.2"].includes(host)
    || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}
export function resolveNewsImage(image: string, backendOrigin = BACKEND_BASE_URL): string {
  const origin = backendOrigin.replace(/\/+$/, "");
  const value = image.trim();
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value)) {
    try {
      const url = new URL(value.startsWith("//") ? `https:${value}` : value);
      // Laravel's local APP_URL may still be localhost when the phone uses a LAN host.
      if (localHost(url.hostname) && url.pathname.startsWith("/storage/")) return `${origin}${url.pathname}${url.search}${url.hash}`;
      return url.href;
    } catch { return value; }
  }
  if (/^(data|file|content):/i.test(value)) return value;
  const path = value.replace(/^\/+/, "");
  return `${origin}/${path.startsWith("storage/") ? path : `storage/${path}`}`;
}
