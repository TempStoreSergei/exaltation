/* eslint-disable no-console */
import { onMessage } from 'webext-bridge/content-script'
import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'

import css from '~/styles/main.css?inline'

(() => {
  console.info('[vitesse-webext] Hello world from content script')

  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  // Создаем контейнер
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')

  // Создаем Shadow DOM
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container

  // --- ВНЕДРЯЕМ СТИЛИ ---
  // 2. Создаем тег <style> внутри Shadow DOM
  const styleEl = document.createElement('style')
  // 3. Записываем туда содержимое вашего main.css (с уже обработанным Tailwind)
  styleEl.textContent = css
  shadowDOM.appendChild(styleEl)
  // ----------------------

  shadowDOM.appendChild(root)
  document.body.appendChild(container)

  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()