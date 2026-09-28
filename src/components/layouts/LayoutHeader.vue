<script setup lang="ts">
import { ref, type Ref } from 'vue'

import ToolTip from '../ToolTip.vue'

defineProps<{
  tab: string
}>()

const emit = defineEmits<{
  'update:tab': [value: string],
  'is-config-show': [value: boolean],
  'input-search': [value: string]
}>()

const menuTab: Ref<string> = ref('installed')
const searchText: Ref<string> = ref('')

function onChangeTab() {
  emit('update:tab', menuTab.value)
}

function onWinClose() {
  window.electronAPI.send('quit')
}

function onWinMinimize() {
  window.electronAPI.send('minimize')
}

function onWinMaximize() {
  window.electronAPI.send('maximize')
}
</script>

<template>
  <q-header
    class="bg-transparent"
    :class="$q.dark.isActive ? 'text-white' : 'text-dark'"
  >
    <q-toolbar
      class="top-tools justify-between q-py-sm"
      style="-webkit-app-region: drag; z-index: 1; width: 100%"
    >
      <!-- LEFT: Settings and Search -->
      <div class="row items-center no-wrap q-gutter-x-sm" style="-webkit-app-region: no-drag">
        <q-btn
          dense
          unelevated
          round
          icon="settings"
          size="md"
          :color="$q.dark.isActive ? 'dark' : 'grey-2'"
          :text-color="$q.dark.isActive ? 'grey-4' : 'dark'"
          @click="$emit('is-config-show', true)"
        >
          <tool-tip text="Settings" />
        </q-btn>

        <q-input
          v-model="searchText"
          rounded
          outlined
          dense
          :dark="$q.dark.isActive"
          color="brand"
          placeholder="Search versions..."
          class="search-input"
          style="width: 200px"
          @update:model-value="(val: any) => emit('input-search', val)"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="xs" />
          </template>
        </q-input>
      </div>

      <!-- CENTER/MIDDLE: Tabs -->
      <div class="row items-center" style="-webkit-app-region: no-drag">
        <q-tabs v-model="menuTab" dense indicator-color="transparent" active-class="active-tab-chip" style="padding: 4px;" @update:model-value="onChangeTab">
          <q-tab name="installed" label="Installed" class="tab-chip" style="margin-right: 12px;" />
          <q-tab name="archive" label="Available" class="tab-chip" />
        </q-tabs>
      </div>

      <!-- RIGHT: Window controls -->
      <div class="row items-center no-wrap q-gutter-x-sm" style="-webkit-app-region: no-drag">
        <div class="window-btn q-ml-md" style="justify-content: flex-end;">
          <q-btn round dense unelevated size="xs" icon="remove" class="minimize-btn" @click="onWinMinimize">
            <tool-tip text="Minimize" />
          </q-btn>
          <q-btn round dense unelevated size="xs" icon="crop_square" class="maximize-btn" @click="onWinMaximize">
            <tool-tip text="Maximize" />
          </q-btn>
          <q-btn round dense unelevated size="xs" icon="close" class="close-btn" @click="onWinClose">
            <tool-tip text="Close" />
          </q-btn>
        </div>
      </div>
    </q-toolbar>
  </q-header>
</template>

<style scoped>
.tab-chip {
  border-radius: 24px;
  min-height: 36px;
  padding: 0 20px;
  transition: all 0.2s ease;
  border: 1px solid #ccc;
  background-color: transparent;
  color: #757575;
  font-weight: 500;
  letter-spacing: 1px;
}
.body--dark .tab-chip { border: 1px solid #424242; color: #757575; }
.active-tab-chip {
  border: 1px solid #2979ff !important;
  background-color: rgba(41, 121, 255, 0.1) !important;
  color: #2979ff !important;
  font-weight: bold;
}
.body--dark .active-tab-chip {
  border: 1px solid #60a5fa !important;
  background-color: rgba(96, 165, 250, 0.15) !important;
  color: #fff !important;
}
</style>
