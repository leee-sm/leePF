<template>
  <div ref="mapElement" class="h-[42rem] min-h-72 w-full overflow-hidden rounded-2xl bg-slate-100" aria-label="검색 결과 지도" />
</template>

<script setup lang="ts">
type Place = { name: string; latitude: number; longitude: number; [key: string]: any }
const props = defineProps<{ latitude: number; longitude: number; places: Place[]; selectedId?: string | null }>()
const emit = defineEmits<{ select: [place: Place] }>()
const mapElement = ref<HTMLElement | null>(null)
let map: any
let markers: any[] = []
let selectedOverlay: any
let sdkPromise: Promise<void> | null = null
const config = useRuntimeConfig()
const route = useRoute()
const javascriptKey = computed(() => route.path.startsWith('/baby') ? config.public.kakaoBabyJavascriptKey : config.public.kakaoRunJavascriptKey)

function loadSdk() {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (!javascriptKey.value) return reject(new Error('Kakao JavaScript 키가 설정되지 않았습니다.'))
    if ((window as any).kakao?.maps) {
      ;(window as any).kakao.maps.load(resolve)
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-map]')
    if (existing) {
      existing.addEventListener('load', () => (window as any).kakao.maps.load(resolve), { once: true })
      existing.addEventListener('error', () => reject(new Error('Kakao 지도 SDK를 불러오지 못했습니다.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.dataset.kakaoMap = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(javascriptKey.value)}&autoload=false`
    script.onload = () => {
      if (!(window as any).kakao?.maps) return reject(new Error('Kakao 지도 SDK 응답이 올바르지 않습니다.'))
      ;(window as any).kakao.maps.load(resolve)
    }
    script.onerror = () => reject(new Error('Kakao 지도 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

async function draw() {
  if (!mapElement.value) return
  try {
    await loadSdk()
    const kakao = (window as any).kakao
    const center = new kakao.maps.LatLng(props.latitude, props.longitude)
    map ||= new kakao.maps.Map(mapElement.value, { center, level: 5 })
    map.setCenter(center)
    markers.forEach((marker) => marker.setMap(null))
    markers = props.places.map((place) => {
      const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(place.latitude, place.longitude), title: place.name })
      kakao.maps.event.addListener(marker, 'click', () => emit('select', place))
      return marker
    })
    focusSelected()
  } catch {
    if (mapElement.value) mapElement.value.textContent = '지도를 불러오지 못했습니다. Kakao JavaScript 키와 도메인 설정을 확인해 주세요.'
  }
}

function focusSelected() {
  if (!map) return
  const index = props.places.findIndex((place) => String(place.id) === String(props.selectedId))
  if (selectedOverlay) selectedOverlay.setMap(null)
  if (index < 0) return
  const kakao = (window as any).kakao
  const place = props.places[index]
  markers[index]?.setZIndex(10)
  map.setCenter(new kakao.maps.LatLng(place.latitude, place.longitude))
  const content = document.createElement('div')
  content.className = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg'
  content.style.maxWidth = '220px'
  const title = document.createElement('strong')
  title.className = 'block text-sm font-bold text-slate-900'
  title.textContent = place.name
  const address = document.createElement('span')
  address.className = 'mt-1 block text-slate-600'
  address.textContent = place.roadAddress || place.address || ''
  content.append(title, address)
  if (place.phone) {
    const phone = document.createElement('span')
    phone.className = 'mt-1 block text-slate-600'
    phone.textContent = place.phone
    content.append(phone)
  }
  if (place.openStatus || place.operatingStatus) {
    const status = document.createElement('span')
    status.className = 'mt-1 block font-bold text-slate-800'
    status.textContent = place.openStatus || place.operatingStatus
    content.append(status)
  }
  selectedOverlay = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(place.latitude, place.longitude), content, yAnchor: 1.25, zIndex: 20 })
  selectedOverlay.setMap(map)
}

onMounted(draw)
watch(() => [props.latitude, props.longitude, props.places], draw, { deep: true })
watch(() => props.selectedId, focusSelected)
</script>
