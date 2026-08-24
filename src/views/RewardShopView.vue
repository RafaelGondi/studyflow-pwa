<template>
  <div class="ak-app-page">
    <AkPageHeader
      label="Recompensas"
      title="Lojinha"
      :meta="shopMeta"
      size="md"
    >
      <template #actions>
        <AkButton size="sm" variant="ghost" @click="router.back()">
          <template #icon>
            <AkIcon name="arrow-left-outline" :size="16" />
          </template>
          Voltar
        </AkButton>
        <AkButton size="sm" variant="primary" @click="openNewReward">Nova</AkButton>
      </template>
    </AkPageHeader>

    <div class="ak-app-scroll page-body reveal reveal-d1">
      <div v-if="gamification.archivedRewards.length" class="chip-row">
        <AkChip :selected="filter === 'active'" @click="filter = 'active'">Ativas</AkChip>
        <AkChip :selected="filter === 'archived'" @click="filter = 'archived'">
          Arquivadas ({{ gamification.archivedRewards.length }})
        </AkChip>
      </div>

      <AkEmptyState
        v-if="visible.length === 0"
        :title="filter === 'active' ? 'Crie algo para conquistar' : 'Nenhuma recompensa arquivada'"
        :description="filter === 'active'
          ? 'Cadastre pequenos prazeres ou compras que podem ser trocados pelas moedas dos seus estudos.'
          : 'As recompensas que você arquivar aparecerão aqui.'"
      >
        <template #icon>🎁</template>
        <template v-if="filter === 'active'" #action>
          <AkButton variant="primary" @click="openNewReward">Criar recompensa</AkButton>
        </template>
      </AkEmptyState>

      <template v-else>
        <!--
          A vitrine da loja: o que já dá pra levar, grande e primeiro. É a única
          coisa da tela com movimento contínuo, porque é a única que pede ação.
        -->
        <section v-if="filter === 'active'" class="section-block">
          <AkSectionHeader title="Disponíveis para resgate">
            <template v-if="unlocked.length" #action>
              <span class="text-xs text-muted">
                {{ unlocked.length }} {{ unlocked.length === 1 ? 'liberada' : 'liberadas' }}
              </span>
            </template>
          </AkSectionHeader>

          <div v-if="unlocked.length" class="shelf">
            <button
              v-for="reward in unlocked"
              :key="reward.id"
              type="button"
              class="shelf__card"
              :style="{ '--reward-color': reward.color }"
              @click="detailReward = reward"
            >
              <span class="shelf__icon">{{ reward.icon }}</span>
              <span class="shelf__name">{{ reward.name }}</span>
              <span class="shelf__cost">
                <CoinIcon :size="12" />
                <span class="numeric">{{ formatCoins(reward.cost) }}</span>
              </span>
              <!--
                Custo em tempo, não só em moeda. Escolher entre 90 e 360 não diz
                nada; escolher entre 1h30 e 6h de estudo é a comparação real.
              -->
              <span class="shelf__time">{{ coinsAsStudyTime(reward.cost, rate) }} de estudo</span>
            </button>
          </div>

          <!-- Loja vazia é loja fechada: sem nada ao alcance, mostra o alvo mais perto. -->
          <p v-else-if="nextTarget" class="shelf-empty">
            Falta <strong class="numeric">{{ formatCoins(nextTarget.cost - gamification.balance) }}</strong>
            para {{ nextTarget.icon }} {{ nextTarget.name }} —
            cerca de {{ coinsAsStudyTime(nextTarget.cost - gamification.balance, rate) }} de estudo.
          </p>
        </section>

        <section class="section-block">
          <AkSectionHeader :title="filter === 'active' ? 'Vitrine' : 'Arquivadas'">
            <template #action>
              <span class="text-xs text-muted">{{ visible.length }} no total</span>
            </template>
          </AkSectionHeader>

          <TransitionGroup name="tile-list" tag="div" class="tile-list">
            <RewardTile
              v-for="reward in pending"
              :key="reward.id"
              :reward="reward"
              :balance="gamification.balance"
              :coins-per-hour="rate"
              :ready="isReady(reward)"
              :claimed="isClaimed(reward)"
              @open="detailReward = $event"
            />
          </TransitionGroup>

          <p v-if="filter === 'active' && pending.length === 0" class="text-xs text-muted">
            Tudo disponível para resgate.
          </p>
        </section>
      </template>
    </div>

    <RewardDetailSheet
      :reward="detailReward"
      :balance="gamification.balance"
      :coins-per-hour="rate"
      :ready="detailReward ? isReady(detailReward) : false"
      :claimed="detailReward ? isClaimed(detailReward) : false"
      @close="detailReward = null"
      @redeem="confirmRedeem"
      @edit="openEditReward"
      @archive="toggleArchive"
      @remove="confirmDelete"
    />

    <RewardModal :show="showRewardModal" :reward="editingReward" @close="closeRewardModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkButton, AkChip, AkEmptyState, AkIcon, AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import RewardModal from '@/components/rewards/RewardModal.vue'
import RewardTile from '@/components/rewards/RewardTile.vue'
import RewardDetailSheet from '@/components/rewards/RewardDetailSheet.vue'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import { useGamificationStore } from '@/stores/gamification'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { useAppToast } from '@/composables/useAppToast'
import { useCoinBurst } from '@/composables/useCoinBurst'
import { coinsAsStudyTime, formatCoins } from '@/utils/coins'
import type { Reward } from '@/types'

const router = useRouter()
const gamification = useGamificationStore()
const confirmSheet = useConfirmSheet()
const toast = useAppToast()
const coinBurst = useCoinBurst()

const filter = ref<'active' | 'archived'>('active')
const detailReward = ref<Reward | null>(null)
const showRewardModal = ref(false)
const editingReward = ref<Reward | null>(null)

const rate = computed(() => gamification.settings.coinsPerHour)

const visible = computed(() => filter.value === 'active'
  ? gamification.activeRewards
  : gamification.archivedRewards,
)

function isClaimed(reward: Reward) {
  return !reward.repeatable && gamification.hasActiveRedemption(reward.id)
}
function isReady(reward: Reward) {
  return !reward.archivedAt && gamification.canRedeem(reward)
}

const unlocked = computed(() => gamification.activeRewards.filter(isReady))
/* A vitrine lista o que ainda não está na prateleira, do mais perto ao mais longe. */
const pending = computed(() => visible.value
  .filter(reward => !!reward.archivedAt || !isReady(reward))
  .slice()
  .sort((a, b) => a.cost - b.cost),
)

const nextTarget = computed(() =>
  gamification.activeRewards
    .filter(reward => !isClaimed(reward) && reward.cost > gamification.balance)
    .sort((a, b) => a.cost - b.cost)[0] ?? null,
)

const shopMeta = computed(() => {
  const n = unlocked.value.length
  if (n === 0) return `${formatCoins(gamification.balance)} moedas disponíveis`
  return `${n} ${n === 1 ? 'liberada' : 'liberadas'} · ${formatCoins(gamification.balance)} moedas`
})

function openNewReward() {
  editingReward.value = null
  showRewardModal.value = true
}

function openEditReward(reward: Reward) {
  detailReward.value = null
  editingReward.value = reward
  showRewardModal.value = true
}

function closeRewardModal() {
  showRewardModal.value = false
  editingReward.value = null
}

async function confirmRedeem(reward: Reward) {
  const confirmed = await confirmSheet.ask({
    title: `Resgatar ${reward.name}?`,
    message: `${formatCoins(reward.cost)} moedas serão descontadas do seu saldo.`,
    confirmLabel: 'Resgatar',
    confirmVariant: 'primary',
  })
  if (!confirmed) return
  try {
    await gamification.redeemReward(reward.id)
    detailReward.value = null
    coinBurst.fire({ kind: 'redeem', label: reward.name })
    toast.success('Recompensa resgatada', `Você usou ${formatCoins(reward.cost)} moedas.`)
  } catch (error) {
    const message = error instanceof Error && error.message === 'insufficient-balance'
      ? 'Seu saldo mudou e não é mais suficiente.'
      : 'Não foi possível concluir o resgate.'
    toast.error('Falha ao resgatar', message)
  }
}

async function toggleArchive(reward: Reward) {
  detailReward.value = null
  if (reward.archivedAt) {
    await gamification.restoreReward(reward.id)
    filter.value = 'active'
    toast.success('Recompensa restaurada')
  } else {
    await gamification.archiveReward(reward.id)
    toast.success('Recompensa arquivada')
  }
}

async function confirmDelete(reward: Reward) {
  const confirmed = await confirmSheet.ask({
    title: 'Excluir recompensa?',
    message: `“${reward.name}” será removida. Os resgates anteriores continuarão no extrato.`,
    confirmLabel: 'Excluir',
    confirmVariant: 'danger',
  })
  if (!confirmed) return
  detailReward.value = null
  await gamification.removeReward(reward.id)
  toast.success('Recompensa excluída')
}
</script>

<style scoped>
/* ── Prateleira ───────────────────────────────────────── */
.shelf {
  display: flex;
  gap: var(--space-3);
  margin: 0 calc(var(--page-pad-x) * -1);
  padding: var(--space-1) var(--page-pad-x) var(--space-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  /*
   * Sem isto o snap come o padding do bleed: `scroll-padding` vale `auto`, o
   * snapport ignora os 20px, e o navegador rola exatamente eles para encostar
   * o primeiro card na borda da tela. O padding existe; o snap o desfaz.
   */
  scroll-padding-inline: var(--page-pad-x);
}

.shelf__card {
  position: relative;
  flex: 0 0 152px;
  scroll-snap-align: start;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--coin-face-lo) 45%, transparent);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--reward-color) 16%, transparent), transparent 60%),
    var(--bg-elevated);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s var(--ease-out-expo);
}

.shelf__card:active { transform: scale(0.965); }

.shelf__card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Brilho atravessando — o único movimento contínuo da tela. */
.shelf__card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 40%,
    color-mix(in srgb, var(--coin-face-hi) 32%, transparent) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  animation: shelf-sheen 5s var(--ease-smooth) infinite;
}

@keyframes shelf-sheen {
  0%, 58% { transform: translateX(-100%); }
  100%    { transform: translateX(100%); }
}

.shelf__icon { font-size: 26px; line-height: 1; }

.shelf__name {
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
}

.shelf__cost {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--coin-text);
  font-size: var(--text-xs);
  font-weight: 500;
}

.shelf__time {
  color: var(--text-secondary);
  font-size: var(--text-2xs);
}

.shelf-empty {
  padding: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-align: center;
}

/* ── Vitrine ──────────────────────────────────────────── */
.tile-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tile-list-move { transition: transform 0.35s var(--ease-out-expo); }

.tile-list-enter-active,
.tile-list-leave-active {
  transition: opacity 0.25s var(--ease-smooth), transform 0.28s var(--ease-out-expo);
}

.tile-list-leave-active { position: absolute; width: 100%; }

.tile-list-enter-from,
.tile-list-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .shelf__card::after { animation: none; }
}
</style>
