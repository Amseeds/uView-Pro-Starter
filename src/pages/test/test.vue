<script setup lang="ts">
import type { ColorType } from 'uview-pro/types/global'
import { $u } from 'uview-pro'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <app-page :nav-title="$t('common.testPage')" show-tabbar>
    <view class="app-container">
      测试页面内容
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
