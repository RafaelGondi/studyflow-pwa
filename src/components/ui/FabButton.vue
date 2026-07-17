<template>
  <AkButton class="fab fab--pill" variant="primary" @click="emit('click')">
    <AkIcon name="plus-outline" :size="18" />
    {{ label }}
  </AkButton>
</template>

<script setup lang="ts">
import { AkButton, AkIcon } from '@rafael_dias/akoma'

defineProps<{ label: string }>()
const emit = defineEmits<{ click: [] }>()
</script>
