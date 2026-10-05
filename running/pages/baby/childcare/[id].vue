<template>
  <main class="page-shell py-8">
    <NuxtLink to="/baby/childcare" class="text-sm font-bold text-baby">← 어린이집 목록</NuxtLink>
    <StateBlock v-if="error" class="mt-5" eyebrow="Error" title="어린이집 정보를 불러오지 못했습니다" text="잠시 후 다시 시도해 주세요." />
    <article v-else-if="item" class="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <p class="text-sm font-black text-baby">Childcare detail</p>
      <h1 class="mt-2 text-3xl font-black text-ink">{{ item.name }}</h1>
      <p class="mt-2 text-slate-600">{{ item.roadAddress || item.address }}</p>
      <dl class="mt-6 grid gap-4 sm:grid-cols-2">
        <div v-for="field in fields" :key="field.label" class="min-w-0 border-b border-slate-100 pb-3"><dt class="text-sm text-slate-500">{{ field.label }}</dt><dd class="mt-1 break-words font-bold text-ink [overflow-wrap:anywhere]">{{ field.value ?? '공개 데이터 없음' }}</dd></div>
      </dl>
      <a v-if="item.placeUrl" :href="item.placeUrl" target="_blank" rel="noopener" class="mt-6 inline-block rounded-xl bg-baby px-4 py-3 text-sm font-black text-white">지도에서 보기</a>
      <p class="mt-6 text-xs leading-5 text-slate-500">공식 어린이집 공개 API와 매칭되지 않은 Kakao 장소 후보는 상세 정보가 제한됩니다. 대기인원은 공식 데이터가 없으면 계산하지 않습니다.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: response, error } = await useFetch<{ success: boolean; data?: any }>(`/api/baby/childcare/${encodeURIComponent(String(route.params.id))}`)
const item = computed(() => response.value?.success ? response.value.data : null)
const fields = computed(() => item.value ? [
  { label: '유형', value: item.value.type }, { label: '운영상태', value: item.value.operatingStatus },
  { label: '전화번호', value: item.value.phone }, { label: '정원', value: item.value.capacity },
  { label: '현원', value: item.value.currentEnrollment }, { label: '교직원수', value: item.value.staffCount },
  { label: '보육실수', value: item.value.classroomCount }, { label: '통학차량', value: item.value.schoolBus },
  { label: '인가일', value: item.value.approvalDate }, { label: '대기인원', value: item.value.waitlist },
] : [])
useSeoMeta({ title: computed(() => item.value ? `${item.value.name} 어린이집 정보` : '어린이집 상세정보'), description: '공식 공개 데이터 기준 어린이집 상세정보입니다.' })
</script>
