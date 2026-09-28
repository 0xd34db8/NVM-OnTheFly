<script setup lang="ts">
import { ref, type Ref } from 'vue'
import Layout from './components/layouts/Layout.vue'

const isLoading: Ref<boolean> = ref(false)


// }
</script>

<template>
  <Teleport to="body">
    <div
      v-show="isLoading"
      class="loader"
    />
  </Teleport>

  <Layout />
  <!--  <div class="container">-->
  <!--    <div class="row content-row pad15">-->
  <!--      <div>-->
  <!--        <span class="title">NVM</span>-->
  <!--        <span class="space" />-->
  <!--        <span class="sub-title">desk</span>-->
  <!--      </div>-->

  <!--      <span class="sub-title">v0.0.1</span>-->
  <!--    </div>-->

  <!--    <hr>-->

  <!--    <div class="row content-row pad15">-->
  <!--      <span class="sub-title">Current Version</span>-->
  <!--      <span class="sub-title current-version">v18.0.0</span>-->
  <!--    </div>-->

  <!--    <hr>-->

  <!--    &lt;!&ndash;    <div style="margin-bottom:10px">&ndash;&gt;-->
  <!--    &lt;!&ndash;      <div style="margin-bottom:10px">&ndash;&gt;-->
  <!--    &lt;!&ndash;        <button @click="onInstallNVM"&ndash;&gt;-->
  <!--    &lt;!&ndash;                style="background-color: #1dd5ff85">&ndash;&gt;-->
  <!--    &lt;!&ndash;          NVM 설치&ndash;&gt;-->
  <!--    &lt;!&ndash;        </button>&ndash;&gt;-->
  <!--    &lt;!&ndash;      </div>&ndash;&gt;-->
  <!--    &lt;!&ndash;    </div>&ndash;&gt;-->

  <!--    <div class="row">-->
  <!--      <NodeList v-model:loader="isLoading" />-->
  <!--    </div>-->

  <!--    <div class="main-footer">-->
  <!--      <div>-->
  <!--        MIT License-->
  <!--      </div>-->
  <!--      <div>-->
  <!--        Copyright © 2023 Dev.DY-->
  <!--      </div>-->
  <!--    </div>-->
  <!--  </div>-->
</template>
