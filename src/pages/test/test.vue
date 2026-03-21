<script setup lang="ts">
import type { ColorType } from 'uview-pro/types/global'
import { $u } from 'uview-pro'
import { useI18n } from 'vue-i18n'
import chart1 from './components/chart1.vue'
import chart2 from './components/chart2.vue'
import chart3 from './components/chart3.vue'
import chart4 from './components/chart4.vue'
import chart5 from './components/chart5.vue'
import chart6 from './components/chart6.vue'
import chart7 from './components/chart7.vue'
import chart8 from './components/chart8.vue'
import chart9 from './components/chart9.vue'
import chart10 from './components/chart10.vue'

const { t } = useI18n()
</script>

<template>
  <app-page :nav-title="$t('common.testPage')" show-tabbar>
    <view class="app-container">
      <chart1 />
      <chart2 />
      <chart3 />
      <chart4 />
      <chart5 />
      <chart6 />
      <chart7 />
      <chart8 />
      <chart9 />
      <chart10 />
    </view>
  </app-page>
</template>

<style lang="scss" scoped>
.app-container {
  padding: 24rpx;
  background: linear-gradient(180deg, rgba(41, 121, 255, 0.03) 0%, transparent 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
