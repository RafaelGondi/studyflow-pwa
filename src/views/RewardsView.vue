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
        <p class="wallet-card__label">Saldo acumulado</p>
        <p class="wallet-card__balance numeric">
          {{ gamification.balance }}
          <span>moedas</span>
        </p>
        <p class="wallet-card__meta">
          {{ earningSummary }}
        </p>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Extrato de ganhos" />

        <AkEmptyState
          v-if="gamification.recentEarnings.length === 0"
          title="Nenhuma moeda ainda"
          description="As próximas sessões elegíveis aparecerão aqui."
        >
          <template #icon>⭐</template>
        </AkEmptyState>

        <AkList v-else>
          <AkListRow
            v-for="(session, index) in gamification.recentEarnings"
            :key="session.id"
            :divider="index < gamification.recentEarnings.length - 1"
          >
            <template #leading>
              <div class="earning-icon">
                <AkIcon name="star-outline" :size="18" />
              </div>
            </template>

            <span class="truncate">{{ subjectName(session.subjectId) }}</span>

            <template #subtitle>
              <span class="text-xs text-muted">
                {{ formatSessionDate(session.endTime) }} · {{ formatDuration(session.duration) }}
              </span>
            </template>

            <template #trailing>
              <span class="earning-value numeric">+{{ formatCoins(session.coinsEarned ?? 0) }}</span>
            </template>
          </AkListRow>
        </AkList>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  AkEmptyState, AkIcon, AkIconButton, AkList, AkListRow, AkPageHeader, AkSectionHeader,
} from '@rafael_dias/akoma'
import { useGamificationStore } from '@/stores/gamification'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'

const router = useRouter()
const gamification = useGamificationStore()
const subjects = useSubjectsStore()

const earningSummary = computed(() => {
  const count = gamification.rewardedSessions.length
  if (count === 0) return 'Comece uma sessão elegível para ganhar moedas.'
  return `${count} ${count === 1 ? 'sessão recompensada' : 'sessões recompensadas'}`
})

function subjectName(subjectId?: string) {
  return subjectId ? subjects.getSubject(subjectId)?.name ?? 'Matéria removida' : 'Estudo'
}

function formatSessionDate(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
  overflow: hidden;
  padding: var(--space-6);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 16%, var(--surface)), var(--surface));
  box-shadow: var(--shadow-sm);
}

.wallet-card__icon,
.earning-icon {
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

.earning-icon {
  width: 34px;
  height: 34px;
}

.earning-value {
  color: var(--success, var(--accent));
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
