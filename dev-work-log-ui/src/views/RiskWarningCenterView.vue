<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const threshold = ref(5)
const abnormalList = ref([])
const abnormalLoading = ref(false)

const fetchAbnormalHours = async () => {
  abnormalLoading.value = true
  try {
    const res = await fetch(`/api/v1/dashboard/abnormal-hours?threshold=${threshold.value}`)
    const json = await res.json()
    if (json.code === 200) {
      abnormalList.value = json.data || []
    }
  } catch (error) {
    console.error('Failed to fetch abnormal hours:', error)
  } finally {
    abnormalLoading.value = false
  }
}

watch(threshold, (val) => {
  if (val === '' || val === null) return
  fetchAbnormalHours()
})

onMounted(() => {
  fetchAbnormalHours()
})

const riskOverview = [
  { key: 'active', label: '活动预警', value: 8, hint: '当前仍需跟进的预警事件' },
  { key: 'high', label: '高风险', value: 3, hint: '建议优先由项目经理介入' },
  { key: 'goal', label: '目标偏差', value: 2, hint: '目标资源执行偏离月度规划' },
  { key: 'resource', label: '资源过载', value: 2, hint: '成员负荷超过预期阈值' }
]

const warningCategories = [
  {
    category: '目标预警',
    count: 2,
    description: '围绕 goal_config / goal_define 的预算占用与执行偏差',
    items: ['月度预算占用超 85%', '目标进展低于计划 15% 以上']
  },
  {
    category: '项目预警',
    count: 3,
    description: '围绕 project_tag 的工时、进度、阻塞风险',
    items: ['A 工时超 P 工时', '里程碑延期', '阻塞任务持续未解除']
  },
  {
    category: '资源预警',
    count: 2,
    description: '围绕人员资源负荷、投入分散度与响应能力',
    items: ['成员周负荷超 90%', '同周多项目并行过多']
  },
  {
    category: '日志预警',
    count: 1,
    description: '围绕 work_log 的登记完整性与产出状态',
    items: ['连续 2 日未完成日志补录']
  }
]

const warningList = [
  {
    alert_id: 91001,
    alert_level: '高',
    alert_type: '项目预警',
    alert_title: '会展信息化2.0 实际投入超出当前计划',
    alert_content: '项目 A 工时已达到 118h，超过当前 P 工时 96h，且导出联调节点仍未关闭。',
    goal_name: '产品&项目研发',
    tag_name: '会展信息化2.0',
    owner_name: '李芳',
    related_table: 'project_tag',
    trigger_value: 'A/P = 122.9%',
    create_time: '2026-03-26 09:20',
    follow_action: '建议复核本周人天预算，并重新评估导出联调排期。'
  },
  {
    alert_id: 91002,
    alert_level: '高',
    alert_type: '资源预警',
    alert_title: '张伟本周资源负荷接近满载',
    alert_content: '当前周计划 38h，已分配 3 个项目 Tag，重点工作与常规事项出现冲突。',
    goal_name: '产品&项目研发',
    tag_name: '预售营销3.0',
    owner_name: '张伟',
    related_table: 'user_task',
    trigger_value: 'load_rate = 96%',
    create_time: '2026-03-26 10:05',
    follow_action: '建议将常规巡检任务拆给支撑同学，避免主项目里程碑受影响。'
  },
  {
    alert_id: 91003,
    alert_level: '高',
    alert_type: '阻塞预警',
    alert_title: '预售营销3.0 存在超过 48 小时未解除阻塞',
    alert_content: '营销配置台权限联调阻塞已持续 3 天，影响订单看板联调与冒烟验证。',
    goal_name: '产品&项目研发',
    tag_name: '预售营销3.0',
    owner_name: '张伟',
    related_table: 'work_log',
    trigger_value: 'blocked_hours = 72h',
    create_time: '2026-03-26 11:40',
    follow_action: '建议升级到接口负责人与产品负责人共识处理。'
  },
  {
    alert_id: 91004,
    alert_level: '中',
    alert_type: '目标预警',
    alert_title: '产品&项目研发目标预算占用偏高',
    alert_content: '当前月度预算 52 人天，已占用 46 人天，仍有 2 个核心里程碑未完成。',
    goal_name: '产品&项目研发',
    tag_name: '-',
    owner_name: '团队负责人',
    related_table: 'goal_config',
    trigger_value: 'usage = 88.5%',
    create_time: '2026-03-25 17:30',
    follow_action: '建议核对目标权重与资源倾斜是否需要临时调整。'
  },
  {
    alert_id: 91005,
    alert_level: '中',
    alert_type: '项目预警',
    alert_title: '图表渲染性能预研进度落后',
    alert_content: '按计划本周应完成验证结论输出，目前仅完成图表拆包，测试对比结果尚未补齐。',
    goal_name: '技术预研',
    tag_name: '图表渲染性能预研',
    owner_name: '李芳',
    related_table: 'project_tag',
    trigger_value: 'progress = 38%',
    create_time: '2026-03-25 15:10',
    follow_action: '建议补充性能对比数据后再评估是否进入推广阶段。'
  },
  {
    alert_id: 91006,
    alert_level: '中',
    alert_type: '资源预警',
    alert_title: '李芳跨目标投入偏多',
    alert_content: '当前同时承担会展信息化2.0 与技术预研，两类目标均处于关键推进期。',
    goal_name: '技术预研',
    tag_name: '会展信息化2.0 / 图表渲染性能预研',
    owner_name: '李芳',
    related_table: 'project_tag',
    trigger_value: 'focus_count = 2',
    create_time: '2026-03-25 14:25',
    follow_action: '建议明确主次优先级，避免两边都推进不深。'
  }
]

const todoWarnings = computed(() => warningList.filter((item) => item.alert_level === '高'))
const mediumWarnings = computed(() => warningList.filter((item) => item.alert_level === '中'))

const levelStyle = (level) => {
  if (level === '高') return 'bg-error/10 text-error border-error/10'
  if (level === '中') return 'bg-secondary/10 text-secondary border-secondary/10'
  return 'bg-primary/10 text-primary border-primary/10'
}

const typeStyle = (type) => {
  if (type === '阻塞预警') return 'bg-error/10 text-error'
  if (type === '资源预警') return 'bg-secondary/10 text-secondary'
  if (type === '目标预警') return 'bg-primary/10 text-primary'
  return 'bg-surface-container-low text-on-surface-variant'
}
</script>

<template>
  <div class="px-8 py-8 space-y-8">
    <!-- 1. 当日异常工时预警 (New) -->
    <section v-if="abnormalList.length > 0 || threshold !== 5" class="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 flex flex-col md:flex-row md:items-center gap-6">
        <div class="flex items-center gap-3 shrink-0">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <span class="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h3 class="text-[15px] font-bold text-amber-900">今日异常工时预警</h3>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[11px] text-amber-700/70 font-medium">触发阈值:</span>
              <input 
                v-model.number="threshold" 
                type="number" 
                min="0" 
                max="24"
                class="w-12 bg-white/50 border border-amber-200 rounded px-1 py-0.5 text-[11px] font-bold text-amber-900 outline-none focus:border-amber-400 text-center"
              />
              <span class="text-[11px] text-amber-700/70 font-medium">小时</span>
            </div>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div v-if="abnormalLoading" class="flex items-center gap-2 text-amber-600/60 text-xs italic">
            <span class="animate-pulse">正在侦测异常工时...</span>
          </div>
          <div v-else-if="abnormalList.length > 0" class="flex flex-wrap gap-2">
            <div 
              v-for="user in abnormalList" 
              :key="user.id"
              class="inline-flex items-center gap-2 bg-white/60 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-white/80 transition-colors"
            >
              <span class="text-xs font-bold text-amber-900">{{ user.name }}</span>
              <span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">{{ user.total_hours }}h</span>
            </div>
          </div>
          <div v-else class="text-amber-600/70 text-xs italic">
            目前所有在职成员今日工时均已达标。
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="item in riskOverview"
        :key="item.key"
        class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5"
      >
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{{ item.label }}</p>
        <h3 :class="['text-3xl font-manrope font-extrabold', item.key === 'high' ? 'text-error' : 'text-on-surface']">
          {{ item.value }}
        </h3>
        <p class="text-xs text-on-surface-variant mt-2">{{ item.hint }}</p>
      </div>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10">
          <h3 class="font-manrope text-lg font-bold text-primary">预警分类总览</h3>
          <p class="text-sm text-on-surface-variant mt-1">按目标、项目、资源、日志四类规则汇总，方便快速判断风险分布。</p>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="category in warningCategories"
            :key="category.category"
            class="rounded-2xl bg-surface-container-low border border-outline-variant/10 p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="font-bold text-on-surface">{{ category.category }}</h4>
                <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">{{ category.description }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-primary border border-primary/10">
                {{ category.count }} 条
              </span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="rule in category.items"
                :key="rule"
                class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-on-surface-variant border border-outline-variant/10"
              >
                {{ rule }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10">
          <h3 class="font-manrope text-lg font-bold text-primary">重点关注</h3>
          <p class="text-sm text-on-surface-variant mt-1">优先跟进高风险预警，同时保留中风险排查项。</p>
        </div>

        <div class="p-6 space-y-4">
          <div class="rounded-2xl bg-error/5 border border-error/10 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-error/80">高风险</p>
                <h4 class="mt-2 text-2xl font-manrope font-extrabold text-error">{{ todoWarnings.length }}</h4>
              </div>
              <span class="material-symbols-outlined text-error text-3xl">warning</span>
            </div>
            <p class="text-sm text-on-surface-variant mt-3">涉及项目超配、资源满载、阻塞超时等需立即处理的事项。</p>
          </div>

          <div class="rounded-2xl bg-surface-container-low border border-outline-variant/10 p-5">
            <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">中风险</p>
            <h4 class="mt-2 text-2xl font-manrope font-extrabold text-on-surface">{{ mediumWarnings.length }}</h4>
            <p class="text-sm text-on-surface-variant mt-3">主要用于提醒预算偏差、进度滞后与跨项目资源分散问题。</p>
          </div>

          <div class="rounded-2xl bg-primary/5 border border-primary/10 p-5">
            <p class="text-xs font-bold uppercase tracking-widest text-primary/80">建议动作</p>
            <div class="mt-3 space-y-2 text-sm text-on-surface-variant leading-relaxed">
              <p>1. 每日站会优先过一遍高风险项目与阻塞项。</p>
              <p>2. 每周复盘时核对目标预算占用与 P/A 偏差。</p>
              <p>3. 对连续两周高负荷成员及时做资源腾挪。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-outline-variant/10">
        <h3 class="font-manrope text-lg font-bold text-primary">预警清单</h3>
        <p class="text-sm text-on-surface-variant mt-1">Mock 数据按 `risk_warning` 思路组织，承接 alert_id、alert_type、alert_level、trigger_value 等核心字段。</p>
      </div>

      <div class="divide-y divide-outline-variant/10">
        <article
          v-for="warning in warningList"
          :key="warning.alert_id"
          class="px-6 py-5 hover:bg-surface-container-low/30 transition-colors"
        >
          <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold border', levelStyle(warning.alert_level)]">
                  {{ warning.alert_level }}风险
                </span>
                <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold', typeStyle(warning.alert_type)]">
                  {{ warning.alert_type }}
                </span>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-container-low text-on-surface-variant">
                  alert_id: {{ warning.alert_id }}
                </span>
              </div>

              <h4 class="mt-3 text-base font-bold text-on-surface">{{ warning.alert_title }}</h4>
              <p class="mt-2 text-sm text-on-surface-variant leading-relaxed">{{ warning.alert_content }}</p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-primary border border-primary/10">
                  目标：{{ warning.goal_name }}
                </span>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-primary border border-primary/10">
                  项目Tag：{{ warning.tag_name }}
                </span>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-on-surface-variant border border-outline-variant/10">
                  责任人：{{ warning.owner_name }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3 xl:min-w-[280px]">
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">触发值</p>
                <p class="text-sm font-bold text-on-surface">{{ warning.trigger_value }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">来源表</p>
                <p class="text-sm font-bold text-on-surface">{{ warning.related_table }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3 md:col-span-2 xl:col-span-1">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">建议动作</p>
                <p class="text-sm text-on-surface-variant leading-relaxed">{{ warning.follow_action }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3 md:col-span-2 xl:col-span-1">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">触发时间</p>
                <p class="text-sm font-bold text-on-surface">{{ warning.create_time }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
