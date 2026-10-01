const DATA_PORTAL_BASE_URL = "https://api.odcloud.kr/api";

export function getDataPortalServiceKey(): string {
  const rawKey =
    process.env.DATA_GO_KR_SERVICE_KEY?.trim() ||
    process.env.KMA_SERVICE_KEY?.trim() ||
    "";

  if (!rawKey) {
    throw new Error(
      "DATA_GO_KR_SERVICE_KEY 또는 KMA_SERVICE_KEY가 설정되지 않았습니다.",
    );
  }

  return normalizeServiceKey(rawKey);
}

export function buildDataPortalUrl(
  path: string,
  params: Record<string, string | number | null | undefined> = {},
): string {
  const url = new URL(path.replace(/^\/+/, ""), DATA_PORTAL_BASE_URL + "/");
  url.searchParams.set("serviceKey", getDataPortalServiceKey());

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export function normalizeServiceKey(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
