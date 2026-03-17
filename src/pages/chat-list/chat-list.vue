<script setup lang="ts">
import type { ColorType } from 'uview-pro/types/global'
import { $u } from 'uview-pro'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function toDetail(url: string, _title: string) {
  uni.navigateTo({
    url,
    success: () => {
      // 跳转成功
    },
    fail: (err) => {
      $u.toast(`${t('common.jumpFailed')}: ${err.errMsg}`, 'error')
    },
  })
}
</script>

<template>
  <app-page :nav-title="$t('common.testPage')" show-tabbar>
    <view class="app-container">
      对话列表页面内容
      <u-button type="primary" @click="toDetail('/pages/chat/chat', '聊天详情页')">
        跳转到对话详情页
      </u-button>
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
