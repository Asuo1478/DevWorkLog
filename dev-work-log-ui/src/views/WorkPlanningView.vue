<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { useAuthStore } from '@/stores/auth'
import '@vuepic/vue-datepicker/dist/main.css'

const authStore = useAuthStore()

const activeTab = ref('weekly-plan')
const keyword = ref('')
const statusFilter = ref('全部状态')
const dateRange = ref(null)

const goalOverviewLoading = ref(false)
const goalOverviewList = ref([])
const projectTagsLoading = ref(false)
const projectTags = ref([])
const activeTagCardsLoading = ref(false)
const activeTagCards = ref([])
const weeklyTasksLoading = ref(false)
const weeklyTasks = ref([])

const projectDialogVisible = ref(false)
const projectDialogMode = ref('create')
const projectDetailVisible = ref(false)
const projectDeleteVisible = ref(false)
const projectDeleteResultVisible = ref(false)

const taskDialogVisible = ref(false)
const taskDialogMode = ref('create')
const taskDetailVisible = ref(false)
const taskDeleteVisible = ref(false)

const submitting = ref(false)
const currentProject = ref(null)
const currentTask = ref(null)
const referenceGoal = ref(null)
const referenceTag = ref(null)
const projectStatusTouched = ref(false)
const taskStatusTouched = ref(false)
const projectDeleteResultTitle = ref('')
const projectDeleteResultMessage = ref('')

const projectForm = reactive({
  tag_name: '',
  start_date: '',
  end_date: '',
  budget_days: '',
  budget_hours: '',
  priority: '',
  tag_desc: '',
  status: '待启动',
  goal_id: null,
  year: new Date().getFullYear()
})

const taskForm = reactive({
  task_name: '',
  task_content: '',
  week_start_date: '',
  week_end_date: '',
  p_hours: '',
  task_status: '待启动',
  user_id: null,
  tag_id: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  week: 1
})

const tabs = [
  { key: 'weekly-plan', label: '周计划' },
  { key: 'project-manage', label: '项目&任务管理' }
]

const statusOptions = ['全部状态', '待启动', '进行中', '已完成', '已关闭']
const projectStatusOptions = ['待启动', '进行中', '已完成', '已关闭']
const taskStatusOptions = ['待启动', '进行中', '已完成', '已关闭']

const currentMonth = new Date().getMonth() + 1
const todayString = formatDate(new Date())

const keywordPlaceholder = computed(() => (activeTab.value === 'weekly-plan' ? '请输入计划名称' : '请输入项目或任务名称'))
const dateRangeTitle = computed(() => (activeTab.value === 'weekly-plan' ? '计划时间' : '立项时间'))
const projectDialogTitle = computed(() => (projectDialogMode.value === 'create' ? '制定计划' : '编辑项目&任务'))
const taskDialogTitle = computed(() => (taskDialogMode.value === 'create' ? '制定计划' : '编辑周计划'))
const projectDialogSubmitText = computed(() => (projectDialogMode.value === 'create' ? '确认保存' : '保存修改'))
const taskDialogSubmitText = computed(() => (taskDialogMode.value === 'create' ? '确认保存' : '保存修改'))
const goalOverviewCount = computed(() => goalOverviewList.value.length)
const activeTagCardCount = computed(() => activeTagCards.value.length)

const dateRangeDisplay = computed(() => {
  if (!dateRange.value) return ''
  if (Array.isArray(dateRange.value)) {
    const start = formatDate(dateRange.value[0])
    const end = formatDate(dateRange.value[1])
    return start && end ? `${start} 至 ${end}` : start || ''
  }
  return formatDate(dateRange.value)
})

function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatNumber(value) {
  const num = Number(value || 0)
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(1)))
}

function requestJson(url, options = {}) {
  return fetch(url, options).then(async (response) => {
    const json = await response.json()
    if (json.code !== 200) throw new Error(json.msg || '请求失败')
    return json.data
  })
}

function getTaskStatusStyle(status) {
  if (status === '待启动') return 'bg-yellow-100 text-yellow-700'
  if (status === '进行中') return 'bg-primary/10 text-primary'
  if (status === '已完成') return 'bg-green-100 text-green-700'
  if (status === '已关闭') return 'bg-slate-200 text-slate-600'
  return 'bg-surface-container text-on-surface-variant'
}

function getProjectStatusClass(status) {
  if (status === '待启动') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (status === '进行中') return 'bg-primary/10 text-primary border-primary/20'
  if (status === '已完成') return 'bg-green-100 text-green-700 border-green-200'
  if (status === '已关闭') return 'bg-slate-200 text-slate-600 border-slate-300'
  return 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
}

function getYearFromDate(dateString) {
  return dateString ? new Date(dateString).getFullYear() : new Date().getFullYear()
}

function getMonthFromDate(dateString) {
  return dateString ? (new Date(dateString).getMonth() + 1) : (new Date().getMonth() + 1)
}

function getWeekFromDate(dateString) {
  if (!dateString) return 1
  const date = new Date(dateString)
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const pastDays = Math.floor((date - firstDay) / 86400000)
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
}

function overlapWithSelectedRange(startDate, endDate) {
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

function parseProjectTag(item) {
  return {
    tag_id: Number(item.tag_id),
    tag_name: item.tag_name || '',
    tag_desc: item.tag_desc || '',
    goal_id: Number(item.goal_id || 0),
    goal_name: item.goal_name || '-',
    goal_desc: item.goal_desc || '',
    start_date: formatDate(item.start_date),
    end_date: formatDate(item.end_date),
    budget_days: Number(item.budget_days || 0),
    budget_hours: Number(item.budget_hours || 0),
    priority: item.priority == null ? '' : String(item.priority),
    status: item.status || '待启动',
    actual_hours: Number(item.actual_hours || 0),
    create_time: formatDate(item.create_time),
    year: Number(item.year || 0)
  }
}

function parseUserTask(item) {
  return {
    task_id: Number(item.task_id),
    user_id: Number(item.user_id || 0),
    user_name: item.user_name || '',
    tag_id: Number(item.tag_id || 0),
    tag_name: item.tag_name || '',
    task_name: item.task_name || '',
    task_content: item.task_content || '',
    week_start_date: formatDate(item.week_start_date),
    week_end_date: formatDate(item.week_end_date),
    p_hours: Number(item.p_hours || 0),
    task_status: item.task_status || '待启动',
    completion_rate: Number(item.completion_rate || 0),
    budget_hours: Number(item.budget_hours || 0),
    actual_hours: Number(item.actual_hours || 0),
    year: Number(item.year || 0),
    month: Number(item.month || 0),
    week: Number(item.week || 0)
  }
}

function projectProgress(project) {
  const budgetHours = Number(project.budget_hours || 0)
  const actualHours = Number(project.actual_hours || 0)
  if (!budgetHours || Number.isNaN(budgetHours)) return 0
  return Number(Math.min((actualHours / budgetHours) * 100, 100).toFixed(1))
}

function plannedHoursText(project) {
  return `${formatNumber(project.budget_days)}人天 / ${formatNumber(project.budget_hours)}h`
}

function actualHoursText(project) {
  return `${formatNumber(project.actual_hours)}h`
}

function deviationValue(project) {
  return Number((Number(project.budget_hours || 0) - Number(project.actual_hours || 0)).toFixed(1))
}

function deviationText(project) {
  return `${formatNumber(deviationValue(project))}h`
}

function taskReferenceProgress(tag) {
  const budgetHours = Number(tag.budget_hours || 0)
  const actualHours = Number(tag.actual_hours || 0)
  if (!budgetHours) return 0
  return Number(Math.min((actualHours / budgetHours) * 100, 100).toFixed(1))
}

function buildProjectPayload() {
  return {
    tag_name: projectForm.tag_name.trim(),
    start_date: projectForm.start_date,
    end_date: projectForm.end_date,
    budget_days: Number(projectForm.budget_days || 0),
    budget_hours: Number(projectForm.budget_hours || 0),
    priority: projectForm.priority ? String(projectForm.priority) : null,
    tag_desc: projectForm.tag_desc.trim(),
    status: projectForm.status,
    goal_id: projectForm.goal_id,
    year: Number(projectForm.year || getYearFromDate(projectForm.start_date)),
    create_by: authStore.user.id || null,
    update_by: authStore.user.id || null
  }
}

function buildTaskPayload() {
  return {
    task_name: taskForm.task_name.trim(),
    task_content: taskForm.task_content.trim(),
    week_start_date: taskForm.week_start_date,
    week_end_date: taskForm.week_end_date,
    p_hours: Number(taskForm.p_hours || 0),
    task_status: taskForm.task_status,
    user_id: Number(taskForm.user_id || authStore.user.id || 0),
    tag_id: Number(taskForm.tag_id || 0),
    year: Number(taskForm.year),
    month: Number(taskForm.month),
    week: Number(taskForm.week),
    completion_rate: 0
  }
}

function resetProjectForm(goal = null) {
  projectForm.tag_name = ''
  projectForm.start_date = ''
  projectForm.end_date = ''
  projectForm.budget_days = ''
  projectForm.budget_hours = ''
  projectForm.priority = ''
  projectForm.tag_desc = ''
  projectForm.status = '待启动'
  projectForm.goal_id = goal ? Number(goal.goal_id) : null
  projectForm.year = new Date().getFullYear()
  projectStatusTouched.value = false
  referenceGoal.value = goal
    ? {
        goal_id: Number(goal.goal_id),
        goal_name: goal.goal_name || '',
        goal_desc: goal.goal_desc || '',
        weight: goal.weight == null ? null : Number(goal.weight),
        budget_days: goal.budget_days == null ? null : Number(goal.budget_days)
      }
    : null
}

function fillProjectForm(project) {
  projectForm.tag_name = project.tag_name || ''
  projectForm.start_date = formatDate(project.start_date)
  projectForm.end_date = formatDate(project.end_date)
  projectForm.budget_days = project.budget_days == null ? '' : String(project.budget_days)
  projectForm.budget_hours = project.budget_hours == null ? '' : String(project.budget_hours)
  projectForm.priority = project.priority == null ? '' : String(project.priority)
  projectForm.tag_desc = project.tag_desc || ''
  projectForm.status = project.status || '待启动'
  projectForm.goal_id = Number(project.goal_id || 0)
  projectForm.year = Number(project.year || getYearFromDate(project.start_date))
  projectStatusTouched.value = true
  const matchedGoal = goalOverviewList.value.find((goal) => Number(goal.goal_id) === Number(project.goal_id))
  resetProjectForm(matchedGoal || null)
  projectForm.tag_name = project.tag_name || ''
  projectForm.start_date = formatDate(project.start_date)
  projectForm.end_date = formatDate(project.end_date)
  projectForm.budget_days = project.budget_days == null ? '' : String(project.budget_days)
  projectForm.budget_hours = project.budget_hours == null ? '' : String(project.budget_hours)
  projectForm.priority = project.priority == null ? '' : String(project.priority)
  projectForm.tag_desc = project.tag_desc || ''
  projectForm.status = project.status || '待启动'
  projectForm.goal_id = Number(project.goal_id || 0)
  projectForm.year = Number(project.year || getYearFromDate(project.start_date))
  projectStatusTouched.value = true
}

function resetTaskForm(tag = null) {
  taskForm.task_name = ''
  taskForm.task_content = ''
  taskForm.week_start_date = ''
  taskForm.week_end_date = ''
  taskForm.p_hours = ''
  taskForm.task_status = '待启动'
  taskForm.user_id = authStore.user.id || null
  taskForm.tag_id = tag ? Number(tag.tag_id) : null
  taskForm.year = new Date().getFullYear()
  taskForm.month = new Date().getMonth() + 1
  taskForm.week = getWeekFromDate(todayString)
  taskStatusTouched.value = false
  referenceTag.value = tag ? { ...tag } : null
}

function fillTaskForm(task) {
  taskForm.task_name = task.task_name || ''
  taskForm.task_content = task.task_content || ''
  taskForm.week_start_date = formatDate(task.week_start_date)
  taskForm.week_end_date = formatDate(task.week_end_date)
  taskForm.p_hours = task.p_hours == null ? '' : String(task.p_hours)
  taskForm.task_status = task.task_status || '待启动'
  taskForm.user_id = Number(task.user_id || authStore.user.id || 0)
  taskForm.tag_id = Number(task.tag_id || 0)
  taskForm.year = Number(task.year || getYearFromDate(task.week_start_date))
  taskForm.month = Number(task.month || getMonthFromDate(task.week_start_date))
  taskForm.week = Number(task.week || getWeekFromDate(task.week_start_date))
  taskStatusTouched.value = true
  const matchedTag = activeTagCards.value.find((item) => Number(item.tag_id) === Number(task.tag_id))
  referenceTag.value = matchedTag ? { ...matchedTag } : null
}

function syncProjectBudgetHours() {
  const budgetDays = Number(projectForm.budget_days || 0)
  projectForm.budget_hours = budgetDays ? String(Number((budgetDays * 8).toFixed(1))) : ''
}

function sanitizeProjectPriority() {
  projectForm.priority = String(projectForm.priority || '').replace(/\D/g, '')
}

function autoProjectStatusByStartDate() {
  if (!projectForm.start_date) return '待启动'
  return projectForm.start_date <= todayString ? '进行中' : '待启动'
}

function autoTaskStatusByStartDate() {
  if (!taskForm.week_start_date) return '待启动'
  return taskForm.week_start_date <= todayString ? '进行中' : '待启动'
}

function onProjectStartDateChange() {
  projectForm.year = getYearFromDate(projectForm.start_date)
  if (!projectStatusTouched.value) projectForm.status = autoProjectStatusByStartDate()
}

function onTaskStartDateChange() {
  taskForm.year = getYearFromDate(taskForm.week_start_date)
  taskForm.month = getMonthFromDate(taskForm.week_start_date)
  taskForm.week = getWeekFromDate(taskForm.week_start_date)
  if (!taskStatusTouched.value) taskForm.task_status = autoTaskStatusByStartDate()
}

function openProjectDeleteResult(title, message) {
  projectDeleteResultTitle.value = title
  projectDeleteResultMessage.value = message
  projectDeleteResultVisible.value = true
}

function openGoalPlanning(goal) {
  activeTab.value = 'project-manage'
  currentProject.value = null
  projectDialogMode.value = 'create'
  resetProjectForm(goal)
  projectDialogVisible.value = true
}

function openTaskPlanning(tag) {
  currentTask.value = null
  taskDialogMode.value = 'create'
  resetTaskForm(tag)
  taskDialogVisible.value = true
}

async function openProjectDetail(project) {
  try {
    const data = await requestJson(`/api/v1/project-tags/${project.tag_id}`)
    currentProject.value = parseProjectTag(data)
    currentProject.value.goal_name = data.goal_name || currentProject.value.goal_name
    currentProject.value.goal_desc = data.goal_desc || currentProject.value.goal_desc
    projectDetailVisible.value = true
  } catch (error) {
    alert(error.message || '详情加载失败')
  }
}

async function openTaskDetail(task) {
  try {
    const data = await requestJson(`/api/v1/user-tasks/${task.task_id}`)
    currentTask.value = parseUserTask(data)
    currentTask.value.user_name = data.user_name || currentTask.value.user_name
    currentTask.value.tag_name = data.tag_name || currentTask.value.tag_name
    taskDetailVisible.value = true
  } catch (error) {
    alert(error.message || '详情加载失败')
  }
}

async function openProjectEdit(project) {
  try {
    const data = await requestJson(`/api/v1/project-tags/${project.tag_id}`)
    currentProject.value = parseProjectTag(data)
    currentProject.value.goal_name = data.goal_name || currentProject.value.goal_name
    currentProject.value.goal_desc = data.goal_desc || currentProject.value.goal_desc
    projectDialogMode.value = 'edit'
    fillProjectForm(data)
    projectDialogVisible.value = true
  } catch (error) {
    alert(error.message || '编辑数据加载失败')
  }
}

async function openTaskEdit(task) {
  try {
    const data = await requestJson(`/api/v1/user-tasks/${task.task_id}`)
    currentTask.value = parseUserTask(data)
    currentTask.value.user_name = data.user_name || currentTask.value.user_name
    currentTask.value.tag_name = data.tag_name || currentTask.value.tag_name
    currentTask.value.budget_hours = Number(data.budget_hours || currentTask.value.budget_hours || 0)
    currentTask.value.actual_hours = Number(data.actual_hours || currentTask.value.actual_hours || 0)
    taskDialogMode.value = 'edit'
    fillTaskForm(data)
    taskDialogVisible.value = true
  } catch (error) {
    alert(error.message || '编辑数据加载失败')
  }
}

async function openProjectDelete(project) {
  try {
    const data = await requestJson(`/api/v1/project-tags/${project.tag_id}/delete-check`)
    currentProject.value = project
    if (data.can_delete) {
      projectDeleteVisible.value = true
      return
    }
    openProjectDeleteResult('删除项目&任务', data.message || '该项目&任务已经实际启动，不允许删除。')
  } catch (error) {
    openProjectDeleteResult('删除项目&任务', error.message || '删除校验失败')
  }
}

function openTaskDelete(task) {
  currentTask.value = task
  taskDeleteVisible.value = true
}

async function submitProjectForm() {
  if (submitting.value) return
  const payload = buildProjectPayload()
  if (!payload.tag_name || !payload.start_date || !payload.end_date || !projectForm.budget_days) {
    alert('请先完整填写必填信息')
    return
  }
  if (!payload.goal_id) {
    alert('未关联团队目标，无法制定计划')
    return
  }
  if (new Date(payload.start_date) > new Date(payload.end_date)) {
    alert('开始时间不能晚于结束时间')
    return
  }

  submitting.value = true
  try {
    const url = projectDialogMode.value === 'create' ? '/api/v1/project-tags' : `/api/v1/project-tags/${currentProject.value.tag_id}`
    const method = projectDialogMode.value === 'create' ? 'POST' : 'PUT'
    await requestJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    projectDialogVisible.value = false
    await fetchProjectTags()
    await fetchActiveTagCards()
  } catch (error) {
    alert(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function submitTaskForm() {
  if (submitting.value) return
  const payload = buildTaskPayload()
  if (!payload.task_name || !payload.task_content || !payload.week_start_date || !payload.week_end_date || !taskForm.p_hours) {
    alert('请先完整填写必填信息')
    return
  }
  if (!payload.user_id || !payload.tag_id) {
    alert('缺少关联用户或项目&任务信息')
    return
  }
  if (new Date(payload.week_start_date) > new Date(payload.week_end_date)) {
    alert('开始时间不能晚于结束时间')
    return
  }

  submitting.value = true
  try {
    const url = taskDialogMode.value === 'create' ? '/api/v1/user-tasks' : `/api/v1/user-tasks/${currentTask.value.task_id}`
    const method = taskDialogMode.value === 'create' ? 'POST' : 'PUT'
    await requestJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    taskDialogVisible.value = false
    await fetchWeeklyTasks()
  } catch (error) {
    alert(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function confirmDeleteProject() {
  if (!currentProject.value || submitting.value) return
  submitting.value = true
  try {
    await requestJson(`/api/v1/project-tags/${currentProject.value.tag_id}`, { method: 'DELETE' })
    projectDeleteVisible.value = false
    await fetchProjectTags()
    await fetchActiveTagCards()
  } catch (error) {
    alert(error.message || '删除失败')
  } finally {
    submitting.value = false
  }
}

async function confirmDeleteTask() {
  if (!currentTask.value || submitting.value) return
  submitting.value = true
  try {
    await requestJson(`/api/v1/user-tasks/${currentTask.value.task_id}`, { method: 'DELETE' })
    taskDeleteVisible.value = false
    await fetchWeeklyTasks()
  } catch (error) {
    alert(error.message || '删除失败')
  } finally {
    submitting.value = false
  }
}

async function changeProjectStatus(project, nextStatus) {
  const previousStatus = project.status
  project.status = nextStatus
  try {
    await requestJson(`/api/v1/project-tags/${project.tag_id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, update_by: authStore.user.id || null })
    })
    await fetchActiveTagCards()
  } catch (error) {
    project.status = previousStatus
    alert(error.message || '状态更新失败')
  }
}

async function changeTaskStatus(task, nextStatus) {
  const previousStatus = task.task_status
  task.task_status = nextStatus
  try {
    await requestJson(`/api/v1/user-tasks/${task.task_id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_status: nextStatus })
    })
  } catch (error) {
    task.task_status = previousStatus
    alert(error.message || '状态更新失败')
  }
}

async function fetchGoalOverview() {
  goalOverviewLoading.value = true
  try {
    const data = await requestJson(`/api/v1/goal-defines/current-month-overview?month=${currentMonth}`)
    goalOverviewList.value = data.list || []
  } catch (error) {
    goalOverviewList.value = []
  } finally {
    goalOverviewLoading.value = false
  }
}

async function fetchProjectTags() {
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
    const data = await requestJson(`/api/v1/project-tags/planning${query ? `?${query}` : ''}`)
    projectTags.value = (data || []).map(parseProjectTag)
  } catch (error) {
    projectTags.value = []
  } finally {
    projectTagsLoading.value = false
  }
}

async function fetchActiveTagCards() {
  activeTagCardsLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('status', '进行中')
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    if (Array.isArray(dateRange.value) && dateRange.value[0] && dateRange.value[1]) {
      params.set('start_date', formatDate(dateRange.value[0]))
      params.set('end_date', formatDate(dateRange.value[1]))
    }
    const data = await requestJson(`/api/v1/project-tags/planning?${params.toString()}`)
    activeTagCards.value = (data || []).map(parseProjectTag)
  } catch (error) {
    activeTagCards.value = []
  } finally {
    activeTagCardsLoading.value = false
  }
}

async function fetchWeeklyTasks() {
  weeklyTasksLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('user_id', authStore.user.id || '')
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    if (statusFilter.value !== '全部状态') params.set('status', statusFilter.value)
    if (Array.isArray(dateRange.value) && dateRange.value[0] && dateRange.value[1]) {
      params.set('start_date', formatDate(dateRange.value[0]))
      params.set('end_date', formatDate(dateRange.value[1]))
    }
    const data = await requestJson(`/api/v1/user-tasks?${params.toString()}`)
    weeklyTasks.value = (data || []).map(parseUserTask)
  } catch (error) {
    weeklyTasks.value = []
  } finally {
    weeklyTasksLoading.value = false
  }
}

watch([keyword, statusFilter, dateRange], () => {
  if (activeTab.value === 'project-manage') {
    fetchProjectTags()
    return
  }

  fetchActiveTagCards()
  fetchWeeklyTasks()
}, { deep: true })

watch(activeTab, (value) => {
  if (value === 'project-manage') {
    fetchProjectTags()
    return
  }

  fetchActiveTagCards()
  fetchWeeklyTasks()
})

onMounted(() => {
  fetchGoalOverview()
  fetchProjectTags()
  fetchActiveTagCards()
  fetchWeeklyTasks()
})
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
                activeTab === tab.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/70'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end xl:flex-1 xl:pl-24 xl:gap-4">
            <input
              v-model="keyword"
              type="text"
              :placeholder="keywordPlaceholder"
              class="w-full xl:w-[220px] bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70"
            />

            <VueDatePicker v-model="dateRange" range :enable-time-picker="false" auto-apply>
              <template #trigger>
                <div class="w-full xl:min-w-[320px] px-4 py-2.5 text-[13px] font-bold rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/10 transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer">
                  <span class="inline-flex items-center gap-1.5 shrink-0">
                    <span class="material-symbols-outlined text-[16px]">edit_calendar</span>
                    <span>{{ dateRangeTitle }}</span>
                  </span>
                  <span class="ml-auto text-on-surface-variant/80 font-medium truncate text-right">{{ dateRangeDisplay || '全部' }}</span>
                  <span v-if="dateRangeDisplay" @click.stop="dateRange = null" class="inline-flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant/70 hover:bg-surface-container hover:text-error transition-colors shrink-0" title="清空日期">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </span>
                </div>
              </template>
            </VueDatePicker>

            <select v-model="statusFilter" class="w-full xl:w-[140px] bg-surface-container-low border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none appearance-none">
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'weekly-plan'" class="p-6 space-y-6">
        <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 min-h-[150px]">
          <div v-if="activeTagCardsLoading" class="h-full flex items-center justify-center text-sm text-on-surface-variant">正在加载进行中的项目或任务...</div>
          <div v-else-if="activeTagCards.length" class="h-full overflow-x-auto pb-2">
            <div :class="[activeTagCardCount <= 4 ? 'grid w-full' : 'flex gap-4 min-w-max']" :style="activeTagCardCount <= 4 ? `grid-template-columns: repeat(${activeTagCardCount}, minmax(0, 1fr)); gap: 1rem;` : ''">
              <div
                v-for="tag in activeTagCards"
                :key="tag.tag_id"
                :class="['rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-sm overflow-hidden', activeTagCardCount <= 4 ? 'min-w-0' : 'w-[320px] shrink-0']"
              >
                <div class="px-5 py-4 border-b border-outline-variant/10">
                  <div class="flex justify-between items-start gap-6">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ tag.goal_name }}</span>
                      </div>
                      <h5 class="mt-3 text-[18px] font-bold text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">{{ tag.tag_name }}</h5>
                    </div>
                    <div class="flex flex-col items-end gap-2 text-right shrink-0">
                      <button type="button" @click="openTaskPlanning(tag)" class="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/15">
                        <span class="material-symbols-outlined text-[14px]">assignment_add</span>
                        <span>制定计划</span>
                      </button>
                    </div>
                  </div>
                  <div class="mt-3">
                    <p class="text-sm font-medium text-on-surface-variant whitespace-nowrap overflow-hidden text-ellipsis">起止时间：{{ tag.start_date }} 至 {{ tag.end_date }}</p>
                  </div>
                </div>
                <div class="px-5 py-5">
                  <div class="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mb-3">
                    <span>P：{{ plannedHoursText(tag) }}</span>
                    <span>A：{{ actualHoursText(tag) }}</span>
                    <span>进度：{{ taskReferenceProgress(tag) }}%</span>
                  </div>
                  <div>
                    <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                      <div class="h-full rounded-full bg-primary transition-all" :style="`width: ${taskReferenceProgress(tag)}%`"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex items-center justify-center text-sm text-on-surface-variant">当前筛选条件下暂无进行中的项目或任务</div>
        </div>

        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div class="px-6 py-5 border-b border-outline-variant/10">
            <h4 class="font-manrope text-lg font-bold text-on-surface">周计划任务清单</h4>
          </div>

          <div v-if="weeklyTasksLoading" class="px-6 py-12 text-center text-sm text-on-surface-variant">正在加载周计划...</div>
          <div v-else-if="weeklyTasks.length" class="divide-y divide-outline-variant/10">
            <div v-for="task in weeklyTasks" :key="task.task_id" @dblclick="openTaskDetail(task)" class="px-6 py-5 hover:bg-surface-container-low/40 transition-colors cursor-default">
              <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ task.task_name }}</span>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary">{{ task.tag_name }}</span>
                  </div>
                  <h5 class="mt-3 text-base font-bold text-on-surface">{{ task.user_name }} · 第{{ task.week }}周计划</h5>
                  <p class="mt-2 text-sm text-on-surface-variant leading-relaxed">{{ task.task_content }}</p>
                </div>

                <div class="min-w-[320px] space-y-3">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" @click.stop="openTaskEdit(task)" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" title="编辑">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" @click.stop="openTaskDelete(task)" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors" title="删除">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <select :value="task.task_status" @click.stop @change="changeTaskStatus(task, $event.target.value)" :class="['px-3 py-1 rounded-full text-[11px] font-bold border outline-none appearance-none cursor-pointer', getProjectStatusClass(task.task_status)]">
                      <option v-for="status in taskStatusOptions" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-surface-container-low px-4 py-3">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">预算工时</p>
                      <p class="font-manrope text-xl font-extrabold text-on-surface">{{ formatNumber(task.p_hours) }}h</p>
                    </div>
                    <div class="rounded-xl bg-surface-container-low px-4 py-3">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">计划时间</p>
                      <p class="text-sm font-bold text-on-surface">{{ task.week_start_date }} 至 {{ task.week_end_date }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="px-6 py-12 text-center text-sm text-on-surface-variant">当前筛选条件下暂无周计划数据</div>
        </div>
      </div>

      <div v-else class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="md:col-span-4 bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 min-h-[150px]">
            <div v-if="goalOverviewLoading" class="h-full flex items-center justify-center text-sm text-on-surface-variant">正在加载当前月份团队目标...</div>
            <div v-else-if="goalOverviewList.length" class="h-full overflow-x-auto pb-2">
              <div :class="[goalOverviewCount <= 4 ? 'grid w-full' : 'flex gap-4 min-w-max']" :style="goalOverviewCount <= 4 ? `grid-template-columns: repeat(${goalOverviewCount}, minmax(0, 1fr)); gap: 1rem;` : ''">
                <div v-for="goal in goalOverviewList" :key="goal.goal_id" :class="['h-[118px] rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-5 py-4 flex flex-col justify-between', goalOverviewCount <= 4 ? 'min-w-0' : 'w-[280px] shrink-0']">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm font-bold text-on-surface truncate">{{ goal.goal_name }}</p>
                    <button type="button" @click="openGoalPlanning(goal)" class="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/15 shrink-0" title="根据该团队目标制定项目或任务计划">
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
            <div v-else class="h-full flex items-center justify-center text-sm text-on-surface-variant">当前月份暂无团队目标数据</div>
          </div>
        </div>

        <div v-if="projectTagsLoading" class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant">正在加载项目&任务数据...</div>
        <div v-else-if="projectTags.length" class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div v-for="project in projectTags" :key="project.tag_id" @dblclick="openProjectDetail(project)" class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden cursor-default">
            <div class="px-5 py-4 border-b border-outline-variant/10">
              <div class="flex justify-between items-start gap-6">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ project.goal_name }}</span>
                  </div>
                  <h5 class="mt-3 text-[18px] font-bold text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">{{ project.tag_name }}</h5>
                </div>

                <div class="flex flex-col items-end gap-2 text-right shrink-0">
                  <div class="flex items-center gap-2">
                    <button type="button" @click.stop="openProjectEdit(project)" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" title="编辑">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" @click.stop="openProjectDelete(project)" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors" title="删除">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <select :value="project.status" @click.stop @change="changeProjectStatus(project, $event.target.value)" :class="['px-3 py-1 rounded-full text-[11px] font-bold border outline-none appearance-none cursor-pointer', getProjectStatusClass(project.status)]">
                      <option v-for="status in projectStatusOptions" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                  <p class="text-sm font-medium text-on-surface-variant whitespace-nowrap">起止时间：{{ project.start_date }} 至 {{ project.end_date }}</p>
                </div>
              </div>

              <div class="mt-3 w-full">
                <p class="max-w-full overflow-hidden text-ellipsis text-sm leading-7 text-on-surface-variant line-clamp-2 break-all min-h-[56px]">{{ project.tag_desc || '-' }}</p>
              </div>
            </div>

            <div class="px-5 py-5">
              <div class="grid grid-cols-[1.35fr_0.85fr_0.8fr] gap-3 mb-4">
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">计划工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface whitespace-nowrap">{{ plannedHoursText(project) }}</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">实际工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface whitespace-nowrap">{{ actualHoursText(project) }}</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">偏差</p>
                  <p :class="['font-manrope text-xl font-extrabold whitespace-nowrap', deviationValue(project) < 0 ? 'text-error' : 'text-primary']">{{ deviationText(project) }}</p>
                </div>
              </div>
              <div>
                <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1">
                  <span>项目进度</span>
                  <span>{{ projectProgress(project) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div class="h-full rounded-full bg-primary transition-all" :style="`width: ${projectProgress(project)}%`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant">当前筛选条件下暂无项目或任务数据</div>
      </div>
    </section>

    <div v-if="projectDialogVisible" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-primary">{{ projectDialogTitle }}</h4>
            <p class="text-sm text-on-surface-variant mt-1">围绕团队目标制定具体项目或任务计划，目标数据仅作参考。</p>
          </div>
          <button type="button" @click="projectDialogVisible = false" class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div v-if="referenceGoal" class="px-6 pt-5">
          <div class="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-bold text-primary">{{ referenceGoal.goal_name }}</span>
              <span v-if="referenceGoal.weight !== null" class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/10">权重：{{ referenceGoal.weight }}</span>
              <span v-if="referenceGoal.budget_days !== null" class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-secondary border border-secondary/10">工时预算：{{ referenceGoal.budget_days }}人天</span>
            </div>
            <p class="mt-2 text-sm text-on-surface-variant">{{ referenceGoal.goal_desc || '当前团队目标未填写说明。' }}</p>
          </div>
        </div>

        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">项目&计划名称</span>
            <input v-model="projectForm.tag_name" type="text" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入项目&计划名称" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">开始时间</span>
            <input v-model="projectForm.start_date" @change="onProjectStartDateChange" type="date" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">结束时间</span>
            <input v-model="projectForm.end_date" type="date" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">预算人天</span>
            <input v-model="projectForm.budget_days" @input="syncProjectBudgetHours" type="number" min="0" step="0.5" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入预算人天" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">预算工时</span>
            <input :value="projectForm.budget_hours" type="text" readonly class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-3 text-sm text-on-surface outline-none" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">优先级</span>
            <input v-model="projectForm.priority" @input="sanitizeProjectPriority" type="text" inputmode="numeric" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入数字" />
            <p class="mt-2 text-xs text-on-surface-variant">数值越大，优先级越高</p>
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">状态</span>
            <select v-model="projectForm.status" @change="projectStatusTouched = true" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30">
              <option v-for="status in projectStatusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">项目&任务说明</span>
            <textarea v-model="projectForm.tag_desc" rows="4" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none resize-none focus:border-primary/30" placeholder="请输入项目&任务说明"></textarea>
          </label>
        </div>

        <div class="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button type="button" @click="projectDialogVisible = false" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-surface-container-low text-on-surface-variant">取消</button>
          <button type="button" @click="submitProjectForm" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50" :disabled="submitting">{{ projectDialogSubmitText }}</button>
        </div>
      </div>
    </div>

    <div v-if="taskDialogVisible" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div>
            <h4 class="font-manrope text-lg font-bold text-primary">{{ taskDialogTitle }}</h4>
            <p class="text-sm text-on-surface-variant mt-1">围绕进行中的项目或任务制定周计划，参考信息不做强制限制。</p>
          </div>
          <button type="button" @click="taskDialogVisible = false" class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
        </div>

        <div v-if="referenceTag" class="px-6 pt-5">
          <div class="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-bold text-primary">{{ referenceTag.tag_name }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/10">预计工时：{{ plannedHoursText(referenceTag) }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-secondary border border-secondary/10">已投入工时：{{ actualHoursText(referenceTag) }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-tertiary border border-tertiary/10">项目进度：{{ taskReferenceProgress(referenceTag) }}%</span>
            </div>
          </div>
        </div>

        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">计划名称</span>
            <input v-model="taskForm.task_name" type="text" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入计划名称" />
          </label>
          <label class="block md:col-span-2">
            <span class="text-sm font-bold text-on-surface">计划内容</span>
            <textarea v-model="taskForm.task_content" rows="4" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none resize-none focus:border-primary/30" placeholder="请输入计划内容"></textarea>
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">开始时间</span>
            <input v-model="taskForm.week_start_date" @change="onTaskStartDateChange" type="date" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">结束时间</span>
            <input v-model="taskForm.week_end_date" type="date" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">预算工时</span>
            <input v-model="taskForm.p_hours" type="number" min="0" step="0.5" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30" placeholder="请输入小时数" />
          </label>
          <label class="block">
            <span class="text-sm font-bold text-on-surface">状态</span>
            <select v-model="taskForm.task_status" @change="taskStatusTouched = true" class="mt-2 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30">
              <option v-for="status in taskStatusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
        </div>

        <div class="px-6 py-4 border-t border-outline-variant/10 flex items-center justify-end gap-3 bg-surface-container-lowest">
          <button type="button" @click="taskDialogVisible = false" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-surface-container-low text-on-surface-variant">取消</button>
          <button type="button" @click="submitTaskForm" class="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50" :disabled="submitting">{{ taskDialogSubmitText }}</button>
        </div>
      </div>
    </div>

    <div v-if="projectDetailVisible && currentProject" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div><h4 class="font-manrope text-lg font-bold text-primary">项目&任务详情</h4></div>
          <button type="button" @click="projectDetailVisible = false" class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2"><span class="text-sm font-bold text-on-surface">项目&计划名称</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">{{ currentProject.tag_name }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">开始时间</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentProject.start_date }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">结束时间</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentProject.end_date }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">计划工时</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ plannedHoursText(currentProject) }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">优先级</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentProject.priority || '-' }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">状态</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentProject.status }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">实际工时</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ actualHoursText(currentProject) }}</div></div>
          <div class="md:col-span-2"><span class="text-sm font-bold text-on-surface">项目&任务说明</span><div class="mt-2 min-h-[112px] rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed">{{ currentProject.tag_desc || '-' }}</div></div>
        </div>
      </div>
    </div>

    <div v-if="taskDetailVisible && currentTask" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center px-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between gap-4">
          <div><h4 class="font-manrope text-lg font-bold text-primary">周计划详情</h4></div>
          <button type="button" @click="taskDetailVisible = false" class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div v-if="referenceTag" class="px-6 pt-5">
          <div class="rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-bold text-primary">{{ referenceTag.tag_name }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/10">预计工时：{{ plannedHoursText(referenceTag) }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-secondary border border-secondary/10">已投入工时：{{ actualHoursText(referenceTag) }}</span>
              <span class="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-tertiary border border-tertiary/10">项目进度：{{ taskReferenceProgress(referenceTag) }}%</span>
            </div>
          </div>
        </div>
        <div class="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="md:col-span-2"><span class="text-sm font-bold text-on-surface">计划名称</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">{{ currentTask.task_name }}</div></div>
          <div class="md:col-span-2"><span class="text-sm font-bold text-on-surface">计划内容</span><div class="mt-2 min-h-[112px] rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant leading-relaxed">{{ currentTask.task_content }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">开始时间</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentTask.week_start_date }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">结束时间</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentTask.week_end_date }}</div></div>
          <div><span class="text-sm font-bold text-on-surface">预算工时</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ formatNumber(currentTask.p_hours) }}h</div></div>
          <div><span class="text-sm font-bold text-on-surface">状态</span><div class="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">{{ currentTask.task_status }}</div></div>
        </div>
      </div>
    </div>

    <div v-if="projectDeleteVisible && currentProject" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/35 backdrop-blur-[1px]" @click="projectDeleteVisible = false"></div>
      <div class="relative w-full max-w-[560px] rounded-[28px] bg-white shadow-2xl overflow-hidden">
        <div class="px-10 pt-10 pb-8"><h3 class="text-[18px] font-bold text-[#c81e1e]">删除项目&任务</h3><p class="mt-6 text-[15px] leading-7 text-on-surface-variant">确认删除项目&任务“{{ currentProject.tag_name }}”吗？</p></div>
        <div class="px-10 pb-8 flex justify-end gap-4">
          <button @click="projectDeleteVisible = false" class="min-w-[108px] rounded-[18px] bg-surface-container-low px-6 py-3 text-[15px] font-bold text-on-surface-variant hover:bg-surface-container">取消</button>
          <button @click="confirmDeleteProject" class="min-w-[108px] rounded-[18px] bg-[#c81e1e] px-6 py-3 text-[15px] font-bold text-white hover:opacity-95" :disabled="submitting">删除</button>
        </div>
      </div>
    </div>

    <div v-if="taskDeleteVisible && currentTask" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/35 backdrop-blur-[1px]" @click="taskDeleteVisible = false"></div>
      <div class="relative w-full max-w-[560px] rounded-[28px] bg-white shadow-2xl overflow-hidden">
        <div class="px-10 pt-10 pb-8"><h3 class="text-[18px] font-bold text-[#c81e1e]">删除周计划</h3><p class="mt-6 text-[15px] leading-7 text-on-surface-variant">确认删除周计划“{{ currentTask.task_name }}”吗？</p></div>
        <div class="px-10 pb-8 flex justify-end gap-4">
          <button @click="taskDeleteVisible = false" class="min-w-[108px] rounded-[18px] bg-surface-container-low px-6 py-3 text-[15px] font-bold text-on-surface-variant hover:bg-surface-container">取消</button>
          <button @click="confirmDeleteTask" class="min-w-[108px] rounded-[18px] bg-[#c81e1e] px-6 py-3 text-[15px] font-bold text-white hover:opacity-95" :disabled="submitting">删除</button>
        </div>
      </div>
    </div>

    <div v-if="projectDeleteResultVisible" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/35 backdrop-blur-[1px]" @click="projectDeleteResultVisible = false"></div>
      <div class="relative w-full max-w-[560px] rounded-[28px] bg-white shadow-2xl overflow-hidden">
        <div class="px-10 pt-10 pb-8"><h3 class="text-[18px] font-bold text-[#c81e1e]">{{ projectDeleteResultTitle }}</h3><p class="mt-6 text-[15px] leading-7 text-on-surface-variant">{{ projectDeleteResultMessage }}</p></div>
        <div class="px-10 pb-8 flex justify-end">
          <button @click="projectDeleteResultVisible = false" class="min-w-[108px] rounded-[18px] bg-surface-container-low px-6 py-3 text-[15px] font-bold text-on-surface-variant hover:bg-surface-container">知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>
