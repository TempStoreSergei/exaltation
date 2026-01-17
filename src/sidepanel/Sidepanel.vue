<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  kApp,
  kBlock,
  kBlockTitle,
  kButton,
  kCard,
  kNavbar,
  kPage,
  kTabbar,
  kTabbarLink,
} from 'konsta/vue'
import { useContextStore } from '~/stores/ContextManager'
import type { PageAnalysisResult } from '~/stores/ContextManager'
import SearchWidget from '~/components/SearchWidget.vue'
import ReaderView from '~/components/ReaderView.vue'
import MediaGrabber from '~/components/MediaGrabber.vue'

const contextStore = useContextStore()

// Active tab for navigation
const activeTab = ref<'home' | 'reader' | 'media'>('home')

// Determine which view to show based on context
const showReaderButton = computed(() => contextStore.hasLongText)
const showMediaButton = computed(() => contextStore.hasMedia)

// Request page analysis from content script
async function requestPageAnalysis() {
  contextStore.setLoading(true)
  try {
    // Get the active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    const tab = tabs[0]

    if (tab?.id) {
      // Execute content script to analyze the page
      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: analyzePage,
      })

      if (results?.[0]?.result) {
        const analysis = results[0].result as PageAnalysisResult
        contextStore.updateContext(analysis)
      }
    }
  }
  catch (error) {
    console.error('Failed to analyze page:', error)
  }
  finally {
    contextStore.setLoading(false)
  }
}

// Function that runs in the content script context
function analyzePage(): PageAnalysisResult {
  const MIN_TEXT_LENGTH = 1000
  const ARTICLE_SELECTORS = ['article', '[role="article"]', '.article', '.post', '.entry', 'main']

  // Check for long text content
  let hasLongText = false
  let textContent = ''

  for (const selector of ARTICLE_SELECTORS) {
    const el = document.querySelector(selector)
    if (el) {
      textContent = el.textContent || ''
      if (textContent.length > MIN_TEXT_LENGTH) {
        hasLongText = true
        break
      }
    }
  }

  // Fallback: check body text
  if (!hasLongText) {
    const bodyText = document.body?.textContent || ''
    if (bodyText.length > MIN_TEXT_LENGTH * 2) {
      hasLongText = true
    }
  }

  // Check for media elements
  const videos = document.querySelectorAll('video')
  const audios = document.querySelectorAll('audio')
  const hasMedia = videos.length > 0 || audios.length > 0

  // Extract media items
  const mediaItems: Array<{
    type: 'video' | 'audio'
    src: string
    title?: string
    duration?: string
  }> = []

  videos.forEach((video, index) => {
    const src = video.src || video.querySelector('source')?.src
    if (src) {
      mediaItems.push({
        type: 'video',
        src,
        title: video.title || `Video ${index + 1}`,
        duration: video.duration ? formatDuration(video.duration) : undefined,
      })
    }
  })

  audios.forEach((audio, index) => {
    const src = audio.src || audio.querySelector('source')?.src
    if (src) {
      mediaItems.push({
        type: 'audio',
        src,
        title: audio.title || `Audio ${index + 1}`,
        duration: audio.duration ? formatDuration(audio.duration) : undefined,
      })
    }
  })

  // Helper function for duration formatting
  function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds))
      return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Determine context
  let context: 'general' | 'reading' | 'media' = 'general'
  if (hasMedia)
    context = 'media'
  else if (hasLongText)
    context = 'reading'

  return {
    context,
    hasLongText,
    hasMedia,
    mediaItems,
    pageTitle: document.title,
    pageUrl: window.location.href,
    documentHTML: hasLongText ? document.documentElement.outerHTML : undefined,
  }
}

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

function refreshAnalysis() {
  requestPageAnalysis()
}

onMounted(() => {
  requestPageAnalysis()
})

// Listen for tab changes
let tabListener: ((tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab) => void) | null = null

onMounted(() => {
  tabListener = (_tabId, changeInfo, _tab) => {
    if (changeInfo.status === 'complete') {
      requestPageAnalysis()
    }
  }
  browser.tabs.onUpdated.addListener(tabListener)
  browser.tabs.onActivated.addListener(() => requestPageAnalysis())
})

onUnmounted(() => {
  if (tabListener) {
    browser.tabs.onUpdated.removeListener(tabListener)
  }
})
</script>

<template>
  <k-app theme="ios" class="h-screen">
    <k-page>
      <!-- Navbar -->
      <k-navbar title="Smart Panel">
        <template #right>
          <k-button clear small @click="refreshAnalysis">
            🔄
          </k-button>
          <k-button clear small @click="openOptionsPage">
            ⚙️
          </k-button>
        </template>
      </k-navbar>

      <!-- Loading State -->
      <k-block v-if="contextStore.isLoading" class="text-center py-8">
        <div class="text-4xl mb-2">
          ⏳
        </div>
        <div class="text-gray-500">
          Analyzing page...
        </div>
      </k-block>

      <!-- Main Content -->
      <template v-else>
        <!-- Context Indicator -->
        <k-block class="!my-4">
          <k-card>
            <div class="p-4 flex items-center gap-3">
              <span class="text-3xl">
                {{
                  contextStore.currentContext === 'reading' ? '📖'
                  : contextStore.currentContext === 'media' ? '🎬' : '🌐'
                }}
              </span>
              <div class="flex-1">
                <div class="font-semibold text-gray-800 dark:text-white truncate">
                  {{ contextStore.pageTitle || 'Current Page' }}
                </div>
                <div class="text-sm text-gray-500 capitalize">
                  {{ contextStore.currentContext }} Mode
                </div>
              </div>
            </div>
          </k-card>
        </k-block>

        <!-- Home Tab Content -->
        <template v-if="activeTab === 'home'">
          <!-- Search Widget -->
          <SearchWidget />

          <!-- Context-specific quick actions -->
          <k-block v-if="showReaderButton || showMediaButton" class="!my-4">
            <k-block-title>Quick Actions</k-block-title>
            <div class="grid grid-cols-2 gap-3">
              <k-button
                v-if="showReaderButton"
                large
                class="flex flex-col items-center justify-center h-20"
                @click="activeTab = 'reader'"
              >
                <span class="text-2xl mb-1">📖</span>
                <span class="text-xs">Reader Mode</span>
              </k-button>
              <k-button
                v-if="showMediaButton"
                large
                class="flex flex-col items-center justify-center h-20"
                @click="activeTab = 'media'"
              >
                <span class="text-2xl mb-1">📥</span>
                <span class="text-xs">Download Media</span>
              </k-button>
            </div>
          </k-block>
        </template>

        <!-- Reader Tab Content -->
        <template v-if="activeTab === 'reader'">
          <ReaderView />
        </template>

        <!-- Media Tab Content -->
        <template v-if="activeTab === 'media'">
          <MediaGrabber />
        </template>
      </template>

      <!-- Bottom Tabbar -->
      <k-tabbar class="fixed bottom-0 left-0 right-0">
        <k-tabbar-link
          :active="activeTab === 'home'"
          label="Home"
          @click="activeTab = 'home'"
        >
          <template #icon>
            <span class="text-xl">🏠</span>
          </template>
        </k-tabbar-link>
        <k-tabbar-link
          :active="activeTab === 'reader'"
          label="Reader"
          :badge="showReaderButton ? '!' : undefined"
          @click="activeTab = 'reader'"
        >
          <template #icon>
            <span class="text-xl">📖</span>
          </template>
        </k-tabbar-link>
        <k-tabbar-link
          :active="activeTab === 'media'"
          label="Media"
          :badge="showMediaButton ? String(contextStore.mediaItems.length) : undefined"
          @click="activeTab = 'media'"
        >
          <template #icon>
            <span class="text-xl">📥</span>
          </template>
        </k-tabbar-link>
      </k-tabbar>
    </k-page>
  </k-app>
</template>

<style>
/* Ensure proper spacing for bottom tabbar */
.k-page-content {
  padding-bottom: 80px !important;
}
</style>
