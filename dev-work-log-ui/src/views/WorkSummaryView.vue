<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const DashboardTabView = defineAsyncComponent(() => import('@/views/DashboardView.vue'))
const LogSummaryTabView = defineAsyncComponent(() => import('@/views/LogSummaryView.vue'))

const route = useRoute()

const activeTab = computed(() => {
  const tab = route.query.tab
  return tab === 'log-summary' ? 'log-summary' : 'dashboard'
})

const activeComponent = computed(() => (
  activeTab.value === 'dashboard' ? DashboardTabView : LogSummaryTabView
))
</script>

<template>
  <div class="pb-12">
      <Suspense>
        <component :is="activeComponent" />

        <template #fallback>
          <div class="px-8 py-16 flex flex-col items-center justify-center text-center text-on-surface-variant">
            <span class="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p class="mt-3 text-sm font-medium">正在加载当前汇总内容...</p>
          </div>
        </template>
      </Suspense>
  </div>
</template>
