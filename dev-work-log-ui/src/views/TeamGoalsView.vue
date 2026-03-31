<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const now = new Date()
const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const activeTab = ref('resource-plan')
const selectedMonth = ref(currentMonthValue)

const goalDefines = ref([])
const resourcePlanList = ref([])
const resourcePlanStatus = reactive({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  has_config: true,
  count: 0
})
const resourcePlanSummary = reactive({
  total_weight: 0,
  total_budget_days: 0,
  total_occupied_days: 0
})

const listLoading = ref(false)
const resourceLoading = ref(false)
const submitting = ref(false)
const initLoading = ref(false)
const resourceSubmitting = ref(false)

const dialogMode = ref('create')
const detailVisible = ref(false)
const formVisible = ref(false)
const deleteVisible = ref(false)
const currentGoal = ref(null)

const resourceEditVisible = ref(false)
const currentResourcePlan = ref(null)
const resourcePlanForm = reactive({
  weight: '',
  budget_days: ''
})

const goalForm = reactive({
  goal_name: '',
  goal_desc: '',
  sort_no: 0,
  status: 1
})

const monthLabel = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  return `${year}年${Number(month)}月`
})

const currentPlanMonthLabel = computed(() => `${resourcePlanStatus.year}年${resourcePlanStatus.month}月`)
const canShowInitButton = computed(() => !resourcePlanStatus.has_config)

const sortedGoalDefines = computed(() => {
  return [...goalDefines.value].sort((a, b) => {
    if (Number(a.sort_no) !== Number(b.sort_no)) return Number(a.sort_no) - Number(b.sort_no)
    return Number(a.goal_id) - Number(b.goal_id)
  })
})

const nextSortNo = computed(() => {
  return sortedGoalDefines.value.length
    ? Math.max(...sortedGoalDefines.value.map((item) => Number(item.sort_no || 0))) + 10
    : 10
})

const statusText = (status) => (Number(status) === 1 ? '启用' : '停用')

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  const json = await response.json()

  if (json.code !== 200) {
    throw new Error(json.msg || '请求失败')
  }

  return json.data
}

const loadGoalDefines = async () => {
  listLoading.value = true
  try {
    goalDefines.value = await requestJson('/api/v1/goal-defines')
  } catch (error) {
    alert(error.message || '目标分类加载失败')
  } finally {
    listLoading.value = false
  }
}

const loadResourcePlanStatus = async () => {
  try {
    const data = await requestJson('/api/v1/goal-defines/resource-plan/current-month-status')
    resourcePlanStatus.year = Number(data.year || resourcePlanStatus.year)
    resourcePlanStatus.month = Number(data.month || resourcePlanStatus.month)
    resourcePlanStatus.has_config = Boolean(data.has_config)
    resourcePlanStatus.count = Number(data.count || 0)
  } catch (error) {
    alert(error.message || '本月资源规划状态加载失败')
  }
}

const loadResourcePlan = async () => {
  resourceLoading.value = true
  try {
    const data = await requestJson(`/api/v1/goal-defines/resource-plan?month=${selectedMonth.value}`)
    resourcePlanList.value = data.list || []
    resourcePlanSummary.total_weight = Number(data.summary?.total_weight || 0)
    resourcePlanSummary.total_budget_days = Number(data.summary?.total_budget_days || 0)
    resourcePlanSummary.total_occupied_days = Number(data.summary?.total_occupied_days || 0)
    selectedMonth.value = data.month || selectedMonth.value
  } catch (error) {
    resourcePlanList.value = []
    resourcePlanSummary.total_weight = 0
    resourcePlanSummary.total_budget_days = 0
    resourcePlanSummary.total_occupied_days = 0
    alert(error.message || '月度资源规划加载失败')
  } finally {
    resourceLoading.value = false
  }
}

const resetForm = () => {
  goalForm.goal_name = ''
  goalForm.goal_desc = ''
  goalForm.sort_no = nextSortNo.value
  goalForm.status = 1
}

const fillForm = (goal) => {
  goalForm.goal_name = goal.goal_name || ''
  goalForm.goal_desc = goal.goal_desc || ''
  goalForm.sort_no = Number(goal.sort_no || 0)
  goalForm.status = Number(goal.status ?? 1)
}

const fillResourcePlanForm = (config) => {
  resourcePlanForm.weight = Number(config.weight || 0)
  resourcePlanForm.budget_days = Number(config.budget_days || 0)
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  currentGoal.value = null
  resetForm()
  formVisible.value = true
}

const openDetailDialog = async (goal) => {
  try {
    currentGoal.value = await requestJson(`/api/v1/goal-defines/${goal.goal_id}`)
    detailVisible.value = true
  } catch (error) {
    alert(error.message || '详情加载失败')
  }
}

const openEditDialog = (goal) => {
  dialogMode.value = 'edit'
  currentGoal.value = goal
  fillForm(goal)
  formVisible.value = true
}

const openDeleteDialog = (goal) => {
  currentGoal.value = goal
  deleteVisible.value = true
}

const openResourceEditDialog = (config) => {
  currentResourcePlan.value = config
  fillResourcePlanForm(config)
  resourceEditVisible.value = true
}

const closeFormDialog = () => {
  if (submitting.value) return
  formVisible.value = false
}

const closeResourceEditDialog = () => {
  if (resourceSubmitting.value) return
  resourceEditVisible.value = false
}

const submitGoalForm = async () => {
  if (!goalForm.goal_name.trim() || submitting.value) return

  submitting.value = true

  try {
    const payload = {
      goal_name: goalForm.goal_name.trim(),
      goal_desc: goalForm.goal_desc.trim(),
      sort_no: Number(goalForm.sort_no || 0),
      status: Number(goalForm.status),
      user_id: authStore.user.id || null
    }

    const url = dialogMode.value === 'create'
      ? '/api/v1/goal-defines'
      : `/api/v1/goal-defines/${currentGoal.value.goal_id}`

    const method = dialogMode.value === 'create' ? 'POST' : 'PUT'

    await requestJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    formVisible.value = false
    await Promise.all([loadGoalDefines(), loadResourcePlan()])
  } catch (error) {
    alert(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const submitResourcePlanForm = async () => {
  if (!currentResourcePlan.value || resourceSubmitting.value) return

  resourceSubmitting.value = true

  try {
    await requestJson(`/api/v1/goal-defines/resource-plan/${currentResourcePlan.value.config_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight: Number(resourcePlanForm.weight || 0),
        budget_days: Number(resourcePlanForm.budget_days || 0),
        user_id: authStore.user.id || null
      })
    })

    resourceEditVisible.value = false
    await loadResourcePlan()
  } catch (error) {
    alert(error.message || '月度资源规划保存失败')
  } finally {
    resourceSubmitting.value = false
  }
}

const initCurrentMonthResourcePlan = async () => {
  if (initLoading.value) return

  initLoading.value = true

  try {
    await requestJson('/api/v1/goal-defines/resource-plan/init-current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: authStore.user.id || null
      })
    })

    selectedMonth.value = currentMonthValue
    await Promise.all([loadResourcePlanStatus(), loadResourcePlan()])
  } catch (error) {
    alert(error.message || '本月资源规划初始化失败')
  } finally {
    initLoading.value = false
  }
}

const toggleStatus = async (goal) => {
  const nextStatus = Number(goal.status) === 1 ? 0 : 1

  try {
    await requestJson(`/api/v1/goal-defines/${goal.goal_id}/toggle-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: nextStatus,
        user_id: authStore.user.id || null
      })
    })

    goal.status = nextStatus
    await loadResourcePlan()
  } catch (error) {
    alert(error.message || '状态更新失败')
  }
}

const confirmDelete = async () => {
  if (!currentGoal.value || submitting.value) return

  submitting.value = true

  try {
    await requestJson(`/api/v1/goal-defines/${currentGoal.value.goal_id}`, {
      method: 'DELETE'
    })

    deleteVisible.value = false
    currentGoal.value = null
    await Promise.all([loadGoalDefines(), loadResourcePlan(), loadResourcePlanStatus()])
  } catch (error) {
    alert(error.message || '删除失败')
  } finally {
    submitting.value = false
  }
}

watch(selectedMonth, () => {
  loadResourcePlan()
})

onMounted(async () => {
  await Promise.all([loadGoalDefines(), loadResourcePlanStatus(), loadResourcePlan()])
})
</script>

<template>
  <div class="px-8 py-8 space-y-8">
    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-[0_12px_32px_rgba(0,72,141,0.04)] overflow-hidden">
      <div class="px-6 py-5 border-b border-outline-variant/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="inline-flex p-1 bg-surface-container-low rounded-xl self-start">
          <button
            v-for="tab in [
              { key: 'resource-plan', label: '月度资源规划' },
              { key: 'goal-define', label: '目标分类管理' }
            ]"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'px-5 py-2.5 rounded-lg text-sm font-bold transition-all',
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/70'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <button
          v-if="canShowInitButton"
          type="button"
          @click="initCurrentMonthResourcePlan"
          class="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-bold shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-50 self-start lg:self-center"
          :disabled="initLoading"
        >
          <span class="material-symbols-outlined text-base">calendar_month</span>
          月度资源规划
        </button>
      </div>

      <div v-if="activeTab === 'resource-plan'" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-surface-container-low rounded-xl px-5 py-4 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">规划月份</p>
            <h4 class="text-xl font-manrope font-extrabold text-primary">{{ monthLabel }}</h4>
          </div>
          <div class="bg-surface-container-low rounded-xl px-5 py-4 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">总权重</p>
            <h4 class="text-xl font-manrope font-extrabold text-on-surface">
              {{ resourcePlanSummary.total_weight }}%
            </h4>
          </div>
          <div class="bg-surface-container-low rounded-xl px-5 py-4 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">总预算人天</p>
            <h4 class="text-xl font-manrope font-extrabold text-on-surface">
              {{ resourcePlanSummary.total_budget_days }}
            </h4>
          </div>
          <div class="bg-surface-container-low rounded-xl px-5 py-4 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">项目&任务预算占用</p>
            <h4 class="text-xl font-manrope font-extrabold text-on-surface">{{ resourcePlanSummary.total_occupied_days }}</h4>
          </div>
        </div>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-on-surface">月度资源规划表</h4>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">月份</label>
            <input
              v-model="selectedMonth"
              type="month"
              class="bg-surface-container-low border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface outline-none"
            />
          </div>
        </div>

        <div v-if="resourceLoading" class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-10 text-center text-sm text-on-surface-variant">
          月度资源规划加载中...
        </div>

        <div v-else-if="!resourcePlanList.length" class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-10 text-center text-sm text-on-surface-variant">
          当前月份暂无月度资源规划数据
        </div>

        <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div
            v-for="config in resourcePlanList"
            :key="config.config_id"
            class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden"
          >
            <div class="px-5 py-4 flex justify-between items-start gap-4 border-b border-outline-variant/10">
              <div class="min-w-0">
                <h5 class="text-base font-bold text-primary truncate">{{ config.goal_name }}</h5>
                <p class="text-sm text-on-surface-variant mt-1 line-clamp-2">{{ config.goal_desc || '-' }}</p>
              </div>
              <button
                type="button"
                @click="openResourceEditDialog(config)"
                class="h-10 w-10 shrink-0 rounded-full bg-primary/8 text-primary inline-flex items-center justify-center hover:bg-primary/12"
                aria-label="编辑月度资源规划"
              >
                <span class="material-symbols-outlined text-[20px]">edit</span>
              </button>
            </div>

            <div class="px-5 py-4 space-y-4">
              <div class="space-y-2 text-sm text-on-surface">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="font-semibold">月度权重{{ config.weight }}%</span>
                  <span class="text-on-surface-variant">|</span>
                  <span class="font-semibold">预算人天{{ config.budget_days }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="font-semibold">关联Tag数{{ config.tag_count }}</span>
                  <span class="text-on-surface-variant">|</span>
                  <span :class="['font-semibold', config.remaining_days < 0 ? 'text-error' : 'text-on-surface']">
                    剩余预算人天{{ config.remaining_days }}
                  </span>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1.5">
                  <span>项目&任务预算占用</span>
                  <span>{{ config.occupied_days }} / {{ config.budget_days }} 人天</span>
                </div>
                <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="`width: ${config.budget_days > 0 ? Math.min((config.occupied_days / config.budget_days) * 100, 100) : 0}%`"
                  ></div>
                </div>
              </div>

              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">关联项目&任务</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tagName in config.related_tag_names"
                    :key="tagName"
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-primary border border-primary/10"
                  >
                    {{ tagName }}
                  </span>
                  <span v-if="!config.related_tag_names.length" class="text-xs text-on-surface-variant">
                    暂无关联项目&任务
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-6 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-on-surface">目标分类管理</h4>
          </div>
          <button
            type="button"
            @click="openCreateDialog"
            class="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-bold shadow-sm hover:opacity-95 active:scale-[0.99] self-start"
          >
            <span class="material-symbols-outlined text-base">add</span>
            新增
          </button>
        </div>

        <div v-if="listLoading" class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-10 text-center text-sm text-on-surface-variant">
          目标分类加载中...
        </div>

        <div v-else class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr class="bg-surface-container-low/70">
                  <th class="px-6 py-4 min-w-[280px] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">目标名称</th>
                  <th class="px-6 py-4 min-w-[360px] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">目标说明</th>
                  <th class="px-6 py-4 min-w-[100px] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">排序</th>
                  <th class="px-6 py-4 min-w-[140px] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">状态</th>
                  <th class="px-6 py-4 min-w-[220px] text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">操作</th>
                </tr>
              </thead>
              <tbody v-if="sortedGoalDefines.length" class="divide-y divide-outline-variant/10">
                <tr v-for="goal in sortedGoalDefines" :key="goal.goal_id" class="hover:bg-surface-container-low/40 transition-colors">
                  <td class="px-6 py-4"><p class="font-bold text-on-surface">{{ goal.goal_name }}</p></td>
                  <td class="px-6 py-4 text-sm text-on-surface-variant">{{ goal.goal_desc || '-' }}</td>
                  <td class="px-6 py-4 text-sm font-manrope font-bold text-on-surface">{{ goal.sort_no }}</td>
                  <td class="px-6 py-4">
                    <button
                      type="button"
                      @click="toggleStatus(goal)"
                      :class="[
                        'relative inline-flex h-7 w-14 items-center rounded-full transition-colors',
                        Number(goal.status) === 1 ? 'bg-green-600' : 'bg-outline/30'
                      ]"
                      :aria-label="Number(goal.status) === 1 ? '停用目标分类' : '启用目标分类'"
                    >
                      <span
                        :class="[
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                          Number(goal.status) === 1 ? 'translate-x-8' : 'translate-x-1'
                        ]"
                      ></span>
                    </button>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button type="button" @click="openDetailDialog(goal)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-low text-on-surface-variant hover:text-primary">详情</button>
                      <button type="button" @click="openEditDialog(goal)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/15">编辑</button>
                      <button type="button" @click="openDeleteDialog(goal)" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-error/10 text-error hover:bg-error/15">删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="5" class="px-6 py-10 text-center text-sm text-on-surface-variant">暂无目标分类数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <div v-if="formVisible" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-primary">{{ dialogMode === 'create' ? '新增目标分类' : '编辑目标分类' }}</h4>
          </div>
          <button type="button" @click="closeFormDialog" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">目标名称</span>
            <input v-model="goalForm.goal_name" type="text" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入目标名称" />
          </label>

          <label class="block">
            <span class="text-sm font-bold text-on-surface">排序</span>
            <input v-model="goalForm.sort_no" type="number" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入排序号" />
          </label>

          <label class="block">
            <span class="text-sm font-bold text-on-surface">状态</span>
            <select v-model="goalForm.status" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30">
              <option :value="1">启用</option>
              <option :value="0">停用</option>
            </select>
          </label>

          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">目标说明</span>
            <textarea v-model="goalForm.goal_desc" rows="4" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none resize-none focus:border-primary/30" placeholder="请输入目标说明"></textarea>
          </label>
        </div>

        <div class="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button type="button" @click="closeFormDialog" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-surface-container-low text-on-surface-variant">取消</button>
          <button type="button" @click="submitGoalForm" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50" :disabled="!goalForm.goal_name.trim() || submitting">保存</button>
        </div>
      </div>
    </div>

    <div v-if="resourceEditVisible && currentResourcePlan" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-primary">编辑月度资源规划</h4>
          </div>
          <button type="button" @click="closeResourceEditDialog" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="px-6 py-5 space-y-5">
          <div class="rounded-2xl bg-surface-container-low px-5 py-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h5 class="text-base font-bold text-primary truncate">{{ currentResourcePlan.goal_name }}</h5>
                <p class="text-sm text-on-surface-variant mt-1 line-clamp-2">{{ currentResourcePlan.goal_desc || '-' }}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary shrink-0">{{ currentPlanMonthLabel }}</span>
            </div>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-white px-4 py-3 border border-outline-variant/10">
                <p class="text-on-surface-variant">关联项目&任务数</p>
                <p class="mt-1 font-bold text-on-surface">{{ currentResourcePlan.tag_count }}</p>
              </div>
              <div class="rounded-xl bg-white px-4 py-3 border border-outline-variant/10">
                <p class="text-on-surface-variant">项目&任务预算占用</p>
                <p class="mt-1 font-bold text-on-surface">{{ currentResourcePlan.occupied_days }} 人天</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label class="block">
              <span class="text-sm font-bold text-on-surface">权重</span>
              <input v-model="resourcePlanForm.weight" type="number" step="0.01" min="0" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入权重" />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-on-surface">预算人天</span>
              <input v-model="resourcePlanForm.budget_days" type="number" step="0.01" min="0" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入预算人天" />
            </label>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button type="button" @click="closeResourceEditDialog" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-surface-container-low text-on-surface-variant">取消</button>
          <button type="button" @click="submitResourcePlanForm" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50" :disabled="resourceSubmitting">保存</button>
        </div>
      </div>
    </div>

    <div v-if="detailVisible && currentGoal" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-primary">目标分类详情</h4>
          </div>
          <button type="button" @click="detailVisible = false" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2">
            <span class="text-sm font-bold text-on-surface">目标名称</span>
            <div class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">{{ currentGoal.goal_name }}</div>
          </div>
          <div>
            <span class="text-sm font-bold text-on-surface">排序</span>
            <div class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">{{ currentGoal.sort_no }}</div>
          </div>
          <div>
            <span class="text-sm font-bold text-on-surface">状态</span>
            <div class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">{{ statusText(currentGoal.status) }}</div>
          </div>
          <div class="md:col-span-2">
            <span class="text-sm font-bold text-on-surface">目标说明</span>
            <div class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed min-h-[112px]">{{ currentGoal.goal_desc || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="deleteVisible && currentGoal" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5">
          <h4 class="font-manrope text-lg font-bold text-error">删除目标分类</h4>
          <p class="text-sm text-on-surface-variant mt-2 leading-relaxed">确认删除目标分类“{{ currentGoal.goal_name }}”吗？</p>
        </div>
        <div class="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button type="button" @click="deleteVisible = false" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-surface-container-low text-on-surface-variant">取消</button>
          <button type="button" @click="confirmDelete" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-error text-white" :disabled="submitting">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
