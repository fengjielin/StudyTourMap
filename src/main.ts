import { createPinia } from 'pinia'
import router from './router'
import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import App from './App.vue'
import './assets/styles/main.scss'
import 'leaflet/dist/leaflet.css'
import Cookies from 'js-cookie';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import locale from 'element-plus/es/locale/lang/zh-cn';


const app = createApp(App)
const pinia = createPinia()

// 使用element-plus 并且设置全局的大小
app.use(ElementPlus, {
  locale: locale,
  // 支持 large、default、small
  size: Cookies.get('size') || 'default',
});

app.use(pinia)
app.use(router)
app.use(Viewer)
app.mount('#app')
