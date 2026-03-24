<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = '/api/v1/users'

// Search filters
const searchFilters = ref({
  name: '',
  username: '',
  status: '全部',
  group_name: '全部'
})

// Pagination
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// Data
const employees = ref([])
const groupOptions = ref([])
const loading = ref(false)
const operationMsg = ref('')

// Modal states
const showFormModal = ref(false)
const formMode = ref('add') // 'add' | 'edit'
const showDetailModal = ref(false)
const detailUser = ref(null)

const formData = ref({
  id: null,
  name: '',
  username: '',
  password: '',
  group_name: '',
  job_desc: ''
})

// Computed: total pages
const totalPages = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.pageSize)))
const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = pagination.value.page
  const pages = []
  let start = Math.max(1, current - 2)
  let end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const formTitle = computed(() => formMode.value === 'add' ? '添加新账号' : '编辑账号信息')
const formIcon = computed(() => formMode.value === 'add' ? 'person_add' : 'edit')
const formSubmitText = computed(() => formMode.value === 'add' ? '确认添加' : '保存修改')
const isFormValid = computed(() => {
  if (formMode.value === 'add') {
    return formData.value.name && formData.value.username && formData.value.password
  }
  return formData.value.name && formData.value.username
})

// ---- API methods ----

// Fetch user list from backend
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', pagination.value.page)
    params.set('pageSize', pagination.value.pageSize)
    if (searchFilters.value.name) params.set('name', searchFilters.value.name)
    if (searchFilters.value.username) params.set('username', searchFilters.value.username)
    if (searchFilters.value.status !== '全部') {
      params.set('status', searchFilters.value.status === '启用' ? '1' : '0')
    }
    if (searchFilters.value.group_name !== '全部') {
      params.set('group_name', searchFilters.value.group_name)
    }

    const res = await fetch(`${API_BASE}/list?${params.toString()}`)
    const json = await res.json()
    if (json.code === 200) {
      employees.value = json.data.list
      pagination.value.total = json.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

// Fetch distinct group names
const fetchGroups = async () => {
  try {
    const res = await fetch(`${API_BASE}/groups`)
    const json = await res.json()
    if (json.code === 200) {
      groupOptions.value = json.data
    }
  } catch (error) {
    console.error('获取小组列表失败', error)
  }
}

// Search (reset to page 1)
const doSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

// Reset filters
const resetFilters = () => {
  searchFilters.value = { name: '', username: '', status: '全部', group_name: '全部' }
  pagination.value.page = 1
  fetchUsers()
}

// Page change
const goToPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  pagination.value.page = p
  fetchUsers()
}

// Toggle user status
const toggleStatus = async (emp) => {
  try {
    const res = await fetch(`${API_BASE}/${emp.id}/toggle-status`, { method: 'PUT' })
    const json = await res.json()
    if (json.code === 200) {
      emp.status = json.data.status
      showOperationMsg(json.msg)
    }
  } catch (error) {
    console.error('状态切换失败', error)
  }
}

// ---- Form Modal (Add / Edit) ----

const openAddModal = () => {
  formMode.value = 'add'
  formData.value = { id: null, name: '', username: '', password: '', group_name: groupOptions.value[0] || '', job_desc: '' }
  showFormModal.value = true
}

const openEditModal = (emp) => {
  formMode.value = 'edit'
  formData.value = {
    id: emp.id,
    name: emp.name,
    username: emp.username,
    password: '',
    group_name: emp.group_name || '',
    job_desc: emp.job_desc || ''
  }
  showFormModal.value = true
}

const submitForm = async () => {
  if (!isFormValid.value) return
  try {
    let res, json
    if (formMode.value === 'add') {
      res = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.value)
      })
    } else {
      res = await fetch(`${API_BASE}/${formData.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.value)
      })
    }
    json = await res.json()
    if (json.code === 200) {
      showFormModal.value = false
      showOperationMsg(json.msg)
      fetchUsers()
      fetchGroups() // refresh groups in case new group was added
    } else {
      alert(json.msg)
    }
  } catch (error) {
    console.error('提交失败', error)
  }
}

// ---- Detail Modal ----

const openDetailModal = async (emp) => {
  try {
    const res = await fetch(`${API_BASE}/${emp.id}`)
    const json = await res.json()
    if (json.code === 200) {
      detailUser.value = json.data
      showDetailModal.value = true
    }
  } catch (error) {
    console.error('获取详情失败', error)
  }
}

// ---- Delete ----

const deleteUser = async (emp) => {
  if (!window.confirm(`确定要删除账号「${emp.name}」吗？\n该操作不可逆，删除后将无法恢复。`)) return
  try {
    const res = await fetch(`${API_BASE}/${emp.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.code === 200) {
      showOperationMsg(json.msg)
      fetchUsers()
    } else {
      alert(json.msg)
    }
  } catch (error) {
    console.error('删除失败', error)
  }
}

// ---- Helpers ----

const showOperationMsg = (msg) => {
  operationMsg.value = msg
  setTimeout(() => { operationMsg.value = '' }, 2500)
}

const statusLabel = (s) => s === 1 ? '已启用' : '已禁用'
const isActive = (s) => s === 1

const groupColors = {
  '研发一部': { bg: 'bg-primary/10', text: 'text-primary' },
  '研发二部': { bg: 'bg-secondary/10', text: 'text-secondary' },
  '测试部':   { bg: 'bg-tertiary/10', text: 'text-tertiary' },
  '产品部':   { bg: 'bg-primary/10', text: 'text-primary' },
}
const getGroupStyle = (g) => groupColors[g] || { bg: 'bg-surface-container', text: 'text-on-surface-variant' }

const formatDate = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

onMounted(() => {
  fetchUsers()
  fetchGroups()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-10 relative">

    <!-- Operation toast -->
    <transition name="fade">
      <div v-if="operationMsg" class="fixed top-6 right-8 z-[60] px-5 py-3 bg-tertiary text-on-tertiary rounded-lg shadow-xl text-sm font-bold flex items-center gap-2 animate-bounce-in">
        <span class="material-symbols-outlined text-[18px]">check_circle</span>
        {{ operationMsg }}
      </div>
    </transition>

    <!-- Data Overview: Bento Grid -->
    <section class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="md:col-span-1 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
        <p class="text-label text-on-surface-variant uppercase tracking-wider font-bold text-[11px] mb-2">系统账号总数</p>
        <div class="flex items-baseline gap-2">
          <span class="font-manrope text-4xl font-extrabold text-primary">{{ pagination.total }}</span>
        </div>
        <div class="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div class="h-full bg-primary w-full"></div>
        </div>
      </div>
      
      <div class="md:col-span-3 bg-surface-container-low p-6 rounded-xl flex flex-col md:flex-row gap-8 items-center">
        <div class="flex-1 space-y-4 w-full">
          <p class="text-label text-on-surface-variant uppercase tracking-wider font-bold text-[11px]">快速操作</p>
          <p class="text-sm text-on-surface-variant opacity-70">通过下方检索面板查找账号，或添加新成员至系统</p>
        </div>
        <div class="hidden lg:block w-px h-16 bg-outline-variant opacity-20"></div>
        <button @click="openAddModal" class="bg-surface-container-lowest px-6 py-4 rounded-lg flex items-center gap-3 group hover:bg-white transition-all shadow-sm shrink-0 active:scale-95 border-2 border-transparent hover:border-primary/20">
          <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_circle</span>
          <div class="text-left">
            <p class="text-sm font-bold text-primary">添加新账号</p>
            <p class="text-[10px] text-on-surface-variant opacity-60">快速录入账号档案</p>
          </div>
        </button>
      </div>
    </section>

    <!-- Employee List -->
    <section class="space-y-6">
      <div class="flex justify-between items-end">
        <div>
           <h3 class="font-manrope text-xl font-bold text-on-surface">账号档案库</h3>
          <p class="text-sm text-on-surface-variant opacity-70 mt-1">管理团队成员身份、角色及实时状态</p>
        </div>
      </div>

      <!-- Search Filters -->
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div class="space-y-1.5 md:col-span-1">
          <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">员工姓名</label>
          <input v-model="searchFilters.name" @keyup.enter="doSearch" type="text" placeholder="输入姓名检索" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
        </div>
        <div class="space-y-1.5 md:col-span-1">
          <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">登录账号</label>
          <input v-model="searchFilters.username" @keyup.enter="doSearch" type="text" placeholder="输入账号检索" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
        </div>
        <div class="space-y-1.5 md:col-span-1">
          <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">状态</label>
          <select v-model="searchFilters.status" @change="doSearch" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none appearance-none font-medium cursor-pointer">
            <option value="全部">全部状态</option>
            <option value="启用">已启用</option>
            <option value="禁用">已禁用</option>
          </select>
        </div>
        <div class="space-y-1.5 md:col-span-1">
          <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">所属小组</label>
          <select v-model="searchFilters.group_name" @change="doSearch" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none appearance-none font-medium cursor-pointer">
            <option value="全部">全部小组</option>
            <option v-for="g in groupOptions" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div class="md:col-span-1 flex gap-2">
          <button @click="doSearch" class="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm active:scale-95 transition-all shadow-sm hover:shadow-md">检索</button>
          <button @click="resetFilters" class="flex-1 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors font-bold text-sm border border-surface-container-high active:scale-95">重置</button>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
        <!-- Table Header -->
        <div class="grid grid-cols-12 px-6 py-4 bg-surface-container-low border-b border-outline-variant/10 items-center">
          <div class="col-span-3 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant">账号信息</div>
          <div class="col-span-2 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant text-center">登录账号</div>
          <div class="col-span-2 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant text-center">所属小组</div>
          <div class="col-span-1 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant">岗位描述</div>
          <div class="col-span-1 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant text-center">状态</div>
          <div class="col-span-3 text-label uppercase tracking-widest font-bold text-[10px] text-on-surface-variant text-right">操作</div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="px-6 py-12 text-center text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
          <p class="mt-2 text-sm opacity-60">加载中...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="employees.length === 0" class="px-6 py-12 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl opacity-30">person_off</span>
          <p class="mt-2 text-sm opacity-60">暂无匹配的账号记录</p>
        </div>

        <!-- List Items -->
        <div v-else class="divide-y divide-surface-container">
          <div v-for="emp in employees" :key="emp.id" class="grid grid-cols-12 px-6 py-5 items-center hover:bg-surface-container-low transition-colors group">
            <div class="col-span-3 flex items-center gap-4">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm',
                `bg-${emp.theme_color || 'primary'}/15 text-${emp.theme_color || 'primary'}`
              ]">
                {{ emp.avatar_char || emp.name?.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="font-bold text-on-surface text-sm truncate">{{ emp.name }}</p>
                <p class="text-xs text-on-surface-variant opacity-80 truncate">ID: {{ emp.id }}</p>
              </div>
            </div>
            <div class="col-span-2 text-center font-mono text-xs text-on-surface-variant">{{ emp.username }}</div>
            <div class="col-span-2 text-center">
              <span :class="[
                'px-2.5 py-1 text-[10px] font-bold rounded inline-block',
                getGroupStyle(emp.group_name).bg,
                getGroupStyle(emp.group_name).text
              ]">{{ emp.group_name || '未分配' }}</span>
            </div>
            <div class="col-span-1 text-sm text-on-surface-variant truncate pr-2">{{ emp.job_desc || '-' }}</div>
            <div class="col-span-1 flex justify-center">
              <button @click="toggleStatus(emp)" :class="[
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 hover:shadow-sm w-[72px] justify-center',
                isActive(emp.status) ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border-tertiary/20 hover:bg-tertiary/10' : 'bg-surface-dim text-on-surface-variant border-outline/20 hover:bg-outline/10'
              ]">
                <span :class="['w-1.5 h-1.5 rounded-full shrink-0', isActive(emp.status) ? 'bg-tertiary' : 'bg-outline']"></span> 
                {{ statusLabel(emp.status) }}
              </button>
            </div>
            <div class="col-span-3 text-right flex justify-end gap-1 sm:gap-2">
              <button @click="openDetailModal(emp)" class="text-primary hover:bg-primary/10 px-2 py-1 rounded text-xs transition-colors font-bold tracking-wide">详细</button>
              <button @click="openEditModal(emp)" class="text-secondary hover:bg-secondary/10 px-2 py-1 rounded text-xs transition-colors font-bold tracking-wide">编辑</button>
              <button @click="deleteUser(emp)" class="text-error hover:bg-error/10 px-2 py-1 rounded text-xs transition-colors font-bold tracking-wide">删除</button>
            </div>
          </div>
        </div>

        <!-- Table Footer / Pagination -->
        <div class="px-8 py-4 bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant border-t border-outline-variant/10">
           <p>当前第 {{ pagination.page }} 页，共 {{ pagination.total }} 条记录</p>
          <div class="flex items-center gap-4">
            <button @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1" :class="['flex items-center gap-1 transition-colors', pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary cursor-pointer']">
               <span class="material-symbols-outlined text-sm">chevron_left</span> 上一页
            </button>
            <div class="flex gap-1">
              <span v-for="p in pageNumbers" :key="p"
                @click="goToPage(p)"
                :class="[
                  'w-6 h-6 flex items-center justify-center rounded font-bold cursor-pointer transition-colors',
                  p === pagination.page ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-dim'
                ]">{{ p }}</span>
            </div>
            <button @click="goToPage(pagination.page + 1)" :disabled="pagination.page >= totalPages" :class="['flex items-center gap-1 transition-colors', pagination.page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary cursor-pointer']">
              下一页 <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating FAB -->
    <button @click="openAddModal" class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform group z-40">
       <span class="material-symbols-outlined text-2xl">person_add</span>
      <span class="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">快速添加账号</span>
    </button>
    
    <!-- ============================================ -->
    <!-- Add / Edit Account Modal (shared form)      -->
    <!-- ============================================ -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-scrim/40 backdrop-blur-sm" @click="showFormModal = false" style="background-color: rgba(0,0,0,0.5);"></div>
      
      <div class="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <h3 class="font-headline text-xl font-bold text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">{{ formIcon }}</span>
            {{ formTitle }}
          </h3>
          <button @click="showFormModal = false" class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">姓名 <span class="text-error">*</span></label>
            <input v-model="formData.name" type="text" placeholder="输入真实姓名（首字将作为头像文字）" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">登录账号 <span class="text-error">*</span></label>
              <input v-model="formData.username" type="text" placeholder="输入登录账号" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
            </div>
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">
                {{ formMode === 'add' ? '登录密码' : '重置密码' }}
                <span v-if="formMode === 'add'" class="text-error">*</span>
              </label>
              <input v-model="formData.password" type="password" :placeholder="formMode === 'add' ? '请输入至少8位密码' : '留空则不修改'" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">所属小组</label>
              <select v-model="formData.group_name" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none appearance-none font-medium cursor-pointer">
                <option v-for="g in groupOptions" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
               <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">岗位描述</label>
               <input v-model="formData.job_desc" type="text" placeholder="例如：高级前端开发" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface outline-none placeholder:text-outline-variant/70 transition-all font-medium" />
            </div>
          </div>

          <!-- Avatar char preview -->
          <div v-if="formData.name" class="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
            <div class="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shadow-sm">
              {{ formData.name.charAt(0) }}
            </div>
            <div>
              <p class="text-xs text-on-surface-variant">头像文字预览</p>
              <p class="text-sm font-bold text-on-surface">将自动截取「{{ formData.name.charAt(0) }}」作为头像缩写</p>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-5 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-end gap-3">
          <button @click="showFormModal = false" class="px-5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-bold text-sm transition-colors transform active:scale-95">
            取消
          </button>
          <button @click="submitForm" :disabled="!isFormValid" class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
            {{ formSubmitText }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- User Detail Modal                            -->
    <!-- ============================================ -->
    <div v-if="showDetailModal && detailUser" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-scrim/40 backdrop-blur-sm" @click="showDetailModal = false" style="background-color: rgba(0,0,0,0.5);"></div>
      
      <div class="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <h3 class="font-headline text-xl font-bold text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">badge</span>
            账号详细信息
          </h3>
          <button @click="showDetailModal = false" class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors active:scale-95">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          <!-- Profile header -->
          <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
            <div :class="[
              'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-md',
              `bg-${detailUser.theme_color || 'primary'}/15 text-${detailUser.theme_color || 'primary'}`
            ]">
              {{ detailUser.avatar_char || detailUser.name?.charAt(0) }}
            </div>
            <div>
              <p class="text-lg font-bold text-on-surface">{{ detailUser.name }}</p>
              <p class="text-sm text-on-surface-variant">{{ detailUser.job_desc || '暂无岗位描述' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="[
                  'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                  detailUser.status === 1 ? 'bg-tertiary/10 text-tertiary' : 'bg-outline/10 text-outline'
                ]">
                  <span :class="['w-1.5 h-1.5 rounded-full', detailUser.status === 1 ? 'bg-tertiary' : 'bg-outline']"></span>
                  {{ statusLabel(detailUser.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Detail fields -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">系统 ID</p>
              <p class="text-sm font-mono font-medium text-on-surface">{{ detailUser.id }}</p>
            </div>
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">登录账号</p>
              <p class="text-sm font-mono font-medium text-on-surface">{{ detailUser.username }}</p>
            </div>
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">所属小组</p>
              <p class="text-sm font-medium text-on-surface">{{ detailUser.group_name || '未分配' }}</p>
            </div>
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">头像文字</p>
              <p class="text-sm font-medium text-on-surface">{{ detailUser.avatar_char }}</p>
            </div>
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">创建时间</p>
              <p class="text-sm font-medium text-on-surface">{{ formatDate(detailUser.create_time) }}</p>
            </div>
            <div class="p-3 bg-surface-container-low/60 rounded-lg">
              <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">更新时间</p>
              <p class="text-sm font-medium text-on-surface">{{ formatDate(detailUser.update_time) }}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-end gap-3">
          <button @click="showDetailModal = false; openEditModal(detailUser)" class="px-5 py-2.5 rounded-lg bg-secondary/10 text-secondary font-bold text-sm transition-colors active:scale-95 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">edit</span>
            编辑此账号
          </button>
          <button @click="showDetailModal = false" class="px-5 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-bold text-sm transition-colors active:scale-95">
            关闭
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
