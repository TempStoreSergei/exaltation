<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Readability } from '@mozilla/readability'
import {
  kBlock,
  kBlockTitle,
  kButton,
  kCard,
} from 'konsta/vue'
import { useContextStore } from '~/stores/ContextManager'

const contextStore = useContextStore()
const isReaderActive = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const hasReaderContent = computed(() => !!contextStore.readerContent)

async function activateReaderMode() {
  if (!contextStore.documentHTML) {
    error.value = 'No document content available'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // Parse the HTML using DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(contextStore.documentHTML, 'text/html')

    // Use Readability to extract the article
    const reader = new Readability(doc)
    const article = reader.parse()

    if (article && article.content) {
      contextStore.setReaderContent(article.content, article.title || contextStore.pageTitle)
      isReaderActive.value = true
    }
    else {
      error.value = 'Could not parse article content'
    }
  }
  catch (err) {
    error.value = 'Failed to parse page content'
    console.error('Reader mode error:', err)
  }
  finally {
    isLoading.value = false
  }
}

function closeReaderMode() {
  isReaderActive.value = false
  contextStore.clearReaderContent()
}

onMounted(() => {
  // Check if we already have reader content
  if (contextStore.readerContent) {
    isReaderActive.value = true
  }
})
</script>

<template>
  <div class="reader-view">
    <!-- Activation Button -->
    <k-block v-if="!isReaderActive && contextStore.hasLongText" class="!my-4">
      <k-card>
        <div class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">📖</span>
            <div>
              <div class="font-semibold text-gray-800 dark:text-white">
                Reader Mode Available
              </div>
              <div class="text-sm text-gray-500">
                This page contains readable content
              </div>
            </div>
          </div>
          <k-button
            large
            :disabled="isLoading"
            class="w-full"
            @click="activateReaderMode"
          >
            {{ isLoading ? 'Loading...' : 'Activate Reader Mode' }}
          </k-button>
          <div v-if="error" class="mt-2 text-red-500 text-sm text-center">
            {{ error }}
          </div>
        </div>
      </k-card>
    </k-block>

    <!-- Reader Content -->
    <div v-if="isReaderActive && hasReaderContent" class="reader-content">
      <k-block-title class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <span>📖</span>
          Reader Mode
        </span>
        <k-button clear small @click="closeReaderMode">
          ✕ Close
        </k-button>
      </k-block-title>

      <k-block class="!mt-2">
        <k-card>
          <div class="p-4">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {{ contextStore.readerTitle }}
            </h1>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              class="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-200 leading-relaxed"
              v-html="contextStore.readerContent"
            />
          </div>
        </k-card>
      </k-block>
    </div>
  </div>
</template>

<style scoped>
.reader-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.reader-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}

.reader-content :deep(h1),
.reader-content :deep(h2),
.reader-content :deep(h3) {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.reader-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.reader-content :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #6b7280;
}

.reader-content :deep(pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
}

.reader-content :deep(code) {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.reader-content :deep(ul),
.reader-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.reader-content :deep(li) {
  margin-bottom: 0.5rem;
}
</style>
