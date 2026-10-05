import { z } from 'zod'
import { cached } from '../utils/cache'
import { fetchJson } from '../utils/http'
import { toKmaGrid } from '../utils/kmaGrid'

const kakaoAddressSchema = z.object({
  documents: z.array(
    z.object({
      address_name: z.string().optional(),
      x: z.string(),
      y: z.string(),
      road_address: z.record(z.unknown()).nullable().optional(),
      address: z.record(z.unknown()).nullable().optional(),
    }),
  ),
})

const kakaoPlaceSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      place_name: z.string(),
      category_name: z.string().optional(),
      phone: z.string().optional(),
      address_name: z.string().optional(),
      road_address_name: z.string().optional(),
      x: z.string(),
      y: z.string(),
      distance: z.string().optional(),
      place_url: z.string().optional(),
    }),
  ),
})

export type AddressResult = {
  roadAddress: string
  latitude: number
  longitude: number
  sido: string
  sigungu: string
  eupMyeonDong: string
  nx: number
  ny: number
}

export type NearbyPlace = {
  id: string
  name: string
  address: string
  roadAddress: string
  latitude: number
  longitude: number
  distanceMeters: number | null
  phone: string | null
  category: string | null
  url: string | null
}

function requireKakaoKey() {
  const config = useRuntimeConfig()
  if (!config.kakaoRestApiKey) {
    throw new Error('Kakao REST API Key가 설정되지 않았습니다.')
  }
  return config.kakaoRestApiKey
}

export async function searchAddress(query: string): Promise<AddressResult[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []
  const key = requireKakaoKey()
  return cached(`address:v2:${normalized}`, 60 * 60 * 24 * 14, async () => {
    const roadSpaced = normalized.replace(/\s*(대로|로|길)\s*(\d+(?:-\d+)?(?:\S*)?)$/u, '$1 $2')
    const queries = [...new Set([
      normalized,
      roadSpaced,
      normalized.replace(/\s+/g, ''),
      normalized.replace(/(대로|로|길)\s*(\d+)/g, '$1 $2'),
    ])]
    let parsed = { documents: [] as z.infer<typeof kakaoAddressSchema>['documents'] }
    for (const candidate of queries) {
      const url = new URL('https://dapi.kakao.com/v2/local/search/address.json')
      url.searchParams.set('query', candidate)
      const json = await fetchJson<unknown>(url.toString(), {
        headers: { Authorization: `KakaoAK ${key}` },
      })
      const result = kakaoAddressSchema.parse(json)
      parsed = result
      if (result.documents.length) break
    }
    return parsed.documents.map((item) => {
      const latitude = Number(item.y)
      const longitude = Number(item.x)
      const grid = toKmaGrid(latitude, longitude)
      const road = item.road_address
      const address = item.address
      return {
        roadAddress: String(road?.address_name || item.address_name || ''),
        latitude,
        longitude,
        sido: String(road?.region_1depth_name || address?.region_1depth_name || ''),
        sigungu: String(road?.region_2depth_name || address?.region_2depth_name || ''),
        eupMyeonDong: String(road?.region_3depth_name || address?.region_3depth_name || ''),
        ...grid,
      }
    })
  })
}

export async function searchNearbyByCategory(
  categoryGroupCode: 'HP8' | 'PS3',
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<NearbyPlace[]> {
  const key = requireKakaoKey()
  const safeRadius = Math.min(Math.max(radiusMeters, 100), 10_000)
  const cacheKey = `place:${categoryGroupCode}:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${safeRadius}`
  return cached(cacheKey, 60 * 60 * 6, async () => {
    const url = new URL('https://dapi.kakao.com/v2/local/search/category.json')
    url.searchParams.set('category_group_code', categoryGroupCode)
    url.searchParams.set('x', String(longitude))
    url.searchParams.set('y', String(latitude))
    url.searchParams.set('radius', String(safeRadius))
    url.searchParams.set('sort', 'distance')
    const json = await fetchJson<unknown>(url.toString(), {
      headers: { Authorization: `KakaoAK ${key}` },
    })
    const parsed = kakaoPlaceSchema.parse(json)
    return parsed.documents.map((item) => ({
      id: item.id,
      name: item.place_name,
      address: item.address_name || '',
      roadAddress: item.road_address_name || '',
      latitude: Number(item.y),
      longitude: Number(item.x),
      distanceMeters: item.distance ? Number(item.distance) : null,
      phone: item.phone || null,
      category: item.category_name || null,
      url: item.place_url || null,
    }))
  })
}
