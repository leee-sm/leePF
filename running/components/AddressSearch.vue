<template>
  <form class="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft" @submit.prevent="openPostcode">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="min-w-0 flex-1">
        <label class="text-sm font-black text-ink" :for="inputId">주소 입력</label>
        <input :id="inputId" v-model="query" class="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" placeholder="주소 입력" autocomplete="street-address">
      </div>
      <button class="focus-ring min-h-12 rounded-xl bg-ink px-5 font-black text-white disabled:bg-slate-400" :disabled="loading" type="submit">
        {{ loading ? '검색 중' : '검색' }}
      </button>
    </div>
    <p v-if="error" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
type AddressItem = { roadAddress: string; latitude: number; longitude: number; sido: string; sigungu: string; eupMyeonDong: string; nx: number; ny: number }
defineProps<{ label?: string }>()
const emit = defineEmits<{ select: [item: AddressItem] }>()
const inputId = `address-${Math.random().toString(36).slice(2)}`
const query = ref('')
const loading = ref(false)
const error = ref('')
let postcodePromise: Promise<void> | null = null

function loadPostcode() {
  if (postcodePromise) return postcodePromise
  postcodePromise = new Promise((resolve, reject) => {
    if ((window as any).kakao?.Postcode) return resolve()
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-postcode]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Kakao postcode script failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.dataset.kakaoPostcode = 'true'
    script.src = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Kakao postcode script failed'))
    document.head.appendChild(script)
  })
  return postcodePromise
}

async function openPostcode() {
  loading.value = true
  error.value = ''
  try {
    await loadPostcode()
    new (window as any).kakao.Postcode({
      oncomplete: async (data: any) => {
        const address = data.roadAddress || data.jibunAddress || data.address
        if (!address) return
        query.value = address
        try {
          const response = await $fetch<{ success: boolean; data?: AddressItem[]; error?: { message: string } }>('/api/location/search', { query: { q: address } })
          const item = response.success ? response.data?.[0] : undefined
          if (!item) { error.value = response.error?.message || '선택한 주소의 좌표를 찾지 못했습니다.'; return }
          query.value = item.roadAddress
          emit('select', item)
        } catch { error.value = '선택한 주소의 좌표를 찾지 못했습니다.' }
      },
    }).open({ q: query.value.trim() })
  } catch { error.value = '카카오 주소 찾기를 불러오지 못했습니다.' }
  finally { loading.value = false }
}
</script>
