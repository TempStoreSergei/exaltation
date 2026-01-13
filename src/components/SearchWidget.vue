<script setup lang="ts">
import { ref } from 'vue'
import {
  kBlock,
  kList,
  kListInput,
  kListItem,
  kSegmented,
  kSegmentedButton,
} from 'konsta/vue'

type SearchEngine = 'google' | 'yandex' | 'bing' | 'duckduckgo'

interface EngineConfig {
  name: string
  url: string
  icon: string
}

const engines: Record<SearchEngine, EngineConfig> = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '🔍',
  },
  yandex: {
    name: 'Yandex',
    url: 'https://yandex.com/search/?text=',
    icon: '🔎',
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: '🌐',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: '🦆',
  },
}

const selectedEngine = ref<SearchEngine>('google')
const searchQuery = ref('')

function performSearch() {
  if (!searchQuery.value.trim())
    return

  const engine = engines[selectedEngine.value]
  const searchUrl = engine.url + encodeURIComponent(searchQuery.value.trim())
  browser.tabs.create({ url: searchUrl })
  searchQuery.value = ''
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    performSearch()
  }
}
</script>

<template>
  <k-block class="!my-4">
    <div class="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
      🔍 Quick Search
    </div>

    <!-- Search Engine Selector -->
    <k-segmented strong class="mb-4">
      <k-segmented-button
        v-for="(config, key) in engines"
        :key="key"
        :active="selectedEngine === key"
        @click="selectedEngine = key as SearchEngine"
      >
        <span class="text-sm">{{ config.icon }} {{ config.name }}</span>
      </k-segmented-button>
    </k-segmented>

    <!-- Search Input -->
    <k-list strong inset class="!my-0">
      <k-list-input
        type="text"
        placeholder="Search the web..."
        :value="searchQuery"
        @input="(e: Event) => searchQuery = (e.target as HTMLInputElement).value"
        @keydown="handleKeydown"
      >
        <template #media>
          <span class="text-xl">{{ engines[selectedEngine].icon }}</span>
        </template>
      </k-list-input>
      <k-list-item
        link
        title="Search"
        class="text-center"
        @click="performSearch"
      >
        <template #after>
          <span class="text-blue-500">→</span>
        </template>
      </k-list-item>
    </k-list>
  </k-block>
</template>
