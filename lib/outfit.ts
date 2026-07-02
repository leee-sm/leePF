export type PrecipitationType =
  | "none"
  | "rain"
  | "rain_snow"
  | "snow"
  | "shower"
  | "drizzle"
  | "flurry"
  | "unknown";

export type RunningWeatherInput = {
  temperature: number;
  humidity?: number | null;
  windSpeed?: number | null;
  precipitationProbability?: number | null;
  precipitationType?: PrecipitationType | null;
};

export type OutfitRecommendation = {
  title: string;
  temperatureBand: string;
  summary: string;
  items: string[];
  alerts: string[];
};

type TemperatureRule = {
  matches: (temperature: number) => boolean;
  title: string;
  temperatureBand: string;
  summary: string;
  items: string[];
};

const TEMPERATURE_RULES: TemperatureRule[] = [
  {
    matches: (temperature) => temperature >= 25,
    title: "가볍게 열 배출",
    temperatureBand: "25도 이상",
    summary: "체온이 빠르게 오르는 날이라 통풍과 햇빛 차단을 우선하세요.",
    items: ["민소매 또는 반팔", "쇼츠", "얇은 양말", "모자"],
  },
  {
    matches: (temperature) => temperature >= 20 && temperature <= 24,
    title: "반팔 반바지 기본",
    temperatureBand: "20~24도",
    summary: "24도 전후는 반팔과 반바지가 기본입니다.",
    items: ["반팔", "반바지"],
  },
  {
    matches: (temperature) => temperature >= 15 && temperature <= 19,
    title: "초반 체온 유지",
    temperatureBand: "15~19도",
    summary: "출발 직후만 서늘할 수 있어 얇은 상의를 고르세요.",
    items: ["반팔 또는 얇은 긴팔", "쇼츠 또는 롱타이츠"],
  },
  {
    matches: (temperature) => temperature >= 10 && temperature <= 14,
    title: "얇은 방풍 레이어",
    temperatureBand: "10~14도",
    summary: "달리기 전후 체온 저하를 막는 얇은 겉옷이 좋습니다.",
    items: ["긴팔", "얇은 바람막이", "롱타이츠"],
  },
  {
    matches: (temperature) => temperature >= 5 && temperature <= 9,
    title: "손과 귀 보온",
    temperatureBand: "5~9도",
    summary: "말단 부위가 차가워지기 쉬워 작은 보온 장비를 챙기세요.",
    items: ["기능성 긴팔", "바람막이", "장갑", "귀마개"],
  },
  {
    matches: (temperature) => temperature >= 0 && temperature <= 4,
    title: "보온 중심 러닝",
    temperatureBand: "0~4도",
    summary: "땀 배출과 보온을 같이 챙기는 겨울 구성이 필요합니다.",
    items: ["보온 긴팔", "러닝 자켓", "기모 타이츠", "장갑", "비니"],
  },
  {
    matches: (temperature) => temperature < 0,
    title: "강한 방한 레이어",
    temperatureBand: "0도 미만",
    summary: "찬 공기와 바람을 막는 레이어링을 우선하세요.",
    items: [
      "방한 레이어링",
      "방풍 자켓",
      "기모 타이츠",
      "장갑",
      "비니",
      "넥워머",
    ],
  },
];

export function isPrecipitating(type?: PrecipitationType | null): boolean {
  return type !== undefined && type !== null && type !== "none";
}

export function getOutfitRecommendation(
  weather: RunningWeatherInput,
): OutfitRecommendation {
  const normalizedTemperature = Math.round(weather.temperature);
  const rule =
    TEMPERATURE_RULES.find((candidate) =>
      candidate.matches(normalizedTemperature),
    ) ?? TEMPERATURE_RULES[TEMPERATURE_RULES.length - 1];

  const items = [...rule.items];
  const alerts: string[] = [];

  const addItem = (item: string) => {
    if (!items.includes(item)) {
      items.push(item);
    }
  };

  if (isPrecipitating(weather.precipitationType)) {
    addItem("방수/발수 자켓");
    alerts.push("비 또는 눈 예보가 있어 젖어도 체온을 지킬 수 있는 겉옷이 필요합니다.");
  }

  if (weather.windSpeed !== null && weather.windSpeed !== undefined) {
    if (weather.windSpeed >= 5) {
      addItem("바람막이");
      alerts.push("풍속이 5m/s 이상이라 체감 온도가 더 낮을 수 있습니다.");
    }
  }

  if (
    weather.humidity !== null &&
    weather.humidity !== undefined &&
    weather.humidity >= 75 &&
    normalizedTemperature >= 20
  ) {
    addItem("통풍 좋은 옷");
    alerts.push("습도가 높아 땀이 마르기 어려운 조건입니다.");
  }

  return {
    title: rule.title,
    temperatureBand: rule.temperatureBand,
    summary: rule.summary,
    items,
    alerts,
  };
}
