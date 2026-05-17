import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, logout, onAuthStateChanged, getAdminClaim } from '@/services/auth'
import type { User } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAdmin = ref(false)
  const isLoggedIn = ref(false)

  function init() {
    onAuthStateChanged(async (user) => {
      currentUser.value = user
      isLoggedIn.value = !!user
      isAdmin.value = user ? await getAdminClaim() : false
    })
  }

  async function loginUser(email: string, password: string): Promise<void> {
    await login(email, password)
  }

  async function logoutUser(): Promise<void> {
    await logout()
    isAdmin.value = false
    isLoggedIn.value = false
    currentUser.value = null
  }

  return { currentUser, isAdmin, isLoggedIn, init, loginUser, logoutUser }
})
