import { prisma } from '../utils/prisma'
import { searchNearbyByCategory } from './locationService'
import { getOfficialKindergartens, matchOfficialKindergarten } from './kindergartenService'
import { getOfficialHospitals, hospitalOpenStatus, matchOfficialHospital } from './hospitalService'

export async function listBenefits(sido?: string, sigungu?: string) {
  const benefits = await prisma.babyBenefit.findMany({
    where: {
      OR: [
        { regionSido: null, regionSigungu: null },
        ...(sido ? [{ regionSido: sido, regionSigungu: null }, ...(sigungu ? [{ regionSido: sido, regionSigungu: sigungu }] : [])] : []),
      ],
    },
    orderBy: [{ regionSido: 'asc' }, { regionSigungu: 'asc' }, { title: 'asc' }],
    take: 100,
  })

  const seen = new Set<string>()
  return benefits.filter((item) => {
    const key = `${item.title}:${item.officialUrl || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((item) => ({
    id: String(item.id), title: item.title, regionSido: item.regionSido, regionSigungu: item.regionSigungu,
    content: item.content, amount: item.amount, target: item.target, applyMethod: item.applyMethod, agency: item.agency,
    officialUrl: item.officialUrl, sourceName: item.sourceName,
    effectiveDate: item.effectiveDate?.toISOString().slice(0, 10) ?? null,
    updatedSourceAt: item.updatedSourceAt?.toISOString().slice(0, 10) ?? null,
  }))
}

export async function listChecklists(type: 'pregnancy' | 'baby') {
  const rows = await prisma.babyChecklist.findMany({ where: { type, active: true }, orderBy: [{ weekFrom: 'asc' }, { displayOrder: 'asc' }] })
  return rows.map((item) => ({
    id: String(item.id), type: item.type, periodType: item.periodType, weekFrom: item.weekFrom, weekTo: item.weekTo,
    monthFrom: item.monthFrom, monthTo: item.monthTo, category: item.category, mandatory: item.mandatory,
    title: item.title, description: item.description, sourceName: item.sourceName, sourceUrl: item.sourceUrl,
  }))
}

export async function listHospitals(latitude: number, longitude: number, radiusMeters: number, sido?: string, sigungu?: string) {
  const places = await searchNearbyByCategory('HP8', latitude, longitude, radiusMeters)
  let official: Awaited<ReturnType<typeof getOfficialHospitals>> = []
  try { official = await getOfficialHospitals(sido, sigungu) } catch { official = [] }
  return places.map((place) => {
    const matched = matchOfficialHospital(place.name, place.latitude, place.longitude, official)
    const status = matched ? hospitalOpenStatus(matched.hours) : { label: '\uC601\uC5C5\uC2DC\uAC04 \uD655\uC778 \uD544\uC694', state: 'unknown' }
    return { ...place, category: matched?.category || place.category || '\uBCD1\uC6D0', phone: matched?.phone || place.phone, operationTime: matched ? '\uACF5\uC2DD \uC9C4\uB8CC\uC2DC\uAC04 \uB370\uC774\uD130 \uC5F0\uB3D9' : null, openStatus: status.label, openState: status.state, officialSource: matched ? '\uAD6D\uB9BD\uC911\uC559\uC758\uB8CC\uC6D0 \uBCD1\u00B7\uC758\uC6D0 \uCC3E\uAE30 \uC11C\uBE44\uC2A4' : null }
  })
}

export async function listChildcare(latitude: number, longitude: number, radiusMeters: number) {
  const places = await searchNearbyByCategory('PS3', latitude, longitude, radiusMeters)
  return places.filter((place) => place.name.includes('\uC5B4\uB9B0\uC774\uC9D1')).map((place) => ({
    ...place, type: null, operatingStatus: null, capacity: null, currentEnrollment: null, staffCount: null,
    classroomCount: null, schoolBus: null, homepage: null, approvalDate: null,
    verificationStatus: '\uACF5\uC2DD \uC5B4\uB9B0\uC774\uC9D1 \uC815\uBCF4 API \uC5F0\uB3D9 \uD544\uC694',
    waitlist: '\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C', ageGroups: null,
  }))
}

export async function listChildcareWithOfficialData(latitude: number, longitude: number, radiusMeters: number, sido?: string, sigungu?: string) {
  const places = await searchNearbyByCategory('PS3', latitude, longitude, radiusMeters)
  let official: Awaited<ReturnType<typeof getOfficialKindergartens>> = []
  try { official = await getOfficialKindergartens(sido, sigungu) } catch { official = [] }

  const kakaoPlaces = places.filter((place) => place.name.includes('\uC5B4\uB9B0\uC774\uC9D1') || place.name.includes('\uC720\uCE58\uC6D0')).map((place) => {
    const isKindergarten = place.name.includes('\uC720\uCE58\uC6D0')
    const matched = isKindergarten ? matchOfficialKindergarten(place.name, official) : null
    return {
      ...place,
      facilityType: isKindergarten ? '\uC720\uCE58\uC6D0' : '\uC5B4\uB9B0\uC774\uC9D1',
      type: matched?.type || null,
      operatingStatus: matched?.operatingStatus || null,
      capacity: matched?.capacity ?? null,
      currentEnrollment: matched?.currentEnrollment ?? null,
      staffCount: matched?.staffCount ?? null,
      classroomCount: matched?.classroomCount ?? null,
      classroomArea: matched?.classroomArea ?? null,
      buildingArea: matched?.buildingArea ?? null,
      floorCount: matched?.floorCount ?? null,
      schoolBus: null,
      homepage: matched?.homepage || null,
      approvalDate: null,
      operationTime: matched?.operationTime || null,
      verificationStatus: matched ? matched.sourceName : '\uACF5\uC2DD \uC2DC\uC124 \uC0C1\uC138 API \uC5F0\uB3D9 \uD544\uC694',
      sourceUrl: matched?.sourceUrl || null,
      waitlist: '\uACF5\uAC1C \uB370\uC774\uD130 \uC5C6\uC74C',
      ageGroups: null,
    }
  })

  const distance = (item: { latitude: number; longitude: number }) => Math.round(Math.hypot((item.latitude - latitude) * 111000, (item.longitude - longitude) * 88000))
  const officialPlaces = official.filter((item) => item.latitude !== null && item.longitude !== null && distance({ latitude: item.latitude, longitude: item.longitude }) <= radiusMeters).map((item) => ({
    id: `kindergarten-${item.code || item.name}`,
    name: item.name || '유치원',
    address: item.address || '',
    roadAddress: item.address || '',
    latitude: item.latitude!,
    longitude: item.longitude!,
    distanceMeters: distance({ latitude: item.latitude!, longitude: item.longitude! }),
    phone: item.phone,
    category: '교육,학문 > 유아교육 > 유치원',
    url: item.homepage,
    facilityType: '유치원',
    type: item.type,
    operatingStatus: item.operatingStatus,
    capacity: item.capacity,
    currentEnrollment: item.currentEnrollment,
    staffCount: item.staffCount,
    classroomCount: item.classroomCount,
    classroomArea: item.classroomArea,
    buildingArea: item.buildingArea,
    floorCount: item.floorCount,
    schoolBus: null,
    homepage: item.homepage,
    approvalDate: null,
    operationTime: item.operationTime,
    verificationStatus: item.sourceName,
    sourceUrl: item.sourceUrl,
    waitlist: '공개 데이터 없음',
    ageGroups: null,
  }))

  const existingNames = new Set(kakaoPlaces.map((item) => item.name.replace(/\s+/g, '')))
  return [...kakaoPlaces, ...officialPlaces.filter((item) => !existingNames.has(item.name.replace(/\s+/g, '')))].sort((a, b) => (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) - (b.distanceMeters ?? Number.MAX_SAFE_INTEGER))
}
