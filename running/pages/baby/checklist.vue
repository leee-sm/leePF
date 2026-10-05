<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-baby">Checklist</p>
      <h1 class="mt-2 text-3xl font-black text-ink">{{ type === 'pregnancy' ? '임신 주차별 체크리스트' : '출산 후 아기 체크리스트' }}</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">이번 주에 확인해보세요. 일반적인 확인사항이며 개인별 진료 및 검사 일정은 다를 수 있습니다.</p>
      <p class="mt-2 text-xs leading-5 text-slate-500">정확한 일정은 의료진 또는 공식 기관 안내를 확인하세요.</p>
    </div>

    <div class="mb-5 flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft" role="tablist" aria-label="체크리스트 유형">
      <button type="button" role="tab" :aria-selected="type === 'pregnancy'" class="flex-1 rounded-lg px-3 py-3 text-sm font-black" :class="type === 'pregnancy' ? 'bg-rose-50 text-baby' : 'text-slate-500'" @click="setType('pregnancy')">임신</button>
      <button type="button" role="tab" :aria-selected="type === 'baby'" class="flex-1 rounded-lg px-3 py-3 text-sm font-black" :class="type === 'baby' ? 'bg-rose-50 text-baby' : 'text-slate-500'" @click="setType('baby')">출산 후 아기</button>
    </div>

    <section class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2">
      <label class="grid gap-2 text-sm font-bold text-ink">확인 시기
        <select v-model="periodKey" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3">
          <option v-for="option in periodOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm font-bold text-ink">카테고리
        <select v-model="category" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3">
          <option value="all">전체</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </section>

    <section v-if="type === 'pregnancy'" class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
      일반적인 검사 시기 참고정보입니다. 목덜미투명대검사는 11~14주, 통합선별검사 2차 혈액검사는 15~22주, 임신성 당뇨검사는 24~28주에 시행될 수 있으며 개인별 일정은 의료진 안내를 확인하세요.
    </section>

    <div v-if="pending" class="mt-5 grid gap-3"><div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-2xl bg-slate-100" /></div>
    <StateBlock v-else-if="errorMessage" class="mt-5" eyebrow="Error" title="체크리스트를 불러오지 못했습니다" :text="errorMessage" />
    <StateBlock v-else-if="!filteredItems.length" class="mt-5" eyebrow="No checklist data" title="이 시기의 체크리스트가 없습니다" text="공식기관 자료를 확인해 추가할 수 있는 항목은 순차적으로 등록됩니다." />
    <div v-else class="mt-5 grid gap-3">
      <label v-for="item in filteredItems" :key="item.id" class="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <input v-model="checked[item.id]" class="mt-1 h-5 w-5 accent-rose-600" type="checkbox" @change="persist">
        <span class="min-w-0">
          <span class="mb-1 inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-baby">{{ item.category }}{{ item.mandatory ? ' · 참고 우선순위 높음' : '' }}</span>
          <b class="block text-ink">{{ item.title }}</b>
          <span class="mt-1 block text-sm leading-6 text-slate-600">{{ item.description }}</span>
          <a v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank" rel="noopener" class="mt-2 inline-block text-xs font-bold text-baby">출처: {{ item.sourceName || '공식기관' }} →</a>
        </span>
      </label>
    </div>
  </main>
</template>

<script setup lang="ts">
type Checklist = { id: string; type: string; periodType: 'week' | 'month'; weekFrom: number | null; weekTo: number | null; monthFrom: number | null; monthTo: number | null; category: string; title: string; description: string | null; sourceName: string | null; sourceUrl: string | null; mandatory: boolean }
const type = ref<'pregnancy' | 'baby'>('pregnancy')
const periodKey = ref('week:4')
const category = ref('all')
const items = ref<Checklist[]>([])
const checked = ref<Record<string, boolean>>({})
const pending = ref(false)
const errorMessage = ref('')
const pregnancyCategories = ['검사', '진료', '생활', '준비', '행정', '출산준비']
const babyCategories = ['예방접종', '건강검진', '수유', '수면', '발달', '안전', '생활', '행정']
const categories = computed(() => type.value === 'pregnancy' ? pregnancyCategories : babyCategories)
const periodOptions = computed(() => type.value === 'pregnancy'
  ? Array.from({ length: 37 }, (_, index) => ({ key: `week:${index + 4}`, label: `임신 ${index + 4}주` }))
  : [...Array.from({ length: 12 }, (_, index) => ({ key: `week:${index + 1}`, label: `생후 ${index + 1}주` })), ...Array.from({ length: 10 }, (_, index) => ({ key: `month:${index + 3}`, label: `생후 ${index + 3}개월` }))])
const filteredItems = computed(() => {
  const [periodType, value] = periodKey.value.split(':')
  const period = Number(value)
  return items.value.filter((item) => item.periodType === periodType && (periodType === 'week' ? item.weekFrom === period : item.monthFrom === period) && (category.value === 'all' || item.category === category.value))
})

function loadChecked() {
  if (import.meta.client) checked.value = JSON.parse(localStorage.getItem(`baby-checklist:${type.value}`) || '{}')
}
function persist() {
  if (import.meta.client) localStorage.setItem(`baby-checklist:${type.value}`, JSON.stringify(checked.value))
}
async function refresh() {
  pending.value = true; errorMessage.value = ''; category.value = 'all'
  try {
    const response = await $fetch<{ success: boolean; data?: Checklist[]; error?: { message?: string } }>('/api/baby/checklists', { query: { type: type.value } })
    if (!response.success) throw new Error(response.error?.message || '체크리스트 데이터를 불러오지 못했습니다.')
    items.value = response.data || []
    periodKey.value = type.value === 'pregnancy' ? 'week:4' : 'week:1'
    loadChecked()
  } catch (error) { items.value = []; errorMessage.value = error instanceof Error ? error.message : '체크리스트 데이터를 불러오지 못했습니다.' }
  finally { pending.value = false }
}
async function setType(next: 'pregnancy' | 'baby') { type.value = next; await refresh() }
await refresh()
const config = useRuntimeConfig()
useSeoMeta({ title: '임신·출산 후 체크리스트', description: '임신 주차와 출산 후 아기 주차·월령별 확인사항을 공식 출처와 함께 확인합니다.', ogUrl: `${config.public.appBaseUrl}/baby/checklist` })
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/baby/checklist` }] })
</script>
