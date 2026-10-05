<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-baby">Hospitals</p>
      <h1 class="mt-2 text-3xl font-black text-ink">주변 병원 찾기</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">주소를 검색한 뒤 지도에서 병원을 선택하면 오른쪽에서 상세 정보를 확인할 수 있습니다.</p>
    </div>
    <AddressSearch label="기준 주소" @select="selectAddress" />
    <div class="mt-4 flex gap-2">
      <button v-for="radius in [3000, 5000, 10000]" :key="radius" class="rounded-xl border px-3 py-2 text-sm font-bold" :class="selectedRadius === radius ? 'border-baby bg-rose-50 text-baby' : 'border-slate-200 bg-white'" @click="selectedRadius = radius; selected && load()">{{ radius / 1000 }}km</button>
    </div>
    <StateBlock v-if="message" class="mt-5" eyebrow="Status" title="병원 검색 안내" :text="message" />
    <div v-if="items.length" class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start">
      <KakaoMap v-if="selected" :latitude="selected.latitude" :longitude="selected.longitude" :places="items" :selected-id="selectedPlace?.id" @select="selectPlace" />
      <div class="flex h-[42rem] min-w-0 flex-col gap-3 overflow-y-auto">
        <article v-if="selectedPlace" class="hidden rounded-2xl border border-baby/30 bg-white p-5">
          <p class="text-xs font-black uppercase tracking-wide text-baby">선택한 병원 상세</p>
          <h2 class="mt-2 text-xl font-black text-ink">{{ selectedPlace.name }}</h2>
          <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt class="text-slate-500">주소</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.roadAddress || selectedPlace.address || '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">거리</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.distanceMeters ?? '공개 데이터 없음' }}{{ selectedPlace.distanceMeters != null ? 'm' : '' }}</dd></div>
            <div><dt class="text-slate-500">전화번호</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.phone || '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">영업 상태</dt><dd class="mt-1 flex items-center gap-2 font-bold text-ink"><span class="h-2.5 w-2.5 rounded-full" :class="statusDotClass(selectedPlace.openState)" />{{ selectedPlace.openStatus || '영업시간 확인 필요' }}</dd></div>
            <div v-if="selectedPlace.operationTime" class="sm:col-span-2"><dt class="text-slate-500">진료시간</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.operationTime }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-slate-500">분류</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.category || '공개 데이터 없음' }}</dd></div>
          </dl>
        </article>
        <p v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">지도에서 병원 위치를 선택하세요.</p>
        <div class="min-h-[20rem] flex-none grid grid-rows-5 gap-2">
          <button v-for="item in pagedItems" :key="item.id" type="button" class="min-h-0 w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-soft transition hover:border-baby" :class="selectedPlace?.id === item.id ? 'border-baby ring-2 ring-rose-100' : 'border-slate-200'" @click="selectPlace(item)">
            <div class="flex items-center justify-between gap-2"><h2 class="min-w-0 truncate text-base font-black text-ink">{{ item.name }}</h2><span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black" :class="statusBadgeClass(item.openState)"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ item.openStatus || '확인 필요' }}</span></div>
            <p class="mt-1 text-sm text-slate-500">{{ item.roadAddress || item.address }}</p>
            <p class="mt-2 flex items-center gap-2 text-sm font-bold text-slate-700"><span class="h-2.5 w-2.5 rounded-full" :class="statusDotClass(item.openState)" />{{ item.distanceMeters }}m · {{ item.openStatus || '영업시간 확인 필요' }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ item.phone || '전화번호 공개 데이터 없음' }}</p>
          </button>
        </div>
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <button class="rounded-lg px-3 py-2 text-sm font-bold text-baby disabled:text-slate-300" :disabled="currentPage === 1" @click="currentPage -= 1">이전</button>
          <span class="text-sm font-bold text-slate-600">{{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded-lg px-3 py-2 text-sm font-bold text-baby disabled:text-slate-300" :disabled="currentPage === totalPages" @click="currentPage += 1">다음</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const selected = ref<any>(null)
const selectedPlace = ref<any>(null)
const selectedRadius = ref(3000)
const items = ref<any[]>([])
const message = ref('')
const currentPage = ref(1)
const pageSize = 5
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const pagedItems = computed(() => items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
function statusDotClass(state?: string | null) { return state === 'open' ? 'bg-emerald-500' : state === 'closed' ? 'bg-red-500' : 'bg-slate-300' }
function statusBadgeClass(state?: string | null) { return state === 'open' ? 'bg-emerald-50 text-emerald-700' : state === 'closed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600' }

function selectPlace(item: any) { selectedPlace.value = item }
async function selectAddress(item: any) {
  selected.value = item
  selectedPlace.value = null
  currentPage.value = 1
  await load()
}
async function load() {
  if (!selected.value) return
  message.value = ''
  items.value = []
  selectedPlace.value = null
  const response = await $fetch<{ success: boolean; data?: any[]; error?: { message: string } }>('/api/baby/hospitals', { query: { lat: selected.value.latitude, lon: selected.value.longitude, radius: selectedRadius.value, sido: selected.value.sido, sigungu: selected.value.sigungu } })
  if (!response.success) { message.value = response.error?.message || '병원 정보를 불러오지 못했습니다.'; return }
  items.value = response.data || []
  currentPage.value = 1
  if (!items.value.length) message.value = '검색 결과가 없습니다.'
}
watch(currentPage, () => { selectedPlace.value = null })
const config = useRuntimeConfig()
useSeoMeta({ title: '주변 병원 찾기', description: '주소 기준 주변 병원 목록과 위치 정보를 확인합니다.', ogUrl: `${config.public.appBaseUrl}/baby/hospitals` })
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/baby/hospitals` }] })
</script>
