import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { PROFILES, type Profile } from '@/domain/Profile'

const LS_KEY = 'bredy_ludo_profile'

export const useProfileStore = defineStore('profile', () => {
  const storedRaw = localStorage.getItem(LS_KEY)
  const stored = storedRaw && (PROFILES as readonly string[]).includes(storedRaw)
    ? storedRaw as Profile
    : null

  const activeProfile = ref<Profile | null>(stored)

  watch(activeProfile, (val) => {
    if (val) localStorage.setItem(LS_KEY, val)
    else localStorage.removeItem(LS_KEY)
  })

  function setProfile(profile: Profile | null) {
    activeProfile.value = profile
  }

  return { activeProfile, setProfile }
})
