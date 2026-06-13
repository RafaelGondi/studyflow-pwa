<template>
  <button
    type="button"
    class="chip tap-scale"
    :class="{
      'chip--active': active,
      'chip--accent': accent,
    }"
    :style="active && color ? { background: color } : undefined"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
  /** Cor sólida quando ativo (categorias do usuário) */
  color?: string
  /** Filtro genérico (ex.: Todas) — usa accent quando ativo */
  accent?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  white-space: nowrap;
  transition:
    color 0.25s ease,
    background 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.chip--active {
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
}

.chip--active.chip--accent {
  background: var(--accent);
}
</style>
