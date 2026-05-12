import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',         name: 'home',     component: HomeView },
    { path: '/subjects', name: 'subjects', component: () => import('@/views/SubjectsView.vue') },
    { path: '/stats',    name: 'stats',    component: () => import('@/views/StatsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  ],
})

export default router
