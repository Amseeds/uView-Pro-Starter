<script>
import QfImageCropper from '@/uni_modules/qf-image-cropper/components/qf-image-cropper/qf-image-cropper.vue'

const BASE_URL = 'http://192.168.31.171:8000'

export default {
  components: {
    QfImageCropper,
  },
  methods: {
    async handleCrop(e) {
      console.log('BASE_URL', BASE_URL)
      uni.uploadFile({
        url: `${BASE_URL}/api/file/avatar`,
        filePath: e.tempFilePath,
        name: 'file',
        success: (res) => {
          console.log('上传成功', res)
          uni.navigateBack()
        },
        fail: (err) => {
          console.error('上传失败', err)
          uni.showToast({ title: '上传失败', icon: 'none' })
        },
      })
    },
  },
}
</script>

<template>
  <view>
    <qf-image-cropper :width="400" :height="500" :radius="50" :navigation="false" @crop="handleCrop" />
  </view>
</template>

<style>

</style>
