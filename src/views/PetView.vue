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
      <section class="habitat" :class="{ 'habitat--away': pet.isAway }">
        <span class="habitat__star habitat__star--one">✦</span>
        <span class="habitat__star habitat__star--two">·</span>
        <PixelPet :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :size="224" />
        <p class="speech">“{{ pet.message }}”</p>
      </section>

      <section class="care-card" :class="{ 'care-card--danger': pet.isAway }">
        <div class="care-card__head">
          <div>
            <span class="eyebrow">Cuidados diários</span>
            <strong>{{ careTitle }}</strong>
          </div>
          <div class="hearts" :aria-label="`${pet.hearts} de ${pet.maxHearts} corações`">
            <span v-for="heart in pet.maxHearts" :key="heart" :class="{ 'heart--empty': heart > pet.hearts }">♥</span>
          </div>
        </div>
        <div class="care-bar" :style="{ '--fill': `${pet.careProgress}%` }"><span /></div>
        <div class="care-card__foot">
          <span>{{ formatDuration(pet.todaySeconds) }} de 1h hoje</span>
          <strong v-if="pet.streak">🔥 {{ pet.streak }} {{ pet.streak === 1 ? 'dia' : 'dias' }}</strong>
          <strong v-else>Comece sua sequência</strong>
        </div>
        <p>{{ careHint }}</p>
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
          <p>{{ nextCareHint }}</p>
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

      <details class="care-rules">
        <summary>Como funcionam os cuidados?</summary>
        <p>A Lumi precisa de 1h de foco por dia. Cada dia completo abaixo da meta remove um coração e encerra a sequência. Com cinco dias consecutivos sem a meta ela vai embora — mas completar 1h traz sua companheira de volta.</p>
      </details>
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

const careTitle = computed(() => {
  if (pet.isAway) return `${pet.name} foi embora`
  if (pet.todayGoalMet) return 'Bem alimentada hoje'
  if (pet.missedDays > 0) return 'Está com fome'
  return 'Aguardando o foco de hoje'
})

const careHint = computed(() => {
  if (pet.isAway) return `Complete a meta de hoje para ${pet.name} voltar para casa.`
  if (pet.todayGoalMet) return 'Meta cumprida. A sequência e os corações estão protegidos.'
  if (pet.streakAtRisk) return 'Sua sequência continua viva, mas precisa da meta de hoje para ser mantida.'
  if (pet.missedDays > 0) return `Foram ${pet.missedDays} ${pet.missedDays === 1 ? 'dia' : 'dias'} sem a meta diária.`
  return 'O dia atual só conta como perdido quando termina.'
})

const nextCareHint = computed(() => {
  if (pet.todayGoalMet) return `${pet.name} está bem e a meta de hoje está garantida.`
  return `Faltam ${formatDuration(Math.max(0, pet.dailyGoalSeconds - pet.todaySeconds))} para alimentar ${pet.name}.`
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
.care-card, .bond-card, .today-card, .name-card { margin-top: var(--space-4); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg-elevated); }
.care-card { border-color: color-mix(in srgb, #d56a63 22%, var(--border)); }
.care-card--danger { border-color: color-mix(in srgb, #d56a63 60%, var(--border)); background: color-mix(in srgb, #d56a63 7%, var(--bg-elevated)); }
.care-card__head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }.care-card__head > div:first-child { display: grid; gap: 3px; }
.hearts { display: flex; gap: 3px; color: #d85f58; font-size: 18px; letter-spacing: -.03em; }.heart--empty { color: var(--border); }
.care-bar { height: 8px; margin: var(--space-3) 0 var(--space-2); overflow: hidden; border-radius: 999px; background: var(--bg-subtle); }.care-bar span { display: block; width: var(--fill); height: 100%; border-radius: inherit; background: linear-gradient(90deg, #d85f58, #e4ad36); transition: width .45s var(--ease-smooth); }
.care-card__foot { display: flex; justify-content: space-between; gap: var(--space-3); color: var(--text-secondary); font-size: var(--text-xs); }.care-card__foot strong { color: var(--text); }
.care-card > p { margin-top: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.45; }
.habitat--away { background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--text-secondary) 8%, transparent), transparent 48%), var(--bg-elevated); }
.bond-card__head { display: flex; justify-content: space-between; align-items: end; }.bond-card__head div { display: grid; gap: 3px; }.bond-card__head > span { color: var(--accent); font-weight: 700; }
.eyebrow { color: var(--text-secondary); font-size: var(--text-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.bond-bar { height: 8px; margin: var(--space-3) 0; overflow: hidden; border-radius: 999px; background: var(--bg-subtle); }.bond-bar span { display: block; width: var(--fill); height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), #e4ad36); transition: width .45s var(--ease-smooth); }
.bond-card p, .today-card p, .name-card p { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; }
.today-card { display: flex; align-items: center; gap: var(--space-3); }.today-card__icon { display: grid; place-items: center; flex: 0 0 48px; height: 48px; border-radius: var(--radius-md); background: color-mix(in srgb, #e4ad36 15%, var(--bg-subtle)); color: #c58a13; font-size: 22px; }.today-card div:last-child { display: grid; gap: 3px; }
.name-card { display: grid; gap: var(--space-4); }.name-form { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: var(--space-2); }
.care-rules { margin-top: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); color: var(--text-secondary); font-size: var(--text-sm); }.care-rules summary { color: var(--text); font-weight: 650; cursor: pointer; }.care-rules p { margin-top: var(--space-2); line-height: 1.5; }
@media (max-width: 390px) { .name-form { grid-template-columns: 1fr; } }
</style>
