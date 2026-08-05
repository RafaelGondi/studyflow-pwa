import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useGamificationStore } from '@/stores/gamification'
import { useSubjectsStore } from '@/stores/subjects'
import { activityMeta } from '@/utils/coins'

/**
 * Moedas da sessão em andamento, ao vivo.
 *
 * O ganho só existia depois de salvar a sessão — quem estudava não via moeda
 * nenhuma enquanto estudava, que é justamente quando o retorno importa. Aqui
 * o mesmo cálculo do `saveStudy` roda sobre o tempo decorrido.
 */
export function useLiveCoins() {
  const timer = useTimerStore()
  const gamification = useGamificationStore()
  const subjects = useSubjectsStore()

  const eligible = computed(() =>
    !!timer.activeSubjectId && subjects.subjectEarnsCoins(timer.activeSubjectId),
  )

  const liveCoins = computed(() => {
    if (!eligible.value) return 0
    if (timer.mode === 'idle' || timer.isInBreak) return 0
    return gamification.calculateCoins(
      timer.studyElapsedSeconds,
      gamification.settings.coinsPerHour,
      subjects.subjectCoinMultiplier(timer.activeSubjectId!),
    )
  })

  /** Saldo como ficará ao encerrar — o número que o usuário está perseguindo. */
  const projectedBalance = computed(() =>
    Math.floor(gamification.earnedCoins + liveCoins.value) - gamification.spentCoins,
  )

  /** Metal que a sessão em andamento está rendendo. */
  const activeMetal = computed(() =>
    activityMeta(timer.activeSubjectId ? subjects.subjectActivityKind(timer.activeSubjectId) : null),
  )

  return { liveCoins, projectedBalance, coinsEligible: eligible, activeMetal }
}
