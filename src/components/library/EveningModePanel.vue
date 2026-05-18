<template>
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
    <div class="flex items-center justify-between mb-2">
      <span class="font-semibold text-sm text-amber-800">🌙 Mode Soirée</span>
      <button
        :class="['px-3 py-1 rounded-full text-xs font-medium transition-colors', isActive ? 'bg-amber-600 text-white' : 'bg-base-100 text-amber-700 border border-amber-400']"
        @click="toggle()"
      >
        {{ isActive ? 'Actif' : 'Activer' }}
      </button>
    </div>
    <div v-if="isActive" class="flex flex-wrap gap-1.5">
      <button
        v-for="profile in PROFILES"
        :key="profile"
        :class="[
          'px-2 py-0.5 rounded-full text-xs border transition-colors',
          presentProfiles.includes(profile)
            ? 'bg-amber-600 text-white border-amber-600'
            : 'bg-base-100 text-base-content/50 border-gray-300',
        ]"
        @click="toggleProfile(profile)"
      >
        {{ profile }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PROFILES } from '@/domain/Profile'
import { useEveningMode } from '@/composables/useEveningMode'

const { isActive, presentProfiles, toggle, toggleProfile } = useEveningMode()
</script>
