<template>
  <div class="admin-layout">
    <AdminSidebar />
    <router-view />
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
