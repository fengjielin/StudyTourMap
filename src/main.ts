import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import App from './App.vue'
import './assets/styles/main.scss'
import 'leaflet/dist/leaflet.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Viewer)
app.mount('#app')
