<script setup lang="ts">
import { useRafFn, useToggle } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import {
  kLink,
  kProvider,
  kToolbar,
  kToolbarPane,
} from 'konsta/vue'
import { storageScrollSpeedReady } from '~/logic/storage'

// --- SETUP ---
const [isOpen, _toggleOpen] = useToggle(false)
const activeTab = ref('control')
const toolbarRef = ref<HTMLElement | null>(null)
// isLightSite: true = сайт светлый (нужен темный виджет)
// isLightSite: false = сайт темный (нужен светлый виджет)
const isLightSite = ref(true)

onMounted(async () => {
  await storageScrollSpeedReady
})

// --- ЛОГИКА ОПРЕДЕЛЕНИЯ ФОНА ---
function getBrightness(color: string): number | null {
  const rgb = color.match(/\d+/g)
  if (!rgb)
    return null
  const r = Number.parseInt(rgb[0])
  const g = Number.parseInt(rgb[1])
  const b = Number.parseInt(rgb[2])
  const a = rgb[3] ? Number.parseFloat(rgb[3]) : 1
  if (a === 0)
    return null
  return (r * 299 + g * 587 + b * 114) / 1000
}

useRafFn(() => {
  if (!toolbarRef.value)
    return
  const rect = toolbarRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const elements = document.elementsFromPoint(centerX, centerY)

  let foundBrightness = 255 // По дефолту считаем сайт белым

  for (const el of elements) {
    if (toolbarRef.value.contains(el))
      continue
    const style = window.getComputedStyle(el)

    // Если под нами картинка/видео -> считаем фон "темным", ставим светлый виджет (безопаснее)
    if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || style.backgroundImage !== 'none') {
      foundBrightness = 0
      break
    }

    const b = getBrightness(style.backgroundColor)
    if (b !== null) {
      foundBrightness = b
      break
    }
  }

  // Если яркость > 128 (Светлый сайт) -> isLightSite = true
  const isLight = foundBrightness > 128
  if (isLightSite.value !== isLight)
    isLightSite.value = isLight
}, { fpsLimit: 15 })
</script>

<template>
  <!--
     theme="ios"
     :dark="!isLightSite" -> Если сайт светлый, тема ios "светлая", но мы инвертируем цвета вручную для стиля
  -->
  <k-provider theme="ios">
    <div
      v-if="!isOpen"
      ref="toolbarRef"
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[2147483647] font-sans transition-all duration-300"
    >
      <!--
        СТИЛИЗАЦИЯ (INVERTED STYLE)
        transition-all duration-500: Плавная смена темы

        СЦЕНАРИЙ 1: САЙТ СВЕТЛЫЙ (isLightSite = true)
        - Фон: Почти черный (#121212/95) - очень плотный, чтобы не просвечивал белый
        - Тень: Мягкая, рассеянная
        - Граница: Едва заметная белая (чтобы отделить от черного текста на сайте)

        СЦЕНАРИЙ 2: САЙТ ТЕМНЫЙ (isLightSite = false)
        - Фон: Белый (#ffffff/95)
        - Текст: Черный
      -->
      <k-toolbar
        class="!relative !w-auto !rounded-full !backdrop-blur-2xl overflow-hidden transition-all duration-500 ease-out border"
        :class="[
          isLightSite
            ? '!bg-[#FFFFFF] border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.12)]' // Темная таблетка
            : '!bg-[#ffffff]/90 border-white/20 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)]', // Светлая таблетка
        ]"
      >
        <k-toolbar-pane class="flex items-center justify-center min-w-[240px] px-1.5 py-1.5 gap-1.5">
          <!-- КНОПКА CONTROL -->
          <k-link
            toolbar
            class="flex-1 !flex !items-center !justify-center !text-center h-9 rounded-full transition-all duration-300 font-semibold text-[14px] tracking-wide cursor-pointer select-none"
            :class="[
              // Если это активная вкладка
              activeTab === 'control'
                ? (isLightSite ? '!bg-white/20 !text-white' : '!bg-black/10 !text-black')
                // Если не активная
                : (isLightSite ? '!text-white/50 hover:!text-white hover:!bg-white/10' : '!text-black/50 hover:!text-black hover:!bg-black/5'),
            ]"
            @click="activeTab = 'control'"
          >
            Control
          </k-link>

          <!-- РАЗДЕЛИТЕЛЬ (Тонкий штрих) -->
          <div
            class="w-px h-4 transition-colors duration-500 rounded-full"
            :class="isLightSite ? 'bg-white/10' : 'bg-black/10'"
          />

          <!-- КНОПКА SETTINGS -->
          <k-link
            toolbar
            class="flex-1 !flex !items-center !justify-center !text-center h-9 rounded-full transition-all duration-300 font-semibold text-[14px] tracking-wide cursor-pointer select-none"
            :class="[
              activeTab === 'settings'
                ? (isLightSite ? '!bg-white/20 !text-white' : '!bg-black/10 !text-black')
                : (isLightSite ? '!text-white/50 hover:!text-white hover:!bg-white/10' : '!text-black/50 hover:!text-black hover:!bg-black/5'),
            ]"
            @click="activeTab = 'settings'"
          >
            Settings
          </k-link>
        </k-toolbar-pane>
      </k-toolbar>
    </div>
  </k-provider>
</template>

<style scoped>
/* Центрирование и сброс отступов Konsta */
:deep(.k-toolbar-inner) {
  padding: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

:deep(.k-link) {
  margin: 0 !important;
}

/* Удаляем системные линии Konsta */
:deep(.hairline-t), :deep(.hairline-b) {
  display: none !important;
}
</style>
