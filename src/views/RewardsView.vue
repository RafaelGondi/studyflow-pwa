<template>
  <div class="ak-app-page">
    <AkPageHeader
      label="Motivação"
      title="Recompensas"
      :meta="`${gamification.settings.coinsPerHour} moedas por hora de estudo`"
      size="md"
    >
      <template #actions>
        <AkIconButton icon="settings-outline" label="Ajustar moedas" size="sm" @click="router.push('/settings')" />
      </template>
    </AkPageHeader>

    <div class="ak-app-scroll page-body reveal reveal-d1">
      <!--
        Carteira. O saldo é o placar do app, então ganhou peso de placar:
        moeda com cara própria, número grande que conta até o valor, e — o
        que faltava — para onde esse saldo está indo.
      -->
      <section class="wallet" :class="hasUnlocked && 'wallet--unlocked'">
        <div class="wallet__head">
          <CoinIcon :size="30" :spinning="hasUnlocked" />
          <div class="wallet__id">
            <p class="wallet__label">Saldo disponível</p>
            <p class="wallet__balance">
              <AnimatedNumber :value="gamification.balance" />
              <span class="wallet__unit">moedas</span>
            </p>
          </div>
        </div>

        <p class="wallet__meta">{{ walletSummary }}</p>

        <!-- De onde o saldo veio. Só aparece quando há mais de uma fonte. -->
        <div v-if="composition.length > 1" class="wallet__mix">
          <div class="mix-bar" aria-hidden="true">
            <span
              v-for="part in composition"
              :key="part.id"
              :style="{ width: `${part.pct}%`, background: `var(--metal-${part.token}-lo)` }"
            />
          </div>
          <ul class="mix-key">
            <li v-for="part in composition" :key="part.id">
              <span class="mix-dot" :style="{ background: `var(--metal-${part.token}-lo)` }" />
              {{ part.label }} {{ Math.round(part.pct) }}%
            </li>
          </ul>
        </div>

        <!--
          Ponte entre estudar e resgatar. "Faltam 320 moedas" não move ninguém;
          "faltam ~38 min de estudo" é uma meta que cabe numa tarde.
        -->
        <div v-if="nextReward" class="wallet__next">
          <div class="wallet__next-head">
            <span class="wallet__next-icon">{{ nextReward.icon }}</span>
            <span class="wallet__next-name truncate">{{ nextReward.name }}</span>
            <span class="wallet__next-missing numeric">
              faltam {{ formatCoins(missingFor(nextReward)) }}
            </span>
          </div>
          <div class="coin-bar" :style="{ '--fill': `${progressFor(nextReward)}%` }" aria-hidden="true">
            <span />
          </div>
          <p class="wallet__next-hint">
            ≈ {{ coinsAsStudyTime(missingFor(nextReward), gamification.settings.coinsPerHour) }} de estudo
          </p>
        </div>

        <p v-else-if="hasUnlocked" class="wallet__next-hint wallet__next-hint--ready">
          <AkIcon name="check-outline" :size="14" />
          {{ unlockedCount }} {{ unlockedCount === 1 ? 'recompensa liberada' : 'recompensas liberadas' }}
        </p>
      </section>

      <div v-if="gamification.balance < 0" class="balance-warning">
        <AkIcon name="warning-outline" :size="20" />
        <p>Seu saldo ficou negativo após uma alteração nos registros. Os próximos ganhos compensarão essa diferença.</p>
      </div>

      <section class="section-block">
        <AkSectionHeader title="Minhas recompensas">
          <template #action>
            <AkButton size="sm" variant="primary" @click="openNewReward">Nova</AkButton>
          </template>
        </AkSectionHeader>

        <div v-if="gamification.archivedRewards.length" class="reward-filters">
          <AkChip :selected="rewardFilter === 'active'" @click="rewardFilter = 'active'">Ativas</AkChip>
          <AkChip :selected="rewardFilter === 'archived'" @click="rewardFilter = 'archived'">
            Arquivadas ({{ gamification.archivedRewards.length }})
          </AkChip>
        </div>

        <AkEmptyState
          v-if="visibleRewards.length === 0"
          :title="rewardFilter === 'active' ? 'Crie algo para conquistar' : 'Nenhuma recompensa arquivada'"
          :description="rewardFilter === 'active'
            ? 'Cadastre pequenos prazeres ou compras que podem ser trocados pelas moedas dos seus estudos.'
            : 'As recompensas que você arquivar aparecerão aqui.'"
        >
          <template #icon>🎁</template>
          <template v-if="rewardFilter === 'active'" #action>
            <AkButton variant="primary" @click="openNewReward">Criar recompensa</AkButton>
          </template>
        </AkEmptyState>

        <TransitionGroup v-else name="reward-list" tag="div" class="reward-grid">
          <article
            v-for="reward in visibleRewards"
            :key="reward.id"
            class="reward-card"
            :class="{
              'reward-card--unlocked': isUnlocked(reward),
              'reward-card--archived': !!reward.archivedAt,
              'reward-card--claimed': isClaimed(reward),
            }"
            :style="{ '--reward-color': reward.color }"
          >
            <div class="reward-card__top">
              <div class="reward-card__icon">{{ reward.icon }}</div>

              <div class="reward-card__content">
                <h3>{{ reward.name }}</h3>
                <p v-if="reward.description">{{ reward.description }}</p>
              </div>

              <div class="reward-card__cost">
                <CoinIcon :size="14" />
                <strong class="numeric">{{ reward.cost }}</strong>
              </div>
            </div>

            <div v-if="!reward.archivedAt" class="reward-card__progress">
              <div class="coin-bar" :style="{ '--fill': `${progressFor(reward)}%` }" aria-hidden="true">
                <span />
              </div>
              <div class="reward-card__status">
                <p>
                  <AkIcon v-if="isUnlocked(reward)" name="check-outline" :size="13" />
                  {{ rewardStatus(reward) }}
                </p>
                <span v-if="reward.repeatable" class="reward-card__tag">repetível</span>
              </div>
            </div>

            <div class="reward-card__actions">
              <AkButton
                v-if="!reward.archivedAt"
                size="sm"
                variant="primary"
                class="reward-card__redeem"
                :disabled="!gamification.canRedeem(reward)"
                @click="confirmRedeem(reward)"
              >
                Resgatar
              </AkButton>

              <!--
                Editar/arquivar/excluir eram três botões de texto do mesmo peso
                que "Resgatar", e a ação principal sumia no meio deles. Viraram
                ícones, à direita, fora do caminho.
              -->
              <div class="reward-card__tools">
                <AkIconButton icon="edit-outline" label="Editar recompensa" size="sm" @click="openEditReward(reward)" />
                <AkIconButton
                  :icon="reward.archivedAt ? 'refresh-outline' : 'box-outline'"
                  :label="reward.archivedAt ? 'Restaurar recompensa' : 'Arquivar recompensa'"
                  size="sm"
                  @click="toggleArchive(reward)"
                />
                <AkIconButton icon="trash-outline" label="Excluir recompensa" size="sm" @click="confirmDelete(reward)" />
              </div>
            </div>
          </article>
        </TransitionGroup>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Extrato de moedas" />

        <AkEmptyState
          v-if="gamification.recentLedger.length === 0"
          title="Nenhuma movimentação ainda"
          description="Ganhos, resgates e estornos aparecerão aqui."
        >
          <template #icon>⭐</template>
        </AkEmptyState>

        <!--
          Mesmo padrão do histórico do Progresso: <details> por dia, o de cima
          aberto. O total no cabeçalho é o que faz o dia fechado ainda informar
          — senão dobrar a lista só esconderia.
        -->
        <div v-else class="ledger-days">
          <details
            v-for="(group, groupIndex) in ledgerGroups"
            :key="group.key"
            class="ledger-day"
            :open="groupIndex === 0"
          >
            <summary class="ledger-day__summary">
              <span>
                <strong>{{ group.label }}</strong>
                <small>{{ group.entries.length }} {{ group.entries.length === 1 ? 'movimentação' : 'movimentações' }}</small>
              </span>
              <span
                class="ledger-day__total numeric"
                :class="{ 'ledger-day__total--spent': group.total < 0 }"
              >{{ group.total > 0 ? '+' : '' }}{{ formatCoins(group.total) }}</span>
            </summary>

            <AkList>
              <AkListRow
                v-for="(entry, index) in group.entries"
                :key="entry.id"
                :divider="index < group.entries.length - 1"
              >
                <template #leading>
                  <div
                    class="ledger-icon"
                    :class="`ledger-icon--${entry.type}`"
                    :style="entryMetalVars(entry)"
                  >
                    <span v-if="entry.type !== 'earning'">{{ entry.redemption.rewardIcon }}</span>
                    <CoinIcon v-else :size="18" :metal="entryMetal(entry)" />
                  </div>
                </template>

                <span class="truncate">{{ ledgerTitle(entry) }}</span>
                <template #subtitle>
                  <span class="text-xs text-muted">{{ ledgerSubtitle(entry) }}</span>
                  <button
                    v-if="entry.type === 'redemption' && !entry.redemption.undoneAt"
                    type="button"
                    class="undo-button"
                    @click="confirmUndo(entry.redemption)"
                  >Desfazer</button>
                </template>
                <template #trailing>
                  <span
                    class="ledger-value numeric"
                    :class="{ 'ledger-value--spent': entry.amount < 0 }"
                    :style="entryMetalVars(entry)"
                  >
                    {{ entry.amount > 0 ? '+' : '' }}{{ formatCoins(entry.amount) }}
                  </span>
                </template>
              </AkListRow>
            </AkList>
          </details>
        </div>
      </section>
    </div>

    <RewardModal :show="showRewardModal" :reward="editingReward" @close="closeRewardModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkButton, AkChip, AkEmptyState, AkIcon, AkIconButton, AkList, AkListRow,
  AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import RewardModal from '@/components/rewards/RewardModal.vue'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useGamificationStore, type WalletEntry } from '@/stores/gamification'
import { useSubjectsStore } from '@/stores/subjects'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { useAppToast } from '@/composables/useAppToast'
import { useCoinBurst } from '@/composables/useCoinBurst'
import { formatDuration, localDateStr } from '@/types'
import { ACTIVITIES, activityMeta, coinsAsStudyTime, formatCoins, type ActivityMeta } from '@/utils/coins'
import type { Reward, RewardRedemption } from '@/types'

const router = useRouter()
const gamification = useGamificationStore()
const subjects = useSubjectsStore()
const confirmSheet = useConfirmSheet()
const toast = useAppToast()
const coinBurst = useCoinBurst()
const rewardFilter = ref<'active' | 'archived'>('active')
const showRewardModal = ref(false)
const editingReward = ref<Reward | null>(null)

const visibleRewards = computed(() => rewardFilter.value === 'active'
  ? gamification.activeRewards
  : gamification.archivedRewards,
)

/* Sessão sem `activityKind` é anterior aos pesos — vale como estudo. */
function entryMetal(entry: WalletEntry): ActivityMeta['token'] {
  if (entry.type !== 'earning') return 'ouro'
  return activityMeta(entry.session.activityKind).token
}

function entryMetalVars(entry: WalletEntry) {
  const token = entryMetal(entry)
  return {
    '--metal-bg': `var(--metal-${token}-bg)`,
    '--metal-tx': `var(--metal-${token}-tx)`,
  }
}

const composition = computed(() => {
  const totals = gamification.earningsByActivity
  const sum = ACTIVITIES.reduce((acc, a) => acc + totals[a.id], 0)
  if (sum <= 0) return []
  return ACTIVITIES
    .filter(a => totals[a.id] > 0)
    .map(a => ({ id: a.id, label: a.label, token: a.token, pct: totals[a.id] / sum * 100 }))
})

const walletSummary = computed(() => {
  const earned = Math.floor(gamification.earnedCoins)
  if (gamification.spentCoins === 0) return `${earned} moedas ganhas até agora`
  return `${earned} ganhas · ${gamification.spentCoins} usadas`
})

/** A mais barata ainda fora de alcance — a que dá o próximo objetivo. */
const nextReward = computed(() =>
  gamification.activeRewards
    .filter(reward => missingFor(reward) > 0 && !isClaimed(reward))
    .sort((a, b) => a.cost - b.cost)[0] ?? null,
)

const unlockedCount = computed(() =>
  gamification.activeRewards.filter(reward => gamification.canRedeem(reward)).length,
)
const hasUnlocked = computed(() => unlockedCount.value > 0)

function isClaimed(reward: Reward) {
  return !reward.repeatable && gamification.hasActiveRedemption(reward.id)
}

function isUnlocked(reward: Reward) {
  return !reward.archivedAt && gamification.canRedeem(reward)
}

function missingFor(reward: Reward) {
  return Math.max(0, reward.cost - gamification.balance)
}

function progressFor(reward: Reward) {
  if (reward.cost <= 0) return 100
  return Math.min(100, Math.max(0, (gamification.balance / reward.cost) * 100))
}

function rewardStatus(reward: Reward) {
  if (isClaimed(reward)) return 'Já resgatada'
  const missing = missingFor(reward)
  if (missing <= 0) return 'Pronta para resgatar'
  const time = coinsAsStudyTime(missing, gamification.settings.coinsPerHour)
  return `Faltam ${formatCoins(missing)} · ≈ ${time} de estudo`
}

function openNewReward() {
  editingReward.value = null
  showRewardModal.value = true
}

function openEditReward(reward: Reward) {
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
    message: `${reward.cost} moedas serão descontadas do seu saldo.`,
    confirmLabel: 'Resgatar',
    confirmVariant: 'primary',
  })
  if (!confirmed) return
  try {
    await gamification.redeemReward(reward.id)
    coinBurst.fire({ kind: 'redeem', label: reward.name })
    toast.success('Recompensa resgatada', `Você usou ${reward.cost} moedas.`)
  } catch (error) {
    const message = error instanceof Error && error.message === 'insufficient-balance'
      ? 'Seu saldo mudou e não é mais suficiente.'
      : 'Não foi possível concluir o resgate.'
    toast.error('Falha ao resgatar', message)
  }
}

async function toggleArchive(reward: Reward) {
  if (reward.archivedAt) {
    await gamification.restoreReward(reward.id)
    rewardFilter.value = 'active'
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
  await gamification.removeReward(reward.id)
  toast.success('Recompensa excluída')
}

async function confirmUndo(redemption: RewardRedemption) {
  const confirmed = await confirmSheet.ask({
    title: 'Desfazer resgate?',
    message: `${redemption.cost} moedas voltarão para o seu saldo.`,
    confirmLabel: 'Desfazer',
    confirmVariant: 'primary',
  })
  if (!confirmed) return
  await gamification.undoRedemption(redemption.id)
  toast.success('Resgate desfeito', `${redemption.cost} moedas foram estornadas.`)
}

function subjectName(subjectId?: string) {
  return subjectId ? subjects.getSubject(subjectId)?.name ?? 'Matéria removida' : 'Estudo'
}

function ledgerTitle(entry: WalletEntry) {
  if (entry.type === 'earning') return subjectName(entry.session.subjectId)
  if (entry.type === 'refund') return `Estorno: ${entry.redemption.rewardName}`
  return entry.redemption.rewardName
}

/* Só a hora: o dia agora vive no cabeçalho do grupo. */
function ledgerSubtitle(entry: WalletEntry) {
  const time = formatEntryTime(entry.createdAt)
  if (entry.type === 'earning') return `${time} · ${formatDuration(entry.session.duration)}`
  return entry.type === 'refund' ? `${time} · Resgate desfeito` : `${time} · Recompensa resgatada`
}

function formatEntryTime(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .format(new Date(timestamp))
}

function dayLabel(date: string) {
  if (date === localDateStr()) return 'Hoje'
  if (date === localDateStr(new Date(Date.now() - 86_400_000))) return 'Ontem'
  const [y, m, d] = date.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  const sameYear = parsed.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: sameYear ? undefined : 'numeric',
  }).format(parsed)
}

/**
 * Extrato por dia. `recentLedger` já vem ordenado do mais recente pro mais
 * antigo, então basta quebrar em blocos — um Map preserva essa ordem.
 */
const ledgerGroups = computed(() => {
  const groups = new Map<string, WalletEntry[]>()
  for (const entry of gamification.recentLedger) {
    const key = localDateStr(new Date(entry.createdAt))
    const bucket = groups.get(key)
    if (bucket) bucket.push(entry)
    else groups.set(key, [entry])
  }
  return [...groups].map(([key, entries]) => ({
    key,
    label: dayLabel(key),
    total: entries.reduce((sum, entry) => sum + entry.amount, 0),
    entries,
  }))
})
</script>

<style scoped>
/* ── Carteira ─────────────────────────────────────────── */
.wallet {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  padding: var(--space-5);
  border: 1px solid color-mix(in srgb, var(--coin-face-lo) 26%, var(--border));
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--coin-face-hi) 22%, transparent), transparent 62%),
    var(--bg-elevated);
}

/*
 * Brilho que atravessa o card quando existe algo resgatável. É o único
 * movimento contínuo da tela — por isso só aparece quando há motivo.
 */
.wallet--unlocked::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 38%,
    color-mix(in srgb, var(--coin-face-hi) 30%, transparent) 50%,
    transparent 62%
  );
  transform: translateX(-100%);
  animation: wallet-sheen 4.5s var(--ease-smooth) infinite;
  pointer-events: none;
}

@keyframes wallet-sheen {
  0%, 55%  { transform: translateX(-100%); }
  100%     { transform: translateX(100%); }
}

.wallet__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.wallet__id { min-width: 0; }

.wallet__label {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
}

.wallet__balance {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-top: 2px;
  color: var(--text);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 750;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

/*
 * Só a unidade. Um seletor `span` solto aqui também pegava o <span> que o
 * AnimatedNumber renderiza, e o saldo saía do tamanho da legenda.
 */
.wallet__unit {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0;
}

.wallet__meta {
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.wallet__next {
  position: relative;
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.wallet__next-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.wallet__next-icon { font-size: 15px; }

.wallet__next-name {
  flex: 1;
  min-width: 0;
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 500;
}

.wallet__next-missing {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.wallet__next-hint {
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.wallet__next-hint--ready {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--space-3);
  color: var(--coin-text);
  font-weight: 500;
}

/* ── Barra de progresso de moedas ─────────────────────── */
.coin-bar {
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.coin-bar span {
  display: block;
  width: var(--fill, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--coin-face-lo), var(--coin-face-hi));
  transition: width 0.6s var(--ease-out-expo);
}

/* ── Composição do saldo por origem ───────────────────── */
.wallet__mix { margin-top: var(--space-4); }

.mix-bar {
  display: flex;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.mix-bar span { transition: width 0.5s var(--ease-out-expo); }

.mix-key {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: var(--space-2) 0 0;
  padding: 0;
  list-style: none;
  color: var(--text-secondary);
  font-size: var(--text-2xs);
}

.mix-key li { display: flex; align-items: center; gap: 5px; }

.mix-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
}

.balance-warning {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  color: var(--warning);
  background: var(--warning-soft);
  font-size: var(--text-xs);
  line-height: 1.45;
}

.reward-filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  overflow-x: auto;
}

.reward-grid {
  display: grid;
  gap: var(--space-3);
}

/* ── Card de recompensa ───────────────────────────────── */
.reward-card {
  position: relative;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  transition: border-color 0.25s var(--ease-smooth), background 0.25s var(--ease-smooth);
}

/*
 * Desbloqueada muda de material, não só de texto: borda dourada e um wash da
 * cor da própria recompensa. Dá pra varrer a lista e ver o que já é seu.
 */
.reward-card--unlocked {
  border-color: color-mix(in srgb, var(--coin-face-lo) 45%, transparent);
  background:
    radial-gradient(130% 100% at 0% 0%, color-mix(in srgb, var(--reward-color) 12%, transparent), transparent 58%),
    var(--bg-elevated);
}

.reward-card--claimed,
.reward-card--archived { opacity: 0.62; }

.reward-card__top {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: start;
}

.reward-card__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--reward-color) 16%, var(--bg-soft));
  font-size: 22px;
}

.reward-card__content { min-width: 0; }

.reward-card__content h3 {
  color: var(--text);
  font-size: var(--text-base);
  font-weight: 650;
  letter-spacing: -0.01em;
}

.reward-card__content p {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: 1.4;
}

.reward-card__cost {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 4px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--coin-soft);
  color: var(--coin-text);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.reward-card__progress { margin-top: var(--space-4); }

.reward-card__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-2xs);
}

.reward-card__status p {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.reward-card--unlocked .reward-card__status {
  color: var(--coin-text);
  font-weight: 500;
}

.reward-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.reward-card__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.reward-card__redeem { transition: transform 0.14s var(--ease-out-expo); }
.reward-card__redeem:active:not(:disabled) { transform: scale(0.95); }

/* Pulso lento no botão liberado — chama sem gritar. */
.reward-card--unlocked .reward-card__redeem {
  animation: redeem-pulse 2.8s var(--ease-smooth) infinite;
}

@keyframes redeem-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--coin-face-lo) 42%, transparent); }
  55%      { box-shadow: 0 0 0 7px transparent; }
}

/* Antes ficava absoluto no canto — em cima do chip de custo. */
.reward-card__tag {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: var(--bg-soft);
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  font-weight: 500;
}

/* ── Extrato ──────────────────────────────────────────── */
.ledger-days {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ledger-day {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
}

.ledger-day__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  list-style: none;
}

.ledger-day__summary::-webkit-details-marker { display: none; }

.ledger-day__summary::before {
  content: '›';
  color: var(--text-tertiary);
  font-size: 20px;
  line-height: 1;
  transition: transform var(--transition);
}

.ledger-day[open] .ledger-day__summary::before { transform: rotate(90deg); }

.ledger-day__summary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.ledger-day__summary > span:first-of-type {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.ledger-day__summary strong {
  overflow: hidden;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-day__summary small {
  color: var(--text-tertiary);
  font-size: 11px;
}

.ledger-day__total {
  flex-shrink: 0;
  color: var(--coin-text);
  font-size: 13px;
  font-weight: 650;
}

.ledger-day__total--spent { color: var(--danger); }

.ledger-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background: var(--metal-bg, var(--coin-soft));
}

.ledger-icon--redemption { background: var(--danger-soft); }
.ledger-icon--refund     { background: var(--success-soft); }

.ledger-value {
  color: var(--metal-tx, var(--coin-text));
  font-size: var(--text-md);
  font-weight: 650;
  white-space: nowrap;
}

.ledger-value--spent { color: var(--danger); }

.undo-button {
  display: inline;
  margin-left: var(--space-2);
  border: 0;
  padding: 0;
  color: var(--accent);
  background: none;
  font: inherit;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
}

/* ── Transições da lista ──────────────────────────────── */
.reward-list-move { transition: transform 0.35s var(--ease-out-expo); }

.reward-list-enter-active,
.reward-list-leave-active {
  transition: opacity 0.25s var(--ease-smooth), transform 0.28s var(--ease-out-expo);
}

.reward-list-leave-active { position: absolute; width: 100%; }

.reward-list-enter-from,
.reward-list-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .wallet--unlocked::after,
  .reward-card--unlocked .reward-card__redeem { animation: none; }
  .coin-bar span { transition: none; }
}

@media (min-width: 720px) {
  .reward-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
