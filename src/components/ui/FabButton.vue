<template>
  <button type="button" class="fab tap-scale" :aria-label="label" @click="emit('click')">
    <AkIcon name="plus-outline" :size="18" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { AkIcon } from '@rafael_dias/akoma'

defineProps<{ label: string }>()
const emit = defineEmits<{ click: [] }>()
</script>
