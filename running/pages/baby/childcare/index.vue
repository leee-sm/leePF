<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-baby">Childcare</p>
      <h1 class="mt-2 text-3xl font-black text-ink">주변 어린이집 찾기</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">주소를 검색한 뒤 지도에서 어린이집을 선택하면 오른쪽에서 공개된 상세 정보를 확인할 수 있습니다.</p>
    </div>
    <AddressSearch label="기준 주소" @select="selectAddress" />
    <StateBlock v-if="message" class="mt-5" eyebrow="Status" title="어린이집 검색 안내" :text="message" />
    <div v-if="items.length" class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start">
      <KakaoMap v-if="selected" :latitude="selected.latitude" :longitude="selected.longitude" :places="items" @select="selectPlace" />
      <div class="flex h-[42rem] min-w-0 flex-col gap-3 overflow-y-auto">
        <article v-if="selectedPlace" class="flex-none rounded-2xl border border-baby/30 bg-white p-5">
          <p class="text-xs font-black uppercase tracking-wide text-baby">선택한 어린이집 상세</p>
          <h2 class="mt-2 text-xl font-black text-ink">{{ selectedPlace.name }}</h2>
          <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt class="text-slate-500">유형</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.type || '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">운영상태</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.status || selectedPlace.operatingStatus || '공개 데이터 없음' }}</dd></div>
            <div class="sm:col-span-2"><dt class="text-slate-500">주소</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.roadAddress || selectedPlace.address || '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">전화번호</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.phone || '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">거리</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.distanceMeters ?? '공개 데이터 없음' }}{{ selectedPlace.distanceMeters != null ? 'm' : '' }}</dd></div>
            <div><dt class="text-slate-500">정원</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.capacity ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">현원</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.currentEnrollment ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">교직원수</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.staffCount ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">보육실수</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.roomCount ?? selectedPlace.classroomCount ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">교실면적</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.classroomArea ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">건물전용면적</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.buildingArea ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">통학차량</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.schoolBus ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">대기인원</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.waitlist ?? '공개 데이터 없음' }}</dd></div>
            <div><dt class="text-slate-500">인가일</dt><dd class="mt-1 font-bold text-ink">{{ selectedPlace.approvalDate || '공개 데이터 없음' }}</dd></div>
          </dl>
          <NuxtLink :to="`/baby/childcare/${encodeURIComponent(selectedPlace.id)}`" class="mt-4 inline-flex text-sm font-black text-baby hover:underline">전체 상세 페이지 보기 →</NuxtLink>
        </article>
        <p v-else class="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">지도에서 어린이집 위치를 선택하세요.</p>
        <div class="min-h-[20rem] flex-none grid grid-rows-5 gap-2">
          <button v-for="item in pagedItems" :key="item.id" type="button" class="min-h-0 w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-soft transition hover:border-baby" :class="selectedPlace?.id === item.id ? 'border-baby ring-2 ring-rose-100' : 'border-slate-200'" @click="selectPlace(item)">
            <div class="flex items-center justify-between gap-2"><h2 class="min-w-0 truncate text-base font-black text-ink">{{ item.name }}</h2><span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ item.operatingStatus || '운영정보 확인 필요' }}</span></div>
            <p class="mt-1 text-sm text-slate-500">{{ item.roadAddress || item.address }}</p>
            <p class="mt-2 text-sm font-bold text-slate-700">{{ item.facilityType || item.type || '유형 공개 데이터 없음' }} · {{ item.distanceMeters }}m</p>
            <p class="mt-1 text-sm text-slate-600">정원 {{ item.capacity ?? '공개 데이터 없음' }} · 현원 {{ item.currentEnrollment ?? '공개 데이터 없음' }}</p>
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
const items = ref<any[]>([])
const selected = ref<any>(null)
const selectedPlace = ref<any>(null)
const message = ref('')
const currentPage = ref(1)
const pageSize = 5
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const pagedItems = computed(() => items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
function selectPlace(item: any) { selectedPlace.value = item }
async function selectAddress(item: any) {
  selected.value = item
  selectedPlace.value = null
  message.value = ''
  items.value = []
  currentPage.value = 1
  const response = await $fetch<{ success: boolean; data?: any[]; error?: { message: string } }>('/api/baby/childcare', { query: { lat: item.latitude, lon: item.longitude, radius: 3000, sido: item.sido, sigungu: item.sigungu } })
  if (!response.success) { message.value = response.error?.message || '어린이집 정보를 불러오지 못했습니다.'; return }
  items.value = response.data || []
  currentPage.value = 1
  if (!items.value.length) message.value = '검색 결과가 없습니다.'
}
const config = useRuntimeConfig()
useSeoMeta({ title: '주변 어린이집 정원·현원 정보', description: '주소 기준 주변 어린이집의 공개 정보를 확인합니다.', ogUrl: `${config.public.appBaseUrl}/baby/childcare` })
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/baby/childcare` }] })
</script>
