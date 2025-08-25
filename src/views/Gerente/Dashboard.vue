<template>
  <div :class="['admin-layout', { 'con-sidebar': mostrarSidebar }]">
  <button
      class="btn btn-outline-ligth position-fixed top-0 start-0 m-2 z-3"
      @click="mostrarSidebar = true"
    >
      ☰
    </button>
    <nav class="navbar justify-content-center shadow-sm" >
      <img
        src="../../assets/pwa-512x512.png"
        alt="Logo"
        height="40"
        class="d-inline-block align-middle"
      />
      
    </nav>

    

    <SidebarGerente :visible="mostrarSidebar" @close="mostrarSidebar = false" />

    <div class="contenido">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SidebarGerente from "./GerenteSidebar.vue";
import { watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    mostrarSidebar.value = false;
  }
);

const mostrarSidebar = ref(false);
</script>

<style scoped>
.admin-layout {
  background-color: #f2f2f2;
  min-height: 100vh;
}

.admin-layout .contenido {
  padding: 2rem;
  transition: margin-left 0.3s ease;
}


</style>
