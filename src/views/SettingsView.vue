<template>
  <div class="page akoma-page">
    <header class="page-header reveal">
      <span class="page-label">Preferências</span>
      <h1 class="page-title">Ajustes</h1>
    </header>

    <main class="scroll-main stack-sm reveal reveal-d1">

      <AkCard v-if="authStore.dataLost" padding="md" class="alert alert--danger">
        <span class="text-lg">⚠️</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary">Dados perdidos na atualização</p>
          <p class="text-xs text-muted" style="margin-top: var(--space-1); line-height: 1.5">
            O navegador limpou os dados do app durante a atualização e uma nova conta anônima foi criada. Entre com Google para evitar que isso aconteça novamente.
          </p>
          <AkButton size="sm" variant="ghost" style="margin-top: var(--space-2)" @click="authStore.dismissDataLostWarning()">
            Dispensar
          </AkButton>
        </div>
      </AkCard>

      <AkCard v-if="authStore.signInError" padding="sm" class="alert alert--warning">
        <span>⚠️</span>
        <p class="text-sm text-primary font-medium flex-1">{{ authStore.signInError }}</p>
        <AkButton size="sm" variant="ghost" @click="authStore.clearSignInError()">×</AkButton>
      </AkCard>

      <p class="section-title" style="padding-top: var(--space-2)">Conta</p>

      <div class="settings-group">
        <template v-if="!authStore.isAnonymous">
          <div class="settings-row">
            <div class="settings-icon" style="border-radius: var(--radius-full); overflow: hidden">
              <img
                v-if="authStore.photoURL"
                :src="authStore.photoURL"
                :alt="authStore.displayName ?? 'Foto'"
                style="width: 100%; height: 100%; object-fit: cover"
                referrerpolicy="no-referrer"
              />
              <span v-else>{{ authStore.displayName?.[0] ?? '?' }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-primary truncate">{{ authStore.displayName ?? 'Usuário Google' }}</p>
              <p class="text-xs text-muted truncate">{{ authStore.email }}</p>
            </div>
            <AkBadge variant="success" label="Sincronizado" />
          </div>

          <button @click="handleSignOut" :disabled="signingOut" class="settings-row">
            <div class="settings-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div style="flex: 1; text-align: left">
              <p class="text-sm font-semibold text-primary">{{ signingOut ? 'Saindo…' : 'Sair da conta' }}</p>
              <p class="text-xs text-muted">Voltará para conta anônima local</p>
            </div>
          </button>
        </template>

        <template v-else>
          <button @click="handleGoogleSignIn" :disabled="authStore.signingIn" class="settings-row">
            <div class="settings-icon">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div style="flex: 1; text-align: left">
              <p class="text-sm font-semibold text-primary">
                {{ authStore.signingIn ? 'Redirecionando…' : 'Entrar com Google' }}
              </p>
              <p class="text-xs text-muted">Seus dados ficam seguros mesmo ao atualizar o app</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <div style="padding: var(--space-3) var(--space-4); display: flex; gap: var(--space-3); align-items: flex-start">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="width:16px;height:16px;flex-shrink:0;margin-top:2px">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="text-xs text-muted" style="line-height: 1.5">
              Você está usando uma <strong class="text-primary font-semibold">conta anônima</strong>. Os dados ficam salvos neste navegador, mas podem ser perdidos se o app for reinstalado.
            </p>
          </div>
        </template>
      </div>

      <p class="section-title" style="padding-top: var(--space-2)">Comportamento</p>
      <div class="settings-group">
        <button @click="handleFaceDownToggle" class="settings-row">
          <div class="settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div style="flex: 1; text-align: left">
            <p class="text-sm font-semibold text-primary">Gesto de foco</p>
            <p class="text-xs text-muted">
              {{ faceDown.permissionError.value ? 'Permissão negada pelo sistema' : 'Vire o celular pra baixo para abrir o modo foco' }}
            </p>
          </div>
          <div class="toggle" :class="{ 'toggle--on': faceDown.enabled.value }">
            <div class="toggle__knob" />
          </div>
        </button>
      </div>

      <p class="section-title" style="padding-top: var(--space-2)">Aplicativo</p>
      <div class="settings-group">
        <button v-if="isInstallable && !isInstalled" @click="install()" class="settings-row">
          <div class="settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div style="flex: 1; text-align: left">
            <p class="text-sm font-semibold text-primary">Instalar aplicativo</p>
            <p class="text-xs text-muted">Adicionar à tela inicial</p>
          </div>
        </button>

        <button @click="handleUpdate" :disabled="updating" class="settings-row">
          <div class="settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" :class="{ 'spin': updating }">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <div style="flex: 1; text-align: left">
            <p class="text-sm font-semibold text-primary">{{ hasUpdate ? 'Atualização disponível' : 'Verificar atualização' }}</p>
            <p class="text-xs text-muted">{{ updating ? 'Aplicando…' : hasUpdate ? 'Toque para reiniciar' : 'Versão atual instalada' }}</p>
          </div>
          <AkBadge v-if="hasUpdate" variant="success" label="●" />
        </button>
      </div>

      <p class="section-title" style="padding-top: var(--space-2)">Aparência</p>
      <div class="settings-group">
        <button @click="theme.toggle()" class="settings-row">
          <div class="settings-icon">
            <svg v-if="theme.isDark" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <div style="flex: 1; text-align: left">
            <p class="text-sm font-semibold text-primary">Tema</p>
            <p class="text-xs text-muted">{{ theme.isDark ? 'Modo escuro' : 'Modo claro' }}</p>
          </div>
          <div class="toggle" :class="{ 'toggle--on': theme.isDark }">
            <div class="toggle__knob" />
          </div>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AkBadge, AkButton, AkCard } from '@rafael_dias/akoma'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { usePwaUpdate } from '@/composables/usePwaUpdate'
import { useFaceDownFocus } from '@/composables/useFaceDownFocus'

const theme = useThemeStore()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const { isInstallable, isInstalled, install } = usePwaInstall()
const { hasUpdate, setup, checkForUpdate, applyUpdate } = usePwaUpdate()
const faceDown = useFaceDownFocus()

const updating = ref(false)
const signingOut = ref(false)

async function handleFaceDownToggle() {
  await faceDown.toggle()
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
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
