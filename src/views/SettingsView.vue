<template>
  <div class="min-h-screen bg-app-bg flex flex-col">
    <header class="px-4 pt-5 pb-4">
      <p class="text-[11px] text-muted font-medium uppercase tracking-widest">Preferências</p>
      <h1 class="text-lg font-bold text-primary">Configurações</h1>
    </header>

    <main class="flex-1 px-4 pb-28 space-y-2">

      <!-- Aviso de dados perdidos -->
      <div
        v-if="authStore.dataLost"
        class="rounded-md border border-red-500/30 bg-red-500/10 p-4 flex gap-3"
      >
        <span class="text-lg leading-none mt-0.5">⚠️</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary">Dados perdidos na atualização</p>
          <p class="text-xs text-muted mt-1 leading-relaxed">
            O navegador limpou os dados do app durante a atualização e uma nova conta anônima foi criada. Entre com Google para evitar que isso aconteça novamente.
          </p>
          <button @click="authStore.dismissDataLostWarning()" class="mt-2 text-xs text-muted underline">Dispensar</button>
        </div>
      </div>

      <!-- Erro de login -->
      <div
        v-if="authStore.signInError"
        class="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3"
      >
        <span class="text-base leading-none mt-0.5">⚠️</span>
        <div class="flex-1">
          <p class="text-sm text-primary font-medium">{{ authStore.signInError }}</p>
        </div>
        <button @click="authStore.clearSignInError()" class="text-muted text-lg leading-none">×</button>
      </div>

      <!-- ── Conta ─────────────────────────────────────────────────── -->
      <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1 pt-2 pb-1">Conta</p>

      <div class="bg-app-card rounded-md overflow-hidden divide-y divide-app-border">

        <!-- Logado com Google -->
        <template v-if="!authStore.isAnonymous">
          <!-- Perfil -->
          <div class="flex items-center gap-4 px-4 py-3.5">
            <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-app-elevated">
              <img
                v-if="authStore.photoURL"
                :src="authStore.photoURL"
                :alt="authStore.displayName ?? 'Foto'"
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-base">
                {{ authStore.displayName?.[0] ?? '?' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-primary truncate">{{ authStore.displayName ?? 'Usuário Google' }}</p>
              <p class="text-xs text-muted truncate">{{ authStore.email }}</p>
            </div>
            <span class="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">Sincronizado</span>
          </div>

          <!-- Sair -->
          <button
            @click="handleSignOut"
            :disabled="signingOut"
            class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors disabled:opacity-50"
          >
            <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
              <svg class="w-[18px] h-[18px] text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-semibold text-primary">{{ signingOut ? 'Saindo…' : 'Sair da conta' }}</p>
              <p class="text-xs text-muted">Voltará para conta anônima local</p>
            </div>
          </button>
        </template>

        <!-- Anônimo → mostrar botão de entrar com Google -->
        <template v-else>
          <button
            @click="handleGoogleSignIn"
            :disabled="authStore.signingIn"
            class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors disabled:opacity-50"
          >
            <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
              <!-- Google "G" logo -->
              <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-semibold text-primary">
                {{ authStore.signingIn ? 'Redirecionando…' : 'Entrar com Google' }}
              </p>
              <p class="text-xs text-muted">Seus dados ficam seguros mesmo ao atualizar o app</p>
            </div>
            <svg class="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <!-- Contexto sobre conta anônima -->
          <div class="px-4 py-3 flex items-start gap-3">
            <svg class="w-4 h-4 text-muted flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="text-xs text-muted leading-relaxed">
              Você está usando uma <strong class="text-primary font-semibold">conta anônima</strong>. Os dados ficam salvos neste navegador, mas podem ser perdidos se o app for reinstalado. Entre com Google para sincronizar em qualquer dispositivo.
            </p>
          </div>
        </template>
      </div>

      <!-- ── Aplicativo ─────────────────────────────────────────────── -->
      <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1 pt-2 pb-1">Aplicativo</p>
      <div class="bg-app-card rounded-md overflow-hidden divide-y divide-app-border">

        <!-- Instalar -->
        <button
          v-if="isInstallable && !isInstalled"
          @click="install()"
          class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors"
        >
          <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
            <svg class="w-[18px] h-[18px] text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold text-primary">Instalar aplicativo</p>
            <p class="text-xs text-muted">Adicionar à tela inicial</p>
          </div>
          <svg class="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- Atualizar -->
        <button
          @click="handleUpdate"
          :disabled="updating"
          class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors disabled:opacity-50"
        >
          <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
            <svg class="w-[18px] h-[18px] text-accent" :class="{ 'animate-spin': updating }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold text-primary">{{ hasUpdate ? 'Atualização disponível' : 'Verificar atualização' }}</p>
            <p class="text-xs text-muted">{{ updating ? 'Aplicando…' : hasUpdate ? 'Toque para reiniciar' : 'Versão atual instalada' }}</p>
          </div>
          <span v-if="hasUpdate" class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        </button>

      </div>

      <!-- ── Aparência ───────────────────────────────────────────────── -->
      <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1 pt-2 pb-1">Aparência</p>

      <div class="bg-app-card rounded-md overflow-hidden">
        <button
          @click="theme.toggle()"
          class="w-full flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors"
        >
          <div class="w-9 h-9 rounded-sm bg-app-elevated flex items-center justify-center flex-shrink-0">
            <svg v-if="theme.isDark" class="w-[18px] h-[18px] text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1"  x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else class="w-[18px] h-[18px] text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold text-primary">Tema</p>
            <p class="text-xs text-muted">{{ theme.isDark ? 'Modo escuro' : 'Modo claro' }}</p>
          </div>
          <div class="w-11 h-6 rounded-full transition-colors flex items-center px-0.5" :class="theme.isDark ? 'bg-accent' : 'bg-app-elevated'">
            <div class="w-5 h-5 rounded-full bg-white shadow transition-transform" :class="theme.isDark ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useSubjectsStore } from '@/stores/subjects'
import { useSessionsStore } from '@/stores/sessions'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const theme = useThemeStore()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const { isInstallable, isInstalled, install } = usePwaInstall()
const { hasUpdate, setup, checkForUpdate, applyUpdate } = usePwaUpdate()

const updating   = ref(false)
const signingOut = ref(false)

onMounted(setup)

async function handleGoogleSignIn() {
  // Inicia o redirect para o Google — a página vai navegar.
  // O resultado é processado em authStore.init() quando o app volta.
  await authStore.signInWithGoogle()
}

async function handleSignOut() {
  signingOut.value = true
  await authStore.signOut()
  await Promise.all([
    subjectsStore.load(),
    sessionsStore.loadToday(),
  ])
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
