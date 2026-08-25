<template>
  <div class="ak-app-page">
    <AkPageHeader label="Companheiro" :title="pet.name" :meta="`Vínculo ${pet.level} · ${pet.moodLabel}`" size="md">
      <template #actions>
        <AkButton size="sm" variant="ghost" @click="router.back()">
          <template #icon><AkIcon name="arrow-left-outline" :size="16" /></template>
          Voltar
        </AkButton>
      </template>
    </AkPageHeader>

    <div class="ak-app-scroll pet-page reveal reveal-d1">
      <section class="habitat" :class="habitatClasses">
        <span class="habitat__star habitat__star--one">✦</span>
        <span class="habitat__star habitat__star--two">·</span>
        <PixelPet interactive :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :size="224" :bond-level="pet.level" @pet="handlePet" />
        <p class="speech" aria-live="polite">“{{ displayedMessage }}”</p>
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
          <span>{{ formatDuration(pet.todayCareSeconds) }} equivalentes de 1h</span>
          <strong v-if="pet.streak">🔥 {{ pet.streak }} {{ pet.streak === 1 ? 'dia' : 'dias' }}</strong>
          <strong v-else>Comece sua sequência</strong>
        </div>
        <ul v-if="pet.todayCareBreakdown.length" class="care-mix">
          <li v-for="part in pet.todayCareBreakdown" :key="part.id">
            <span class="care-mix__metal" :class="`care-mix__metal--${part.token}`" />
            <span>{{ formatDuration(part.actualSeconds) }} de {{ part.label.toLowerCase() }}</span>
            <strong>→ {{ formatDuration(part.equivalentSeconds) }}</strong>
          </li>
        </ul>
        <p v-else class="care-exchange">1h de estudo = 4h de leitura = 8h de trabalho</p>
        <p>{{ careHint }}</p>
      </section>

      <section class="bond-card">
        <div class="bond-card__head">
          <div>
            <span class="eyebrow">Vínculo</span>
            <strong>Nível {{ pet.level }}</strong>
          </div>
          <span v-if="pet.nextBondReward" class="numeric">
            {{ formatDuration(pet.bondLevelSeconds) }} / {{ formatDuration(pet.bondLevelTargetSeconds) }}
          </span>
          <span v-else class="numeric">Vínculo máximo</span>
        </div>
        <div class="bond-bar" :style="{ '--fill': `${pet.levelProgress}%` }"><span /></div>
        <div v-if="pet.nextBondReward" class="bond-next">
          <span>Próxima recompensa · nível {{ pet.nextBondReward.level }}</span>
          <strong>{{ pet.nextBondReward.reward }}</strong>
          <small>Faltam {{ formatDuration(pet.bondRemainingSeconds) }} equivalentes</small>
        </div>
        <p>O vínculo cresce com o tempo equivalente em foco desde o nível zero. Cumprir a meta diária concede 10 min extras. Ele é independente das moedas e não diminui ao resgatar recompensas.</p>
        <details class="bond-journey">
          <summary>Ver jornada de vínculo</summary>
          <ol>
            <li v-for="milestone in bondMilestones" :key="milestone.level" :class="{ 'bond-journey__unlocked': pet.level >= milestone.level }">
              <span>Nível {{ milestone.level }} · {{ formatDuration(milestone.seconds) }}</span>
              <strong>{{ milestone.reward }}</strong>
            </li>
          </ol>
        </details>
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
        <p>A Lumi precisa do equivalente a 1h de estudo por dia. Estudo vale 1×, leitura ¼× e trabalho ⅛×, e os tempos podem ser combinados. Cada dia completo abaixo da meta remove um coração e encerra a sequência. Com cinco dias consecutivos sem a meta ela vai embora — mas completar a meta traz sua companheira de volta.</p>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AkButton, AkIcon, AkInput, AkPageHeader } from '@rafael_dias/akoma'
import PixelPet from '@/components/pet/PixelPet.vue'
import { BOND_LEVELS, usePetStore } from '@/stores/pet'
import { useAppToast } from '@/composables/useAppToast'
import { formatDuration } from '@/types'

const router = useRouter()
const pet = usePetStore()
const toast = useAppToast()
const draftName = ref(pet.name)
const saving = ref(false)
const reactionMessage = ref('')
const bondMilestones = BOND_LEVELS.slice(1)
let reactionTimer: ReturnType<typeof setTimeout> | null = null
let reactionIndex = 0

watch(() => pet.name, value => { draftName.value = value }, { immediate: true })

const displayedMessage = computed(() => reactionMessage.value || pet.message)
const habitatClasses = computed(() => ({
  'habitat--away': pet.isAway,
  'habitat--bond-glow': pet.level >= 4,
  'habitat--night': pet.level >= 5,
  'habitat--aura': pet.level >= 7,
  'habitat--aurora': pet.level >= 8,
  'habitat--constellation': pet.level >= 9,
}))
const PET_REACTIONS = [
  'Hehe! Isso faz cócegas.',
  'Eu gosto quando você vem me ver.',
  'Carinho recebido. Agora vamos cuidar da nossa sequência?',
]

function handlePet() {
  if (reactionTimer) clearTimeout(reactionTimer)
  reactionMessage.value = pet.isAway
    ? 'Ainda consigo sentir seu carinho daqui.'
    : PET_REACTIONS[reactionIndex++ % PET_REACTIONS.length]
  reactionTimer = setTimeout(() => { reactionMessage.value = '' }, 2200)
}

onBeforeUnmount(() => { if (reactionTimer) clearTimeout(reactionTimer) })

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
  return `Faltam ${formatDuration(Math.max(0, pet.dailyGoalSeconds - pet.todayCareSeconds))} equivalentes para alimentar ${pet.name}.`
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
.care-mix { display: grid; gap: 6px; margin: var(--space-3) 0 0; padding: var(--space-3); border-radius: var(--radius-md); background: var(--bg-soft); list-style: none; }.care-mix li { display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: var(--space-2); color: var(--text-secondary); font-size: var(--text-xs); }.care-mix li strong { color: var(--text); font-weight: 650; }.care-mix__metal { width: 8px; height: 8px; border-radius: 50%; }.care-mix__metal--ouro { background: var(--metal-ouro-lo); }.care-mix__metal--prata { background: var(--metal-prata-lo); }.care-mix__metal--bronze { background: var(--metal-bronze-lo); }
.care-exchange { margin-top: var(--space-3); padding: 8px 10px; border-radius: var(--radius-sm); background: var(--bg-soft); text-align: center; }
.care-card > p { margin-top: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.45; }
.habitat--away { background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--text-secondary) 8%, transparent), transparent 48%), var(--bg-elevated); }
.habitat--bond-glow { box-shadow: inset 0 0 42px color-mix(in srgb, #e4ad36 12%, transparent); }
.habitat--night { background: radial-gradient(circle at 50% 42%, color-mix(in srgb, #7bb9e8 20%, transparent), transparent 43%), linear-gradient(155deg, #121a32, #26385a); }
.habitat--night .speech { background: color-mix(in srgb, #101729 82%, transparent); color: #eef5ff; }
.habitat--aura { box-shadow: inset 0 0 52px color-mix(in srgb, #e4ad36 18%, transparent), 0 0 24px color-mix(in srgb, var(--accent) 13%, transparent); }
.habitat--aurora { background: radial-gradient(circle at 50% 45%, color-mix(in srgb, #a7f0dc 27%, transparent), transparent 38%), linear-gradient(145deg, #17243d 10%, #315a6b 48%, #493e70); }
.habitat--constellation .habitat__star { text-shadow: 24px 32px #f4d77d, -34px 70px #dcecff, 55px 84px #f4d77d, -12px 126px #dcecff; }
.bond-card__head { display: flex; justify-content: space-between; align-items: end; }.bond-card__head div { display: grid; gap: 3px; }.bond-card__head > span { color: var(--accent); font-weight: 700; }
.eyebrow { color: var(--text-secondary); font-size: var(--text-xs); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.bond-bar { height: 8px; margin: var(--space-3) 0; overflow: hidden; border-radius: 999px; background: var(--bg-subtle); }.bond-bar span { display: block; width: var(--fill); height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), #e4ad36); transition: width .45s var(--ease-smooth); }
.bond-next { display: grid; gap: 3px; margin-bottom: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--bg-soft); }.bond-next span, .bond-next small { color: var(--text-secondary); font-size: var(--text-xs); }.bond-next strong { font-size: var(--text-sm); }
.bond-journey { margin-top: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); }.bond-journey summary { color: var(--accent); font-weight: 650; cursor: pointer; }.bond-journey ol { display: grid; gap: 0; margin-top: var(--space-3); padding: 0; list-style: none; }.bond-journey li { display: grid; gap: 2px; padding: 9px 0; border-top: 1px solid var(--border); opacity: .58; }.bond-journey li span { font-size: var(--text-xs); }.bond-journey li strong { color: var(--text); font-size: var(--text-sm); }.bond-journey__unlocked { opacity: 1 !important; }.bond-journey__unlocked span::after { content: ' · desbloqueado'; color: var(--accent); font-weight: 700; }
.bond-card p, .today-card p, .name-card p { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; }
.today-card { display: flex; align-items: center; gap: var(--space-3); }.today-card__icon { display: grid; place-items: center; flex: 0 0 48px; height: 48px; border-radius: var(--radius-md); background: color-mix(in srgb, #e4ad36 15%, var(--bg-subtle)); color: #c58a13; font-size: 22px; }.today-card div:last-child { display: grid; gap: 3px; }
.name-card { display: grid; gap: var(--space-4); }.name-form { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: var(--space-2); }
.care-rules { margin-top: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); color: var(--text-secondary); font-size: var(--text-sm); }.care-rules summary { color: var(--text); font-weight: 650; cursor: pointer; }.care-rules p { margin-top: var(--space-2); line-height: 1.5; }
@media (max-width: 390px) { .name-form { grid-template-columns: 1fr; } }
</style>
