import { fileURLToPath, URL } from 'node:url'

import Uni from '@uni-helper/plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import { uViewProResolver, ZPagingResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniRoot from '@uni-ku/root'
import { UniEchartsResolver } from 'uni-echarts/resolver'
import { UniEcharts } from 'uni-echarts/vite'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'

import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    AutoImport({
      imports: ['vue', 'uni-app'], // 推荐：自动导入 Vue 和 uni-app 常用 API
      resolvers: [UniEchartsResolver()],
      dts: true, // 生成类型声明文件
    }),
    // https://github.com/uni-ku/root
    UniRoot(),
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: [ZPagingResolver(), uViewProResolver(), UniEchartsResolver()],
    }),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
    UnoCSS(),
    UniEcharts(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "uview-pro/theme.scss";',
      },
    },
  },
})
