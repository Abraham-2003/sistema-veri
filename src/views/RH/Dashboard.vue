<template>
  <div class="d-flex min-vh-100">
    <RHSidebar />
    <div class="flex-grow-1 p-4">
    <router-view />
  </div>
  </div>
</template>

<script>
import RHSidebar from './RHSidebar.vue'

export default {
  components: {
    RHSidebar
  }
}
</script>

<style scoped>
.coordinador-layout {
  display: flex;
}
</style>
