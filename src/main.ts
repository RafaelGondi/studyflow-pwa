import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Akoma } from '@rafael_dias/akoma'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Akoma)
app.mount('#app')
