<template>
  <div class="fab">
    <AkButton size="lg" class="tap-scale" :aria-label="label" @click="emit('click')">
      <template #icon>
        <AkIcon name="plus-outline" :size="18" />
      </template>
      {{ label }}
    </AkButton>
  </div>
</template>

<script setup lang="ts">
import { AkButton, AkIcon } from '@rafael_dias/akoma'

defineProps<{ label: string }>()
const emit = defineEmits<{ click: [] }>()
</script>
