<template>
  <main class="page-shell py-8">
    <div class="mb-5">
      <p class="text-sm font-black uppercase tracking-wide text-running">Pace Calculator</p>
      <h1 class="mt-2 text-3xl font-black text-ink">목표 페이스 계산</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">초 단위 정수 계산으로 평균 페이스와 거리별 누적 통과시간을 계산합니다.</p>
    </div>
    <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-4">
        <label class="grid gap-2 text-sm font-bold text-ink">
          거리
          <select v-model="distanceType" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3">
            <option value="10k">10km</option>
            <option value="half">Half</option>
            <option value="full">Full</option>
          </select>
        </label>
        <label class="grid gap-2 text-sm font-bold text-ink">시간<input v-model.number="hours" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0" ></label>
        <label class="grid gap-2 text-sm font-bold text-ink">분<input v-model.number="minutes" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0" max="59" ></label>
        <label class="grid gap-2 text-sm font-bold text-ink">초<input v-model.number="seconds" class="focus-ring min-h-12 rounded-xl border border-slate-300 px-3" type="number" min="0" max="59" ></label>
      </div>
      <button class="focus-ring mt-4 min-h-12 rounded-xl bg-running px-5 font-black text-white" type="submit">목표 페이스 계산</button>
      <p v-if="error" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>
    </form>
    <section v-if="result" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <p class="text-sm font-black text-running">{{ result.distanceKm }}km · 목표 {{ result.targetTime }}</p>
      <h2 class="mt-2 text-4xl font-black text-ink">{{ result.paceText }}</h2>
      <div class="mt-5 overflow-x-auto">
        <table class="w-full min-w-80 text-left text-sm">
          <thead class="text-slate-500"><tr><th class="py-2">거리</th><th>페이스</th><th>누적시간</th></tr></thead>
          <tbody>
            <tr v-for="split in result.splits" :key="split.distanceKm" class="border-t border-slate-100">
              <td class="py-3 font-bold">{{ split.distanceKm }}km</td>
              <td>{{ split.paceText }}</td>
              <td>{{ split.elapsedText }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const distanceType = ref<'10k' | 'half' | 'full'>('10k')
const hours = ref(0)
const minutes = ref(50)
const seconds = ref(0)
const error = ref('')
const result = ref<any>(null)

async function calculate() {
  error.value = ''
  result.value = null
  try {
    const response = await $fetch<{ success: boolean; data?: any; error?: { message: string } }>('/api/running/pace', {
      method: 'POST',
      body: { distanceType: distanceType.value, hours: hours.value, minutes: minutes.value, seconds: seconds.value },
    })
    if (!response.success) {
      error.value = response.error?.message || '페이스 계산에 실패했습니다.'
      return
    }
    result.value = response.data
  } catch {
    error.value = '페이스 계산에 실패했습니다. DB 연결 상태를 확인해 주세요.'
  }
}

const config = useRuntimeConfig()
useSeoMeta({
  title: '목표 페이스 계산기',
  description: '10km, Half, Full 목표시간을 기준으로 1km 평균 페이스와 누적 통과시간을 계산합니다.',
  ogUrl: `${config.public.appBaseUrl}/running/pace`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/running/pace` }] })
</script>
