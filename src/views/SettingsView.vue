<template>
  <div class="ak-app-page ak-app-scroll">
    <AkPageHeader label="Preferências" title="Ajustes" size="md" />

    <div class="page-body reveal reveal-d1">
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

const { mode, setMode } = useAppTheme()
const authStore = useAuthStore()
const subjectsStore = useSubjectsStore()
const sessionsStore = useSessionsStore()
const { isInstallable, isInstalled, install } = usePwaInstall()
const { hasUpdate, setup, checkForUpdate, applyUpdate } = usePwaUpdate()
const faceDown = useFaceDownFocus()

const updating = ref(false)
const signingOut = ref(false)

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
