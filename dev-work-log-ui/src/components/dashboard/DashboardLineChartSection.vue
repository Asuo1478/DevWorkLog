<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { use, graphic, init } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, TooltipComponent, GridComponent, TitleComponent, CanvasRenderer])

const props = defineProps({
  trendData: {
    type: Array,
    default: () => []
  },
  totalHours: {
    type: Number,
    default: 0
  },
  periodLabel: {
    type: String,
    default: '本周'
  }
})

const chartRef = ref(null)
let chartInstance = null

const normalizedTrend = computed(() => (
  (props.trendData || []).map(item => Number(item || 0))
))

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = init(chartRef.value)
  }

  chartInstance.setOption({
    title: {
      text: `总计: ${props.totalHours} h`,
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
    yAxis: [
      {
        type: 'value',
        name: '工时(h)',
        splitLine: { lineStyle: { type: 'dashed' } }
      }
    ],
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
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 72, 141, 0.25)' },
            { offset: 1, color: 'rgba(0, 72, 141, 0.02)' }
          ])
        },
        data: normalizedTrend.value
      }
    ]
  })
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

watch([normalizedTrend, () => props.totalHours], () => {
  renderChart()
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div class="w-full md:w-3/4 flex flex-col border-t md:border-t-0 md:border-l border-outline-variant/10 pt-4 md:pt-0 md:pl-6">
    <div class="flex justify-between items-center mb-2">
      <h4 class="font-manrope text-base font-bold text-primary">周工作时长分布</h4>
      <span class="text-[10px] font-bold text-on-surface bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">{{ periodLabel }}</span>
    </div>
    <div ref="chartRef" class="w-full h-64"></div>
  </div>
</template>
