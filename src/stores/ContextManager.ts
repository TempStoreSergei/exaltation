import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PageContext = 'general' | 'reading' | 'media'

export interface MediaItem {
  type: 'video' | 'audio'
  src: string
  title?: string
  duration?: string
}

export interface PageAnalysisResult {
  context: PageContext
  hasLongText: boolean
  hasMedia: boolean
  mediaItems: MediaItem[]
  pageTitle: string
  pageUrl: string
  documentHTML?: string
}

export const useContextStore = defineStore('context', () => {
  // State
  const currentContext = ref<PageContext>('general')
  const isLoading = ref(false)
  const hasLongText = ref(false)
  const hasMedia = ref(false)
  const mediaItems = ref<MediaItem[]>([])
  const pageTitle = ref('')
  const pageUrl = ref('')
  const documentHTML = ref<string | undefined>(undefined)
  const readerContent = ref<string | undefined>(undefined)
  const readerTitle = ref<string | undefined>(undefined)

  // Actions
  function updateContext(analysis: PageAnalysisResult) {
    currentContext.value = analysis.context
    hasLongText.value = analysis.hasLongText
    hasMedia.value = analysis.hasMedia
    mediaItems.value = analysis.mediaItems
    pageTitle.value = analysis.pageTitle
    pageUrl.value = analysis.pageUrl
    documentHTML.value = analysis.documentHTML
  }

  function setReaderContent(content: string, title: string) {
    readerContent.value = content
    readerTitle.value = title
  }

  function clearReaderContent() {
    readerContent.value = undefined
    readerTitle.value = undefined
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function reset() {
    currentContext.value = 'general'
    hasLongText.value = false
    hasMedia.value = false
    mediaItems.value = []
    pageTitle.value = ''
    pageUrl.value = ''
    documentHTML.value = undefined
    readerContent.value = undefined
    readerTitle.value = undefined
  }

  return {
    // State
    currentContext,
    isLoading,
    hasLongText,
    hasMedia,
    mediaItems,
    pageTitle,
    pageUrl,
    documentHTML,
    readerContent,
    readerTitle,
    // Actions
    updateContext,
    setReaderContent,
    clearReaderContent,
    setLoading,
    reset,
  }
})
