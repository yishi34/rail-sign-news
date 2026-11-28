/**
 * 外部リンクURLが安全なプロトコル（http/https）であることを検証する。
 * javascript: や data: などの危険なスキームを拒否する。
 */
export function safeExternalUrl(url) {
  if (typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    return "#";
  }
  return "#";
}
