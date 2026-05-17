<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="profile in PROFILES"
      :key="profile"
      :class="[
        'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
        activeProfile === profile
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400',
      ]"
      @click="profileStore.setProfile(activeProfile === profile ? null : profile)"
    >
      {{ profile }}
    </button>
    <button
      :class="[
        'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
        activeProfile === null
          ? 'bg-gray-700 text-white border-gray-700'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500',
      ]"
      @click="profileStore.setProfile(null)"
    >
      Famille
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profileStore'
import { PROFILES } from '@/domain/Profile'

const profileStore = useProfileStore()
const { activeProfile } = storeToRefs(profileStore)
</script>
