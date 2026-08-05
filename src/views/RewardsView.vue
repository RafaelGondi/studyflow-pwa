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
      <section class="wallet-card">
        <div class="wallet-card__icon" aria-hidden="true">
          <AkIcon name="trophy-outline" :size="24" />
        </div>
        <p class="wallet-card__label">Saldo disponível</p>
        <p class="wallet-card__balance numeric">
          {{ gamification.balance }}
          <span>moedas</span>
        </p>
        <p class="wallet-card__meta">
          {{ walletSummary }}
        </p>
      </section>

      <div v-if="gamification.balance < 0" class="balance-warning">
        <AkIcon name="alert-circle-outline" :size="20" />
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

        <div v-else class="reward-grid">
          <article v-for="reward in visibleRewards" :key="reward.id" class="reward-card">
            <div class="reward-card__top">
              <div class="reward-card__icon" :style="{ background: rewardTint(reward.color) }">{{ reward.icon }}</div>
              <div class="reward-card__content">
                <h3>{{ reward.name }}</h3>
                <p v-if="reward.description">{{ reward.description }}</p>
                <span class="reward-card__kind">{{ reward.repeatable ? 'Pode repetir' : 'Resgate único' }}</span>
              </div>
              <strong class="reward-card__cost numeric">{{ reward.cost }} <small>moedas</small></strong>
            </div>

            <div v-if="!reward.archivedAt" class="reward-card__progress">
              <span>{{ rewardStatus(reward) }}</span>
              <div class="reward-progress" aria-hidden="true">
                <span :style="{ width: `${rewardProgress(reward)}%`, background: reward.color }" />
              </div>
            </div>

            <div class="reward-card__actions">
              <AkButton
                v-if="!reward.archivedAt"
                size="sm"
                variant="primary"
                :disabled="!gamification.canRedeem(reward)"
                @click="confirmRedeem(reward)"
              >
                Resgatar
              </AkButton>
              <AkButton size="sm" variant="ghost" @click="openEditReward(reward)">Editar</AkButton>
              <AkButton size="sm" variant="ghost" @click="toggleArchive(reward)">
                {{ reward.archivedAt ? 'Restaurar' : 'Arquivar' }}
              </AkButton>
              <AkIconButton icon="trash-outline" label="Excluir recompensa" size="sm" @click="confirmDelete(reward)" />
            </div>
          </article>
        </div>
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

        <AkList v-else>
          <AkListRow
            v-for="(entry, index) in gamification.recentLedger"
            :key="entry.id"
            :divider="index < gamification.recentLedger.length - 1"
          >
            <template #leading>
              <div class="ledger-icon" :class="`ledger-icon--${entry.type}`">
                <span v-if="entry.type !== 'earning'">{{ entry.redemption.rewardIcon }}</span>
                <AkIcon v-else name="star-outline" :size="18" />
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
              <span class="ledger-value numeric" :class="{ 'ledger-value--spent': entry.amount < 0 }">
                {{ entry.amount > 0 ? '+' : '' }}{{ formatCoins(entry.amount) }}
              </span>
            </template>
          </AkListRow>
        </AkList>
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
import { useGamificationStore, type WalletEntry } from '@/stores/gamification'
import { useSubjectsStore } from '@/stores/subjects'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { useAppToast } from '@/composables/useAppToast'
import { formatDuration } from '@/types'
import type { Reward, RewardRedemption } from '@/types'

const router = useRouter()
const gamification = useGamificationStore()
const subjects = useSubjectsStore()
const confirmSheet = useConfirmSheet()
const toast = useAppToast()
const rewardFilter = ref<'active' | 'archived'>('active')
const showRewardModal = ref(false)
const editingReward = ref<Reward | null>(null)

const visibleRewards = computed(() => rewardFilter.value === 'active'
  ? gamification.activeRewards
  : gamification.archivedRewards,
)

const walletSummary = computed(() => {
  const earned = Math.floor(gamification.earnedCoins)
  if (gamification.spentCoins === 0) return `${earned} moedas ganhas até agora`
  return `${earned} ganhas · ${gamification.spentCoins} usadas`
})

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

function rewardProgress(reward: Reward) {
  return Math.min(100, Math.max(0, (gamification.balance / reward.cost) * 100))
}

function rewardStatus(reward: Reward) {
  if (!reward.repeatable && gamification.hasActiveRedemption(reward.id)) return 'Já resgatada'
  const missing = reward.cost - gamification.balance
  return missing <= 0 ? 'Você já pode resgatar' : `Faltam ${missing} moedas`
}

function rewardTint(color: string) {
  return `color-mix(in srgb, ${color} 18%, var(--surface))`
}

function subjectName(subjectId?: string) {
  return subjectId ? subjects.getSubject(subjectId)?.name ?? 'Matéria removida' : 'Estudo'
}

function ledgerTitle(entry: WalletEntry) {
  if (entry.type === 'earning') return subjectName(entry.session.subjectId)
  if (entry.type === 'refund') return `Estorno: ${entry.redemption.rewardName}`
  return entry.redemption.rewardName
}

function ledgerSubtitle(entry: WalletEntry) {
  const date = formatEntryDate(entry.createdAt)
  if (entry.type === 'earning') return `${date} · ${formatDuration(entry.session.duration)}`
  return entry.type === 'refund' ? `${date} · Resgate desfeito` : `${date} · Recompensa resgatada`
}

function formatEntryDate(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(timestamp))
}

function formatCoins(value: number) {
  if (value > 0 && value < 0.01) return '<0,01'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.wallet-card {
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
  padding: var(--space-6);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 16%, var(--surface)), var(--surface));
  box-shadow: var(--shadow-sm);
}

.wallet-card__icon,
.ledger-icon {
  display: grid;
  place-items: center;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border-radius: var(--radius-md);
}

.wallet-card__icon {
  width: 44px;
  height: 44px;
  margin-bottom: var(--space-4);
}

.wallet-card__label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.wallet-card__balance {
  margin-top: var(--space-1);
  color: var(--text-primary);
  font-size: 40px;
  font-weight: 750;
  line-height: 1.1;
}

.wallet-card__balance span {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
}

.wallet-card__meta {
  margin-top: var(--space-3);
  color: var(--text-secondary);
  font-size: 13px;
}

.balance-warning {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  color: var(--warning, #a16207);
  background: color-mix(in srgb, var(--warning, #f59e0b) 12%, var(--surface));
  font-size: 13px;
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

.reward-card {
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

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
  font-size: 22px;
}

.reward-card__content {
  min-width: 0;
}

.reward-card__content h3 {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
}

.reward-card__content p {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.reward-card__kind {
  display: inline-block;
  margin-top: var(--space-2);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.reward-card__cost {
  text-align: right;
  color: var(--text-primary);
  font-size: 17px;
  white-space: nowrap;
}

.reward-card__cost small {
  display: block;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
}

.reward-card__progress {
  margin-top: var(--space-4);
  color: var(--text-secondary);
  font-size: 11px;
}

.reward-progress {
  height: 5px;
  margin-top: var(--space-2);
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.reward-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.reward-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-4);
}

.ledger-icon {
  width: 34px;
  height: 34px;
}

.ledger-icon--redemption {
  background: color-mix(in srgb, var(--danger, #dc2626) 10%, transparent);
}

.ledger-icon--refund {
  background: color-mix(in srgb, var(--success, #16a34a) 12%, transparent);
}

.ledger-value {
  color: var(--success, var(--accent));
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.ledger-value--spent {
  color: var(--danger, #dc2626);
}

.undo-button {
  display: inline;
  margin-left: var(--space-2);
  border: 0;
  padding: 0;
  color: var(--accent);
  background: none;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

@media (min-width: 720px) {
  .reward-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
