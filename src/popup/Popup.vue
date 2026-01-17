<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { kBlock, kBlockTitle, kList, kListItem, kNavbar, kPage, kProvider, kRange } from 'konsta/vue'
import { storageScrollSpeed, storageScrollSpeedReady } from '~/logic/storage'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

const isReady = ref(false)

onMounted(async () => {
  await storageScrollSpeedReady
  isReady.value = true
})

const safeSpeed = computed({
  get: () => {
    const val = Number(storageScrollSpeed.value)
    return Number.isFinite(val) ? val : 1
  },
  set: (val) => {
    if (isReady.value) {
      storageScrollSpeed.value = val
    }
  },
})
</script>

<template>
  <k-provider theme="ios">
    <div class="k-ios w-[350px] h-[400px] flex flex-col bg-page-ios-light">
      <k-page>
        <k-navbar title="Auto Scroll Settings" />

        <k-block-title>Scroll Speed: {{ safeSpeed.toFixed(1) }}x</k-block-title>
        <k-block strong inset>
          <k-range
            v-if="isReady"
            :value="safeSpeed"
            :min="0.2"
            :max="5"
            :step="0.1"
            @input="(v: any) => safeSpeed = Number(v)"
          />
          <div v-else class="h-6 w-full bg-gray-200 animate-pulse rounded" />

          <div class="flex justify-between text-sm text-gray-500 mt-2">
            <span>Slow (0.2x)</span>
            <span>Fast (5x)</span>
          </div>
        </k-block>

        <k-list strong inset>
          <k-list-item
            title="Open Options"
            link
            @click="openOptionsPage"
          />
        </k-list>
      </k-page>
    </div>
  </k-provider>
</template>
