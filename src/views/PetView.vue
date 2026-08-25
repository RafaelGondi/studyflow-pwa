<template>
  <div class="ak-app-page">
    <AkPageHeader label="Companheiro" :title="pet.name" :meta="`Nível ${pet.level} · ${pet.moodLabel}`" size="md">
      <template #actions>
        <AkButton size="sm" variant="ghost" @click="router.back()">
          <template #icon><AkIcon name="arrow-left-outline" :size="16" /></template>
          Voltar
        </AkButton>
      </template>
    </AkPageHeader>

    <div class="ak-app-scroll pet-page reveal reveal-d1">
      <section class="habitat">
        <span class="habitat__star habitat__star--one">✦</span>
        <span class="habitat__star habitat__star--two">·</span>
        <PixelPet :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :size="224" />
        <p class="speech">“{{ pet.message }}”</p>
      </section>

      <section class="bond-card">
        <div class="bond-card__head">
          <div>
            <span class="eyebrow">Vínculo</span>
            <strong>Nível {{ pet.level }}</strong>
          </div>
          <span class="numeric">{{ pet.levelProgress }} / 100</span>
        </div>
        <div class="bond-bar" :style="{ '--fill': `${pet.levelProgress}%` }"><span /></div>
        <p>Cada moeda conquistada aproxima {{ pet.name }} do próximo nível. Resgatar recompensas não reduz o vínculo.</p>
      </section>

      <section class="today-card">
        <div class="today-card__icon">✦</div>
        <div>
          <span class="eyebrow">Ritmo de hoje</span>
          <strong>{{ formatDuration(pet.todaySeconds) }} em foco</strong>
          <p>{{ nextMoodHint }}</p>
        </div>
      </section>

      <section class="name-card">
        <div>
          <span class="eyebrow">Nome do mascote</span>
          <p>Esse nome fica sincronizado com sua conta.</p>
        </div>
        <form class="name-form" @submit.prevent="saveName">
          <AkInput v-model="draftName" label="Nome" placeholder="Lumi" maxlength="20" required />
          <AkButton type="submit" variant="primary" :loading="saving" :disabled="!draftName.trim()">Salvar</AkButton>
        </form>
      </section>

      <p class="first-version">Primeira fase do companheiro: humor diário, evolução pelo seu histórico e nome personalizado. Novas espécies e interações podem chegar depois.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AkButton, AkIcon, AkInput, AkPageHeader } from '@rafael_dias/akoma'
import PixelPet from '@/components/pet/PixelPet.vue'
import { usePetStore } from '@/stores/pet'
import { useAppToast } from '@/composables/useAppToast'
import { formatDuration } from '@/types'

const router = useRouter()
const pet = usePetStore()
const toast = useAppToast()
const draftName = ref(pet.name)
const saving = ref(false)

watch(() => pet.name, value => { draftName.value = value }, { immediate: true })

const nextMoodHint = computed(() => {
  if (pet.todaySeconds >= 3600) return `${pet.name} está no humor máximo de hoje.`
  const target = pet.todaySeconds < 1500 ? 1500 : 3600
  return `Mais ${formatDuration(target - pet.todaySeconds)} para uma nova reação.`
})

async function saveName() {
  saving.value = true
  try {
    await pet.rename(draftName.value)
    toast.success('Nome salvo', `Seu companheiro agora se chama ${pet.name}.`)
  } catch {
    toast.error('Não foi possível salvar', 'Tente novamente quando estiver conectado.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.pet-page { padding: var(--space-4); padding-bottom: calc(112px + env(safe-area-inset-bottom)); }
.habitat {
  position: relative; display: grid; place-items: center; min-height: 330px; overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent) 23%, var(--border)); border-radius: var(--radius-xl);
  background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 48%), var(--bg-elevated);
}
.habitat__star { position: absolute; color: color-mix(in srgb, #e4ad36 78%, var(--text)); font-size: 20px; }
.habitat__star--one { top: 18%; left: 18%; }.habitat__star--two { top: 13%; right: 21%; font-size: 38px; }
.speech { position: absolute; left: var(--space-4); right: var(--space-4); bottom: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--bg) 88%, transparent); color: var(--text-secondary); text-align: center; font-size: var(--text-sm); backdrop-filter: blur(8px); }
.bond-card, .today-card, .name-card { margin-top: var(--space-4); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg-elevated); }
.bond-card__head { display: flex; justify-content: space-between; align-items: end; }.bond-card__head div { display: grid; gap: 3px; }.bond-card__head > span { color: var(--accent); font-weight: 700; }
.eyebrow { color: var(--text-secondary); font-size: var(--text-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.bond-bar { height: 8px; margin: var(--space-3) 0; overflow: hidden; border-radius: 999px; background: var(--bg-subtle); }.bond-bar span { display: block; width: var(--fill); height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), #e4ad36); transition: width .45s var(--ease-smooth); }
.bond-card p, .today-card p, .name-card p, .first-version { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; }
.today-card { display: flex; align-items: center; gap: var(--space-3); }.today-card__icon { display: grid; place-items: center; flex: 0 0 48px; height: 48px; border-radius: var(--radius-md); background: color-mix(in srgb, #e4ad36 15%, var(--bg-subtle)); color: #c58a13; font-size: 22px; }.today-card div:last-child { display: grid; gap: 3px; }
.name-card { display: grid; gap: var(--space-4); }.name-form { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: var(--space-2); }
.first-version { margin: var(--space-5) var(--space-2) 0; text-align: center; }
@media (max-width: 390px) { .name-form { grid-template-columns: 1fr; } }
</style>
