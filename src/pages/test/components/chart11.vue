<script setup>
import { PieChart } from 'echarts/charts'
import { DatasetComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
// import UniEcharts from 'uni-echarts' // 引入组件(配置自动引入后可以忽略)
import { provideEcharts, provideEchartsTheme } from 'uni-echarts/shared'
import { ref } from 'vue'

// 关键：必须调用 provideEcharts 注入 echarts 实例（使用 Vite 插件可省略）
// provideEcharts(echarts)
// 可选：设置图表主题
// provideEchartsTheme('dark')

// 注册 ECharts 所需模块（按需引入）
echarts.use([
  LegendComponent,
  TooltipComponent,
  DatasetComponent,
  PieChart,
  CanvasRenderer,
])

// 图表配置（根据业务需求修改）
const option = ref({
  legend: { top: 10, left: 'center' },
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: ['30%', '52%'] }],
  dataset: {
    dimensions: ['来源', '数量'],
    source: [['Search Engine', 1048], ['Direct', 735]],
  },
})
</script>

<template>
  <uni-echarts custom-class="chart" :option="option" />
</template>

<style>
.chart { height: 300px; }
</style>
