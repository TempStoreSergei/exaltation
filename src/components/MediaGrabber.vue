<script setup lang="ts">
import { computed } from 'vue'
import {
  kBlock,
  kBlockTitle,
  kCard,
  kList,
  kListItem,
} from 'konsta/vue'
import { useContextStore } from '~/stores/ContextManager'

const contextStore = useContextStore()

const videoItems = computed(() =>
  contextStore.mediaItems.filter(item => item.type === 'video'),
)

const audioItems = computed(() =>
  contextStore.mediaItems.filter(item => item.type === 'audio'),
)

function downloadMedia(src: string, title?: string) {
  // Extract filename from URL or use title
  const url = new URL(src, window.location.href)
  const pathSegments = url.pathname.split('/')
  const filename = title || pathSegments[pathSegments.length - 1] || 'media'

  // Use browser.downloads API if available, otherwise open in new tab
  if (browser.downloads) {
    browser.downloads.download({
      url: src,
      filename,
      saveAs: true,
    }).catch(() => {
      // Fallback: open in new tab
      browser.tabs.create({ url: src })
    })
  }
  else {
    browser.tabs.create({ url: src })
  }
}

function getMediaIcon(type: 'video' | 'audio'): string {
  return type === 'video' ? '🎬' : '🎵'
}

function formatSrc(src: string): string {
  if (src.startsWith('blob:'))
    return 'Blob URL'

  try {
    const url = new URL(src)
    return url.hostname + url.pathname.split('/').pop()
  }
  catch {
    return src.slice(0, 50) + (src.length > 50 ? '...' : '')
  }
}
</script>

<template>
  <div class="media-grabber">
    <k-block v-if="contextStore.hasMedia" class="!my-4">
      <k-card>
        <div class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">📥</span>
            <div>
              <div class="font-semibold text-gray-800 dark:text-white">
                Media Detected
              </div>
              <div class="text-sm text-gray-500">
                {{ contextStore.mediaItems.length }} media item(s) found
              </div>
            </div>
          </div>
        </div>
      </k-card>
    </k-block>

    <!-- Video Items -->
    <template v-if="videoItems.length > 0">
      <k-block-title>
        🎬 Videos ({{ videoItems.length }})
      </k-block-title>
      <k-list strong inset>
        <k-list-item
          v-for="(item, index) in videoItems"
          :key="`video-${index}`"
          :title="item.title || `Video ${index + 1}`"
          :subtitle="formatSrc(item.src)"
          link
          @click="downloadMedia(item.src, item.title)"
        >
          <template #media>
            <span class="text-2xl">{{ getMediaIcon(item.type) }}</span>
          </template>
          <template #after>
            <span v-if="item.duration" class="text-sm text-gray-500">
              {{ item.duration }}
            </span>
            <span class="ml-2 text-blue-500">↓</span>
          </template>
        </k-list-item>
      </k-list>
    </template>

    <!-- Audio Items -->
    <template v-if="audioItems.length > 0">
      <k-block-title>
        🎵 Audio ({{ audioItems.length }})
      </k-block-title>
      <k-list strong inset>
        <k-list-item
          v-for="(item, index) in audioItems"
          :key="`audio-${index}`"
          :title="item.title || `Audio ${index + 1}`"
          :subtitle="formatSrc(item.src)"
          link
          @click="downloadMedia(item.src, item.title)"
        >
          <template #media>
            <span class="text-2xl">{{ getMediaIcon(item.type) }}</span>
          </template>
          <template #after>
            <span v-if="item.duration" class="text-sm text-gray-500">
              {{ item.duration }}
            </span>
            <span class="ml-2 text-blue-500">↓</span>
          </template>
        </k-list-item>
      </k-list>
    </template>

    <!-- No Media State -->
    <k-block v-if="!contextStore.hasMedia" class="!my-4">
      <k-card>
        <div class="p-6 text-center">
          <span class="text-4xl mb-3 block">📹</span>
          <div class="text-gray-500 dark:text-gray-400">
            No media detected on this page
          </div>
        </div>
      </k-card>
    </k-block>
  </div>
</template>
