<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useAuthStore } from '@/stores/auth';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const authStore = useAuthStore();
const globalDateRange = ref(null);
const period = ref('today');

const globalDateRangeDisplay = computed(() => {
  if (!globalDateRange.value) return '';
  const formatPart = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
  if (Array.isArray(globalDateRange.value)) {
    const start = formatPart(globalDateRange.value[0]);
    const end = formatPart(globalDateRange.value[1]);
    if (start && end) return `${start} 至 ${end}`;
    if (start) return start;
  }
  return formatPart(globalDateRange.value);
});

// Employee Work Log Detail
const workLogList = ref([]);
const pagination = ref({ page: 1, pageSize: 15, total: 0 });
const isLoading = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.value.total / pagination.value.pageSize)));
const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = pagination.value.page;
  const pages = [];
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);
  start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const getApiParams = () => {
  const params = new URLSearchParams();
  params.append('period', period.value);
  if (period.value === 'custom' && globalDateRange.value) {
    let start, end;
    if (Array.isArray(globalDateRange.value)) {
      start = globalDateRange.value[0];
      end = globalDateRange.value[1];
    } else {
      start = globalDateRange.value;
      end = globalDateRange.value;
    }
    const formatPart = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
    if (start) params.append('startDate', formatPart(start));
    if (end) params.append('endDate', formatPart(end));
  }
  
  if (authStore.user) {
    params.append('username', authStore.user.identifier);
    params.append('userId', authStore.user.id);
  }
  
  return params;
};

const fetchWorkLogDetail = async () => {
  isLoading.value = true;
  try {
    const params = getApiParams();
    params.append('page', pagination.value.page);
    params.append('pageSize', pagination.value.pageSize);

    const res = await fetch(`/api/v1/dashboard/work-log-detail?${params.toString()}`);
    const json = await res.json();
    if (json.code === 200) {
      workLogList.value = json.data.list;
      pagination.value.total = json.data.total;
    }
  } catch (err) {
    console.error('Failed to fetch work log details', err);
  } finally {
    isLoading.value = false;
  }
};

const goToPage = (p) => {
  if (p < 1 || p > totalPages.value) return;
  pagination.value.page = p;
  fetchWorkLogDetail();
};

const exportDetailReport = () => {
  const params = getApiParams();
  window.location.href = `/api/v1/dashboard/work-log-export?${params.toString()}`;
};

watch([period, globalDateRange], () => {
  pagination.value.page = 1;
  fetchWorkLogDetail();
  fetchChartsData();
  fetchMetricsData();
  fetchAlerts();
}, { deep: true });

// Metrics Data
const metrics = ref({
  totalHours: 0,
  businessRatio: 0,
  bugRatio: 0,
  interruptedCount: 0
});

const fetchMetricsData = async () => {
  try {
    const params = getApiParams();
    const res = await fetch(`/api/v1/dashboard/metrics?${params.toString()}`);
    const json = await res.json();
    if (json.code === 200) {
      metrics.value = json.data;
    }
  } catch (err) {
    console.error('Failed to fetch metrics data:', err);
  }
};

// Blocking Alerts Data
const alertsList = ref([]);
const isAlertModalOpen = ref(false);
const allAlertsList = ref([]);

const fetchAlerts = async () => {
  try {
    const params = getApiParams();
    params.set('resolved', '0'); // Show only unresolved alerts on the dashboard list
    const res = await fetch(`/api/v1/dashboard/alerts?${params.toString()}`);
    const json = await res.json();
    if (json.code === 200) {
      alertsList.value = json.data;
    }
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
  }
};

const resolveAlert = async (id) => {
  try {
    const res = await fetch(`/api/v1/dashboard/alerts/${id}/resolve`, {
      method: 'PUT'
    });
    const json = await res.json();
    if (json.code === 200) {
      fetchAlerts();
      fetchMetricsData(); // Update interruptedCount
    }
  } catch (err) {
    console.error('Failed to resolve alert:', err);
  }
};

const calcDays = (startDate) => {
  return dayjs().diff(dayjs(startDate), 'day') || 0;
};

const openAllAlertsModal = async () => {
  try {
    const params = getApiParams();
    const res = await fetch(`/api/v1/dashboard/alerts?${params.toString()}`);
    const json = await res.json();
    if (json.code === 200) {
      allAlertsList.value = json.data;
      isAlertModalOpen.value = true;
    }
  } catch (err) {
    console.error('Failed to fetch all alerts:', err);
  }
};

const closeAlertModal = () => {
  isAlertModalOpen.value = false;
};

// ECharts Chart Data
const pieChartRef = ref(null);
const lineChartRef = ref(null);
let pieChartInstance = null;
let lineChartInstance = null;
const weeklyPeriodDisplay = ref('');

const fetchChartsData = async () => {
  try {
    const params = getApiParams();
    
    const [resDist, resTrend] = await Promise.all([
      fetch(`/api/v1/dashboard/distribution?${params.toString()}`),
      fetch(`/api/v1/dashboard/weekly-trend?${params.toString()}`)
    ]);

    const jsonDist = await resDist.json();
    if (jsonDist.code === 200) {
      renderPieChart(jsonDist.data);
    }

    const jsonTrend = await resTrend.json();
    if (jsonTrend.code === 200) {
      weeklyPeriodDisplay.value = jsonTrend.data.period;
      renderLineChart(jsonTrend.data.trend, jsonTrend.data.total);
    }
  } catch (err) {
    console.error('Failed to fetch charts data:', err);
  }
};

const renderPieChart = (data) => {
  if (!pieChartInstance && pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value);
  }
  if (!pieChartInstance) return;

  const chartData = (data || []).map(item => ({
    name: item.name || '未知',
    value: Number(item.value)
  }));
  
  if (chartData.length === 0) {
    pieChartInstance.clear();
    return;
  }

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}h ({d}%)' },
    legend: { bottom: '0%', left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
    series: [
      {
        name: '工时分布',
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { 
          show: true,
          formatter: '{b}\n{c}h',
          fontSize: 11,
          color: '#555'
        },
        labelLine: { show: true, length: 10, length2: 15 },
        data: chartData
      }
    ]
  };
  pieChartInstance.setOption(option);
};

const renderLineChart = (trendData, totalHours) => {
  if (!lineChartInstance && lineChartRef.value) {
    lineChartInstance = echarts.init(lineChartRef.value);
  }
  if (!lineChartInstance) return;

  const option = {
    title: {
      text: `总计: ${totalHours} h`,
      right: '2%',
      top: '0%',
      textStyle: { fontSize: 13, color: '#00488d', fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        axisLabel: { color: '#666', fontSize: 11 }
      }
    ],
    yAxis: [ { type: 'value', name: '工时(h)', splitLine: { lineStyle: { type: 'dashed' } } } ],
    series: [
      {
        name: '工时',
        type: 'line',
        smooth: true,
        lineStyle: { width: 3, color: '#00488d' },
        itemStyle: { color: '#00488d' },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}h',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#00488d'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 72, 141, 0.25)' },
            { offset: 1, color: 'rgba(0, 72, 141, 0.02)' }
          ])
        },
        data: trendData
      }
    ]
  };
  lineChartInstance.setOption(option);
};

onMounted(() => {
  fetchWorkLogDetail();
  fetchMetricsData();
  fetchAlerts();
  nextTick(() => {
    fetchChartsData();
  });
  
  // Handle resize for echarts
  window.addEventListener('resize', () => {
    if (pieChartInstance) pieChartInstance.resize();
    if (lineChartInstance) lineChartInstance.resize();
  });
});

const getStatusColor = (status) => Object.entries({
  '已确认': 'tertiary',
  '进行中': 'secondary',
  '阻塞': 'error',
  '已审核': 'primary'
}).find(([k]) => status?.includes(k))?.[1] || 'outline';

const formatDate = (d) => d ? d.substring(0, 10) : '';

</script>

<template>
  <div class="px-8 pb-12 pt-8 space-y-10">
    <!-- Global Integrated Time Filter (No Wrapper Box) -->
    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-start gap-4 mb-4">
      <div class="flex flex-wrap items-center bg-surface-container-low rounded-lg p-1.5 shadow-sm border border-outline-variant/10">
        <button @click="period = 'today'; globalDateRange = null" :class="period === 'today' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span class="material-symbols-outlined text-[16px]">today</span>
          本日
        </button>
        <button @click="period = 'week'; globalDateRange = null" :class="period === 'week' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span class="material-symbols-outlined text-[16px]">view_week</span>
          本周
        </button>
        <button @click="period = 'month'; globalDateRange = null" :class="period === 'month' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span class="material-symbols-outlined text-[16px]">calendar_month</span>
          本月
        </button>
        <button @click="period = 'quarter'; globalDateRange = null" :class="period === 'quarter' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span class="material-symbols-outlined text-[16px]">pie_chart</span>
          本季度
        </button>
        <button @click="period = 'year'; globalDateRange = null" :class="period === 'year' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span class="material-symbols-outlined text-[16px]">event_note</span>
          本年度
        </button>
        
        <div class="w-px bg-outline-variant/20 mx-1.5 my-2 self-stretch hidden sm:block"></div>
        
        <div class="flex items-center">
          <VueDatePicker 
            v-model="globalDateRange" 
            range 
            :enable-time-picker="false"
            auto-apply
            @update:model-value="period = 'custom'"
            @open="period = 'custom'"
          >
            <template #trigger>
              <button 
                @click="period = 'custom'" 
                :class="period === 'custom' ? 'bg-white text-primary shadow-sm border-outline-variant/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary border-transparent'" 
                class="px-5 py-2 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5 whitespace-nowrap group"
              >
                <span class="material-symbols-outlined text-[16px]">edit_calendar</span>
                自定义周期
              </button>
            </template>
          </VueDatePicker>
        </div>
      </div>

      <!-- Selected Date Display Card (Appears on the right) -->
      <div 
        v-if="period === 'custom' && globalDateRangeDisplay" 
        class="flex items-center bg-primary/5 text-primary rounded-lg px-4 py-2 border border-primary/20 transition-all shadow-sm whitespace-nowrap h-10 animate-fade-in"
      >
        <span class="material-symbols-outlined text-[16px] mr-2">event_available</span>
        <span class="text-[13px] font-bold tracking-wide font-manrope">{{ globalDateRangeDisplay }}</span>
        <button 
          @click="globalDateRange = null; period = 'week'" 
          class="ml-3 text-primary/50 hover:text-error transition-colors flex items-center justify-center rounded-full hover:bg-error/10 w-6 h-6"
          title="清除所选周期"
        >
          <span class="material-symbols-outlined text-[14px] font-bold">close</span>
        </button>
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.04)] transition-transform hover:-translate-y-1">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-primary/5 rounded-lg">
            <span class="material-symbols-outlined text-primary">schedule</span>
          </div>
          <span class="text-[10px] font-bold text-primary px-2 py-1 bg-primary-fixed rounded-full">TOTAL</span>
        </div>
        <p class="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">总累计工时</p>
        <h3 class="text-3xl font-manrope font-extrabold text-on-surface">{{ metrics.totalHours }} <span class="text-sm font-normal text-on-surface-variant">h</span></h3>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.04)] transition-transform hover:-translate-y-1">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-secondary/5 rounded-lg">
            <span class="material-symbols-outlined text-secondary">business_center</span>
          </div>
        </div>
        <p class="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">有效产品工时占比</p>
        <h3 class="text-3xl font-manrope font-extrabold text-on-surface">{{ metrics.businessRatio }}%</h3>
        <div class="mt-4 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
          <div class="bg-primary h-full rounded-full transition-all duration-500" :style="`width: ${metrics.businessRatio}%`"></div>
        </div>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.04)] transition-transform hover:-translate-y-1" :class="{'border-l-4 border-error': metrics.bugRatio > 25}">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-error-container/20 rounded-lg">
            <span class="material-symbols-outlined text-error">bug_report</span>
          </div>
          <div v-if="metrics.bugRatio > 25" class="flex items-center space-x-1 text-[10px] text-error font-bold bg-error-container px-2 py-0.5 rounded">
            <span class="material-symbols-outlined text-[12px]">warning</span>
            <span>RED LINE 25%</span>
          </div>
        </div>
        <p class="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">Bug 修复占比</p>
        <h3 class="text-3xl font-manrope font-extrabold text-error">{{ metrics.bugRatio }}%</h3>
        <p v-if="metrics.bugRatio > 25" class="mt-4 text-xs text-on-surface-variant italic">高于预警阈值，需关注质量</p>
        <p v-else class="mt-4 text-xs text-on-surface-variant italic">代码质量处于健康状态</p>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0_12px_32px_rgba(0,72,141,0.04)] transition-transform hover:-translate-y-1">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-tertiary/5 rounded-lg">
            <span class="material-symbols-outlined text-tertiary">pause_circle</span>
          </div>
        </div>
        <p class="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">已中断任务</p>
        <h3 class="text-3xl font-manrope font-extrabold text-on-surface">{{ metrics.interruptedCount }}</h3>
        <p class="mt-4 text-xs text-on-surface-variant italic">状态为“已中断”的工作记录</p>
      </div>
    </section>

    <!-- Charts and Blocking Alert Area -->
    <section class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Pie & Line Charts Area (Span 3/4) -->
      <div class="lg:col-span-3 bg-surface-container-low rounded-xl p-6 border border-outline-variant/5 shadow-[0_12px_48px_rgba(0,0,0,0.02)]">
        <div class="flex flex-col md:flex-row h-full gap-6">
          <!-- Pie Chart Area (1/4 of this box) -->
          <div class="w-full md:w-1/4 flex flex-col items-center">
            <h4 class="font-manrope text-base font-bold text-primary self-start mb-2">产品工时分布</h4>
            <div ref="pieChartRef" class="w-full h-64"></div>
          </div>
          
          <!-- Line Chart Area (3/4 of this box) -->
          <div class="w-full md:w-3/4 flex flex-col border-t md:border-t-0 md:border-l border-outline-variant/10 pt-4 md:pt-0 md:pl-6">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-manrope text-base font-bold text-primary">周工作时长分布</h4>
              <span class="text-[10px] font-bold text-on-surface bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">{{ weeklyPeriodDisplay ? weeklyPeriodDisplay : '本周' }}</span>
            </div>
            <div ref="lineChartRef" class="w-full h-64"></div>
          </div>
        </div>
      </div>

      <!-- Blocking Alerts Area -->
      <div class="lg:col-span-1 bg-error-container/20 border border-error/10 rounded-xl p-6 shadow-[0_12px_48px_rgba(0,0,0,0.02)]">
        <div class="flex items-center space-x-2 mb-6">
          <span class="material-symbols-outlined text-error">warning</span>
          <h4 class="font-manrope text-xl font-bold text-error">阻塞预警</h4>
        </div>
        <div class="space-y-4">
          <div v-if="alertsList.length === 0" class="text-center py-6">
            <span class="material-symbols-outlined text-4xl text-error/30 mb-2">task_alt</span>
            <p class="text-sm text-on-surface-variant">当前时间范围内没有阻塞预警</p>
          </div>
          <div v-for="alert in alertsList" :key="alert.id" class="bg-surface-container-lowest p-4 rounded-lg shadow-sm border-l-4 border-error">
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold px-2 py-0.5 bg-error/10 text-error rounded uppercase">PENDING</span>
              <div class="flex items-center space-x-3">
                <span class="text-[10px] text-on-surface-variant font-medium">挂起 {{ calcDays(alert.suspend_start_time) }}天</span>
                <button @click="resolveAlert(alert.id)" class="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase cursor-pointer">
                  <span class="material-symbols-outlined text-[12px] align-middle -mt-0.5 mr-0.5">check_circle</span>移除
                </button>
              </div>
            </div>
            <h5 class="font-bold text-sm text-on-surface mb-1">{{ alert.title }}</h5>
            <p class="text-xs text-on-surface-variant line-clamp-2">{{ alert.reason }}</p>
          </div>
          <button @click="openAllAlertsModal" class="w-full py-3 mt-4 border border-error/20 rounded-lg text-error text-sm font-bold hover:bg-error/5 transition-colors">
            查看全部阻塞任务
          </button>
        </div>
      </div>
    </section>

    <!-- Employee Output List -->
    <section class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.03)]">
      <div class="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
        <div>
          <h4 class="font-manrope text-xl font-bold text-primary">员工每日产出明细</h4>
        </div>
        <button @click="exportDetailReport" class="flex items-center space-x-2 text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors">
          <span class="material-symbols-outlined text-lg">download</span>
          <span>导出明细报表</span>
        </button>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="px-6 py-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
        <p class="mt-2 text-sm opacity-60">加载中...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="workLogList.length === 0" class="px-6 py-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl opacity-30">receipt_long</span>
        <p class="mt-2 text-sm opacity-60">暂无相关产出明细</p>
      </div>

      <!-- Details List -->
      <div v-else class="overflow-x-auto flex flex-col min-h-[400px]">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-surface-container-low/50">
              <th class="text-left px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">登记日期</th>
              <th class="text-left px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">研发人员</th>
              <th class="text-left px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">所属产品 & 类别</th>
              <th class="text-left px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">投入时长</th>
              <th class="text-left px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">工作描述</th>
              <th class="text-right px-8 py-4 font-label font-bold text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/5">
            <tr v-for="(item, index) in workLogList" :key="item.id" :class="index % 2 === 1 ? 'bg-surface-container-low/20' : ''" class="hover:bg-surface-container-low/30 transition-colors">
              <td class="px-8 py-5 text-sm font-mono text-on-surface-variant">{{ formatDate(item.log_date) }}</td>
              <td class="px-8 py-5">
                <div class="flex items-center space-x-3">
                  <div :class="`w-8 h-8 rounded-full bg-${item.sys_user?.theme_color || 'primary'}/10 flex items-center justify-center text-${item.sys_user?.theme_color || 'primary'} font-bold text-xs shrink-0`">
                    {{ item.sys_user?.avatar_char || '?' }}
                  </div>
                  <span class="text-sm font-bold text-on-surface">{{ item.sys_user?.name || '未知' }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <p class="text-sm text-on-surface-variant font-bold">{{ item.product_type }}</p>
                <p class="text-[11px] text-on-surface-variant/70">{{ item.task_category }}</p>
              </td>
              <td class="px-8 py-5 text-sm font-manrope font-bold text-primary">{{ item.work_hours }}h</td>
              <td class="px-8 py-5 text-sm text-on-surface-variant max-w-md">
                <div class="line-clamp-2" :title="item.description">{{ item.description || '-' }}</div>
              </td>
              <td class="px-8 py-5 text-right">
                <span :class="`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-${getStatusColor(item.status)}-container/30 text-${getStatusColor(item.status)}`">
                  {{ item.status || '未知' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination Footer -->
        <div class="px-8 py-4 bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant border-t border-outline-variant/10 mt-auto">
           <p>当前第 {{ pagination.page }} 页，共 {{ pagination.total }} 条明细</p>
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

    <!-- All Alerts Modal -->
    <div v-if="isAlertModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-scrim/40 backdrop-blur-sm" @click="closeAlertModal"></div>
      <div class="relative bg-surface-container-lowest w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-fade-in-up">
        <div class="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest z-10">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-error/10 rounded-xl">
              <span class="material-symbols-outlined text-error">warning</span>
            </div>
            <h3 class="font-manrope text-xl font-bold text-on-surface">全部阻塞任务</h3>
          </div>
          <button @click="closeAlertModal" class="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="overflow-y-auto p-8 bg-surface">
          <div v-if="allAlertsList.length === 0" class="text-center py-12">
            <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">inbox</span>
            <p class="text-on-surface-variant text-lg font-bold">暂无任何阻塞任务记录</p>
          </div>
          <div v-else class="space-y-4">
            <div v-for="alert in allAlertsList" :key="alert.id" 
                 class="bg-surface-container-lowest border rounded-2xl p-6 transition-all hover:shadow-md"
                 :class="alert.is_resolved === 0 ? 'border-error/30' : 'border-outline-variant/20 opacity-70'">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                  <span v-if="alert.is_resolved === 0" class="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full border border-error/20 inline-flex items-center">
                    <span class="material-symbols-outlined text-[14px] mr-1">pending_actions</span> 未解决
                  </span>
                  <span v-else class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 inline-flex items-center">
                    <span class="material-symbols-outlined text-[14px] mr-1">check_circle</span> 已解决
                  </span>
                  <h4 class="font-bold text-lg text-on-surface">{{ alert.title }}</h4>
                </div>
                <div class="text-right">
                  <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">挂起时间</p>
                  <p class="text-sm font-mono text-on-surface">{{ formatDate(alert.suspend_start_time) }}</p>
                </div>
              </div>
              
              <div class="bg-surface-container-low/50 rounded-xl p-4 mb-4">
                <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">阻塞原因描述</p>
                <p class="text-sm text-on-surface leading-relaxed">{{ alert.reason || '无详细描述' }}</p>
              </div>
              
              <div class="flex items-center space-x-2 pt-4 border-t border-outline-variant/10">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {{ (alert.sys_user?.name || '?').charAt(0) }}
                </div>
                <div>
                  <p class="text-[10px] font-bold text-on-surface-variant uppercase">责任人</p>
                  <p class="text-sm font-bold text-on-surface">{{ alert.sys_user?.name || '未知' }}</p>
                </div>
                
                <div class="ml-auto" v-if="alert.is_resolved === 0">
                  <p class="text-xs text-error font-medium flex items-center">
                    <span class="material-symbols-outlined text-[14px] mr-1">timer</span>
                    已持续 {{ calcDays(alert.suspend_start_time) }} 天
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
