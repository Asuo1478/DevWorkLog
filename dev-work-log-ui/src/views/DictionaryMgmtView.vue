<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDictionaryStore } from '../stores/dictionary'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const dictionaryStore = useDictionaryStore()
const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref('PRODUCT_TYPE')
const isModalOpen = ref(false)
const modalMode = ref('add') // 'add' or 'edit'
const currentItem = ref({ id: null, dict_type: 'PRODUCT_TYPE', dict_label: '', dict_value: '', sort_no: 10, status: 1 })
const errorMsg = ref('')

const tabs = [
  { id: 'PRODUCT_TYPE', label: '关联产品' },
  { id: 'TASK_CATEGORY', label: '任务类别' }
]

const filteredList = computed(() => {
  return dictionaryStore.allDictionaries.filter(item => item.dict_type === activeTab.value)
})

const openModal = (mode, item = null) => {
  modalMode.value = mode
  errorMsg.value = ''
  if (mode === 'edit' && item) {
    currentItem.value = { ...item }
  } else {
    currentItem.value = { id: null, dict_type: activeTab.value, dict_label: '', dict_value: '', sort_no: getNextSortNo(), status: 1 }
  }
  isModalOpen.value = true
}

const getNextSortNo = () => {
  if (filteredList.value.length === 0) return 10
  const maxSort = Math.max(...filteredList.value.map(i => i.sort_no))
  return maxSort + 10
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSave = async () => {
  if (!currentItem.value.dict_label) {
    errorMsg.value = '标签不能为空'
    return
  }
  // For this system, label and value are usually the same
  currentItem.value.dict_value = currentItem.value.dict_label
  
  const res = await dictionaryStore.saveDictionaryItem(currentItem.value)
  if (res.success) {
    closeModal()
  } else {
    errorMsg.value = res.msg || '保存失败'
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这项吗？这将影响下拉框显示。')) return
  const res = await dictionaryStore.deleteDictionaryItem(id)
  if (!res.success) {
    alert(res.msg || '删除失败')
  }
}

const toggleStatus = async (item) => {
  const updatedItem = { ...item, status: item.status === 1 ? 0 : 1 }
  const res = await dictionaryStore.saveDictionaryItem(updatedItem)
  if (!res.success) {
    alert(res.msg || '操作失败')
  }
}

onMounted(async () => {
  if (!authStore.isAdmin) {
    router.push('/logs/daily')
    return
  }
  await dictionaryStore.fetchAllDictionaries()
})
</script>

<template>
  <div class="px-12 py-8 max-w-6xl mx-auto pb-32">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="font-headline text-3xl font-bold text-on-surface tracking-tight">字典管理</h1>
        <p class="text-on-surface-variant mt-1 text-sm">管理系统中的“关联产品”与“任务类别”选项，可灵活控制排序与显示状态。</p>
      </div>
      <button 
        @click="openModal('add')"
        class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        新增配置项
      </button>
    </div>

    <!-- Tabs Container -->
    <div class="bg-surface-container-low p-1.5 rounded-xl inline-flex mb-8 shadow-sm border border-outline-variant/10">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300',
          activeTab === tab.id 
            ? 'bg-white text-primary shadow-sm' 
            : 'text-on-surface-variant hover:bg-white/50'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Data List -->
    <div class="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container-low border-b border-outline-variant/20">
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">排序号</th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">配置名称 (Label)</th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">状态</th>
            <th class="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/10">
          <tr 
            v-for="item in filteredList" 
            :key="item.id"
            class="hover:bg-primary/5 transition-colors group"
          >
            <td class="px-6 py-4">
              <span class="font-mono text-sm font-bold text-primary">{{ item.sort_no }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="font-bold text-on-surface">{{ item.dict_label }}</span>
            </td>
            <td class="px-6 py-4">
              <button 
                @click="toggleStatus(item)"
                :class="[
                  'px-3 py-1 rounded-full text-[10px] font-bold transition-all',
                  item.status === 1 
                    ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' 
                    : 'bg-error/10 text-error border border-error/20'
                ]"
              >
                {{ item.status === 1 ? '启用中' : '已禁用' }}
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  @click="openModal('edit', item)"
                  class="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="编辑"
                >
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button 
                  @click="handleDelete(item.id)"
                  class="p-2 text-error hover:bg-error/10 rounded-md transition-colors"
                  title="删除"
                >
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="4" class="px-6 py-12 text-center text-on-surface-variant opacity-60">
              <div class="flex flex-col items-center gap-2">
                <span class="material-symbols-outlined text-4xl">inventory_2</span>
                <p>暂无配置项，点击右上角新增</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Tip -->
    <div class="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
      <span class="material-symbols-outlined text-primary">info</span>
      <div class="text-[11px] leading-relaxed text-on-surface-variant font-medium">
        <p class="font-bold text-primary mb-1">使用提醒：</p>
        <p>1. 禁用状态的项目将不会出现在下拉选择框中，但历史记录中的显示暂不受影响。</p>
        <p>2. 排序号越小排在越前面，建议以 10 为步长进行设置，方便后续插入。</p>
        <p>3. 删除操作不可恢复，请谨慎操作。</p>
      </div>
    </div>

    <!-- Design Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="closeModal"></div>
      <div class="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10 animate-in fade-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-symbols-outlined text-primary text-3xl">settings_input_component</span>
            <h3 class="font-headline text-2xl font-bold">{{ modalMode === 'add' ? '新增' : '编辑' }}{{ activeTab === 'PRODUCT_TYPE' ? '关联产品' : '任务类别' }}</h3>
          </div>

          <div class="space-y-6">
            <div class="space-y-1.5">
              <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline px-1">名称标签 (Label)</label>
              <input 
                v-model="currentItem.dict_label"
                type="text" 
                class="w-full bg-surface-container-low border-none rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                placeholder="请输入显示的文字名称"
              />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline px-1">排序权重 (SortNo)</label>
                <input 
                  v-model.number="currentItem.sort_no"
                  type="number" 
                  class="w-full bg-surface-container-low border-none rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                />
              </div>
              <div class="space-y-1.5">
                <label class="font-label text-[10px] font-bold uppercase tracking-widest text-outline px-1">可用状态</label>
                <select 
                  v-model.number="currentItem.status"
                  class="w-full bg-surface-container-low border-none rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none cursor-pointer"
                >
                  <option :value="1">启用 (Enabled)</option>
                  <option :value="0">禁用 (Disabled)</option>
                </select>
              </div>
            </div>
          </div>

          <p v-if="errorMsg" class="mt-4 text-xs font-bold text-error px-1">{{ errorMsg }}</p>

          <div class="mt-10 flex gap-4">
            <button 
              @click="closeModal"
              class="flex-1 py-4 rounded-xl border border-outline-variant/30 font-bold text-sm tracking-widest hover:bg-surface-container transition-colors uppercase"
            >
              取消
            </button>
            <button 
              @click="handleSave"
              class="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold text-sm tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all uppercase"
            >
              确认并保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
