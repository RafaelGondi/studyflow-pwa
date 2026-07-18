<template>
  <header class="page-hero page-hero--with-nav reveal" :class="{ 'page-hero--day': bordered }">
    <div class="page-hero__main">
      <span v-if="label" class="page-label">{{ label }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="meta" class="page-hero__meta">{{ meta }}</p>
      <slot />
    </div>
    <div v-if="$slots.nav" class="page-hero__nav">
      <slot name="nav" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  title: string
  meta?: string
  bordered?: boolean
}>()
</script>
