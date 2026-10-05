<template>
  <footer class="mt-16 border-t border-slate-200 bg-white">
    <div class="page-shell py-8 text-sm leading-6 text-slate-500">
      <p class="font-bold text-ink">{{ isBaby ? 'Baby Guide' : 'Running Guide' }}</p>
      <p class="mt-2">
        공공 API와 공식 출처를 우선 사용합니다. 제공되지 않는 정보는 임의로 추정하지 않으며,
        실제 신청·진료·참가 전에는 공식 기관 정보를 확인해야 합니다.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute()
const requestHost = import.meta.server ? (useRequestHeaders(['host']).host || '') : window.location.host
const isBaby = computed(() => route.path === '/baby' || route.path.startsWith('/baby/') || requestHost.startsWith('baby.localhost'))
</script>
