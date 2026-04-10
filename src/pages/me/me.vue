<script>
export default {
  methods: {
    toCropper() {
      uni.navigateTo({
        url: '/pages/cropper/round',
      })
    },
  },
}
</script>

<template>
  <app-page :nav-title="$t('common.me')" :show-tabbar="true">
    <u-button type="primary" @click="toCropper">
      主要按钮
    </u-button>
  </app-page>
</template>
