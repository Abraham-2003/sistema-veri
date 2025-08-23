<template>
  <div v-if="visible" class="alert-box">{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue';
const visible = ref(false);
const message = ref('');

function showAlert(msg) {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user || user.rol !== 'Administrador') return

  message.value = msg
  visible.value = true
  setTimeout(() => visible.value = false, 5000)
}

defineExpose({ showAlert });
</script>

<style scoped>
.alert-box {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #20912fff;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 9999;
}
</style>
