<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm space-y-4">
      <h1 class="text-xl font-bold text-center">Connexion Admin</h1>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Email</label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label class="text-sm text-gray-600 mb-1 block">Mot de passe</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <button
        class="w-full py-2 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
        :disabled="loading"
        @click="submit"
      >
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await authStore.loginUser(email.value, password.value)
    router.push({ name: 'admin' })
  } catch (e: unknown) {
    error.value = 'Identifiants incorrects'
  } finally {
    loading.value = false
  }
}
</script>
