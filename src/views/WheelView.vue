<template>
  <div class="min-h-screen bg-gray-50 pb-20 flex flex-col">
    <div class="max-w-4xl mx-auto w-full px-4 pt-4 flex-1">
      <h1 class="text-2xl font-bold mb-4">Roue de décision</h1>

      <div class="md:flex md:gap-6">
        <!-- Candidate list -->
        <div class="md:w-72 mb-4 md:mb-0">
          <CandidateList />
        </div>

        <!-- Wheel -->
        <div class="flex-1 flex flex-col items-center gap-4">
          <DecisionWheel :candidates="candidates" :is-spinning="isSpinning" :result="result" />
          <button
            class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
            :disabled="candidates.length === 0 || isSpinning"
            @click="spin()"
          >
            {{ isSpinning ? 'En cours…' : 'Tourner !' }}
          </button>
          <div v-if="result" class="text-center bg-white rounded-xl shadow p-4 w-full max-w-xs">
            <p class="text-xs text-gray-500 mb-1">Résultat :</p>
            <p class="font-bold text-lg text-indigo-700">{{ result.nom }}</p>
            <router-link :to="`/game/${result.id}`" class="text-xs text-indigo-500 hover:underline">
              Voir la fiche →
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { useWheel } from '@/composables/useWheel'
import DecisionWheel from '@/components/wheel/DecisionWheel.vue'
import CandidateList from '@/components/wheel/CandidateList.vue'
import AppNav from '@/components/layout/AppNav.vue'

const { candidates, result, isSpinning, spin } = useWheel()
</script>
