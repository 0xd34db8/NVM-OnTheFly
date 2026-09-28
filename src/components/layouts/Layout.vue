<script setup lang="ts">
import { computed, ref, type Ref, watch, onMounted } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'

import LayoutHeader from './LayoutHeader.vue'
import NodeList from '../NodeList.vue'
import LayoutConfig from './LayoutConfig.vue'

const $q = useQuasar()
const currentVersion: Ref<string> = ref('')
const runtimeMode: Ref<string> = ref('')
const tab: Ref<string> = ref('installed')
const isConfigOpen: Ref<boolean> = ref(false)
const searchKeyword: Ref<string> = ref('')
const availableModes: Ref<string[]> = ref([])
const nodeListRef = ref<any>(null)
const isPackagesLoading = ref(false)

onMounted(() => {
  window.electronAPI.receive('availableModes', (evt: any, modes: string[]) => {
    availableModes.value = modes
  })
  
  window.electronAPI.receive('resNpmCommand', (evt: any, data: any) => {
    if (isPackagesLoading.value) {
      isPackagesLoading.value = false
      const output = data.result || data.error || 'No output'
      $q.dialog({
        dark: $q.dark.isActive,
        title: `Global Packages (Node ${currentVersion.value})`,
        message: `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; max-height: 400px; overflow-y: auto; background: ${$q.dark.isActive ? '#1d1d1d' : '#f5f5f5'}; color: ${$q.dark.isActive ? '#fff' : '#000'}; padding: 10px; border-radius: 4px;">${output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
        html: true,
        ok: true,
        style: 'min-width: 450px;'
      })
    }
  })

  window.electronAPI.send('checkAvailableModes', null)
})

function showPackages() {
  isShowLog.value = true
  isPackagesLoading.value = true
  window.electronAPI.send('runNpmCommand', { args: ['list', '-g', '--depth=0'] })
}

function switchMode() {
  if (availableModes.value.length < 2) return;
  const currentIndex = availableModes.value.indexOf(runtimeMode.value);
  const nextMode = availableModes.value[(currentIndex + 1) % availableModes.value.length] || availableModes.value[0];
  
  runtimeMode.value = nextMode;
  window.electronAPI.send('setMode', nextMode);
  
  if (nodeListRef.value) {
    nodeListRef.value.reLoad();
  }
}

interface LogMessage {
  text: string;
  type: string;
}
const nvmLog: Ref<LogMessage[]> = ref([])
const isShowLog: Ref<boolean> = ref(true)
const logContainer = ref<HTMLElement | null>(null)

const logs = computed(() => nvmLog.value.map(l => l.text).join(''))

// Logs persist when terminal is hidden

function onUpdateLogs(val: any) {
  let text = typeof val === 'string' ? val : val.text
  let type = typeof val === 'string' ? 'info' : val.type

  const cleanVal = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  nvmLog.value.push({ text: cleanVal, type })

  setTimeout(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  }, 50)
}

function onCopyLogs() {
  copyToClipboard(logs.value).then(() => {
    $q.notify({
      message: 'Logs copied to clipboard',
      color: 'positive',
      position: 'bottom',
      timeout: 2000
    })
  })
}

</script>

<template>
  <q-layout view="hHh lpR fFf">
    <!-- layout - header-->
    <layout-header
      v-model:tab="tab"
      @is-config-show="(val: any) => isConfigOpen = val"
      @input-search="(val: string) => searchKeyword = val"
    />

    <!-- layout - config-->
    <layout-config v-model:is-show="isConfigOpen" />

    <!-- layout - body-->
    <q-page-container>
      <q-page class="q-pa-md">
        <div class="row justify-between items-center q-mb-md">
          <div class="row items-center q-ml-sm" style="flex: 1; min-width: 150px; margin-right: 16px;">
            <img v-if="$q.dark.isActive" key="dark" src="../../assets/img/Hero-Dark.png" style="width: 100%; max-width: 280px; height: auto; max-height: 85px; object-fit: contain; object-position: left center;" alt="Hero Dark" />
            <img v-else key="light" src="../../assets/img/Hero-Light.png" style="width: 100%; max-width: 280px; height: auto; max-height: 85px; object-fit: contain; object-position: left center;" alt="Hero Light" />
          </div>
          
          <div :class="['row items-center q-px-md q-py-xs rounded-borders', $q.dark.isActive ? 'bg-dark' : 'bg-grey-2']" :style="$q.dark.isActive ? 'border: 1px solid #27272a; border-radius: 20px' : 'border: 1px solid #e5e7eb; border-radius: 20px'">
            <span v-if="runtimeMode !== ''" class="q-mr-sm">
              <q-chip size="sm" color="brand" text-color="white" class="text-weight-bold" style="margin: 0; padding: 0 10px; border-radius: 12px">{{ runtimeMode }}</q-chip>
              <q-chip v-if="availableModes.length > 1" clickable @click="switchMode" size="sm" color="grey-7" text-color="white" class="text-weight-bold q-ml-xs cursor-pointer" style="margin: 0; padding: 0 10px; border-radius: 12px" icon="swap_horiz">Switch</q-chip>
            </span>
            <span :class="['text-caption q-mr-sm', $q.dark.isActive ? 'text-grey-5' : 'text-dark']">Current:</span>
            <span
              v-if="currentVersion !== ''"
              :class="['text-weight-bold text-body2', $q.dark.isActive ? 'text-white' : 'text-dark']"
            >{{ currentVersion }}</span>
            <q-btn v-if="currentVersion !== ''" flat dense round icon="inventory_2" size="sm" class="q-ml-sm" :color="$q.dark.isActive ? 'grey-4' : 'grey-8'" @click="showPackages" :loading="isPackagesLoading">
              <q-tooltip>View Global Packages</q-tooltip>
            </q-btn>
            <span v-if="currentVersion === ''">
              <q-skeleton
                animation="fade"
                type="text"
                width="60px"
                height="20px"
                :dark="$q.dark.isActive"
              />
            </span>
          </div>
        </div>

        <node-list
          ref="nodeListRef"
          :tab="tab"
          :search-keyword="searchKeyword"
          class="row"
          @is-show-log="val => isShowLog = val"
          @update-logs="onUpdateLogs"
          @current-version="val => currentVersion = val"
          @runtime-mode="val => runtimeMode = val"
        />

        <q-page-sticky position="bottom-right" :offset="[18, 18]">
          <q-btn
            round
            size="sm"
            unelevated
            :color="$q.dark.isActive ? 'grey-8' : 'white'"
            :text-color="$q.dark.isActive ? 'white' : 'dark'"
            :icon="isShowLog ? 'keyboard_arrow_down' : 'keyboard_arrow_up'"
            style="border: 1px solid #e5e7eb"
            :style="$q.dark.isActive ? 'border: 1px solid #27272a' : ''"
            @click="isShowLog = !isShowLog"
          >
            <q-tooltip>{{ isShowLog ? 'Hide Terminal' : 'Show Terminal' }}</q-tooltip>
          </q-btn>
        </q-page-sticky>
      </q-page>
    </q-page-container>

    <q-footer
      v-model="isShowLog"
      reveal
      :class="$q.dark.isActive ? 'bg-dark text-grey-4' : 'bg-grey-2 text-dark'"
      :style="$q.dark.isActive ? 'border-top: 1px solid #27272a' : 'border-top: 1px solid #e5e7eb'"
    >
      <div class="q-pa-sm" style="position: relative;">
        <q-btn
          icon="content_copy"
          size="sm"
          flat
          round
          :color="$q.dark.isActive ? 'white' : 'grey-8'"
          style="position: absolute; top: 15px; right: 25px; z-index: 10"
          @click="onCopyLogs"
        >
          <q-tooltip>Copy logs</q-tooltip>
        </q-btn>
        
        <div
          ref="logContainer"
          class="log-area rounded-borders q-pa-sm"
          :class="$q.dark.isActive ? 'bg-black' : 'bg-white'"
          style="width: 100%; height: 180px; overflow-y: auto; font-family: monospace; white-space: pre-wrap;"
          :style="$q.dark.isActive ? 'border: 1px solid #27272a; outline: none;' : 'border: 1px solid #e5e7eb; outline: none;'"
        >
          <span
            v-for="(log, idx) in nvmLog"
            :key="idx"
            :class="{
              'text-red-4': log.type === 'error' && $q.dark.isActive,
              'text-red-8': log.type === 'error' && !$q.dark.isActive,
              'text-green-4': log.type === 'success' && $q.dark.isActive,
              'text-green-8': log.type === 'success' && !$q.dark.isActive,
              'text-blue-3': log.type === 'system' && $q.dark.isActive,
              'text-blue-8': log.type === 'system' && !$q.dark.isActive,
              'text-grey-4': log.type === 'info' && $q.dark.isActive,
              'text-dark': log.type === 'info' && !$q.dark.isActive
            }"
          >{{ log.text }}</span>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>
