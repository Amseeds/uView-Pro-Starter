<script setup>
import { ref } from 'vue'

const straightChart = ref(null)
const straightOption = ref({
  title: {
    text: '直线折线图',
    textStyle: {
      fontSize: 16,
      color: '#333',
    },
  },
  xAxis: {
    type: 'category',
    data: ['一月', '二月', '三月', '四月', '五月', '六月'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '销售额',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230],
      smooth: false, // 直线模式
      lineStyle: {
        width: 2,
      },
      label: {
        show: true, // 显示标签
        color: '#666',
        position: 'top', // 标签的位置，可以是 'top', 'bottom', 'left', 'right' 等
      },
    },
  ],
})
</script>

<template>
  <view>
    <ly-charts-line
      ref="straightChart"
      :option="straightOption"
      height="260px"
      @click="onChartClick"
    />
  </view>
</template>
