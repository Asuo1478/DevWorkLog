<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const activeTab = ref('weekly-plan')
const keyword = ref('')
const statusFilter = ref('全部状态')
const dateRange = ref(null)

const goalOverviewLoading = ref(false)
const goalOverviewList = ref([])
const projectTagsLoading = ref(false)
const projectTags = ref([])

const weeklyTasks = ref([
  {
    task_id: 2001,
    user_id: 1,
    user_name: '张伟',
    tag_id: 1002,
    tag_name: '预售营销3.0',
    plan_name: '预售配置台联调优化',
    year: 2026,
    month: 3,
    week: 4,
    week_start_date: '2026-03-23',
    week_end_date: '2026-03-29',
    p_hours: 18,
    task_content: '完成预售配置台筛选器改造、订单看板联调、权限细节修正',
    task_status: '进行中',
    completion_rate: 64
  },
  {
    task_id: 2002,
    user_id: 2,
    user_name: '李芳',
    tag_id: 1001,
    tag_name: '会展信息化2.0',
    plan_name: '报名支付链路联调',
    year: 2026,
    month: 3,
    week: 4,
    week_start_date: '2026-03-23',
    week_end_date: '2026-03-29',
    p_hours: 20,
    task_content: '推进报名页接口联调、导出功能联调与异常提示修复',
    task_status: '进行中',
    completion_rate: 58
  },
  {
    task_id: 2003,
    user_id: 3,
    user_name: '王磊',
    tag_id: 1003,
    tag_name: '线上环境巡检优化',
    plan_name: '巡检规则沉淀',
    year: 2026,
    month: 3,
    week: 4,
    week_start_date: '2026-03-23',
    week_end_date: '2026-03-29',
    p_hours: 10,
    task_content: '巡检项补齐、告警规则验证、周报模板沉淀',
    task_status: '已完成',
    completion_rate: 100
  },
  {
    task_id: 2004,
    user_id: 1,
    user_name: '张伟',
    tag_id: 1004,
    tag_name: '研发周会与知识库沉淀',
    plan_name: '知识库规范更新',
    year: 2026,
    month: 3,
    week: 4,
    week_start_date: '2026-03-23',
    week_end_date: '2026-03-29',
    p_hours: 6,
    task_content: '完成本周复盘纪要、知识库整理与规范更新',
    task_status: '待启动',
    completion_rate: 15
  }
])

const tabs = [
  { key: 'weekly-plan', label: '周计划' },
  { key: 'project-manage', label: '项目&任务管理' }
]

const statusOptions = ['全部状态', '待启动', '进行中', '已完成', '已关闭']
const projectStatusOptions = ['待启动', '进行中', '已完成', '已关闭']

const keywordPlaceholder = computed(() => (
  activeTab.value === 'weekly-plan' ? '请输入计划名称' : '请输入项目或任务名称'
))

const goalOverviewCount = computed(() => goalOverviewList.value.length)
const currentMonth = new Date().getMonth() + 1

const formatDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const dateRangeDisplay = computed(() => {
  if (!dateRange.value) return ''
  if (Array.isArray(dateRange.value)) {
    const start = formatDate(dateRange.value[0])
    const end = formatDate(dateRange.value[1])
    if (start && end) return `${start} 至 ${end}`
    return start
  }
  return formatDate(dateRange.value)
})

const inRange = (startDate, endDate) => {
  if (!dateRange.value) return true
  const targetStart = new Date(startDate)
  const targetEnd = new Date(endDate)

  if (Array.isArray(dateRange.value)) {
    const [selectedStart, selectedEnd] = dateRange.value
    if (!selectedStart || !selectedEnd) return true
    return targetEnd >= selectedStart && targetStart <= selectedEnd
  }

  return targetStart <= dateRange.value && targetEnd >= dateRange.value
}

const filteredWeeklyTasks = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return weeklyTasks.value.filter((task) => {
    const matchedKeyword = !kw || [
      task.plan_name,
      task.task_content,
      task.tag_name,
      task.user_name
    ].some((item) => String(item || '').toLowerCase().includes(kw))

    const matchedStatus = statusFilter.value === '全部状态' || task.task_status === statusFilter.value
    const matchedDate = inRange(task.week_start_date, task.week_end_date)
    return matchedKeyword && matchedStatus && matchedDate
  })
})

const totalPlanHours = computed(() => filteredWeeklyTasks.value.reduce((sum, item) => sum + Number(item.p_hours || 0), 0))
const completedWeeklyTasks = computed(() => filteredWeeklyTasks.value.filter((item) => item.task_status === '已完成').length)

const getStatusStyle = (status) => {
  if (status === '待启动') return 'bg-yellow-100 text-yellow-700'
  if (status === '进行中') return 'bg-primary/10 text-primary'
  if (status === '已完成') return 'bg-green-100 text-green-700'
  if (status === '已关闭') return 'bg-slate-200 text-slate-600'
  return 'bg-surface-container text-on-surface-variant'
}

const parseProjectTag = (item) => ({
  tag_id: item.tag_id,
  tag_name: item.tag_name,
  tag_desc: item.tag_desc || '',
  goal_id: item.goal_id,
  goal_name: item.goal_name || '-',
  goal_desc: item.goal_desc || '',
  start_date: formatDate(item.start_date),
  end_date: formatDate(item.end_date),
  budget_days: Number(item.budget_days || 0),
  budget_hours: Number(item.budget_hours || 0),
  status: item.status || '待启动',
  progress_rate: Number(item.progress_rate || 0),
  actual_hours: Number(item.actual_hours || 0),
  create_time: formatDate(item.create_time)
})

const fetchGoalOverview = async () => {
  goalOverviewLoading.value = true
  try {
    const res = await fetch(`/api/v1/goal-defines/current-month-overview?month=${currentMonth}`)
    const json = await res.json()
    goalOverviewList.value = json.code === 200 ? (json.data?.list || []) : []
  } catch (error) {
    console.error('获取当前月目标概览失败', error)
    goalOverviewList.value = []
  } finally {
    goalOverviewLoading.value = false
  }
}

const fetchProjectTags = async () => {
  projectTagsLoading.value = true
  try {
    const params = new URLSearchParams()
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    if (statusFilter.value !== '全部状态') params.set('status', statusFilter.value)
    if (Array.isArray(dateRange.value) && dateRange.value[0] && dateRange.value[1]) {
      params.set('start_date', formatDate(dateRange.value[0]))
      params.set('end_date', formatDate(dateRange.value[1]))
    }

    const query = params.toString()
    const res = await fetch(`/api/v1/project-tags/planning${query ? `?${query}` : ''}`)
    const json = await res.json()
    projectTags.value = json.code === 200 ? (json.data || []).map(parseProjectTag) : []
  } catch (error) {
    console.error('获取项目&任务管理列表失败', error)
    projectTags.value = []
  } finally {
    projectTagsLoading.value = false
  }
}

const deviationText = (project) => {
  if (project.actual_hours === null || Number.isNaN(Number(project.actual_hours))) return null
  return Number((Number(project.budget_hours || 0) - Number(project.actual_hours || 0)).toFixed(1))
}

const clearDateRange = () => {
  dateRange.value = null
}

const openGoalPlanning = (goal) => {
  activeTab.value = 'project-manage'
  keyword.value = goal.goal_name || ''
  statusFilter.value = '全部状态'
  dateRange.value = null
}

onMounted(() => {
  fetchGoalOverview()
  fetchProjectTags()
})

watch([keyword, statusFilter, dateRange], () => {
  if (activeTab.value === 'project-manage') {
    fetchProjectTags()
  }
}, { deep: true })
</script>

<template>
  <div class="px-8 py-8 space-y-8">
    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-[0_12px_32px_rgba(0,72,141,0.04)] overflow-hidden">
      <div class="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="inline-flex p-1 bg-surface-container-low rounded-xl self-start">
            <button
              v-for="tab in tabs"
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

          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end xl:flex-1 xl:pl-20 xl:gap-4">
            <input
              v-model="keyword"
              type="text"
              :placeholder="keywordPlaceholder"
              class="w-full xl:w-[220px] bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70"
            />

            <VueDatePicker
              v-model="dateRange"
              range
              :enable-time-picker="false"
              auto-apply
            >
              <template #trigger>
                <button
                  type="button"
                  class="w-full xl:w-auto min-w-[300px] px-4 py-2.5 text-[13px] font-bold rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/10 transition-all flex items-center justify-between gap-3 whitespace-nowrap"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">edit_calendar</span>
                    <span>立项时间</span>
                  </span>
                  <span class="ml-auto text-on-surface-variant/80 font-medium truncate max-w-[170px] text-right">
                    {{ dateRangeDisplay || '全部' }}
                  </span>
                  <button
                    v-if="dateRangeDisplay"
                    type="button"
                    @click.stop="clearDateRange"
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant/70 hover:bg-surface-container hover:text-error transition-colors shrink-0"
                    title="清空日期"
                  >
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </button>
              </template>
            </VueDatePicker>

            <select
              v-model="statusFilter"
              class="w-full xl:w-[140px] bg-surface-container-low border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none appearance-none"
            >
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'weekly-plan'" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">规划周</p>
            <h4 class="text-2xl font-manrope font-extrabold text-primary">2026年第4周</h4>
            <p class="text-xs text-on-surface-variant mt-2">2026-03-23 至 2026-03-29</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">计划工时</p>
            <h4 class="text-2xl font-manrope font-extrabold text-on-surface">{{ totalPlanHours }}h</h4>
            <p class="text-xs text-on-surface-variant mt-2">来源字段：`user_task.p_hours`</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">计划项数</p>
            <h4 class="text-2xl font-manrope font-extrabold text-on-surface">{{ filteredWeeklyTasks.length }}</h4>
            <p class="text-xs text-on-surface-variant mt-2">一人可有多条按 Tag 拆分的周计划</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">已完成</p>
            <h4 class="text-2xl font-manrope font-extrabold text-primary">{{ completedWeeklyTasks }}</h4>
            <p class="text-xs text-on-surface-variant mt-2">状态字段：`user_task.task_status`</p>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-outline-variant/10">
            <h4 class="font-manrope text-lg font-bold text-on-surface">周计划任务清单</h4>
            <p class="text-sm text-on-surface-variant mt-1">以下数据按 `user_task` 结构组织，并补充展示用户名与 Tag 名。</p>
          </div>

          <div v-if="filteredWeeklyTasks.length" class="divide-y divide-outline-variant/10">
            <div v-for="task in filteredWeeklyTasks" :key="task.task_id" class="px-6 py-5 hover:bg-surface-container-low/40 transition-colors">
              <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ task.plan_name }}</span>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary">{{ task.tag_name }}</span>
                    <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold', getStatusStyle(task.task_status)]">{{ task.task_status }}</span>
                  </div>
                  <h5 class="mt-3 text-base font-bold text-on-surface">{{ task.user_name }} · 第{{ task.week }}周计划</h5>
                  <p class="mt-2 text-sm text-on-surface-variant leading-relaxed">{{ task.task_content }}</p>
                </div>

                <div class="grid grid-cols-2 gap-3 min-w-[260px]">
                  <div class="rounded-xl bg-surface-container-low px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">计划工时</p>
                    <p class="font-manrope text-xl font-extrabold text-on-surface">{{ task.p_hours }}h</p>
                  </div>
                  <div class="rounded-xl bg-surface-container-low px-4 py-3">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">完成度</p>
                    <p class="font-manrope text-xl font-extrabold text-on-surface">{{ task.completion_rate }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="px-6 py-12 text-center text-sm text-on-surface-variant">
            当前筛选条件下暂无周计划数据
          </div>
        </div>
      </div>

      <div v-else class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="md:col-span-4 bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 min-h-[150px]">
            <div v-if="goalOverviewLoading" class="h-full flex items-center justify-center text-sm text-on-surface-variant">
              正在加载当前月份团队目标...
            </div>
            <div v-else-if="goalOverviewList.length" class="h-full overflow-x-auto pb-2">
              <div
                :class="[goalOverviewCount <= 4 ? 'grid w-full' : 'flex gap-4 min-w-max']"
                :style="goalOverviewCount <= 4 ? `grid-template-columns: repeat(${goalOverviewCount}, minmax(0, 1fr)); gap: 1rem;` : ''"
              >
                <div
                  v-for="goal in goalOverviewList"
                  :key="goal.goal_id"
                  :class="[
                    'h-[118px] rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 flex flex-col justify-between',
                    goalOverviewCount <= 4 ? 'min-w-0' : 'w-[280px] shrink-0'
                  ]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm font-bold text-on-surface truncate">{{ goal.goal_name }}</p>
                    <button
                      type="button"
                      @click="openGoalPlanning(goal)"
                      class="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/15 shrink-0"
                      title="根据该团队目标制定项目或任务计划"
                    >
                      <span class="material-symbols-outlined text-[14px]">assignment_add</span>
                      <span>制定计划</span>
                    </button>
                  </div>
                  <div class="flex items-center gap-2 whitespace-nowrap overflow-hidden text-sm">
                    <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">权重：{{ goal.weight }}</span>
                    <span class="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-1 font-bold text-secondary">工时预算：{{ goal.budget_days }}人天</span>
                  </div>
                  <p class="text-sm text-on-surface-variant line-clamp-2">{{ goal.goal_desc || '-' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center text-sm text-on-surface-variant">
              当前月份暂无团队目标数据
            </div>
          </div>
        </div>

        <div v-if="projectTagsLoading" class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant">
          正在加载项目&任务数据...
        </div>

        <div v-else-if="projectTags.length" class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div
            v-for="project in projectTags"
            :key="project.tag_id"
            class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden"
          >
            <div class="px-5 py-4 border-b border-outline-variant/10">
              <div class="flex justify-between items-start gap-6">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ project.goal_name }}</span>
                  </div>
                  <h5 class="mt-3 text-base font-bold text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">{{ project.tag_name }}</h5>
                </div>
                <div class="flex flex-col items-end gap-2 text-right shrink-0">
                  <select
                    v-model="project.status"
                    :class="[
                      'px-3 py-1 rounded-full text-[11px] font-bold border outline-none appearance-none cursor-pointer',
                      project.status === '待启动' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : '',
                      project.status === '进行中' ? 'bg-primary/10 text-primary border-primary/20' : '',
                      project.status === '已完成' ? 'bg-green-100 text-green-700 border-green-200' : '',
                      project.status === '已关闭' ? 'bg-slate-200 text-slate-600 border-slate-300' : ''
                    ]"
                  >
                    <option v-for="status in projectStatusOptions" :key="status" :value="status">
                      {{ status }}
                    </option>
                  </select>
                  <p class="text-sm font-medium text-on-surface-variant whitespace-nowrap">起止时间：{{ project.start_date }} 至 {{ project.end_date }}</p>
                </div>
              </div>
              <p class="mt-3 text-sm text-on-surface-variant leading-7 line-clamp-2 w-full">{{ project.tag_desc }}</p>
            </div>

            <div class="px-5 py-5">
              <div class="grid grid-cols-[1.35fr_0.85fr_0.8fr] gap-3 mb-4">
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">计划工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface whitespace-nowrap">{{ project.budget_days }}人天 / {{ project.budget_hours }}h</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">实际工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface whitespace-nowrap">{{ project.actual_hours === null ? '-' : `${project.actual_hours}h` }}</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">偏差</p>
                  <p :class="['font-manrope text-xl font-extrabold whitespace-nowrap', deviationText(project) !== null && deviationText(project) < 0 ? 'text-error' : 'text-primary']">
                    {{ deviationText(project) === null ? '-' : `${deviationText(project)}h` }}
                  </p>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1">
                  <span>项目进度</span>
                  <span>{{ project.progress_rate }}%</span>
                </div>
                <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div class="h-full rounded-full bg-primary transition-all" :style="`width: ${project.progress_rate}%`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant">
          当前筛选条件下暂无项目或任务数据
        </div>
      </div>
    </section>
  </div>
</template>
