<template>
  <main class="page-shell py-8">
    <StateBlock v-if="!marathon" eyebrow="Not found" title="대회 정보를 찾을 수 없습니다" text="DB에 등록된 공식 출처 기반 대회만 상세 페이지를 제공합니다." />
    <article v-else class="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <NuxtLink class="text-sm font-bold text-running" to="/running/marathons">← 목록으로</NuxtLink>
      <h1 class="mt-4 text-3xl font-black text-ink">{{ marathon.name }}</h1>
      <p class="mt-2 text-sm text-slate-500">{{ marathon.region || '지역 정보 없음' }} · {{ marathon.dday }}</p>
      <dl class="mt-6 grid gap-4 sm:grid-cols-2">
        <div v-for="row in rows" :key="row.label" class="rounded-xl bg-slate-50 p-4">
          <dt class="text-xs font-bold text-slate-500">{{ row.label }}</dt>
          <dd class="mt-1 min-w-0 break-words font-bold text-ink [overflow-wrap:anywhere]">{{ row.value || '공개 데이터 없음' }}</dd>
        </div>
      </dl>
      <div class="mt-6 flex flex-wrap gap-2">
        <a v-if="marathon.websiteUrl" class="rounded-xl bg-ink px-4 py-3 text-sm font-black text-white" :href="marathon.websiteUrl" target="_blank" rel="noreferrer">공식 홈페이지</a>
        <a v-if="marathon.registrationUrl" class="rounded-xl bg-running px-4 py-3 text-sm font-black text-white" :href="marathon.registrationUrl" target="_blank" rel="noreferrer">접수 페이지</a>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const response = await $fetch<{ success: boolean; data?: any }>(`/api/running/marathons/${route.params.id}`)
const marathon = computed(() => (response.success ? response.data : null))
const rows = computed(() => {
  const item = marathon.value
  if (!item) return []
  return [
    { label: '개최일', value: item.raceDate },
    { label: '시작시간', value: item.startTime },
    { label: '상세주소', value: item.address },
    { label: '접수기간', value: [item.registrationStartDate, item.registrationEndDate].filter(Boolean).join(' ~ ') },
    { label: '접수상태', value: item.registrationStatus },
    { label: '종목', value: item.distances?.join(' / ') },
    { label: '참가비', value: item.entryFee },
    { label: '주최', value: item.organizer },
    { label: '주관', value: item.host },
    { label: '출처', value: item.sourceName },
  ]
})
const config = useRuntimeConfig()
useSeoMeta({
  title: marathon.value ? `${marathon.value.name} 상세정보` : '마라톤 상세정보',
  description: '마라톤 개최일, 지역, 접수 상태, 종목, 공식 홈페이지 정보를 확인합니다.',
  ogUrl: `${config.public.appBaseUrl}/running/marathons/${route.params.id}`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/running/marathons/${route.params.id}` }] })
</script>
