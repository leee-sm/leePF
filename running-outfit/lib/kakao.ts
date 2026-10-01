import "server-only";

export type KakaoCoordinate = {
  addressName: string;
  roadAddressName: string | null;
  latitude: number;
  longitude: number;
};

type KakaoAddressDocument = {
  address_name?: string;
  x?: string;
  y?: string;
  road_address?: {
    address_name?: string;
  } | null;
  address?: {
    address_name?: string;
  } | null;
};

type KakaoAddressResponse = {
  documents?: KakaoAddressDocument[];
};

type KakaoKeywordDocument = {
  address_name?: string;
  place_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
};

type KakaoKeywordResponse = {
  documents?: KakaoKeywordDocument[];
};

const ROAD_ADDRESS_NUMBER_PATTERN =
  /^(.+?(?:대로|로|길|번길|가길|거리|고개|다리|로터리|광장|시장|길목|샛길))\s*(\d+(?:-\d+)?)$/u;

export class KakaoLocalApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "KakaoLocalApiError";
    this.status = status;
  }
}

export async function geocodeAddress(
  address: string,
  apiKey: string,
): Promise<KakaoCoordinate> {
  const searchQueries = createSearchQueries(address);

  for (const query of searchQueries) {
    const addressResult = await searchAddress(query, apiKey);

    if (addressResult) {
      return addressResult;
    }
  }

  for (const query of searchQueries) {
    const keywordResult = await searchKeyword(query, apiKey, address);

    if (keywordResult) {
      return keywordResult;
    }
  }

  throw new KakaoLocalApiError(
    "입력한 주소를 찾지 못했습니다. 도로명 또는 지번 주소를 조금 더 구체적으로 입력해 주세요.",
    404,
  );
}

async function searchAddress(
  address: string,
  apiKey: string,
): Promise<KakaoCoordinate | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", address);

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new KakaoLocalApiError(
      `카카오 주소 검색에 실패했습니다. ${await readResponseMessage(response)}`,
      response.status,
    );
  }

  const data = (await response.json()) as KakaoAddressResponse;
  const firstDocument = data.documents?.[0];

  if (!firstDocument?.x || !firstDocument.y) {
    return null;
  }

  const longitude = Number(firstDocument.x);
  const latitude = Number(firstDocument.y);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new KakaoLocalApiError(
      "카카오 주소 검색 결과의 좌표를 해석하지 못했습니다.",
    );
  }

  return {
    addressName:
      firstDocument.road_address?.address_name ??
      firstDocument.address?.address_name ??
      firstDocument.address_name ??
      address,
    roadAddressName: firstDocument.road_address?.address_name ?? null,
    latitude,
    longitude,
  };
}

async function searchKeyword(
  address: string,
  apiKey: string,
  originalAddress = address,
): Promise<KakaoCoordinate | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", address);

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new KakaoLocalApiError(
      `카카오 키워드 검색에 실패했습니다. ${await readResponseMessage(response)}`,
      response.status,
    );
  }

  const data = (await response.json()) as KakaoKeywordResponse;
  const firstDocument = selectKeywordDocument(data.documents, originalAddress);

  if (!firstDocument?.x || !firstDocument.y) {
    return null;
  }

  const longitude = Number(firstDocument.x);
  const latitude = Number(firstDocument.y);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new KakaoLocalApiError(
      "카카오 키워드 검색 결과의 좌표를 해석하지 못했습니다.",
    );
  }

  return {
    addressName:
      firstDocument.road_address_name ??
      firstDocument.address_name ??
      firstDocument.place_name ??
      address,
    roadAddressName: firstDocument.road_address_name ?? null,
    latitude,
    longitude,
  };
}

function createSearchQueries(address: string): string[] {
  const trimmedAddress = normalizeWhitespace(address);
  const queries = [trimmedAddress];
  const roadAddressQuery = createRoadAddressQuery(trimmedAddress);

  if (roadAddressQuery) {
    queries.push(roadAddressQuery);
  }

  return Array.from(new Set(queries));
}

function createRoadAddressQuery(address: string): string | null {
  const match = address.match(ROAD_ADDRESS_NUMBER_PATTERN);

  if (!match) {
    return null;
  }

  return `${match[1]} ${match[2]}`;
}

function selectKeywordDocument(
  documents: KakaoKeywordDocument[] | undefined,
  originalAddress: string,
): KakaoKeywordDocument | undefined {
  const normalizedAddress = normalizeForLikeMatch(originalAddress);

  return (
    documents?.find((document) => {
      const roadAddressName = normalizeForLikeMatch(
        document.road_address_name,
      );

      return (
        roadAddressName.length > 0 &&
        (roadAddressName.includes(normalizedAddress) ||
          normalizedAddress.includes(roadAddressName))
      );
    }) ?? documents?.[0]
  );
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeForLikeMatch(value?: string): string {
  return normalizeWhitespace(value ?? "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function readResponseMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status}`;
  }

  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message ?? json.error ?? `HTTP ${response.status}`;
  } catch {
    return text.slice(0, 120);
  }
}
