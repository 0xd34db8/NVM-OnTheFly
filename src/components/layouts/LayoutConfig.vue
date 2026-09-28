<script setup lang="ts">
import { ref, toRefs, watch, type Ref } from 'vue'
import {Dark} from 'quasar'

const props = defineProps<{
  isShow: boolean
}>()

defineEmits<{
  'update:is-show': [value: boolean]
}>()

const { isShow } = toRefs(props)
const isOpen: Ref<boolean> = ref(false)
const themeMode: Ref<boolean> = ref(false)

const getLinkedin = 'https://www.linkedin.com/in/apurv7gupta/'
const getGithub = 'https://github.com/0xd34db8/NVM-OnTheFly'

watch(isShow, v => isOpen.value = v)

function onChangeTheme (val:boolean) {
  Dark.set(val)

  window.electronAPI.send('setConfig', {dark: val})
}

window.electronAPI.receive('getConfig', (_, { config }) => {
  themeMode.value = config.dark
  onChangeTheme(config.dark)
})
</script>

<template>
  <q-drawer
    v-model="isOpen"
    side="right"
    behavior="desktop"
    no-swipe-open
    no-swipe-close
    no-swipe-backdrop
    :class="['config-panel', $q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark']"
    :style="$q.dark.isActive ? 'border-left: 1px solid #27272a;' : 'border-left: 1px solid #e5e7eb;'"
    @update:model-value="$emit('update:is-show', isOpen)"
  >
    <div class="column full-height">
    <div class="row config-title justify-between q-pa-md" :style="$q.dark.isActive ? 'border-bottom: 1px solid #27272a' : 'border-bottom: 1px solid #e5e7eb'">
      <div class="col">
        <div class="text-h6 text-weight-bold tracking-wide">Settings</div>
      </div>

      <div>
        <q-btn
          round
          flat
          size="sm"
          icon="close"
          :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
          @click="$emit('update:is-show', false)"
        />
      </div>
    </div>

    <div class="config-body q-pa-md">
      <div class="row items-center q-mb-md">
        <div :class="['col text-subtitle2', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
          Dark Theme
        </div>
        <div class="col text-right">
          <q-toggle
            v-model="themeMode"
            size="sm"
            checked-icon="dark_mode"
            color="brand"
            unchecked-icon="light_mode"
            @update:model-value="onChangeTheme"
          />
        </div>
      </div>

      <div class="row items-center">
        <div :class="['col text-subtitle2', $q.dark.isActive ? 'text-grey-4' : 'text-grey-8']">
          Support
        </div>

        <div class="col text-right q-gutter-x-sm">
          <a :href="getLinkedin" :class="[$q.dark.isActive ? 'text-grey-4 hover-text-white' : 'text-grey-8 hover-text-dark', 'transition-colors']">
            <q-icon
              name="fa-brands fa-linkedin"
              size="sm"
            />
          </a>

          <a
            :href="getGithub"
            target="_blank"
            :class="[$q.dark.isActive ? 'text-grey-4 hover-text-white' : 'text-grey-8 hover-text-dark', 'transition-colors']"
          >
            <q-icon
              name="fa-brands fa-github"
              size="sm"
            />
          </a>
        </div>
      </div>
    </div>


    <div class="config-footer q-pb-md">
      <div class="row justify-center text-caption text-grey-6">MIT LICENSE</div>
      <div class="row justify-center text-caption text-grey-6">Made by Apurv Gupta (0xd34db8)</div>
    </div>
    </div>
  </q-drawer>
</template>
