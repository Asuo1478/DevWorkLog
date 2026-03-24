<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// 是否是管理员（jhtadmin 可以查看所有人数据）
const isAdmin = computed(() => authStore.user.identifier === 'jhtadmin')

const dateRange = ref([new Date(), null])

const formatDate = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''

const dateRangeDisplay = computed(() => {
  if (!dateRange.value) return '';
  if (Array.isArray(dateRange.value)) {
    const start = formatDate(dateRange.value[0]);
    const end = formatDate(dateRange.value[1]);
    if (start && end) return `${start} 至 ${end}`;
    if (start) return start;
  }
  return formatDate(dateRange.value);
})

const displayPeriod = computed(() => {
  if (!dateRange.value) return '- / -'
  const fmt = (d) => d ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` : ''
  if (Array.isArray(dateRange.value)) {
    const start = fmt(dateRange.value[0])
    const end = fmt(dateRange.value[1])
    if (start && end) return `${start} - ${end}`
    if (start) return `${start} - /`
  } else {
    const d = fmt(dateRange.value)
    if (d) return `${d} - /`
  }
  return '- / -'
})

const statMode = ref('product')
const records = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 10

const filterName = ref('')
const filterProduct = ref('全部产品')
const filterCategory = ref('全部类别')

// 统计模式到后端 groupBy 参数的映射
const statModeToGroupBy = {
  product: 'product_type',
  category: 'task_category',
  daily: 'daily'
}

// 构建通用的查询参数
const buildQueryParams = () => {
  const params = new URLSearchParams()
  params.set('page', currentPage.value)
  params.set('limit', pageSize)
  params.set('groupBy', statModeToGroupBy[statMode.value])
  params.set('isAdmin', isAdmin.value ? 'true' : 'false')

  // 日期筛选
  if (dateRange.value && Array.isArray(dateRange.value)) {
    const startDate = formatDate(dateRange.value[0])
    const endDate = formatDate(dateRange.value[1])
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
  }

  // 非管理员时自动注入 userId 过滤
  if (!isAdmin.value && authStore.user.id) {
    params.set('userId', authStore.user.id)
  }

  // 员工姓名前缀模糊
  if (filterName.value.trim()) {
    params.set('userName', filterName.value.trim())
  }

  // 关联产品精确过滤
  if (filterProduct.value && filterProduct.value !== '全部产品') {
    params.set('productType', filterProduct.value)
  }

  // 任务类别精确过滤
  if (filterCategory.value && filterCategory.value !== '全部类别') {
    params.set('taskCategory', filterCategory.value)
  }

  return params.toString()
}

const fetchRecords = async () => {
  if (!authStore.user.id) return

  try {
    const res = await fetch(`/api/v1/work-logs/summary?${buildQueryParams()}`)
    const json = await res.json()
    if (json.code === 200) {
      totalCount.value = json.data.total
      records.value = json.data.list.map(item => ({
        id: `${item.user_id}-${item.log_date}-${item.product_type || item.task_category || 'daily'}`,
        name: item.sys_user?.name || '未知',
        char: item.sys_user?.avatar_char || '?',
        color: item.sys_user?.theme_color || 'primary',
        date: item.log_date,
        product: item.product_type || '全天耗时',
        category: item.task_category || '全天耗时',
        hours: Number(item.total_hours) || 0
      }))
    }
  } catch (error) {
    console.error('[LogSummary] fetch error:', error)
  }
}

// 切换模式、日期、或翻页时自动刷新
watch([statMode, dateRange, currentPage], () => {
  fetchRecords()
}, { deep: true })

onMounted(() => {
  fetchRecords()
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(currentPage.value * pageSize, totalCount.value)
  return `显示第 ${totalCount.value > 0 ? start : 0}-${end} 条，共 ${totalCount.value} 条`
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-10">
    <!-- Filters & Actions Section (Bento Style Layout) -->
    <section class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Filter Card -->
      <div class="lg:col-span-3 bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.04)]">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_260px] gap-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">员工姓名</label>
            <input v-model="filterName" @change="fetchRecords" class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary-fixed-dim outline-none text-on-surface" placeholder="输入姓名" type="text" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">关联产品</label>
            <select v-model="filterProduct" @change="fetchRecords" class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary-fixed-dim outline-none text-on-surface">
              <option>全部产品</option>
              <option>预售营销</option>
              <option>溯源营销</option>
              <option>会展信息化</option>
              <option>内部信息化</option>
              <option>其他</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">任务类别</label>
            <select v-model="filterCategory" @change="fetchRecords" class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary-fixed-dim outline-none text-on-surface">
              <option>全部类别</option>
              <option>需求对接</option>
              <option>需求开发</option>
              <option>Bug修复</option>
              <option>测试部署</option>
              <option>培训|会议</option>
              <option>PPT|平台推广</option>
              <option>专利软著</option>
              <option>项目申报</option>
              <option>其他</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">登记日期</label>
            <VueDatePicker 
              v-model="dateRange" 
              range 
              :enable-time-picker="false"
              auto-apply
            >
              <template #trigger>
                <div class="relative w-full">
                  <input 
                    type="text" 
                    readonly 
                    placeholder="选择起止日期" 
                    :value="dateRangeDisplay" 
                    class="w-full bg-surface-container-low border-none rounded-lg text-sm pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-primary-fixed-dim outline-none text-on-surface cursor-pointer"
                  />
                  <!-- Clear Button -->
                  <button 
                    v-if="dateRange" 
                    @click.stop="dateRange = null" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-error rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center"
                    title="清空日期"
                  >
                    <span class="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </template>
            </VueDatePicker>
          </div>
        </div>
      </div>

      <!-- Quick Stats / Actions -->
      <div class="lg:col-span-1 bg-primary text-white p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.1)] flex flex-col justify-between">
        <div>
          <p class="text-xs opacity-70 font-medium">当前查询周期</p>
          <h3 class="text-base font-bold font-headline mt-1 whitespace-nowrap">{{ displayPeriod }}</h3>
        </div>
        <button class="w-full bg-white text-primary py-2.5 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 mt-4 hover:bg-slate-100 transition-colors">
          <span class="material-symbols-outlined text-[18px]">download</span>
          <span>导出数据</span>
        </button>
      </div>
    </section>

    <!-- Data Management Section -->
    <section class="space-y-6">
      <!-- View Controller -->
      <div class="flex items-center justify-between border-b border-outline-variant border-opacity-20 pb-4">
        <div class="flex p-1 bg-surface-container-high rounded-lg">
          <button @click="statMode = 'product'" :class="statMode === 'product' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-primary transition-colors'" class="px-6 py-1.5 text-sm rounded-md transition-all">按关联产品统计</button>
          <button @click="statMode = 'category'" :class="statMode === 'category' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-primary transition-colors'" class="px-6 py-1.5 text-sm rounded-md transition-all">按任务类别统计</button>
          <button @click="statMode = 'daily'" :class="statMode === 'daily' ? 'bg-white text-primary font-semibold shadow-sm' : 'text-slate-500 font-medium hover:text-primary transition-colors'" class="px-6 py-1.5 text-sm rounded-md transition-all">按单日耗时统计</button>
        </div>
        <div class="flex items-center space-x-2 text-slate-400">
          <span class="text-xs font-medium">共计 {{ totalCount }} 条记录</span>
          <div class="w-px h-4 bg-slate-300 mx-2"></div>
          <button class="p-1 hover:bg-slate-200 rounded transition-colors"><span class="material-symbols-outlined text-[20px]">sort</span></button>
          <button class="p-1 hover:bg-slate-200 rounded transition-colors"><span class="material-symbols-outlined text-[20px]">grid_view</span></button>
        </div>
      </div>

      <!-- Modern Data Ledger (Table Replacement) -->
      <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low">
                <th class="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">员工姓名</th>
                <th class="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">记录日期</th>
                <th class="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ statMode === 'product' ? '关联产品' : statMode === 'category' ? '任务类别' : '当日耗时' }}</th>
                <th class="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">当日总用时 (h)</th>
              </tr>
            </thead>
            <tbody class="divide-y-0">
              <tr 
                v-for="(rec, index) in records" 
                :key="rec.id" 
                :class="[
                  'hover:bg-surface-container-high transition-colors group',
                  index % 2 === 1 ? 'bg-surface-container-low' : ''
                ]"
              >
                <td class="px-8 py-6">
                  <div class="flex items-center space-x-3">
                    <div :class="`w-9 h-9 rounded-full bg-${rec.color}-fixed flex items-center justify-center text-${rec.color} font-bold text-xs`">{{ rec.char }}</div>
                    <span class="font-semibold text-sm text-slate-800">{{ rec.name }}</span>
                  </div>
                </td>
                <td class="px-8 py-6 text-sm text-slate-500 font-medium">{{ rec.date }}</td>
                <td class="px-8 py-6">
                  <span class="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-full">
                    {{ statMode === 'product' ? rec.product : statMode === 'category' ? rec.category : '全天耗时' }}
                  </span>
                </td>
                <td class="px-8 py-6 text-sm text-right font-bold text-primary">{{ rec.hours.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (Editorial Style) -->
        <div class="px-8 py-6 flex items-center justify-between bg-surface-container-lowest">
          <div class="text-xs text-slate-400 font-medium">{{ paginationInfo }}</div>
          <div class="flex items-center space-x-2">
            <button @click="currentPage > 1 && currentPage--" :disabled="currentPage <= 1" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-30"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <template v-for="p in totalPages" :key="p">
              <button @click="currentPage = p" :class="currentPage === p ? 'w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold shadow-sm' : 'w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors'">{{ p }}</button>
            </template>
            <button @click="currentPage < totalPages && currentPage++" :disabled="currentPage >= totalPages" class="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-30"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* 彻底隐藏 VueDatePicker 底部带时间图标的 Action Row 和附属切换按钮 */
.dp__action_row,
.dp__button,
.dp__button_bottom {
  display: none !important;
}
</style>

