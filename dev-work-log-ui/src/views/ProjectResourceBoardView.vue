<script setup>
import { computed } from 'vue'

const goalSummary = [
  {
    goal_id: 1,
    goal_name: '产品&项目研发',
    weight: 42,
    budget_days: 52,
    occupied_days: 34,
    active_tags: 2,
    progress_rate: 49
  },
  {
    goal_id: 2,
    goal_name: '常规运维',
    weight: 23,
    budget_days: 28,
    occupied_days: 18,
    active_tags: 1,
    progress_rate: 72
  },
  {
    goal_id: 3,
    goal_name: '团队日常',
    weight: 18,
    budget_days: 20,
    occupied_days: 7,
    active_tags: 1,
    progress_rate: 65
  },
  {
    goal_id: 4,
    goal_name: '技术预研',
    weight: 17,
    budget_days: 18,
    occupied_days: 9,
    active_tags: 1,
    progress_rate: 38
  }
]

const projectSummary = [
  {
    tag_id: 1001,
    tag_name: '会展信息化2.0',
    goal_name: '产品&项目研发',
    owner_name: '李芳',
    budget_days: 18,
    budget_hours: 144,
    actual_days: 11.5,
    actual_hours: 92,
    progress_rate: 56,
    risk_level: '中'
  },
  {
    tag_id: 1002,
    tag_name: '预售营销3.0',
    goal_name: '产品&项目研发',
    owner_name: '张伟',
    budget_days: 16,
    budget_hours: 128,
    actual_days: 9.2,
    actual_hours: 74,
    progress_rate: 41,
    risk_level: '中'
  },
  {
    tag_id: 1003,
    tag_name: '线上环境巡检优化',
    goal_name: '常规运维',
    owner_name: '王磊',
    budget_days: 8,
    budget_hours: 64,
    actual_days: 5,
    actual_hours: 40,
    progress_rate: 72,
    risk_level: '低'
  },
  {
    tag_id: 1004,
    tag_name: '研发周会与知识库沉淀',
    goal_name: '团队日常',
    owner_name: '张伟',
    budget_days: 6,
    budget_hours: 48,
    actual_days: 2,
    actual_hours: 16,
    progress_rate: 65,
    risk_level: '低'
  },
  {
    tag_id: 1005,
    tag_name: '图表渲染性能预研',
    goal_name: '技术预研',
    owner_name: '李芳',
    budget_days: 7,
    budget_hours: 56,
    actual_days: 4,
    actual_hours: 32,
    progress_rate: 38,
    risk_level: '高'
  }
]

const resourceLoad = [
  {
    user_id: 1,
    user_name: '张伟',
    group_name: '研发一部',
    focus_goal: '产品&项目研发',
    assigned_tags: ['预售营销3.0', '研发周会与知识库沉淀'],
    weekly_hours: 24,
    load_rate: 92,
    load_status: '高负荷'
  },
  {
    user_id: 2,
    user_name: '李芳',
    group_name: '研发二部',
    focus_goal: '产品&项目研发',
    assigned_tags: ['会展信息化2.0', '图表渲染性能预研'],
    weekly_hours: 26,
    load_rate: 98,
    load_status: '高负荷'
  },
  {
    user_id: 3,
    user_name: '测试部',
    group_name: '测试部',
    focus_goal: '常规运维',
    assigned_tags: ['线上环境巡检优化'],
    weekly_hours: 14,
    load_rate: 54,
    load_status: '平衡'
  }
]

const totalBudgetDays = computed(() => goalSummary.reduce((sum, item) => sum + item.budget_days, 0))
const totalOccupiedDays = computed(() => goalSummary.reduce((sum, item) => sum + item.occupied_days, 0))
const totalProjects = computed(() => projectSummary.length)
const highRiskProjects = computed(() => projectSummary.filter(item => item.risk_level === '高').length)

const budgetUsage = (item) => Math.min((item.occupied_days / item.budget_days) * 100, 100)
const projectUsage = (item) => Math.min((item.actual_days / item.budget_days) * 100, 100)

const loadStyle = (status) => {
  if (status === '高负荷') return 'bg-error/10 text-error'
  if (status === '平衡') return 'bg-primary/10 text-primary'
  return 'bg-outline/10 text-on-surface-variant'
}

const riskStyle = (riskLevel) => {
  if (riskLevel === '高') return 'bg-error/10 text-error'
  if (riskLevel === '中') return 'bg-secondary/10 text-secondary'
  return 'bg-primary/10 text-primary'
}
</script>

<template>
  <div class="px-8 py-8 space-y-8">
    <section class="grid grid-cols-1 md:grid-cols-4 gap-5">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">目标预算总量</p>
        <h3 class="text-3xl font-manrope font-extrabold text-primary">{{ totalBudgetDays }}</h3>
        <p class="text-xs text-on-surface-variant mt-2">汇总 `goal_config.budget_days`</p>
      </div>
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">已占用预算</p>
        <h3 class="text-3xl font-manrope font-extrabold text-on-surface">{{ totalOccupiedDays }}</h3>
        <p class="text-xs text-on-surface-variant mt-2">汇总 `project_tag.budget_days` 占用</p>
      </div>
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">活跃项目数</p>
        <h3 class="text-3xl font-manrope font-extrabold text-on-surface">{{ totalProjects }}</h3>
        <p class="text-xs text-on-surface-variant mt-2">体现目标下挂载的项目总体规模</p>
      </div>
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">高风险项目</p>
        <h3 class="text-3xl font-manrope font-extrabold text-error">{{ highRiskProjects }}</h3>
        <p class="text-xs text-on-surface-variant mt-2">便于资源调配和优先级干预</p>
      </div>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10">
          <h4 class="font-manrope text-lg font-bold text-primary">目标预算占用</h4>
          <p class="text-sm text-on-surface-variant mt-1">从目标视角看预算、人天、权重与项目占用情况。</p>
        </div>
        <div class="p-6 space-y-4">
          <div v-for="goal in goalSummary" :key="goal.goal_id" class="rounded-xl bg-surface-container-low p-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h5 class="font-bold text-on-surface">{{ goal.goal_name }}</h5>
                <p class="text-xs text-on-surface-variant mt-1">权重 {{ goal.weight }}% · 活跃项目 {{ goal.active_tags }} 个</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-primary border border-primary/10">
                {{ goal.occupied_days }}/{{ goal.budget_days }} 人天
              </span>
            </div>
            <div class="mt-4">
              <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1">
                <span>预算占用</span>
                <span>{{ budgetUsage(goal).toFixed(0) }}%</span>
              </div>
              <div class="h-2 rounded-full bg-surface overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="`width: ${budgetUsage(goal)}%`"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-outline-variant/10">
          <h4 class="font-manrope text-lg font-bold text-primary">资源负荷分布</h4>
          <p class="text-sm text-on-surface-variant mt-1">从人员视角看资源焦点、项目分配与工作负荷。</p>
        </div>
        <div class="p-6 space-y-4">
          <div v-for="user in resourceLoad" :key="user.user_id" class="rounded-xl bg-surface-container-low p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h5 class="font-bold text-on-surface">{{ user.user_name }}</h5>
                <p class="text-xs text-on-surface-variant mt-1">{{ user.group_name }} · 聚焦 {{ user.focus_goal }}</p>
              </div>
              <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold', loadStyle(user.load_status)]">
                {{ user.load_status }}
              </span>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <span v-for="tag in user.assigned_tags" :key="tag" class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-primary border border-primary/10">
                {{ tag }}
              </span>
            </div>
            <div class="mt-4">
              <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1">
                <span>本周计划负荷</span>
                <span>{{ user.weekly_hours }}h / {{ user.load_rate }}%</span>
              </div>
              <div class="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="user.load_rate >= 90 ? 'bg-error' : 'bg-primary'"
                  :style="`width: ${Math.min(user.load_rate, 100)}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-outline-variant/10">
        <h4 class="font-manrope text-lg font-bold text-primary">项目资源明细</h4>
        <p class="text-sm text-on-surface-variant mt-1">从项目维度看预算、实际投入、进度和风险，支撑资源调度。</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="bg-surface-container-low/70">
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">项目Tag</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">所属目标</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">负责人</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">预算</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">实际投入</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">进度</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">风险</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <tr v-for="project in projectSummary" :key="project.tag_id" class="hover:bg-surface-container-low/40 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-on-surface">{{ project.tag_name }}</p>
                <p class="text-xs text-on-surface-variant mt-1">tag_id: {{ project.tag_id }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-on-surface-variant">{{ project.goal_name }}</td>
              <td class="px-6 py-4 text-sm text-on-surface-variant">{{ project.owner_name }}</td>
              <td class="px-6 py-4 text-sm text-on-surface">
                <span class="font-bold">{{ project.budget_days }}</span> 人天 / {{ project.budget_hours }}h
              </td>
              <td class="px-6 py-4 text-sm text-on-surface">
                <span class="font-bold">{{ project.actual_days }}</span> 人天 / {{ project.actual_hours }}h
              </td>
              <td class="px-6 py-4 min-w-[180px]">
                <div class="flex justify-between items-center text-xs text-on-surface-variant mb-1">
                  <span>{{ project.progress_rate }}%</span>
                  <span>{{ projectUsage(project).toFixed(0) }}% 预算占用</span>
                </div>
                <div class="h-2 rounded-full bg-surface overflow-hidden">
                  <div class="h-full rounded-full bg-primary" :style="`width: ${project.progress_rate}%`"></div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold', riskStyle(project.risk_level)]">
                  {{ project.risk_level }}风险
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
