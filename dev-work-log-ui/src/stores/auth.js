import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

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

  const isAdmin = computed(() => user.value.identifier === 'jhtadmin')

  const logout = () => {
    user.value = {
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
    localStorage.removeItem('auth_user')
  }

  watch(user, (newVal) => {
    localStorage.setItem('auth_user', JSON.stringify(newVal))
  }, { deep: true })

  return { user, logout, isAdmin }
})
