<template>
  <div class="d-flex min-vh-100">
    <CoordinadorSidebar />
    <div class="flex-grow-1 p-4">
    <router-view />
  </div>
  </div>
</template>

<script>
import CoordinadorSidebar from './CoordinadorSidebar.vue'

export default {
  components: {
    CoordinadorSidebar
  }
}
</script>

<style scoped>
.coordinador-layout {
  display: flex;
}
</style>
