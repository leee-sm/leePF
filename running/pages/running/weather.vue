<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-running">Running Weather</p>
      <h1 class="mt-2 text-3xl font-black text-ink">오늘 러닝 날씨와 복장 추천</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">주소를 검색하면 현재 날씨와 시간별 러닝 환경을 확인할 수 있습니다.</p>
    </div>
    <AddressSearch label="러닝 위치" @select="selectAddress" />
    <section v-if="selected" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 class="text-xl font-black text-ink">{{ selected.roadAddress }}</h2>
      <div v-if="pending" class="mt-4 h-28 animate-pulse rounded-xl bg-slate-100" />
      <StateBlock v-else-if="errorMessage" class="mt-4" eyebrow="Weather unavailable" title="날씨 데이터를 불러오지 못했습니다." :text="errorMessage" />
      <div v-else-if="weather" class="mt-4 grid min-w-0 gap-4">
        <StateBlock v-if="!weather.current" eyebrow="API setup required" title="공공데이터 API 연동 준비 상태" text="PUBLIC_DATA_SERVICE_KEY를 설정하면 현재 날씨와 시간별 날씨를 표시합니다." />
        <section v-else class="grid gap-4">
          <section class="rounded-2xl border border-teal-100 bg-teal-50 p-5">
            <p class="text-sm font-black text-running">현재 러닝 환경</p>
            <div class="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black" :class="conditionClass(displayOutfit.condition)">
              <span class="h-2.5 w-2.5 rounded-full" :class="conditionDotClass(displayOutfit.condition)" />
              {{ displayOutfit.conditionLabel }}
            </div>
            <div class="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><span class="text-xs text-slate-500">기온</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.temperature ?? '-' }}°C</strong></div>
              <div><span class="text-xs text-slate-500">습도</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.humidity ?? '-' }}%</strong></div>
              <div><span class="text-xs text-slate-500">강수량</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.precipitation ?? 0 }}mm</strong></div>
              <div><span class="text-xs text-slate-500">풍속</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.windSpeed ?? '-' }}m/s</strong></div>
              <div><span class="text-xs text-slate-500">미세먼지 PM10</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.pm10 ?? '-' }}㎍/m³</strong></div>
              <div><span class="text-xs text-slate-500">초미세먼지 PM2.5</span><strong class="mt-1 block text-2xl text-ink">{{ weather.current.pm25 ?? '-' }}㎍/m³</strong></div>
            </div>
          </section>
          <section v-if="weather.hourly.length" class="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 p-4">
            <h2 class="font-black text-ink">시간별 날씨</h2>
            <p class="mt-1 text-xs text-slate-500">시간대를 누르면 해당 시간 기준 복장 추천으로 바뀝니다.</p>
            <div class="mt-3 max-w-full overflow-x-auto pb-2">
              <div class="flex min-w-max gap-3">
                <button v-for="hour in weather.hourly" :key="hour.time" type="button" class="w-28 shrink-0 rounded-xl p-3 text-center transition" :class="selectedHour?.time === hour.time ? 'bg-teal-100 ring-2 ring-running' : 'bg-slate-50 hover:bg-teal-50'" @click="selectHour(hour)">
                  <p class="text-xs text-slate-500">{{ hour.time.slice(-4, -2) }}:{{ hour.time.slice(-2) }}</p>
                  <strong class="mt-2 block text-lg text-ink">{{ hour.temperature ?? '-' }}°</strong>
                  <p class="mt-1 text-xs text-slate-500">습도 {{ hour.humidity ?? '-' }}%</p>
                  <p class="text-xs text-slate-500">강수 {{ hour.precipitationProbability ?? '-' }}%</p>
                </button>
              </div>
            </div>
          </section>
          <section class="min-w-0 max-w-full overflow-x-auto rounded-xl bg-teal-50 p-4">
            <p class="text-sm font-black text-running">복장 추천 <span v-if="selectedHour" class="font-normal text-slate-600">· {{ selectedHour.time.slice(-4, -2) }}:{{ selectedHour.time.slice(-2) }} 기준</span></p>
            <div v-if="selectedOutfitPending" class="mt-3 h-12 animate-pulse rounded-lg bg-white/70" />
            <div v-else>
              <dl class="mt-3 grid min-w-[32rem] gap-3 sm:grid-cols-3">
                <div><dt class="text-xs text-slate-500">상의</dt><dd class="font-bold text-ink">{{ displayOutfit.top }}</dd></div>
                <div><dt class="text-xs text-slate-500">하의</dt><dd class="font-bold text-ink">{{ displayOutfit.bottom }}</dd></div>
                <div><dt class="text-xs text-slate-500">기타 추천</dt><dd class="font-bold text-ink">{{ displayOutfit.accessories.join(', ') || '없음' }}</dd></div>
              </dl>
              <p v-if="displayOutfit.notices.length" class="mt-3 text-sm text-slate-700">{{ displayOutfit.notices.join(' ') }}</p>
            </div>
          </section>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
type Address = { roadAddress: string; latitude: number; longitude: number; nx: number; ny: number; sido?: string }
type Outfit = { top: string; bottom: string; accessories: string[]; notices: string[]; condition: 'good' | 'caution' | 'poor'; conditionLabel: string }
type Hour = { time: string; temperature: number | null; humidity: number | null; precipitationProbability: number | null; precipitation: number | string | null; windSpeed: number | null }
type WeatherResponse = { location: unknown; current: { temperature: number | null; humidity: number | null; precipitation: number | string | null; windSpeed: number | null; pm10: number | null; pm25: number | null } | null; hourly: Hour[]; airQuality: unknown | null; outfit: Outfit }

const selected = ref<Address | null>(null)
const weather = ref<WeatherResponse | null>(null)
const pending = ref(false)
const errorMessage = ref('')
const selectedHour = ref<Hour | null>(null)
const selectedOutfit = ref<Outfit | null>(null)
const selectedOutfitPending = ref(false)
const displayOutfit = computed<Outfit>(() => selectedOutfit.value || weather.value?.outfit || { top: '-', bottom: '-', accessories: [], notices: [], condition: 'caution', conditionLabel: '판단 보류' })
function conditionClass(condition: Outfit['condition']) { return condition === 'good' ? 'bg-emerald-100 text-emerald-800' : condition === 'poor' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800' }
function conditionDotClass(condition: Outfit['condition']) { return condition === 'good' ? 'bg-emerald-500' : condition === 'poor' ? 'bg-red-500' : 'bg-amber-500' }

async function selectHour(hour: Hour) {
  if (!weather.value) return
  selectedHour.value = hour
  selectedOutfitPending.value = true
  try {
    const response = await $fetch<{ success: boolean; data?: Outfit }>('/api/running/outfit', {
      method: 'POST',
      body: {
        temperature: hour.temperature,
        feelsLikeTemperature: hour.temperature,
        humidity: hour.humidity,
        precipitation: typeof hour.precipitation === 'number' ? hour.precipitation : Number(hour.precipitation) || 0,
        windSpeed: hour.windSpeed,
        pm10: weather.value.current?.pm10 ?? null,
        pm25: weather.value.current?.pm25 ?? null,
      },
    })
    selectedOutfit.value = response.success ? response.data || null : null
  } catch {
    selectedOutfit.value = null
  } finally {
    selectedOutfitPending.value = false
  }
}

async function selectAddress(item: Address) {
  selected.value = item
  pending.value = true
  errorMessage.value = ''
  weather.value = null
  selectedHour.value = null
  selectedOutfit.value = null
  try {
    const response = await $fetch<{ success: boolean; data?: WeatherResponse; error?: { message: string } }>('/api/running/weather', { query: { lat: item.latitude, lon: item.longitude, nx: item.nx, ny: item.ny, label: item.roadAddress, sido: item.sido } })
    if (!response.success) { errorMessage.value = response.error?.message || '날씨 데이터를 불러오지 못했습니다.'; return }
    weather.value = response.data || null
  } catch { errorMessage.value = '날씨 데이터를 불러오지 못했습니다.' }
  finally { pending.value = false }
}

const config = useRuntimeConfig()
useSeoMeta({ title: '오늘 러닝 날씨와 복장 추천', description: '현재 기온과 시간별 러닝 환경을 확인하고 시간대별 복장을 추천받으세요.', ogUrl: `${config.public.appBaseUrl}/running/weather` })
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/running/weather` }] })
</script>
