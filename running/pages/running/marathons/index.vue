<template>
  <main class="page-shell py-8">
    <section class="mb-8">
      <p class="text-sm font-black uppercase tracking-[0.18em] text-running">Race calendar</p>
      <h1 class="mt-2 text-3xl font-black text-ink sm:text-4xl">마라톤 일정</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        매일 갱신한 공개 일정 데이터를 기준으로 대회 날짜와 접수 상태를 확인하세요.
        대회 상세정보와 접수 여부는 공식 안내를 최종 확인해 주세요.
      </p>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold text-slate-700">
          월 선택
          <input v-model="month" class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" type="month" @change="load" >
        </label>
        <label class="text-sm font-bold text-slate-700">
          지역
          <select v-model="region" class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" @change="load">
            <option value="">전국</option>
            <option v-for="item in regions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="text-sm font-bold text-slate-700">
          접수 상태
          <select v-model="status" class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" @change="load">
            <option value="">전체 상태</option>
            <option value="접수중">접수중</option>
            <option value="접수예정">접수예정</option>
            <option value="마감">마감</option>
          </select>
        </label>
        <label class="text-sm font-bold text-slate-700">
          종목
          <select v-model="distance" class="focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" @change="load">
            <option value="">전체 종목</option>
            <option value="10k">10km 포함</option>
            <option value="half">하프 포함</option>
            <option value="full">풀코스 포함</option>
          </select>
        </label>
      </div>
    </section>

    <p v-if="loading" class="mt-6 rounded-2xl bg-slate-100 px-4 py-5 text-sm text-slate-600">일정을 불러오는 중입니다.</p>
    <StateBlock v-else-if="!items.length" class="mt-6" eyebrow="No races" title="선택한 기간에 등록된 일정이 없습니다" text="공개 원천에 등록된 일정이 없거나 필터 조건과 일치하지 않습니다." />

    <section v-else class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.95fr)]">
      <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-black text-ink">{{ monthLabel }}</h2>
          <span class="text-sm font-bold text-slate-500">{{ items.length }}개 대회</span>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>
        <div class="mt-2 grid grid-cols-7 gap-1">
          <button v-for="cell in calendarCells" :key="cell.key" class="min-h-16 rounded-xl border p-1 text-left transition sm:min-h-20" :class="cell.date && cell.events.length ? 'border-running/30 bg-running/5 hover:bg-running/10' : 'border-transparent bg-slate-50/60'" :disabled="!cell.date || !cell.events.length" @click="selectedDate = cell.date">
            <span v-if="cell.date" class="text-xs font-black" :class="cell.date === selectedDate ? 'text-running' : 'text-slate-600'">{{ cell.day }}</span>
            <span v-if="cell.events.length" class="mt-1 block text-[10px] font-bold leading-4 text-slate-500">{{ cell.events.length }}개</span>
          </button>
        </div>
      </div>

      <div class="flex h-[42rem] min-h-[42rem] flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-3 lg:p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black text-ink">{{ selectedDate ? `${selectedDate} 일정` : '날짜별 일정' }}</h2>
          <button v-if="selectedDate" class="text-sm font-bold text-running" @click="selectedDate = ''">전체 보기</button>
        </div>
        <div class="min-h-0 flex-1 grid grid-rows-5 gap-2">
        <NuxtLink v-for="item in pagedItems" :key="item.id" :to="`/running/marathons/${item.id}`" class="min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-soft transition hover:border-running/50">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-black text-running">{{ item.raceDate }} · {{ item.region || '지역 미공개' }}</p>
              <h3 class="mt-1 break-words text-base font-black text-ink">{{ item.name }}</h3>
            </div>
            <span class="shrink-0 rounded-full bg-running/10 px-3 py-1 text-xs font-black text-running">{{ item.dday }}</span>
          </div>
          <p class="mt-3 text-sm text-slate-600">{{ item.distances?.join(' · ') || '종목 정보 미공개' }} · {{ item.registrationStatus || '접수 상태 미공개' }}</p>
        </NuxtLink>
        </div>
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <button class="rounded-lg px-3 py-2 text-sm font-bold text-running disabled:cursor-not-allowed disabled:text-slate-300" :disabled="currentPage === 1" @click="currentPage -= 1">이전</button>
          <span class="text-sm font-bold text-slate-600">{{ currentPage }} / {{ totalPages }}</span>
          <button class="rounded-lg px-3 py-2 text-sm font-bold text-running disabled:cursor-not-allowed disabled:text-slate-300" :disabled="currentPage === totalPages" @click="currentPage += 1">다음</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
type MarathonItem = { id: string; name: string; region?: string | null; raceDate: string; registrationStatus?: string; dday: string; distances: string[] }
type CalendarCell = { key: string; date: string; day: number; events: MarathonItem[] }

const month = ref(new Date().toISOString().slice(0, 7))
const region = ref('')
const status = ref('')
const distance = ref('')
const selectedDate = ref('')
const currentPage = ref(1)
const pageSize = 5
const items = ref<MarathonItem[]>([])
const loading = ref(false)
const regions = ['서울', '인천', '경기', '강원', '대전', '대구', '부산', '광주', '울산', '세종', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const monthLabel = computed(() => {
  const [year, value] = month.value.split('-')
  return `${year}년 ${Number(value)}월`
})
const grouped = computed(() => items.value.reduce<Record<string, MarathonItem[]>>((all, item) => {
  if (item.raceDate) (all[item.raceDate] ||= []).push(item)
  return all
}, {}))
const calendarCells = computed<CalendarCell[]>(() => {
  const [year, value] = month.value.split('-').map(Number)
  const first = new Date(year, value - 1, 1).getDay()
  const count = new Date(year, value, 0).getDate()
  const cells: CalendarCell[] = []
  for (let index = 0; index < first; index += 1) cells.push({ key: `empty-${index}`, date: '', day: 0, events: [] })
  for (let day = 1; day <= count; day += 1) {
    const date = `${year}-${String(value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ key: date, date, day, events: grouped.value[date] || [] })
  }
  return cells
})
const visibleItems = computed(() => selectedDate.value ? grouped.value[selectedDate.value] || [] : items.value)
const totalPages = computed(() => Math.max(1, Math.ceil(visibleItems.value.length / pageSize)))
const pagedItems = computed(() => visibleItems.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

watch(visibleItems, () => {
  currentPage.value = 1
})

async function load() {
  loading.value = true
  selectedDate.value = ''
  currentPage.value = 1
  try {
    const response = await $fetch<{ success: boolean; data?: { items: MarathonItem[] } }>('/api/running/marathons', { query: { month: month.value, region: region.value || undefined, status: status.value || undefined, distance: distance.value || undefined } })
    items.value = response.success ? response.data?.items || [] : []
  } finally {
    loading.value = false
  }
}

await load()
const config = useRuntimeConfig()
useSeoMeta({
  title: `${monthLabel.value} 전국 마라톤 일정 및 접수정보 | LifeRun`,
  description: '날짜, 지역, 종목, 접수 상태별로 전국 러닝 대회 일정을 확인하세요.',
  ogUrl: `${config.public.appBaseUrl}/running/marathons`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/running/marathons` }] })
</script>
