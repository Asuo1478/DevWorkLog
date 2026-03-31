<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDictionaryStore } from '../stores/dictionary'

const authStore = useAuthStore()
const dictionaryStore = useDictionaryStore()
const today = new Date()
const todayFormatted = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`
const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const entries = ref([])
const projectTags = ref([])
const shortcutTemplates = ref([])
const isSubmitting = ref(false)
const editingIndex = ref(-1)
const submitSuccessMessage = ref('')
const confirmModalVisible = ref(false)
const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const confirmModalAction = ref(null)

const shortcutModalVisible = ref(false)
const shortcutModalName = ref('')
const shortcutModalError = ref('')
const shortcutModalEntry = ref(null)

const defaultEntry = () => ({
  id: null,
  product: '预售营销',
  tagId: null,
  category: '需求开发',
  hours: 0,
  status: '进行中',
  desc: ''
})

const currentEntry = ref(defaultEntry())

const totalHours = computed(() => entries.value.reduce((sum, item) => sum + Number(item.hours || 0), 0))
const activeTagOptions = computed(() => projectTags.value.filter(tag => tag.status === '进行中'))
const selectedTag = computed(() => activeTagOptions.value.find(tag => Number(tag.tag_id) === Number(currentEntry.value.tagId)) || null)

const statusClassMap = {
  '进行中': 'bg-primary/10 text-primary border-primary/20',
  '已完成': 'bg-tertiary/10 text-tertiary border-tertiary/20',
  '已提测': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '已挂起': 'bg-error/10 text-error border-error/20',
  '已中断': 'bg-slate-200 text-slate-600 border-slate-300'
}

const ensureDefaultTag = () => {
  if (!activeTagOptions.value.length) {
    currentEntry.value.tagId = null
    return
  }

  const matched = activeTagOptions.value.some(tag => Number(tag.tag_id) === Number(currentEntry.value.tagId))
  if (!matched) {
    currentEntry.value.tagId = activeTagOptions.value[0].tag_id
  }
}

const ensureDefaultDictionary = () => {
  if (dictionaryStore.productTypes.length > 0 && !dictionaryStore.productTypes.some(p => p.dict_value === currentEntry.value.product)) {
    currentEntry.value.product = dictionaryStore.productTypes[0].dict_value
  }
  if (dictionaryStore.taskCategories.length > 0 && !dictionaryStore.taskCategories.some(c => c.dict_value === currentEntry.value.category)) {
    currentEntry.value.category = dictionaryStore.taskCategories[0].dict_value
  }
}

const fetchProjectTags = async () => {
  try {
    const res = await fetch('/api/v1/project-tags/planning?status=进行中')
    const json = await res.json()
    if (json.code === 200) {
      projectTags.value = json.data || []
      ensureDefaultTag()
    }
  } catch (error) {
    console.error(error)
  }
}

const projectProgress = (project) => {
  const budgetHours = Number(project.budget_hours || 0)
  const actualHours = Number(project.actual_hours || 0)
  if (!budgetHours || Number.isNaN(budgetHours)) return 0
  return Number(Math.min((actualHours / budgetHours) * 100, 100).toFixed(0))
}

const fetchShortcutTemplates = async () => {
  if (!authStore.user.id) return

  try {
    const res = await fetch(`/api/v1/work-logs?userId=${authStore.user.id}&isShortcut=1&limit=20`)
    const json = await res.json()
    if (json.code === 200) {
      shortcutTemplates.value = (json.data.list || []).map(item => ({
        id: item.id,
        title: item.shortcut_name || '快捷登记',
        hours: Number(item.work_hours || 0),
        desc: item.description || '',
        tagId: item.tag_id || null,
        category: item.task_category || currentEntry.value.category,
        product: item.product_type || currentEntry.value.product,
        status: item.status || currentEntry.value.status
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const buildShortcutName = (entry) => {
  const tagLabel = entry.tagName || activeTagOptions.value.find(tag => Number(tag.tag_id) === Number(entry.tagId))?.tag_name || ''
  if (tagLabel && entry.category) return `${tagLabel} ${entry.category}`
  if (tagLabel) return tagLabel
  if (entry.category) return entry.category
  return (entry.desc || '快捷登记').slice(0, 20)
}

const fetchLogs = async () => {
  if (!authStore.user.id) return

  try {
    const res = await fetch(`/api/v1/work-logs?startDate=${isoDate}&endDate=${isoDate}&userId=${authStore.user.id}&limit=100`)
    const json = await res.json()

    if (json.code === 200) {
      entries.value = json.data.list.map(item => {
        const projectTag = item.project_tag || item.ProjectTag || null

        return {
          id: item.id,
          tagId: item.tag_id,
          tagName: projectTag?.tag_name || '',
          product: item.product_type,
          category: item.task_category,
          hours: item.work_hours,
          isShortcut: Number(item.is_shortcut || 0),
          shortcutName: item.shortcut_name || '',
          status: item.status,
          desc: item.description || ''
        }
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const saveEntry = async () => {
  if (!currentEntry.value.desc || currentEntry.value.hours <= 0) return

  const payload = {
    user_id: authStore.user.id,
    tag_id: currentEntry.value.tagId || null,
    log_date: isoDate,
    product_type: currentEntry.value.product,
    task_category: currentEntry.value.category,
    work_hours: currentEntry.value.hours,
    description: currentEntry.value.desc,
    status: currentEntry.value.status
  }

  isSubmitting.value = true
  try {
    const isEditing = editingIndex.value > -1

    if (isEditing) {
      const dbId = entries.value[editingIndex.value].id
      await fetch(`/api/v1/work-logs/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      editingIndex.value = -1
    } else {
      await fetch('/api/v1/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    currentEntry.value = defaultEntry()
    ensureDefaultTag()
    await fetchLogs()
    submitSuccessMessage.value = isEditing ? '修改成功' : '新增成功'
    setTimeout(() => {
      submitSuccessMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

const editEntry = (index) => {
  const entry = entries.value[index]

  currentEntry.value = {
    id: entry.id,
    product: entry.product || '其他',
    tagId: entry.tagId || activeTagOptions.value[0]?.tag_id || null,
    category: entry.category,
    hours: Number(entry.hours),
    status: entry.status,
    desc: entry.desc
  }
  editingIndex.value = index
}

const cancelEdit = () => {
  currentEntry.value = defaultEntry()
  ensureDefaultTag()
  editingIndex.value = -1
}

const applyShortcut = (shortcut) => {
  editingIndex.value = -1
  currentEntry.value = {
    ...defaultEntry(),
    tagId: shortcut.tagId || currentEntry.value.tagId,
    product: shortcut.product || currentEntry.value.product,
    category: shortcut.category || currentEntry.value.category,
    hours: shortcut.hours,
    status: shortcut.status || currentEntry.value.status,
    desc: shortcut.desc || currentEntry.value.desc
  }
}

const openConfirmModal = (title, message, action) => {
  confirmModalTitle.value = title
  confirmModalMessage.value = message
  confirmModalAction.value = action
  confirmModalVisible.value = true
}

const closeConfirmModal = () => {
  confirmModalVisible.value = false
  confirmModalTitle.value = ''
  confirmModalMessage.value = ''
  confirmModalAction.value = null
}

const confirmModalSubmit = async () => {
  if (typeof confirmModalAction.value === 'function') {
    await confirmModalAction.value()
  }
  closeConfirmModal()
}

const removeEntry = async (index) => {
  openConfirmModal(
    '删除工作记录',
    '确认删除这条工作记录吗？',
    async () => {
      try {
        const dbId = entries.value[index].id
        await fetch(`/api/v1/work-logs/${dbId}`, { method: 'DELETE' })
        await fetchLogs()
      } catch (error) {
        console.error(error)
      }
    }
  )
}

const updateShortcutStatus = async (entry, isShortcut) => {
  try {
    await fetch(`/api/v1/work-logs/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_shortcut: isShortcut ? 1 : 0,
        shortcut_name: isShortcut ? (entry.shortcutName || buildShortcutName(entry)) : null
      })
    })
    await Promise.all([fetchLogs(), fetchShortcutTemplates()])
  } catch (error) {
    console.error(error)
  }
}

const addToShortcut = (entry) => {
  shortcutModalEntry.value = entry
  shortcutModalName.value = entry.shortcutName || buildShortcutName(entry)
  shortcutModalError.value = ''
  shortcutModalVisible.value = true
}

const closeShortcutModal = () => {
  shortcutModalVisible.value = false
  shortcutModalEntry.value = null
  shortcutModalName.value = ''
  shortcutModalError.value = ''
}

const submitShortcutModal = async () => {
  const trimmedName = shortcutModalName.value.trim()
  if (!trimmedName) {
    shortcutModalError.value = '快捷登记名称不能为空'
    return
  }

  const entry = shortcutModalEntry.value
  await fetch(`/api/v1/work-logs/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      is_shortcut: 1,
      shortcut_name: trimmedName
    })
  })
  await Promise.all([fetchLogs(), fetchShortcutTemplates()])
  closeShortcutModal()
}

const removeShortcut = async (shortcut) => {
  openConfirmModal(
    '移除快捷登记',
    `确认移除快捷登记“${shortcut.title}”吗？`,
    async () => {
      await updateShortcutStatus(shortcut, false)
    }
  )
}

const enforceOneDecimal = (event) => {
  const value = String(event.target.value)
  if (!value.includes('.')) return

  const parts = value.split('.')
  if (parts[1].length > 1) {
    event.target.value = `${parts[0]}.${parts[1].slice(0, 1)}`
    currentEntry.value.hours = Number(event.target.value)
  }
}

const exportData = () => {
  if (!authStore.user.id) return
  window.location.href = `/api/v1/work-logs/export?startDate=${isoDate}&endDate=${isoDate}&userId=${authStore.user.id}`
}

onMounted(async () => {
  fetchProjectTags()
  fetchShortcutTemplates()
  fetchLogs()
  await Promise.all([
    dictionaryStore.fetchDictionaryByType('PRODUCT_TYPE'),
    dictionaryStore.fetchDictionaryByType('TASK_CATEGORY')
  ])
  ensureDefaultDictionary()
})
</script>

<template>
  <div class="px-12 py-8 max-w-6xl mx-auto pb-32">
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 lg:col-span-3 space-y-6">
        <div class="p-6 rounded-xl bg-surface-container-low/50 shadow-sm flex flex-col gap-4 border border-outline-variant/10">
          <div>
            <span class="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-outline block mb-1">填报日期</span>
            <p class="font-headline text-xl font-bold text-on-surface whitespace-nowrap tracking-tight">{{ todayFormatted }}</p>
          </div>
          <div class="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div class="flex items-center gap-1.5 text-primary mb-2">
              <span class="material-symbols-outlined text-sm">info</span>
              <span class="text-[10px] font-bold uppercase tracking-wider">填报规范</span>
            </div>
            <ul class="text-[10px] space-y-1.5 text-on-surface-variant leading-relaxed">
              <li class="flex gap-1.5"><span>•</span> 每日工时建议：1.0 - 10.0h</li>
              <li class="flex gap-1.5"><span>•</span> 填报条目建议：不超过 5 条</li>
              <li class="flex gap-1.5"><span>•</span> 最小工时单位：0.5h</li>
            </ul>
          </div>
        </div>

        <div class="p-6 rounded-xl bg-primary text-on-primary shadow-xl relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <span class="material-symbols-outlined text-8xl">analytics</span>
          </div>
          <div class="flex justify-between items-center mb-4 relative z-10">
            <span class="px-2 py-1 bg-white/20 rounded md text-[10px] font-bold tracking-widest uppercase">当日合计</span>
          </div>
          <div class="flex items-baseline gap-2 relative z-10">
            <span class="text-5xl font-black font-manrope">{{ totalHours.toFixed(1) }}</span>
            <span class="text-lg font-medium opacity-70">h</span>
          </div>
          <div class="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative z-10">
            <div class="h-full bg-white transition-all duration-300" :style="`width: ${Math.min((totalHours / 10) * 100, 100)}%`"></div>
          </div>
        </div>

        <div class="p-6 rounded-xl bg-surface-container-low/60 shadow-sm border border-outline-variant/10">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-primary text-[18px]">deployed_code</span>
            <h4 class="font-headline text-base font-bold text-on-surface">活跃项目 Tag</h4>
          </div>
          <div class="space-y-3">
            <button
              v-for="tag in activeTagOptions"
              :key="tag.tag_id"
              @click="currentEntry.tagId = tag.tag_id"
              :class="[
                'w-full text-left rounded-xl border px-3 py-2.5 transition-all outline-none',
                Number(currentEntry.tagId) === Number(tag.tag_id)
                  ? 'bg-white border-primary/40 shadow-sm ring-1 ring-primary/10'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-primary/25'
              ]"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <span :class="['text-[13px] font-bold truncate flex-1', Number(currentEntry.tagId) === Number(tag.tag_id) ? 'text-primary' : 'text-on-surface']">
                  {{ tag.tag_name }}
                </span>
                <span class="text-[11px] font-bold text-primary tabular-nums shrink-0">
                  {{ projectProgress(tag) }}%
                </span>
              </div>
              <div class="h-1 rounded-full bg-surface-container overflow-hidden">
                <div
                  class="h-full bg-primary rounded-full transition-all duration-500"
                  :style="`width: ${projectProgress(tag)}%`"
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-9 space-y-6">
        <div class="p-8 rounded-xl bg-surface-container-lowest shadow-sm shadow-primary/5 hover:shadow-md transition-shadow border border-outline-variant/10 relative">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-xl"></div>

          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
              <h3 class="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">edit_square</span>
                {{ editingIndex > -1 ? '编辑工作项' : '添加新工作项' }}
              </h3>
            </div>
            <span v-if="entries.length >= 5 && editingIndex === -1" class="text-xs text-error font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">warning</span>
              条目数达到建议上限
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">关联产品</label>
              <select v-model="currentEntry.product" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
                <option v-for="item in dictionaryStore.productTypes" :key="item.id" :value="item.dict_value">{{ item.dict_label }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">任务类别</label>
              <select v-model="currentEntry.category" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
                <option v-for="item in dictionaryStore.taskCategories" :key="item.id" :value="item.dict_value">{{ item.dict_label }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">所属项目 TAG</label>
              <select v-model="currentEntry.tagId" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
                <option v-for="tag in activeTagOptions" :key="tag.tag_id" :value="tag.tag_id">{{ tag.tag_name }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">投入工时 (h) <span class="text-error">*</span></label>
              <div class="relative">
                <input v-model="currentEntry.hours" @input="enforceOneDecimal" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 font-bold text-on-surface outline-none transition-all" step="0.1" min="0" max="24" type="number" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">产出物状态</label>
              <select v-model="currentEntry.status" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
                <option>进行中</option>
                <option>已提测</option>
                <option>已挂起</option>
                <option>已完成</option>
                <option>已中断</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5 mb-6">
            <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">产出描述内容 <span class="text-error">*</span></label>
            <textarea v-model="currentEntry.desc" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 text-on-surface outline-none resize-none transition-all" placeholder="[功能模块] + [动作或结果描述]，请控制在简明扼要的长度" rows="3"></textarea>
          </div>

          <div class="flex justify-between items-center pt-2 h-10">
            <div class="text-tertiary text-xs font-bold px-3 py-1.5 bg-tertiary/10 rounded flex items-center gap-1.5 transition-opacity duration-300" :class="submitSuccessMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              {{ submitSuccessMessage }}
            </div>

            <div class="flex justify-end gap-3">
              <button v-if="editingIndex > -1" @click="cancelEdit" class="px-5 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors font-bold text-xs">
                取消编辑
              </button>
              <button 
                @click="saveEntry" 
                :disabled="isSubmitting || !currentEntry.desc || currentEntry.hours <= 0" 
                class="px-6 py-2.5 rounded-lg bg-on-surface text-surface font-bold text-xs shadow hover:bg-on-surface/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span v-if="isSubmitting" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span v-else class="material-symbols-outlined text-[16px]">save</span>
                {{ isSubmitting ? '保存中...' : (editingIndex > -1 ? '保存修改' : '确认添加项') }}
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/10">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2 shrink-0">
              <span class="material-symbols-outlined text-primary text-[17px]">bolt</span>
              <h3 class="font-headline text-xs font-bold text-on-surface">快捷登记</h3>
            </div>
            <div v-if="shortcutTemplates.length > 0" class="flex-1 min-w-0 flex flex-wrap gap-2">
              <div
                v-for="shortcut in shortcutTemplates"
                :key="shortcut.id"
                class="w-full md:w-auto inline-flex items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-low px-2 py-1"
              >
                <button
                  @click="applyShortcut(shortcut)"
                  class="inline-flex items-center gap-2 rounded-full px-1.5 py-0 text-left hover:bg-white transition-all"
                >
                  <span class="font-bold text-xs text-on-surface">{{ shortcut.title }}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0 rounded-full bg-primary/10 text-primary">{{ shortcut.hours }}h</span>
                </button>
                <button
                  @click="removeShortcut(shortcut)"
                  class="inline-flex h-4 w-4 items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error"
                  title="移除快捷登记"
                >
                  <span class="material-symbols-outlined text-[11px]">close</span>
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-on-surface-variant">
              当前无日志快捷引用，你可以通过“当日已填报记录”列表的⚡操作完成添加。
            </p>
          </div>
        </div>

        <div class="h-2"></div>

        <div v-if="entries.length > 0" class="space-y-2">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-label text-[11px] font-bold text-outline uppercase tracking-widest pl-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px]">list_alt</span>
              当日已填报记录 ({{ entries.length }})
            </h4>
            <button @click="exportData" class="flex items-center space-x-1 text-primary font-bold text-[11px] px-2.5 py-1 hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">
              <span class="material-symbols-outlined text-[14px]">download</span>
              <span>导出数据</span>
            </button>
          </div>

          <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
            <div class="divide-y divide-outline-variant/10">
              <div
                v-for="(item, index) in entries"
                :key="item.id"
                :class="[
                  'p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors group',
                  editingIndex === index ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-container-low border-l-4 border-transparent'
                ]"
              >
                <div class="hidden sm:flex w-6 h-6 shrink-0 rounded-full bg-surface-container-high items-center justify-center text-[10px] font-bold text-on-surface-variant font-mono">
                  {{ entries.length - index }}
                </div>

                <div class="flex-1 min-w-0 grid grid-cols-12 gap-2 sm:gap-3 items-center">
                  <div class="col-span-12 sm:col-span-4 flex flex-wrap items-center gap-1 shrink-0">
                    <span v-if="item.tagName" class="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded">{{ item.tagName }}</span>
                    <span class="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded">{{ item.product }}</span>
                    <span class="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-bold rounded">{{ item.category }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-6 text-sm text-on-surface line-clamp-2 sm:truncate leading-relaxed">
                    {{ item.desc }}
                  </div>
                  <div class="col-span-12 sm:col-span-2 flex flex-col items-end gap-1 shrink-0">
                    <div class="flex items-center gap-1 border-b border-outline-variant/10 pb-1 w-full justify-end text-outline/30">
                      <button
                        @click="addToShortcut(item)"
                        class="p-1 text-primary hover:bg-primary/10 rounded transition-colors flex items-center justify-center"
                        :title="item.isShortcut ? '已加入快捷登记' : '加入快捷登记'"
                      >
                        <span class="material-symbols-outlined text-[16px] font-bold">{{ item.isShortcut ? 'bolt' : 'offline_bolt' }}</span>
                      </button>
                      <span class="text-[9px] select-none">/</span>
                      <button @click="editEntry(index)" :disabled="editingIndex === index" class="p-1 text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-40 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <span class="text-[9px] select-none">/</span>
                      <button @click="removeEntry(index)" class="p-1 text-error hover:bg-error/10 rounded transition-colors flex items-center justify-center">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>

                    <div class="flex flex-col gap-0.5 items-end">
                      <span
                        :class="[
                          'text-[9px] border rounded px-1.5 py-0.5 w-fit font-bold whitespace-nowrap',
                          statusClassMap[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                        ]"
                      >
                        {{ item.status }}
                      </span>
                      <span class="text-[11px] font-bold text-primary font-mono bg-white px-1.5 py-0 rounded border border-outline-variant/10 shadow-sm whitespace-nowrap">
                        {{ Number(item.hours).toFixed(1) }}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="confirmModalVisible" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/35 backdrop-blur-[1px]" @click="closeConfirmModal"></div>
    <div class="relative w-full max-w-[560px] rounded-[28px] bg-white shadow-2xl overflow-hidden">
      <div class="px-10 pt-10 pb-8">
        <h3 class="text-[18px] font-bold text-[#c81e1e]">{{ confirmModalTitle }}</h3>
        <p class="mt-6 text-[15px] leading-7 text-on-surface-variant">{{ confirmModalMessage }}</p>
      </div>
      <div class="px-10 pb-8 flex justify-end gap-4">
        <button
          @click="closeConfirmModal"
          class="min-w-[108px] rounded-[18px] bg-surface-container-low px-6 py-3 text-[15px] font-bold text-on-surface-variant hover:bg-surface-container"
        >
          取消
        </button>
        <button
          @click="confirmModalSubmit"
          class="min-w-[108px] rounded-[18px] bg-[#c81e1e] px-6 py-3 text-[15px] font-bold text-white hover:opacity-95"
        >
          删除
        </button>
      </div>
    </div>
  </div>

  <div v-if="shortcutModalVisible" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/35 backdrop-blur-[1px]" @click="closeShortcutModal"></div>
    <div class="relative w-full max-w-[520px] rounded-[24px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div class="px-8 pt-8 pb-6">
        <div class="flex items-center gap-3 mb-4 font-headline">
          <span class="material-symbols-outlined text-primary text-xl">bolt</span>
          <h3 class="text-[18px] font-bold text-on-surface">存为快捷登记</h3>
        </div>
        <p class="text-[13px] text-on-surface-variant mb-5 leading-relaxed">
          您可以为该工作项设置一个名称，方便日后一键填报。
        </p>
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-outline px-1">描述名称</label>
          <input 
            v-model="shortcutModalName"
            type="text" 
            class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
            placeholder="例如：系统日常巡检"
            @keyup.enter="submitShortcutModal"
          />
          <p v-if="shortcutModalError" class="text-xs text-error font-bold px-1 mt-1">{{ shortcutModalError }}</p>
        </div>
      </div>
      <div class="px-8 pb-8 flex justify-end gap-3">
        <button
          @click="closeShortcutModal"
          class="min-w-[96px] rounded-[16px] bg-surface-container-low px-5 py-2.5 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          取消
        </button>
        <button
          @click="submitShortcutModal"
          class="min-w-[110px] rounded-[16px] bg-on-surface px-5 py-2.5 text-[14px] font-bold text-surface hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span class="material-symbols-outlined text-lg">check</span>
          确认添加
        </button>
      </div>
    </div>
  </div>
</template>


