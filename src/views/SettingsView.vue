<template>
  <div class="ak-app-page">
    <AkPageHeader label="Preferências" title="Ajustes" size="md" />

    <div class="ak-app-scroll page-body reveal reveal-d1">
      <div v-if="authStore.dataLost" class="inline-notice">
        <p class="text-sm font-semibold">Dados perdidos na atualização</p>
        <p class="text-xs text-muted" style="margin-top: var(--space-2); line-height: 1.5">
          Entre com Google para evitar perda de dados ao atualizar o app.
        </p>
        <AkButton size="sm" variant="ghost" style="margin-top: var(--space-3)" @click="authStore.dismissDataLostWarning()">
          Dispensar
        </AkButton>
      </div>

      <div v-if="authStore.signInError" class="inline-notice inline-notice--danger">
        <p class="text-sm">{{ authStore.signInError }}</p>
        <AkButton size="sm" variant="ghost" @click="authStore.clearSignInError()">Fechar</AkButton>
      </div>

      <section class="section-block">
        <AkSectionHeader title="Conta" />
        <AkList>
          <template v-if="!authStore.isAnonymous">
            <AkListRow :divider="true">
              <template #leading>
                <div class="subject-leading subject-leading--sm">
                  <img
                    v-if="authStore.photoURL"
                    :src="authStore.photoURL"
                    alt=""
                    style="width:100%;height:100%;object-fit:cover;border-radius:inherit"
                  />
                  <span v-else>{{ authStore.displayName?.[0] ?? '?' }}</span>
                </div>
              </template>
              <span class="truncate">{{ authStore.displayName ?? 'Usuário Google' }}</span>
              <template #subtitle>
                <span class="text-xs text-muted truncate">{{ authStore.email }}</span>
              </template>
              <template #trailing>
                <AkBadge variant="success" label="Sync" />
              </template>
            </AkListRow>
            <AkListRow interactive :divider="false" @click="handleSignOut">
              <span>Sair da conta</span>
              <template #subtitle>
                <span class="text-xs text-muted">Voltará para conta anônima</span>
              </template>
            </AkListRow>
          </template>

          <AkListRow v-else interactive :divider="false" @click="handleGoogleSignIn">
            <span>{{ authStore.signingIn ? 'Redirecionando…' : 'Entrar com Google' }}</span>
            <template #subtitle>
              <span class="text-xs text-muted">Sincronize em qualquer dispositivo</span>
            </template>
            <template #trailing>
              <AkIcon name="arrow-right-outline" :size="18" />
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Modo de estudo" />

        <div class="timer-mode-row">
          <button
            v-for="opt in timerModes"
            :key="opt.value"
            type="button"
            class="timer-mode-chip"
            :class="{ 'timer-mode-chip--active': timerStore.timerType === opt.value }"
            @click="timerStore.updatePrefs({ timerType: opt.value })"
          >
            {{ opt.label }}
          </button>
        </div>

        <AkList v-if="timerStore.timerType === 'pomodoro'">
          <AkListRow :divider="true">
            <span>Foco</span>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.pomodoro.workMinutes"
                  min="1" max="90"
                  aria-label="Duração do foco em minutos"
                  @change="e => timerStore.updatePrefs({ pomodoro: { workMinutes: Number((e.target as HTMLInputElement).value) } })"
                />
                <span class="duration-unit">min</span>
              </div>
            </template>
          </AkListRow>
          <AkListRow :divider="true">
            <span>Pausa curta</span>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.pomodoro.shortBreakMinutes"
                  min="1" max="30"
                  aria-label="Duração da pausa curta em minutos"
                  @change="e => timerStore.updatePrefs({ pomodoro: { shortBreakMinutes: Number((e.target as HTMLInputElement).value) } })"
                />
                <span class="duration-unit">min</span>
              </div>
            </template>
          </AkListRow>
          <AkListRow :divider="true">
            <span>Pausa longa</span>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.pomodoro.longBreakMinutes"
                  min="5" max="60"
                  aria-label="Duração da pausa longa em minutos"
                  @change="e => timerStore.updatePrefs({ pomodoro: { longBreakMinutes: Number((e.target as HTMLInputElement).value) } })"
                />
                <span class="duration-unit">min</span>
              </div>
            </template>
          </AkListRow>
          <AkListRow :divider="false">
            <span>Ciclo da pausa longa</span>
            <template #subtitle>
              <span class="text-xs text-muted">A cada quantos pomodoros</span>
            </template>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.pomodoro.longBreakInterval"
                  min="2" max="10"
                  aria-label="Intervalo para pausa longa"
                  @change="e => timerStore.updatePrefs({ pomodoro: { longBreakInterval: Number((e.target as HTMLInputElement).value) } })"
                />
                <span class="duration-unit">×</span>
              </div>
            </template>
          </AkListRow>
        </AkList>

        <AkList v-else-if="timerStore.timerType === 'flowmodoro'">
          <AkListRow :divider="true">
            <span>Proporção da pausa</span>
            <template #subtitle>
              <span class="text-xs text-muted">Pausa = tempo de foco ÷ proporção</span>
            </template>
            <template #trailing>
              <div class="duration-input-row">
                <span class="duration-unit" style="margin-right: var(--space-1)">1 /</span>
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.flowBreakRatio"
                  min="2" max="10"
                  aria-label="Proporção da pausa"
                  @change="e => timerStore.updatePrefs({ flowBreakRatio: Number((e.target as HTMLInputElement).value) })"
                />
              </div>
            </template>
          </AkListRow>
          <AkListRow :divider="timerStore.prefs.flowNotificationEnabled">
            <AkSwitch
              :model-value="timerStore.prefs.flowNotificationEnabled"
              label="Aviso de tempo"
              description="Avisa uma vez e mantém o timer correndo"
              @update:model-value="timerStore.updatePrefs({ flowNotificationEnabled: $event })"
            />
          </AkListRow>
          <AkListRow v-if="timerStore.prefs.flowNotificationEnabled" :divider="false">
            <span>Avisar após</span>
            <template #subtitle>
              <span class="text-xs text-muted">Som, vibração e notificação quando disponíveis</span>
            </template>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="timerStore.prefs.flowNotificationMinutes"
                  min="1"
                  max="240"
                  aria-label="Minutos até o aviso do Flowmodoro"
                  @change="handleFlowNotificationMinutesChange"
                />
                <span class="duration-unit">min</span>
              </div>
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Comportamento" />
        <AkList>
          <AkListRow :divider="false">
            <AkSwitch
              :model-value="faceDown.enabled.value"
              label="Gesto de foco"
              :description="faceDown.permissionError.value ? 'Permissão negada' : 'Vire o celular para abrir modo foco'"
              @update:model-value="handleFaceDownToggle"
            />
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Recompensas" />
        <AkList>
          <AkListRow :divider="false">
            <span>Moedas por hora</span>
            <template #subtitle>
              <span class="text-xs text-muted">Aplicada às próximas sessões · 60 = 1 moeda por minuto</span>
            </template>
            <template #trailing>
              <div class="duration-input-row">
                <input
                  type="number"
                  class="duration-input"
                  :value="gamificationStore.settings.coinsPerHour"
                  min="1"
                  max="1000"
                  aria-label="Moedas ganhas por hora de estudo"
                  @change="handleCoinsPerHourChange"
                />
                <span class="duration-unit">moedas/h</span>
              </div>
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Aplicativo" />
        <AkList>
          <AkListRow v-if="isInstallable && !isInstalled" interactive :divider="true" @click="install()">
            <span>Instalar aplicativo</span>
            <template #subtitle><span class="text-xs text-muted">Adicionar à tela inicial</span></template>
          </AkListRow>
          <AkListRow interactive :divider="false" @click="handleUpdate">
            <span>{{ hasUpdate ? 'Atualização disponível' : 'Verificar atualização' }}</span>
            <template #subtitle>
              <span class="text-xs text-muted">{{ updating ? 'Aplicando…' : hasUpdate ? 'Toque para reiniciar' : 'Versão atual' }}</span>
            </template>
            <template #trailing>
              <AkBadge v-if="hasUpdate" variant="success" label="●" />
            </template>
          </AkListRow>
        </AkList>
      </section>

      <section class="section-block">
        <AkSectionHeader title="Aparência" />
        <AkList>
          <AkListRow :divider="false">
            <AkSwitch
              :model-value="mode === 'dark'"
              label="Modo escuro"
              :description="mode === 'dark' ? 'Tema escuro ativo' : 'Tema claro ativo'"
              @update:model-value="(next) => setMode(next ? 'dark' : 'light')"
            />
          </AkListRow>
        </AkList>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  AkBadge, AkButton, AkIcon, AkList, AkListRow, AkPageHeader, AkSectionHeader, AkSwitch,
} from '@rafael_dias/akoma'
import { useAppTheme } from '@/composables/useAppTheme'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { usePwaUpdate } from '@/composables/usePwaUpdate'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'
import { useTimerStore } from '@/stores/timer'
import { useGamificationStore } from '@/stores/gamification'
import type { TimerType } from '@/stores/timer'

const { mode, setMode } = useAppTheme()
const timerStore = useTimerStore()
const gamificationStore = useGamificationStore()

const timerModes: { value: TimerType; label: string }[] = [
  { value: 'counter',    label: 'Contador' },
  { value: 'pomodoro',  label: 'Pomodoro' },
  { value: 'flowmodoro', label: 'Flowmodoro' },
]
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const { isInstallable, isInstalled, install } = usePwaInstall()
const { hasUpdate, setup, checkForUpdate, applyUpdate } = usePwaUpdate()
const faceDown = useFaceDownFocus()

const updating = ref(false)
const signingOut = ref(false)

function handleFlowNotificationMinutesChange(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Math.min(240, Math.max(1, Math.round(Number(input.value) || 25)))
  input.value = String(value)
  timerStore.updatePrefs({ flowNotificationMinutes: value })
}

async function handleCoinsPerHourChange(event: Event) {
  const input = event.target as HTMLInputElement
  const value = Math.min(1000, Math.max(1, Math.round(Number(input.value) || 60)))
  input.value = String(value)
  await gamificationStore.updateSettings({ coinsPerHour: value })
}

async function handleFaceDownToggle(next: boolean) {
  if (next === faceDown.enabled.value) return
  if (next) await faceDown.enable()
  else faceDown.disable()
}

onMounted(setup)

async function handleGoogleSignIn() {
  await authStore.signInWithGoogle()
}

async function handleSignOut() {
  signingOut.value = true
  await authStore.signOut()
  await Promise.all([subjectsStore.load(), sessionsStore.loadToday()])
  signingOut.value = false
}

async function handleUpdate() {
  if (hasUpdate.value) {
    updating.value = true
    applyUpdate()
  } else {
    updating.value = true
    await checkForUpdate()
    updating.value = false
  }
}
</script>

<style scoped>
.timer-mode-row {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-1) 0 var(--space-3);
}

.timer-mode-chip {
  flex: 1;
  padding: var(--space-2) 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  text-align: center;
}

.timer-mode-chip--active {
  background: var(--accent-ink);
  border-color: var(--accent-ink);
  color: var(--accent-contrast);
}

.duration-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.duration-input {
  width: 52px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-size: var(--text-sm);
  text-align: right;
}

.duration-unit {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
