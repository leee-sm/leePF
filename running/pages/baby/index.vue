<template>
  <main class="page-shell py-8">
    <section class="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
      <p class="text-sm font-black uppercase tracking-wide text-baby">Baby guide</p>
      <h1 class="mt-2 text-3xl font-black text-ink sm:text-5xl">임신·출산과 육아에 필요한 공식 정보</h1>
      <p class="mt-4 max-w-2xl leading-7 text-slate-600">전국 공통 혜택을 먼저 확인하고, 지역 혜택·병원·체크리스트·어린이집 정보를 이어서 찾아보세요.</p>
    </section>

    <section class="mt-6 rounded-3xl border border-rose-100 bg-rose-50/60 p-5 sm:p-7">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-black text-baby">전국 공통 혜택</p>
          <h2 class="mt-1 text-2xl font-black text-ink">임신·출산 주요 지원</h2>
        </div>
        <NuxtLink to="/baby/benefits" class="rounded-xl bg-baby px-4 py-3 text-sm font-black text-white">지역별 혜택 찾기</NuxtLink>
      </div>
      <div v-if="pending" class="mt-5 grid gap-3 sm:grid-cols-2"><div v-for="n in 4" :key="n" class="h-32 animate-pulse rounded-2xl bg-white/80" /></div>
      <StateBlock v-else-if="error" class="mt-5" eyebrow="Error" title="혜택 정보를 불러오지 못했습니다" text="잠시 후 다시 시도해 주세요." />
      <StateBlock v-else-if="!benefits.length" class="mt-5" eyebrow="No data" title="등록된 공식 혜택 데이터가 없습니다" text="공공데이터 또는 공식기관 자료가 연결되면 이곳에 표시됩니다." />
      <div v-else class="mt-5 grid gap-3 sm:grid-cols-2">
        <article v-for="item in benefits" :key="item.id" class="rounded-2xl bg-white p-5 ring-1 ring-rose-100">
          <h3 class="text-lg font-black text-ink">{{ item.title }}</h3>
          <p v-if="item.amount" class="mt-2 text-lg font-black text-baby">{{ item.amount }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.content || '상세 지원내용은 공식 안내를 확인해 주세요.' }}</p>
          <p class="mt-3 text-xs text-slate-500">대상: {{ item.target || '공식 안내 확인 필요' }} · {{ item.updatedSourceAt || item.effectiveDate || '기준일 공개 데이터 없음' }}</p>
          <a v-if="item.officialUrl" :href="item.officialUrl" target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-bold text-baby">공식 안내 확인 →</a>
        </article>
      </div>
      <p class="mt-5 text-xs leading-5 text-slate-500">정책은 변경될 수 있으므로 신청 전 반드시 공식기관의 최신 안내를 최종 확인하세요.</p>
    </section>

    <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink v-for="item in links" :key="item.to" :to="item.to" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-rose-300">
        <span class="text-sm font-black text-baby">{{ item.eyebrow }}</span>
        <h2 class="mt-2 text-xl font-black text-ink">{{ item.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.text }}</p>
      </NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
type Benefit = { id: string; title: string; amount?: string | null; content?: string | null; target?: string | null; officialUrl?: string | null; effectiveDate?: string | null; updatedSourceAt?: string | null }
const { data: response, pending, error } = await useFetch<{ success: boolean; data?: Benefit[] }>('/api/baby/benefits')
const benefits = computed(() => response.value?.success ? (response.value.data || []) : [])
const links = [
  { eyebrow: 'Benefits', title: '지역별 혜택', text: '시·도와 시·군·구를 선택해 추가 지원을 확인합니다.', to: '/baby/benefits' },
  { eyebrow: 'Hospitals', title: '주변 병원', text: '주소를 검색하고 3·5·10km 내 병원을 찾습니다.', to: '/baby/hospitals' },
  { eyebrow: 'Checklist', title: '체크리스트', text: '임신 주차와 아기 주차별 준비사항을 관리합니다.', to: '/baby/checklist' },
  { eyebrow: 'Childcare', title: '어린이집', text: '주변 어린이집 공개 정보를 확인합니다.', to: '/baby/childcare' },
]
const config = useRuntimeConfig()
useSeoMeta({ title: '임신·출산 혜택 및 육아 정보', description: '전국 공통 임신·출산 혜택과 지역별 지원, 병원, 체크리스트, 어린이집 정보를 확인하세요.', ogUrl: `${config.public.appBaseUrl}/baby` })
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/baby` }] })
</script>
