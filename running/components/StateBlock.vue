<template>
  <section class="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-soft">
    <p class="text-sm font-black uppercase tracking-wide text-slate-400">{{ eyebrow }}</p>
    <h2 class="mt-2 text-xl font-black text-ink">{{ title }}</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{{ text }}</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  text: string
}>()
</script>
