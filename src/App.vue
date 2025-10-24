
<template>
<AlertBox ref="alertRef" />
  <router-view />
</template>

<script setup>
import { ref } from 'vue';
// import AlertBox from './components/AlertBox.vue';

// const alertRef = ref(null);

// window.$alert = (msg) => {
//   alertRef.value?.showAlert(msg);
// };
</script>
