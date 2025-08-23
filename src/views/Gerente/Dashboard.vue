<template>
  <div :class="['admin-layout', { 'con-sidebar': mostrarSidebar }]">
    <button 
      class="btn btn-outline-dark position-fixed top-0 start-0 m-2 z-3"
      @click="mostrarSidebar = true"
    >
      ☰
    </button>

    <SidebarGerente :visible="mostrarSidebar" @close="mostrarSidebar = false" />

    <div class="contenido">
      <router-view />
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import SidebarGerente from './GerenteSidebar.vue'
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(() => route.fullPath, () => {
  mostrarSidebar.value = false
})


const mostrarSidebar = ref(false)
</script>

<style scoped>
.admin-layout {
  transition: margin-left 0.3s ease;
}

.admin-layout .contenido {
  padding: 2rem;
  transition: margin-left 0.3s ease;
}

.admin-layout.con-sidebar .contenido {
  margin-left: 250px; /* mismo ancho que el sidebar */
}

</style>
