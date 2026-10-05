<template>
  <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <nav class="page-shell flex min-h-16 items-center justify-between gap-4">
      <NuxtLink :to="isBaby ? '/baby' : '/running'" class="flex items-center gap-2 font-black text-ink">
        <span class="grid h-9 w-9 place-items-center rounded-lg text-sm text-white" :class="isBaby ? 'bg-baby' : 'bg-running'">{{ isBaby ? 'BG' : 'RG' }}</span>
        <span>{{ isBaby ? 'Baby Guide' : 'Running Guide' }}</span>
      </NuxtLink>
      <div class="flex items-center gap-1 overflow-x-auto text-sm font-bold">
        <template v-if="isBaby">
          <NuxtLink to="/baby" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-rose-50">혜택</NuxtLink>
          <NuxtLink to="/baby/checklist" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-rose-50">체크리스트</NuxtLink>
          <NuxtLink to="/baby/hospitals" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-rose-50">병원</NuxtLink>
          <NuxtLink to="/baby/childcare" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-rose-50">어린이집</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/running/marathons" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-teal-50">마라톤 일정</NuxtLink>
          <NuxtLink to="/running/weather" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-teal-50">복장 추천</NuxtLink>
          <NuxtLink to="/running/pace" class="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-teal-50">페이스 계산</NuxtLink>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const requestHost = import.meta.server ? (useRequestHeaders(['host']).host || '') : window.location.host
const isBaby = computed(() => route.path === '/baby' || route.path.startsWith('/baby/') || requestHost.startsWith('baby.localhost'))
</script>
