import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// 加载 ionicons 图标数据
import { addIcons } from 'ionicons'
import * as allIcons from 'ionicons/icons'
const iconObj = {}
Object.entries(allIcons).forEach(([key, value]) => { iconObj[key] = value })
addIcons(iconObj)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
