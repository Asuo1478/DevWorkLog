<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const today = new Date()
const todayFormatted = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`
const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const authStore = useAuthStore()

const entries = ref([])

const totalHours = computed(() => {
  return entries.value.reduce((sum, item) => sum + Number(item.hours), 0)
})

const defaultEntry = () => ({
  id: null,
  product: '预售营销',
  category: '需求开发',
  hours: 0,
  status: '进行中',
  desc: ''
})

const currentEntry = ref(defaultEntry())
const editingIndex = ref(-1)
const submitSuccessMessage = ref('')

const fetchLogs = async () => {
  if (!authStore.user.id) return
  try {
    const res = await fetch(`/api/v1/work-logs?startDate=${isoDate}&endDate=${isoDate}&userId=${authStore.user.id}&limit=100`)
    const json = await res.json()
    if (json.code === 200) {
      entries.value = json.data.list.map(item => ({
        id: item.id,
        product: item.product_type,
        category: item.task_category,
        hours: item.work_hours,
        status: item.status,
        desc: item.description
      }))
    }
  } catch (error) {
    console.error(error)
  }
}

const saveEntry = async () => {
  if (!currentEntry.value.desc || currentEntry.value.hours <= 0) return;
  
  const payload = {
    user_id: authStore.user.id,
    log_date: isoDate,
    product_type: currentEntry.value.product,
    task_category: currentEntry.value.category,
    work_hours: currentEntry.value.hours,
    description: currentEntry.value.desc,
    status: currentEntry.value.status
  }

  try {
    const isEditing = editingIndex.value > -1;
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
    await fetchLogs()
    
    submitSuccessMessage.value = isEditing ? '修改成功' : '新增成功'
    setTimeout(() => {
      submitSuccessMessage.value = ''
    }, 3000)
    
  } catch(error) {
    console.error(error)
  }
}

const editEntry = (index) => {
  currentEntry.value = { ...entries.value[index] }
  editingIndex.value = index
}

const cancelEdit = () => {
  currentEntry.value = defaultEntry()
  editingIndex.value = -1
}

const removeEntry = async (index) => {
  if (!window.confirm("确定要彻底删除这条工作记录吗？\n该操作不可逆，删除后将无法恢复。")) {
    return;
  }
  
  const dbId = entries.value[index].id
  try {
    await fetch(`/api/v1/work-logs/${dbId}`, {
      method: 'DELETE'
    })
    await fetchLogs()
  } catch (error) {
    console.error(error)
  }
}

const enforceOneDecimal = (e) => {
  let val = String(e.target.value);
  if (val.includes('.')) {
    const parts = val.split('.');
    if (parts[1].length > 1) {
      e.target.value = parts[0] + '.' + parts[1].substring(0, 1);
      currentEntry.value.hours = Number(e.target.value);
    }
  }
}

onMounted(() => {
  fetchLogs()
})

const exportData = () => {
  if (!authStore.user.id) return
  window.location.href = `/api/v1/work-logs/export?startDate=${isoDate}&endDate=${isoDate}&userId=${authStore.user.id}`
}
</script>

<template>
  <div class="px-12 py-8 max-w-6xl mx-auto pb-32">
    <!-- Header Section: Editorial Style -->
    <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 class="font-headline text-5xl font-extrabold tracking-tight text-primary mb-2">每日工作登记.</h2>
        <p class="font-body text-on-surface-variant text-lg max-w-2xl">为卓越研发进行精准记录。以严谨的架构清晰记录您的日常贡献。</p>
      </div>
    </div>

    <!-- Bento Layout Container -->
    <div class="grid grid-cols-12 gap-8">
      
      <!-- Left Column: Pre-filled Info -->
      <div class="col-span-12 lg:col-span-3 space-y-6">
        <!-- Date Block -->
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
              <li class="flex gap-1.5"><span>•</span> 每日工时建议：8.0 - 10.0h</li>
              <li class="flex gap-1.5"><span>•</span> 填报条目建议：不超过5条</li>
              <li class="flex gap-1.5"><span>•</span> 最小工时单位：0.5h</li>
            </ul>
          </div>
        </div>

        <!-- Summary Card -->
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
      </div>

      <!-- Right Column: Interactive Log Forms & List -->
      <div class="col-span-12 lg:col-span-9 space-y-6">
        
        <!-- Form Area (Always 1) -->
        <div class="p-8 rounded-xl bg-surface-container-lowest shadow-sm shadow-primary/5 hover:shadow-md transition-shadow border border-outline-variant/10 relative">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-xl"></div>
          
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
              <h3 class="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">edit_square</span>
                {{ editingIndex > -1 ? '编辑工作项' : '添加新工作项' }}
              </h3>
            </div>
            <!-- Limit warning indicator -->
            <span v-if="entries.length >= 5 && editingIndex === -1" class="text-xs text-error font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">warning</span>
              条目数达到建议上限
            </span>
          </div>

          <div class="grid grid-cols-2 gap-6 mb-5">
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">关联产品</label>
              <select v-model="currentEntry.product" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
                <option>预售营销</option>
                <option>溯源营销</option>
                <option>会展信息化</option>
                <option>内部信息化</option>
                <option>其他</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline">任务类别</label>
              <select v-model="currentEntry.category" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 appearance-none font-medium text-on-surface outline-none cursor-pointer hover:bg-surface-container transition-colors">
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
          </div>

          <div class="grid grid-cols-2 gap-6 mb-5">
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
            <!-- Success indicator -->
            <div class="text-tertiary text-xs font-bold px-3 py-1.5 bg-tertiary/10 rounded flex items-center gap-1.5 transition-opacity duration-300" :class="submitSuccessMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              {{ submitSuccessMessage }}
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3">
              <button v-if="editingIndex > -1" @click="cancelEdit" class="px-5 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors font-bold text-xs">
                取消编辑
              </button>
              <button @click="saveEntry" :disabled="!currentEntry.desc || currentEntry.hours <= 0" class="px-6 py-2.5 rounded-lg bg-on-surface text-surface font-bold text-xs shadow hover:bg-on-surface/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">save</span>
                {{ editingIndex > -1 ? '保存修改' : '确认添加项' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Spacer -->
        <div class="h-2"></div>

        <!-- Compact List Area -->
        <div v-if="entries.length > 0" class="space-y-4">
          <div class="flex justify-between items-center mb-4">
            <h4 class="font-label text-xs font-bold text-outline uppercase tracking-widest pl-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">list_alt</span>
              当日已填报记录 ({{ entries.length }})
            </h4>
            <button @click="exportData" class="flex items-center space-x-1.5 text-primary font-bold text-xs px-3 py-1.5 hover:bg-primary/5 rounded-lg transition-colors border border-primary/20">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>导出数据</span>
            </button>
          </div>
          
          <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
            <div class="divide-y divide-outline-variant/10">
              <div v-for="(item, index) in entries" :key="item.id" 
                   :class="['p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors group',
                            editingIndex === index ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-container-low border-l-4 border-transparent']">
                
                <!-- Number indicator -->
                <div class="hidden sm:flex w-6 h-6 shrink-0 rounded-full bg-surface-container-high items-center justify-center text-[10px] font-bold text-on-surface-variant font-mono">
                  {{ entries.length - index }}
                </div>
                
                <!-- Content Area -->
                <div class="flex-1 min-w-0 grid grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center">
                  <div class="col-span-12 sm:col-span-3 flex flex-wrap items-center gap-1.5 shrink-0">
                    <span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded" title="关联产品">{{ item.product }}</span>
                    <span class="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded" title="任务类别">{{ item.category }}</span>
                  </div>
                  <div class="col-span-12 sm:col-span-7 text-sm text-on-surface line-clamp-2 sm:truncate leading-relaxed">
                    <span class="opacity-70 text-[10px] mr-1.5 border border-outline-variant/30 rounded px-1">{{ item.status }}</span> 
                    {{ item.desc }}
                  </div>
                  <div class="col-span-12 sm:col-span-2 text-left sm:text-right flex items-center sm:justify-end gap-2">
                    <span class="text-sm font-bold text-primary font-mono bg-white px-2 py-0.5 rounded border border-outline-variant/10 shadow-sm">{{ Number(item.hours).toFixed(1) }}h</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end border-t sm:border-t-0 border-outline-variant/10 pt-2 sm:pt-0 mt-2 sm:mt-0">
                  <button @click="editEntry(index)" :disabled="editingIndex === index" class="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button @click="removeEntry(index)" class="p-2 text-error hover:bg-error/10 rounded-md transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
