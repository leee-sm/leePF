<template>
  <div>
    <AppHeader />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const requestHost = import.meta.server ? (useRequestHeaders(['host']).host || '') : window.location.host
const isBaby = computed(() => route.path === '/baby' || route.path.startsWith('/baby/') || requestHost.startsWith('baby.localhost'))
const siteTitle = computed(() => isBaby.value ? 'Baby Guide' : 'Running Guide')
useHead({ titleTemplate: (title) => (title ? `${title} | ${siteTitle.value}` : siteTitle.value) })
</script>
