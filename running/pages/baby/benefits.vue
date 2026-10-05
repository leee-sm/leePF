<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-baby">Benefits</p>
      <h1 class="mt-2 text-3xl font-black text-ink">임신·출산 혜택</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">정책은 DB에 공식 출처와 기준일을 함께 관리합니다. 초기에는 임의 데이터를 표시하지 않습니다.</p>
    </div>
    <form class="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-3" @submit.prevent="refresh">
      <select v-model="sido" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" aria-label="시도 선택">
        <option value="">전국 공통</option><option v-for="item in regions" :key="item.name" :value="item.name">{{ item.name }}</option>
      </select>
      <select :key="sido || 'all'" v-model="sigungu" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" :disabled="!sido" aria-label="시군구 선택">
        <option value="">{{ sido ? '시·군·구 전체' : '시·도 먼저 선택' }}</option><option v-for="item in sigunguOptions" :key="item" :value="item">{{ item }}</option>
      </select>
      <button class="focus-ring min-h-12 rounded-xl bg-baby px-4 font-black text-white">지역 혜택 조회</button>
    </form>
    <StateBlock v-if="!items.length" eyebrow="No official policy data" title="등록된 공식 혜택 데이터가 없습니다" text="공공데이터 또는 공식 출처 기반 정책을 DB에 적재하면 이곳에 전국 공통 및 지역별 혜택이 표시됩니다." />
    <div v-else class="grid gap-3">
      <article v-for="item in items" :key="item.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 class="text-xl font-black text-ink">{{ item.title }}</h2>
        <p v-if="item.amount" class="mt-2 text-lg font-black text-baby">{{ item.amount }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.content || '상세 내용 공개 데이터 없음' }}</p>
        <p class="mt-3 text-xs text-slate-500">출처: {{ item.sourceName || '공식 출처 확인 필요' }} · 기준일 {{ item.updatedSourceAt || item.effectiveDate || '공개 데이터 없음' }}</p>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
const sido = ref('')
const sigungu = ref('')
const items = ref<any[]>([])
const regions = [
  { name: '서울특별시', children: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'] },
  { name: '부산광역시', children: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'] },
  { name: '대구광역시', children: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'] },
  { name: '인천광역시', children: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'] },
  { name: '광주광역시', children: ['동구', '서구', '남구', '북구', '광산구'] },
  { name: '대전광역시', children: ['동구', '중구', '서구', '유성구', '대덕구'] },
  { name: '울산광역시', children: ['중구', '남구', '동구', '북구', '울주군'] },
  { name: '세종특별자치시', children: ['세종시'] },
  { name: '경기도', children: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시', '연천군', '가평군', '양평군'] },
  { name: '강원특별자치도', children: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'] },
  { name: '충청북도', children: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'] },
  { name: '충청남도', children: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'] },
  { name: '전북특별자치도', children: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'] },
  { name: '전라남도', children: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'] },
  { name: '경상북도', children: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'] },
  { name: '경상남도', children: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'] },
  { name: '제주특별자치도', children: ['제주시', '서귀포시'] },
]
const sigunguOptions = computed(() => regions.find((item) => item.name === sido.value)?.children || [])
watch(sido, () => { sigungu.value = '' })
async function refresh() {
  const response = await $fetch<{ success: boolean; data?: any[] }>('/api/baby/benefits', { query: { sido: sido.value || undefined, sigungu: sigungu.value || undefined } })
  items.value = response.success ? response.data || [] : []
}
await refresh()
const config = useRuntimeConfig()
useSeoMeta({
  title: '임신·출산 혜택 및 지역별 지원정보',
  description: '전국 공통 및 지역별 임신·출산 지원 정책을 공식 출처와 기준일 중심으로 확인합니다.',
  ogUrl: `${config.public.appBaseUrl}/baby/benefits`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/baby/benefits` }] })
</script>
