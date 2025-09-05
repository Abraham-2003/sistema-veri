<template>
   <div class="d-flex min-vh-100">
    <AdminSidebar />
    <div class="flex-grow-1 p-4">
    <router-view />
  </div>
  </div>
</template>

<script>
import AdminSidebar from './AdminSidebar.vue'

export default {
  components: {
    AdminSidebar
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
}
</style>
