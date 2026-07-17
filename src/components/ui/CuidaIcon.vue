<template>
  <span
    class="cuida-icon"
    :style="{ width: `${size}px`, height: `${size}px`, color }"
    aria-hidden="true"
    v-html="svg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCuidaIcon } from '@/utils/cuidaIcon'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  color?: string
}>(), {
  size: 22,
})

const svg = computed(() => getCuidaIcon(props.name)?.data ?? '')
</script>

<style scoped>
.cuida-icon {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
}
.cuida-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>
