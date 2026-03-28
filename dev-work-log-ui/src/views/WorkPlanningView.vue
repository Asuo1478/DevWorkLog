<script setup>
import { computed, ref } from 'vue'

const activeTab = ref('weekly-plan')

const weeklyTasks = ref([
  {
    task_id: 2001,
    user_id: 1,
    user_name: '张伟',
    tag_id: 1002,
    tag_name: '预售营销3.0',
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

const projectTags = ref([
  {
    tag_id: 1001,
    tag_name: '会展信息化2.0',
    goal_name: '产品&项目研发',
    owner_name: '李芳',
    year: 2026,
    start_date: '2026-03-01',
    end_date: '2026-04-15',
    budget_days: 18,
    budget_hours: 144,
    priority: '高',
    status: '进行中',
    progress_rate: 56,
    p_hours: 42,
    a_hours: 37.5,
    tag_desc: '完成报名、支付、导出和后台管理升级'
  },
  {
    tag_id: 1002,
    tag_name: '预售营销3.0',
    goal_name: '产品&项目研发',
    owner_name: '张伟',
    year: 2026,
    start_date: '2026-03-05',
    end_date: '2026-04-28',
    budget_days: 16,
    budget_hours: 128,
    priority: '高',
    status: '进行中',
    progress_rate: 41,
    p_hours: 36,
    a_hours: 29,
    tag_desc: '升级预售营销配置台、数据面板和订单策略'
  },
  {
    tag_id: 1003,
    tag_name: '线上环境巡检优化',
    goal_name: '常规运维',
    owner_name: '王磊',
    year: 2026,
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    budget_days: 8,
    budget_hours: 64,
    priority: '中',
    status: '进行中',
    progress_rate: 72,
    p_hours: 18,
    a_hours: 16,
    tag_desc: '规范巡检清单并沉淀巡检报告模板'
  },
  {
    tag_id: 1004,
    tag_name: '图表渲染性能预研',
    goal_name: '技术预研',
    owner_name: '李芳',
    year: 2026,
    start_date: '2026-03-10',
    end_date: '2026-03-31',
    budget_days: 7,
    budget_hours: 56,
    priority: '中',
    status: '风险中',
    progress_rate: 38,
    p_hours: 14,
    a_hours: 19,
    tag_desc: '验证按需拆包、图表懒加载与性能优化收益'
  }
])

const tabs = [
  { key: 'weekly-plan', label: '周计划', description: '聚焦 `user_task` 维度的个人周规划任务管理。' },
  { key: 'project-manage', label: '项目管理', description: '聚焦 `project_tag` 维度的项目整体计划管理。' }
]

const totalPlanHours = computed(() => weeklyTasks.value.reduce((sum, item) => sum + Number(item.p_hours || 0), 0))
const completedWeeklyTasks = computed(() => weeklyTasks.value.filter(item => item.task_status === '已完成').length)
const activeProjects = computed(() => projectTags.value.filter(item => item.status !== '已完成' && item.status !== '已关闭').length)
const riskProjects = computed(() => projectTags.value.filter(item => item.status === '风险中').length)

const getStatusStyle = (status) => {
  if (status === '已完成') return 'bg-primary/10 text-primary'
  if (status === '进行中') return 'bg-secondary/10 text-secondary'
  if (status === '待启动') return 'bg-outline/10 text-on-surface-variant'
  if (status === '风险中') return 'bg-error/10 text-error'
  return 'bg-surface-container text-on-surface-variant'
}

const deviationText = (project) => Number((project.a_hours - project.p_hours).toFixed(1))
</script>

<template>
  <div class="px-8 py-8 space-y-8">
    <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-[0_12px_32px_rgba(0,72,141,0.04)] overflow-hidden">
      <div class="px-6 py-5 border-b border-outline-variant/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 class="font-manrope text-xl font-bold text-primary">工作规划</h3>
          <p class="text-sm text-on-surface-variant mt-1">拆分“周计划”和“项目管理”，承接个人执行规划与项目整体管理。</p>
        </div>
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
      </div>

      <div class="px-6 py-3 bg-surface-container-low/40 border-b border-outline-variant/10">
        <p class="text-xs font-medium text-on-surface-variant">
          {{ tabs.find(tab => tab.key === activeTab)?.description }}
        </p>
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
            <h4 class="text-2xl font-manrope font-extrabold text-on-surface">{{ weeklyTasks.length }}</h4>
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
            <p class="text-sm text-on-surface-variant mt-1">以下 Mock 数据按 `user_task` 表结构组织，并补充展示用户名与 Tag 名。</p>
          </div>

          <div class="divide-y divide-outline-variant/10">
            <div v-for="task in weeklyTasks" :key="task.task_id" class="px-6 py-5 hover:bg-surface-container-low/40 transition-colors">
              <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">task_id: {{ task.task_id }}</span>
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
        </div>
      </div>

      <div v-else class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">项目总数</p>
            <h4 class="text-2xl font-manrope font-extrabold text-on-surface">{{ projectTags.length }}</h4>
            <p class="text-xs text-on-surface-variant mt-2">来源字段：`project_tag.tag_id`</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">活跃项目</p>
            <h4 class="text-2xl font-manrope font-extrabold text-primary">{{ activeProjects }}</h4>
            <p class="text-xs text-on-surface-variant mt-2">状态不为已完成/已关闭</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">风险项目</p>
            <h4 class="text-2xl font-manrope font-extrabold text-error">{{ riskProjects }}</h4>
            <p class="text-xs text-on-surface-variant mt-2">用于提醒项目管理者聚焦跟进</p>
          </div>
          <div class="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tag预算工时</p>
            <h4 class="text-2xl font-manrope font-extrabold text-on-surface">{{ projectTags.reduce((sum, item) => sum + Number(item.budget_hours || 0), 0) }}h</h4>
            <p class="text-xs text-on-surface-variant mt-2">字段来源：`project_tag.budget_hours`</p>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div
            v-for="project in projectTags"
            :key="project.tag_id"
            class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden"
          >
            <div class="px-5 py-4 border-b border-outline-variant/10 flex justify-between items-start gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">{{ project.goal_name }}</span>
                  <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold', getStatusStyle(project.status)]">{{ project.status }}</span>
                </div>
                <h5 class="mt-3 text-base font-bold text-on-surface">{{ project.tag_name }}</h5>
                <p class="text-sm text-on-surface-variant mt-1">{{ project.tag_desc }}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-surface-container-low text-on-surface-variant">
                tag_id: {{ project.tag_id }}
              </span>
            </div>

            <div class="p-5 grid grid-cols-2 gap-4">
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">负责人</p>
                <p class="text-sm font-bold text-on-surface">{{ project.owner_name }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">优先级</p>
                <p class="text-sm font-bold text-on-surface">{{ project.priority }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">计划区间</p>
                <p class="text-sm font-bold text-on-surface">{{ project.start_date }} 至 {{ project.end_date }}</p>
              </div>
              <div class="rounded-xl bg-surface-container-low px-4 py-3">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">预算</p>
                <p class="text-sm font-bold text-on-surface">{{ project.budget_days }}人天 / {{ project.budget_hours }}h</p>
              </div>
            </div>

            <div class="px-5 pb-5">
              <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">P工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface">{{ project.p_hours }}</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">A工时</p>
                  <p class="font-manrope text-xl font-extrabold text-on-surface">{{ project.a_hours }}</p>
                </div>
                <div class="rounded-xl bg-surface-container-low px-4 py-3">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">偏差</p>
                  <p :class="['font-manrope text-xl font-extrabold', deviationText(project) > 0 ? 'text-error' : 'text-primary']">
                    {{ deviationText(project) }}
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
      </div>
    </section>
  </div>
</template>
