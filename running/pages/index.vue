<template>
  <main>
    <section class="page-shell py-10 sm:py-16">
      <p class="text-sm font-black uppercase tracking-wide text-running">Public service foundation</p>
      <h1 class="mt-3 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
        러닝과 임신·육아 정보를 공식 데이터 중심으로 확인합니다.
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-7 text-slate-600">
        날씨 기반 러닝 준비, 마라톤 일정, 목표 페이스와 임신·출산 혜택, 병원, 체크리스트,
        어린이집 정보를 하나의 SSR 서비스에서 제공합니다.
      </p>
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <NuxtLink class="rounded-2xl border border-teal-200 bg-white p-6 shadow-soft hover:bg-teal-50" to="/running">
          <span class="text-sm font-black text-running">Running</span>
          <h2 class="mt-2 text-2xl font-black text-ink">오늘의 러닝 준비</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">날씨, 마라톤 일정, 목표 페이스를 빠르게 확인합니다.</p>
        </NuxtLink>
        <NuxtLink class="rounded-2xl border border-rose-200 bg-white p-6 shadow-soft hover:bg-rose-50" to="/baby">
          <span class="text-sm font-black text-baby">Baby</span>
          <h2 class="mt-2 text-2xl font-black text-ink">임신·출산·육아 정보</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">혜택, 병원, 체크리스트, 어린이집 정보를 확인합니다.</p>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
useSeoMeta({
  title: '러닝과 임신·육아 생활 정보',
  description: '러닝 날씨, 마라톤 일정, 페이스 계산과 임신·출산·육아 정보를 제공하는 공개 웹서비스입니다.',
  ogTitle: 'LifeRun Guide',
  ogDescription: '러닝과 임신·육아 생활 정보를 공식 데이터 중심으로 확인하세요.',
  ogUrl: `${config.public.appBaseUrl}/`,
})
useHead({
  link: [{ rel: 'canonical', href: `${config.public.appBaseUrl}/` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'LifeRun Guide',
        url: `${config.public.appBaseUrl}/`,
      }),
    },
  ],
})
</script>
