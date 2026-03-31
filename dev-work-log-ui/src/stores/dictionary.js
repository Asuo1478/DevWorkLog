import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useDictionaryStore = defineStore('dictionary', () => {
  const authStore = useAuthStore()
  const productTypes = ref([])
  const taskCategories = ref([])
  const allDictionaries = ref([])

  const fetchDictionaryByType = async (type) => {
    try {
      const res = await fetch(`/api/v1/dictionaries/list?type=${type}`)
      const json = await res.json()
      if (json.code === 200) {
        if (type === 'PRODUCT_TYPE') productTypes.value = json.data
        if (type === 'TASK_CATEGORY') taskCategories.value = json.data
      }
    } catch (error) {
      console.error(`Failed to fetch dictionary ${type}:`, error)
    }
  }

  const fetchAllDictionaries = async () => {
    try {
      const res = await fetch('/api/v1/dictionaries/all', {
        headers: {
          'x-user-username': authStore.user.identifier
        }
      })
      const json = await res.json()
      if (json.code === 200) {
        allDictionaries.value = json.data
      }
    } catch (error) {
      console.error('Failed to fetch all dictionaries:', error)
    }
  }

  const saveDictionaryItem = async (item) => {
    const isEdit = !!item.id
    const url = isEdit ? `/api/v1/dictionaries/${item.id}` : '/api/v1/dictionaries'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-username': authStore.user.identifier
        },
        body: JSON.stringify(item)
      })
      const json = await res.json()
      if (json.code === 200) {
        await fetchAllDictionaries()
        return { success: true }
      }
      return { success: false, msg: json.msg }
    } catch (error) {
      return { success: false, msg: error.message }
    }
  }

  const deleteDictionaryItem = async (id) => {
    try {
      const res = await fetch(`/api/v1/dictionaries/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-username': authStore.user.identifier
        }
      })
      const json = await res.json()
      if (json.code === 200) {
        await fetchAllDictionaries()
        return { success: true }
      }
      return { success: false, msg: json.msg }
    } catch (error) {
      return { success: false, msg: error.message }
    }
  }

  return {
    productTypes,
    taskCategories,
    allDictionaries,
    fetchDictionaryByType,
    fetchAllDictionaries,
    saveDictionaryItem,
    deleteDictionaryItem
  }
})
