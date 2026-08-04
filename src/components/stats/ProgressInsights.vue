<template>
  <section v-if="insights.length" class="section-block">
    <AkSectionHeader title="Destaques do período" />

    <div class="insights">
      <article v-for="insight in insights" :key="insight.key" class="insight">
        <span class="insight__icon" aria-hidden="true">
          <SubjectIcon :icon="insight.icon" :name="insight.title" />
        </span>
        <div class="insight__content">
          <span class="insight__label">{{ insight.label }}</span>
          <strong>{{ insight.title }}</strong>
          <p>{{ insight.description }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AkSectionHeader } from '@rafael_dias/akoma'
import SubjectIcon from '@/components/ui/SubjectIcon.vue'
import { useSubjectsStore } from '@/stores/subjects'
import { formatDuration } from '@/types'
import { totalsBySubject } from '@/utils/studyProgress'
import type { StudySession } from '@/types'

interface Insight {
  key: string
  icon: string
  label: string
  title: string
  description: string
}

const props = defineProps<{
  sessions: StudySession[]
  dates: string[]
  subjectFiltered?: boolean
}>()

const subjectsStore = useSubjectsStore()

const totalSeconds = computed(() =>
  props.sessions.reduce((sum, session) => sum + session.duration, 0),
)

const longestStreak = computed(() => {
  const activeDates = new Set(props.sessions.map(session => session.date))
  let longest = 0
  let current = 0
  for (const date of props.dates) {
    if (activeDates.has(date)) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
})

const topSubjectInsight = computed<Insight | null>(() => {
  if (props.subjectFiltered) return null
  const totals = totalsBySubject(props.sessions)
  if (totals.length < 2 || totalSeconds.value === 0) return null
  const leader = totals[0]
  if (!leader) return null
  const subject = subjectsStore.getSubject(leader.subjectId)
  const share = Math.round((leader.seconds / totalSeconds.value) * 100)
  return {
    key: 'focus',
    icon: subject?.icon ?? '📚',
    label: 'Maior foco',
    title: subject?.name ?? 'Matéria removida',
    description: `${share}% do tempo do período (${formatDuration(leader.seconds)}).`,
  }
})

const timeOfDayInsight = computed<Insight | null>(() => {
  if (props.sessions.length < 2 || totalSeconds.value === 0) return null
  const periods = [
    { key: 'morning', name: 'pela manhã', icon: '☀️', seconds: 0 },
    { key: 'afternoon', name: 'à tarde', icon: '🌤️', seconds: 0 },
    { key: 'evening', name: 'à noite', icon: '🌙', seconds: 0 },
    { key: 'late', name: 'de madrugada', icon: '✨', seconds: 0 },
  ]
  for (const session of props.sessions) {
    const hour = new Date(session.startTime).getHours()
    const index = hour >= 5 && hour < 12 ? 0 : hour >= 12 && hour < 18 ? 1 : hour >= 18 ? 2 : 3
    periods[index]!.seconds += session.duration
  }
  const leader = [...periods].sort((a, b) => b.seconds - a.seconds)[0]
  if (!leader || leader.seconds === 0) return null
  const share = Math.round((leader.seconds / totalSeconds.value) * 100)
  return {
    key: 'time',
    icon: leader.icon,
    label: 'Horário predominante',
    title: leader.name,
    description: `${share}% do tempo foi registrado nesse horário.`,
  }
})

const streakInsight = computed<Insight | null>(() => {
  if (longestStreak.value === 0) return null
  const days = longestStreak.value
  return {
    key: 'streak',
    icon: days > 1 ? '🔥' : '✓',
    label: 'Maior sequência',
    title: days === 1 ? '1 dia ativo' : `${days} dias seguidos`,
    description: days === 1
      ? 'Ainda não houve dois dias consecutivos neste período.'
      : 'Sua maior sequência de registros no período.',
  }
})

const insights = computed(() => [
  streakInsight.value,
  topSubjectInsight.value,
  timeOfDayInsight.value,
].filter((insight): insight is Insight => insight !== null))
</script>

<style scoped>
.insights {
  display: grid;
  gap: var(--space-2);
}

.insight {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-soft);
}

.insight__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: var(--bg-elevated);
  font-size: 17px;
}

.insight__content {
  min-width: 0;
}

.insight__label {
  display: block;
  margin-bottom: 1px;
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.insight strong {
  display: block;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
}

.insight p {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

@media (min-width: 720px) {
  .insights { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
