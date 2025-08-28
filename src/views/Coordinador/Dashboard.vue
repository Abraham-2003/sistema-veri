<template>
  <div class="coordinador-layout">
    <CoordinadorSidebar />
    <router-view />
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
