<script setup>
import SideNavBar from '@/components/layout/SideNavBar.vue'
import TopAppBar from '@/components/layout/TopAppBar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="bg-surface text-on-surface flex min-h-screen">
    <SideNavBar />
    
    <main class="ml-64 flex-1 flex flex-col min-h-screen w-[calc(100%-16rem)]">
      <TopAppBar />
      
      <!-- Main Content Canvas -->
      <div class="flex-1 overflow-x-hidden">
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.fullPath" />
        </router-view>
      </div>

      <!-- Footer Meta -->
      <footer class="mt-8 pb-8 px-8 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div class="flex gap-8">
          <span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">符合 ISO 27001 标准</span>
          <span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">端到端加密</span>
          <span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">自动化审计追踪</span>
        </div>
        <p class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">© 2026 研发企业系统</p>
      </footer>
    </main>
  </div>
</template>
