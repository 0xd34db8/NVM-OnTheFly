<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type Ref, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import type { Column, Data } from '../types'

import TableLoader from './TableLoader.vue'

const $q = useQuasar()

const props = defineProps<{
  tab: string,
  searchKeyword: string
}>()

// const osRef: Ref<string> = ref('')
const emit = defineEmits<{
  'is-show-log': [value: boolean],
  'update-logs': [value: any],
  'current-version': [value: string],
  'runtime-mode': [value: string]
}>()

const installedCols: Column[] = [
  {
    name: 'ver',
    label: 'Version',
    field: 'ver',
    align: 'center',
    sortable: true
  },
  {
    name: 'release_date',
    label: 'Release Date',
    field: 'release_date',
    align: 'center',
    sortable: true
  },
  {
    name: 'use',
    label: 'Use',
    field: 'use',
    align: 'center'
  },
  {
    name: 'uninstall',
    label: 'Uninstall',
    field: 'uninstall',
    align: 'center'
  }
]
const archiveCols: Column[] = [
  {
    name: 'ver',
    label: 'Version',
    field: 'ver',
    align: 'center',
    sort: (a: any, b: any): number => {
      return a - b
    },
    sortable: true
  },
  {
    name: 'release_date',
    label: 'Release Date',
    field: 'release_date',
    align: 'center',
    sortable: true
  },
  {
    name: 'install',
    label: 'Install',
    field: 'install',
    align: 'center'
  },
]
const columns: Ref<Column []> = ref([])
const rows: Data = ref({
  installedData: [],
  archiveData: []
})
const progressUseBtn: Ref<boolean []> = ref([])
const progressUninstallBtn: Ref<boolean []> = ref([])
const progressInstallBtn: Ref<boolean []> = ref([])
const isDisableBtn: Ref<boolean> = ref(false)
const isLoader: Ref<boolean> = ref(false)

const isInstalledTab = computed(() => props.tab === 'installed')

const filterArchiveData = computed(() => rows.value.archiveData.filter(row => row.install === 1))

const filterData = computed(() => {
  const dataList = isInstalledTab.value ? rows.value.installedData : filterArchiveData.value

  return dataList.filter(row => row.ver.includes(props.searchKeyword))
})

watch(() => props.tab, () => {
  // rows.value.installedData = []
  // rows.value.archiveData = []

  if (isInstalledTab.value) {
    columns.value = installedCols
    // getInstalledData()
  } else {
    columns.value = archiveCols
    // getArchiveData()
  }
})

let isIpcBound = false
let pendingUseVersion = ''

onBeforeMount(async () => {
  isLoader.value = true

  columns.value = installedCols

  if (!isIpcBound) {
    isIpcBound = true

    window.electronAPI.receive('streamCommand', (evt, data) => {
      emit('update-logs', data)
    })

    window.electronAPI.receive('resCommand', async (evt, { result, os, mode, command }) => {
      if (command === 'ls') {
        emit('runtime-mode', mode)

        if (os === 'darwin') {
          dummyData()
          return
        }

        rows.value.installedData = []

        let activeVersion = ''

        // Pass 1: find the global active version
        for (let i = 0; i < result.length; i++) {
          const line = result[i]
          const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
          
          if (mode === 'nvm-windows') {
            if (cleanLine.startsWith('*')) {
               const match = cleanLine.match(/\d+\.\d+\.\d+/)
               if (match) activeVersion = `v${match[0]}`
            }
          } else {
            // nvm-sh: look for the default alias
            if (cleanLine.startsWith('default ->')) {
               const matches = cleanLine.match(/\d+\.\d+\.\d+/g)
               if (matches && matches.length > 0) {
                 activeVersion = `v${matches[matches.length - 1]}`
               }
            }
            if (cleanLine === '---CURRENT---') {
               const nextLine = result[i + 1]?.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
               if (nextLine) {
                 const match = nextLine.match(/\d+\.\d+\.\d+/)
                 if (match) {
                   activeVersion = `v${match[0]}`
                 }
               }
            }
          }
        }

        for (let i = 0; i < result.length; i++) {
          const line = result[i]
          const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim()
          
          if (cleanLine !== '') {
            // Skip alias lines from nvm-sh which contain '->' but don't start with it
            if (cleanLine.includes('->') && !cleanLine.startsWith('->')) continue

            const matches = cleanLine.match(/\d+\.\d+\.\d+/)
            if (!matches) continue

            const version = `v${ matches[0] }`

            // Prevent duplicates
            if (rows.value.installedData.some(d => d.ver === version)) continue

            const isActive = (version === activeVersion)

            rows.value.installedData.push({
              ver: version,
              release_date: getReleaseDate(version),
              use: isActive ? 1 : 0,
              uninstall: 1,
              type: 1
            })

            updateArchiveData(version)

            progressUseBtn.value.push(false)
            progressUninstallBtn.value.push(false)
          }
        }

        emit('current-version', activeVersion !== '' ? activeVersion : 'None')

        isLoader.value = false
      } else if (command === 'use') {
        isDisableBtn.value = false
        for (let i = 0; i < progressUseBtn.value.length; i++) progressUseBtn.value[i] = false

        if (mode === 'Error') {
          $q.notify({
            message: 'Failed to update global default. ' + (result[0] || 'Unknown error'),
            color: 'negative',
            position: 'bottom',
            timeout: 3000
          })
          
          isLoader.value = true
          await getInstalledData()
        } else {
          rows.value.installedData.forEach(row => {
            row.use = (row.ver === pendingUseVersion) ? 1 : 0
          })

          emit('current-version', pendingUseVersion)

          $q.notify({
            message: `Global default successfully updated to ${pendingUseVersion} in ${mode}!`,
            color: 'positive',
            position: 'bottom',
            timeout: 3000
          })
        }
      } else if (command === 'install') {
        isDisableBtn.value = false
        for (let i = 0; i < progressInstallBtn.value.length; i++) progressInstallBtn.value[i] = false

        await reLoad()
      } else if (command === 'uninstall') {
        isDisableBtn.value = false
        for (let i = 0; i < progressUninstallBtn.value.length; i++) progressUninstallBtn.value[i] = false

        if (mode === 'Error') {
          $q.notify({
            message: 'Failed to uninstall version. ' + (result[0] || 'Unknown error'),
            color: 'negative',
            position: 'bottom',
            timeout: 3000
          })
        } else {
          $q.notify({
            message: `Version successfully uninstalled in ${mode}!`,
            color: 'positive',
            position: 'bottom',
            timeout: 3000
          })
        }
        isLoader.value = true
        await getInstalledData()
      }
    })
  }

  await getArchiveData()
  await getInstalledData()
})

async function reLoad() {
  isLoader.value = true

  rows.value.installedData = []
  rows.value.archiveData = []

  await nextTick()

  await getArchiveData()
  await getInstalledData()
}

// onLoad removed

function getReleaseDate(version: string) {
  const matchData = rows.value.archiveData.filter(data => data.ver.includes(version))

  return matchData.length > 0 ? matchData[0].release_date : 'Unknown'
}

function dummyData() {
  rows.value.installedData = []

  for (let i = 0; i < 10; i++) {
    rows.value.installedData.push({
      ver: `v21.4.0`,
      release_date: getReleaseDate(`v21.4.0`),
      use: i === 0 ? 1 : 0,
      uninstall: 1,
      type: 1
    })

    updateArchiveData(`v21.4.0`)
  }

  progressUseBtn.value.push(false)
  progressUninstallBtn.value.push(false)

  onLoad()
}


async function getInstalledData() {
  window.electronAPI.send('runCommand', { args: ['ls'] })
}

async function getArchiveData() {
  const res = await fetch('https://nodejs.org/dist/index.json')
  const nodeList: any = await res.json()

  rows.value.archiveData = nodeList.map((node: any) => {
    return {
      ver: node.version,
      release_date: node.date,
      install: 1,
      type: 2
    }
  })
}

function updateArchiveData(version: string) {
  rows.value.archiveData = rows.value.archiveData.map(node => {
    if (node.ver.includes(version)) {
      node = Object.assign(node, {
        install: 2
      })
    }

    return node
  })
}

async function onApply(col: string, row: any, idx: number) {
  const version = row.ver

  if (col === 'use') {
    emit('is-show-log', true)
    isDisableBtn.value = true
    progressUseBtn.value[idx] = true
    pendingUseVersion = version.trim()

    window.electronAPI.send('runCommand', { args: ['use', version.trim()] })
  }

  if (col === 'uninstall') {
    $q.dialog({
      title: 'Confirm Uninstall',
      message: `Are you sure you want to uninstall Node.js ${version.trim()}?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      emit('is-show-log', true)
      isDisableBtn.value = true
      progressUninstallBtn.value[idx] = true
      window.electronAPI.send('runCommand', { args: ['uninstall', version.trim()] })
    })
  }

  if (col === 'install') {
    const installedVersions = rows.value.installedData.map(d => d.ver);
    
    if (installedVersions.length > 0) {
      $q.dialog({
        title: 'Migrate Global Packages',
        message: 'Do you want to reinstall global packages (like yarn, pm2) from an existing version?',
        options: {
          type: 'radio',
          model: 'none',
          items: [
            { label: 'None (Clean install)', value: 'none' },
            ...installedVersions.map(v => ({ label: v, value: v }))
          ]
        },
        cancel: true,
        persistent: true
      }).onOk(selectedVersion => {
        emit('is-show-log', true)
        isDisableBtn.value = true
        progressInstallBtn.value[idx] = true
        
        const args = ['install', version.trim()]
        if (selectedVersion && selectedVersion !== 'none') {
          args.push(`--reinstall-packages-from=${selectedVersion}`)
        }
        window.electronAPI.send('runCommand', { args })
      })
    } else {
      emit('is-show-log', true)
      isDisableBtn.value = true
      progressInstallBtn.value[idx] = true
      window.electronAPI.send('runCommand', { args: ['install', version.trim()] })
    }
  }
}


function isLoading(col: string, idx: number) {
  if (col === 'use') {
    return progressUseBtn.value[idx]
  }

  if (col === 'uninstall') {
    return progressUninstallBtn.value[idx]
  }

  if (col === 'install') {
    return progressInstallBtn.value[idx]
  }
}

function isDisable(col: string, idx: number) {
  return isDisableBtn.value && (col === 'use' ? !progressUseBtn.value[idx] : !progressUninstallBtn.value[idx])
}

function getTextField(col: string) {
  return col !== 'use' && col !== 'uninstall' && col !== 'install'
}

function getColWidth(col: string) {
  return getTextField(col) ? 'width: 200px' : 'width: 50px'
}

function getFuncBtnStyle(col: string) {
  if (col === 'use') {
    return { icon: 'play_arrow', color: 'brand', text: 'white' }
  }

  if (col === 'uninstall') {
    return { icon: 'delete_outline', color: 'negative', text: 'white' }
  }

  if (col === 'install') {
    return { icon: 'download', color: 'brand', text: 'white' }
  }

  return { icon: '', color: '', text: '' }
}

defineExpose({ reLoad })
</script>

<template>
  <q-table
    :pagination="{rowsPerPage: 0}"
    virtual-scroll
    hide-bottom
    :rows-per-page-options="[0]"
    :virtual-scroll-sticky-size-start="48"
    row-key="ver"
    :rows="filterData"
    :columns="columns"
    flat
    :dark="$q.dark.isActive"
    :loading="isLoader"
    class="sticky-table"
  >
    <template #loading>
      <table-loader />
    </template>

    <template #body="props">
      <q-tr :props="props">
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
          :style="getColWidth(col.field)"
        >
          <span v-if="getTextField(col.field)" class="text-subtitle2 font-medium" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
            {{ col.value }}
          </span>

          <q-btn
            v-else
            unelevated
            size="sm"
            class="action-btn"
            :icon="getFuncBtnStyle(col.field).icon"
            :color="getFuncBtnStyle(col.field).color"
            :text-color="getFuncBtnStyle(col.field).text"
            :loading="isLoading(col.field, props.pageIndex)"
            :disable="isDisable(col.field, props.pageIndex) || props.row.use === 1"
            align="around"
            style="width: 100px; border-radius: 6px"
            @click="onApply(col.field, props.row, props.pageIndex)"
          >
            {{ col.label }}
            <template #loading>
              <q-spinner-hourglass />
            </template>
          </q-btn>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>
