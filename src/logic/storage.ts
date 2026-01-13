import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export const { data: storageDemo, dataReady: storageDemoReady } = useWebExtensionStorage('webext-demo', 'Storage Demo')
export const { data: storageScrollSpeed, dataReady: storageScrollSpeedReady } = useWebExtensionStorage('webext-scroll-speed', 1)
