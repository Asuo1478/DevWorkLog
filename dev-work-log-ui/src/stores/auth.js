import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const initial = localStorage.getItem('auth_user') 
    ? JSON.parse(localStorage.getItem('auth_user'))
    : {
        id: null,
        name: '请登录系统',
        avatar: '',
        avatarChar: '?',
        email: '',
        department: '',
        identifier: '',
        job_desc: '',
        theme_color: 'primary'
      }

  const user = ref(initial)

  watch(user, (newVal) => {
    localStorage.setItem('auth_user', JSON.stringify(newVal))
  }, { deep: true })

  return { user }
})
