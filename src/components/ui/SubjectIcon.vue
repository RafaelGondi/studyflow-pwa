<template>
  <img v-if="isImage" :src="icon" class="subject-icon-img" :alt="name ?? ''" />
  <template v-else>{{ display }}</template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { INITIAL_ICON } from '@/types'

const props = defineProps<{ icon: string; name?: string }>()
const isImage = computed(() => props.icon.startsWith('data:'))
const display = computed(() => {
  if (props.icon === INITIAL_ICON) return (props.name?.[0] ?? '?').toUpperCase()
  return props.icon
})
</script>

<style scoped>
.subject-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}
</style>
