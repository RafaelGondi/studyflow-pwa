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
        <!-- A escada não estava em lugar nenhum da tela; sem ela o extrato não se lê. -->
        <p class="wallet__rate">{{ EXCHANGE_LABEL }}</p>

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

      <!--
        A entrada da lojinha. A lista inteira vivia aqui: com dez recompensas
        eram ~1400px de cromo quase idêntico entre o saldo e o extrato. Agora
        fica só o que já dá pra levar, e o catálogo atrás de um toque.
      -->
      <section class="section-block">
        <AkSectionHeader title="Disponíveis para resgate">
          <template #action>
            <button type="button" class="shop-link" @click="router.push('/rewards/shop')">
              Lojinha
              <AkIcon name="arrow-right-outline" :size="13" />
            </button>
          </template>
        </AkSectionHeader>

        <div v-if="unlocked.length" class="shelf">
          <button
            v-for="reward in unlocked"
            :key="reward.id"
            type="button"
            class="shelf__card"
            :style="{ '--reward-color': reward.color }"
            @click="router.push('/rewards/shop')"
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
            <span class="shelf__time">
              {{ coinsAsStudyTime(reward.cost, gamification.settings.coinsPerHour) }} de estudo
            </span>
          </button>
        </div>

        <button v-else type="button" class="shop-empty" @click="router.push('/rewards/shop')">
          <span v-if="nextReward">
            Falta <strong class="numeric">{{ formatCoins(missingFor(nextReward)) }}</strong>
            para {{ nextReward.icon }} {{ nextReward.name }}
          </span>
          <span v-else>Cadastre sua primeira recompensa</span>
          <AkIcon name="arrow-right-outline" :size="16" />
        </button>
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
                    {{ entry.amount > 0 ? '+' : '' }}{{ entryAmount(entry) }}
                  </span>
                </template>
              </AkListRow>
            </AkList>
          </details>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkIcon, AkList, AkListRow, AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import CoinIcon from '@/components/ui/CoinIcon.vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useGamificationStore, type WalletEntry } from '@/stores/gamification'
import { useSubjectsStore } from '@/stores/subjects'
import { useConfirmSheet } from '@/composables/useConfirmSheet'
import { useAppToast } from '@/composables/useAppToast'
import { formatDuration, localDateStr } from '@/types'
import {
  ACTIVITIES, EXCHANGE_LABEL, activityMeta, coinsAsStudyTime, coinsInMetal, formatCoins,
  type ActivityMeta,
} from '@/utils/coins'
import type { Reward, RewardRedemption } from '@/types'

const router = useRouter()
const gamification = useGamificationStore()
const subjects = useSubjectsStore()
const confirmSheet = useConfirmSheet()
const toast = useAppToast()

/**
 * O ganho é contado no metal que a fonte rende, não convertido em ouro sem
 * avisar: uma hora de trabalho aparece como "+60 bronze", não como "+7,5".
 * O banco guarda ouro-equivalente; a escada faz a volta.
 */
function entryAmount(entry: WalletEntry) {
  if (entry.type !== 'earning') return `${formatCoins(Math.abs(entry.amount))} ouro`
  const meta = activityMeta(entry.session.activityKind)
  return `${formatCoins(coinsInMetal(entry.amount, entry.session.activityKind))} ${meta.metal.toLowerCase()}`
}

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

const unlocked = computed(() => gamification.activeRewards.filter(isUnlocked))

function missingFor(reward: Reward) {
  return Math.max(0, reward.cost - gamification.balance)
}

/* Alimenta a barra da próxima recompensa na carteira. */
function progressFor(reward: Reward) {
  if (reward.cost <= 0) return 100
  return Math.min(100, Math.max(0, (gamification.balance / reward.cost) * 100))
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

.wallet__rate {
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: var(--text-2xs);
  letter-spacing: 0.02em;
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

/* ── Prateleira: o que já dá pra levar ────────────────── */
.shop-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

.shop-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* Sangra até a borda da tela pra deixar claro que rola. */
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

.shop-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s var(--ease-out-expo);
}

.shop-empty:active { transform: scale(0.98); }

.shop-empty strong { color: var(--text); font-weight: 650; }

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
  .shelf__card::after { animation: none; }
  .coin-bar span { transition: none; }
}

</style>
