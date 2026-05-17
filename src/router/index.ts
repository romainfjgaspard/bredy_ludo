import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/library' },
    { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
    { path: '/game/:id', name: 'game-detail', component: () => import('@/views/GameDetailView.vue') },
    { path: '/wheel', name: 'wheel', component: () => import('@/views/WheelView.vue') },
    { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { requiresAdmin: true } },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  ],
})

router.beforeEach((to, _, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAdmin && !auth.isAdmin) next({ name: 'login' })
  else next()
})

export default router
