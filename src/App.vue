<template>
  <el-config-provider :locale="currentLocale">
    <div id="app">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

// 动态语言配置
const currentLocale = computed(() => {
  return configStore.language === 'zh-CN' ? zhCn : en
})

// 确保主题在应用启动时正确应用
onMounted(() => {
  configStore.updateDocumentTheme()
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>