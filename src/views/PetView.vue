<template>
  <div class="ak-app-page">
    <AkPageHeader label="Companheiro" :title="pet.hasEgg ? 'Novo ovo' : pet.name" :meta="petHeaderMeta" size="md">
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
        <div v-if="pet.isDeparted" class="star-spirit" aria-label="Lumi virou estrela">✦</div>
        <button v-else-if="pet.hasEgg" type="button" class="pet-egg" aria-label="Fazer o ovo eclodir" @click="hatchEgg">
          <span class="pet-egg__shell" />
          <span class="pet-egg__shadow" />
        </button>
        <PixelPet v-else interactive :mood="pet.mood" :name="pet.name" :mood-label="pet.moodLabel" :size="224" :bond-level="pet.level" @pet="handlePet" />
        <p class="speech" aria-live="polite">“{{ displayedMessage }}”</p>
      </section>

      <section v-if="pet.isDeparted || pet.hasEgg" class="lifecycle-card">
        <template v-if="pet.isDeparted">
          <span class="eyebrow">Um novo começo</span>
          <strong>{{ pet.name }} agora vive no seu memorial</strong>
          <p>Um ovo custa {{ pet.eggCost }} moedas. A nova Lumi começa no vínculo 0 e o registro da sua antiga companheira permanece guardado.</p>
          <AkButton variant="primary" :loading="buyingEgg" :disabled="gamification.balance < pet.eggCost" @click="buyEgg">
            Comprar ovo · {{ pet.eggCost }} moedas
          </AkButton>
          <small v-if="gamification.balance < pet.eggCost">Faltam {{ pet.eggCost - gamification.balance }} moedas</small>
        </template>
        <template v-else>
          <span class="eyebrow">Pronta para nascer</span>
          <strong>Seu novo ovo chegou</strong>
          <p>Toque no ovo acima ou no botão para conhecer sua nova companheira. Ela começará uma nova geração no vínculo 0.</p>
          <AkButton variant="primary" :loading="hatching" @click="hatchEgg">Fazer o ovo eclodir</AkButton>
        </template>
      </section>

      <section v-if="pet.isActive" class="care-card" :class="{ 'care-card--danger': pet.isAway }">
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

      <section v-if="pet.isActive" class="bond-card">
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

      <section v-if="pet.isActive" class="today-card">
        <div class="today-card__icon">✦</div>
        <div>
          <span class="eyebrow">Ritmo de hoje</span>
          <strong>{{ formatDuration(pet.todaySeconds) }} em foco</strong>
          <p>{{ nextCareHint }}</p>
        </div>
      </section>

      <section v-if="pet.isActive" class="name-card">
        <div>
          <span class="eyebrow">Nome do mascote</span>
          <p>Esse nome fica sincronizado com sua conta.</p>
        </div>
        <form class="name-form" @submit.prevent="saveName">
          <AkInput v-model="draftName" label="Nome" placeholder="Lumi" maxlength="20" required />
          <AkButton type="submit" variant="primary" :loading="saving" :disabled="!draftName.trim()">Salvar</AkButton>
        </form>
      </section>

      <section v-if="pet.memorials.length" class="memorial-card">
        <div class="memorial-card__head">
          <div>
            <span class="eyebrow">Memorial</span>
            <strong>Companheiras que viveram com você</strong>
          </div>
          <span>✦</span>
        </div>
        <article v-for="memory in [...pet.memorials].reverse()" :key="memory.id" class="memory">
          <span class="memory__star">✦</span>
          <div>
            <strong>{{ memory.name }} · geração {{ memory.generation }}</strong>
            <p>Vínculo {{ memory.maxBondLevel }} · {{ formatDuration(memory.bondSeconds) }} equivalentes</p>
            <small>{{ formatMemorialDate(memory.departedAt) }}</small>
          </div>
        </article>
      </section>

      <details v-if="pet.isActive" class="care-rules">
        <summary>Como funcionam os cuidados?</summary>
        <p>A Lumi precisa do equivalente a 1h de estudo por dia. Estudo vale 1×, leitura ¼× e trabalho ⅛×, e os tempos podem ser combinados. Cada dia completo abaixo da meta remove um coração e encerra a sequência. Com cinco dias consecutivos sem a meta ela vai embora e ainda pode ser recuperada. Depois de oito dias consecutivos, ela vira estrela e passa a viver no memorial.</p>
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
import { useGamificationStore } from '@/stores/gamification'
import { useAppToast } from '@/composables/useAppToast'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { formatDuration } from '@/types'

const router = useRouter()
const pet = usePetStore()
const gamification = useGamificationStore()
const toast = useAppToast()
const confirmSheet = useConfirmSheet()
const draftName = ref(pet.name)
const saving = ref(false)
const buyingEgg = ref(false)
const hatching = ref(false)
const reactionMessage = ref('')
const bondMilestones = BOND_LEVELS.slice(1)
let reactionTimer: ReturnType<typeof setTimeout> | null = null
let reactionIndex = 0

watch(() => pet.name, value => { draftName.value = value }, { immediate: true })

const petHeaderMeta = computed(() => {
  if (pet.isDeparted) return `Geração ${pet.generation} · virou estrela`
  if (pet.hasEgg) return `Próxima geração · esperando para nascer`
  return `Vínculo ${pet.level} · ${pet.moodLabel}`
})
const displayedMessage = computed(() => {
  if (pet.isDeparted) return 'Nossa história continua brilhando aqui.'
  if (pet.hasEgg) return 'Tem alguém novo esperando para conhecer você.'
  return reactionMessage.value || pet.message
})
const habitatClasses = computed(() => ({
  'habitat--away': pet.isAway,
  'habitat--bond-glow': pet.level >= 4,
  'habitat--night': pet.level >= 5,
  'habitat--aura': pet.level >= 7,
  'habitat--aurora': pet.level >= 8,
  'habitat--constellation': pet.level >= 9,
}))

function formatMemorialDate(value: number) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(value)
}
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
  if (pet.isAway) return `Complete a meta de hoje para ${pet.name} voltar. Restam ${pet.rescueDaysRemaining} ${pet.rescueDaysRemaining === 1 ? 'dia' : 'dias'} de resgate.`
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

async function buyEgg() {
  const confirmed = await confirmSheet.ask({
    title: 'Comprar um novo ovo?',
    message: `${pet.eggCost} moedas serão usadas. Esse resgate não pode ser desfeito, mas o memorial de ${pet.name} continuará guardado.`,
    confirmLabel: 'Comprar ovo',
    confirmVariant: 'primary',
  })
  if (!confirmed) return
  buyingEgg.value = true
  try {
    await pet.purchaseEgg()
    toast.success('Ovo recebido', 'Uma nova companheira está esperando para nascer.')
  } catch (error) {
    const message = error instanceof Error && error.message === 'insufficient-balance'
      ? 'Seu saldo não é mais suficiente para comprar o ovo.'
      : 'Tente novamente quando estiver conectado.'
    toast.error('Não foi possível comprar o ovo', message)
  } finally {
    buyingEgg.value = false
  }
}

async function hatchEgg() {
  if (hatching.value) return
  hatching.value = true
  try {
    await pet.hatchEgg()
    draftName.value = pet.name
    toast.success('Uma nova Lumi nasceu', 'A nova geração começa no vínculo 0.')
  } catch {
    toast.error('O ovo ainda não eclodiu', 'Tente novamente quando estiver conectado.')
  } finally {
    hatching.value = false
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
.care-card, .bond-card, .today-card, .name-card, .lifecycle-card, .memorial-card { margin-top: var(--space-4); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg-elevated); }
.star-spirit { color: #e4ad36; font-size: 92px; line-height: 1; text-shadow: 0 0 24px color-mix(in srgb, #e4ad36 55%, transparent); animation: star-spirit 2.8s ease-in-out infinite; }
.pet-egg { position: relative; width: 150px; height: 170px; border: 0; background: transparent; cursor: pointer; }.pet-egg__shell { position: absolute; z-index: 2; left: 35px; top: 12px; width: 80px; height: 112px; border: 6px solid #193f55; border-radius: 48% 48% 44% 44% / 58% 58% 42% 42%; background: linear-gradient(145deg, #d9f3ee 0 42%, #79c7c2 43% 62%, #f1d275 63%); image-rendering: pixelated; animation: egg-wiggle 2.4s steps(2, end) infinite; }.pet-egg__shadow { position: absolute; left: 41px; right: 41px; bottom: 27px; height: 13px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 24%, transparent); }
.lifecycle-card { display: grid; gap: var(--space-3); text-align: center; border-color: color-mix(in srgb, #e4ad36 35%, var(--border)); }.lifecycle-card > strong { font-size: var(--text-lg); }.lifecycle-card p { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; }.lifecycle-card small { color: var(--danger); }
.memorial-card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }.memorial-card__head > div { display: grid; gap: 3px; }.memorial-card__head > span { color: #e4ad36; font-size: 26px; }.memory { display: grid; grid-template-columns: 38px 1fr; gap: var(--space-3); margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); }.memory__star { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: color-mix(in srgb, #e4ad36 14%, var(--bg-soft)); color: #c58a13; font-size: 19px; }.memory div { display: grid; gap: 2px; }.memory p, .memory small { color: var(--text-secondary); font-size: var(--text-xs); }
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
@keyframes star-spirit { 0%, 100% { transform: scale(.9) rotate(-4deg); opacity: .68; } 50% { transform: scale(1.08) rotate(5deg); opacity: 1; } }
@keyframes egg-wiggle { 0%, 72%, 100% { transform: rotate(0); } 80% { transform: rotate(-4deg); } 90% { transform: rotate(4deg); } }
</style>
