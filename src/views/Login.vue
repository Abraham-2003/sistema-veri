<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card elevation="2" max-width="400">
      <v-card-title class="text-h6">🔐 Iniciar sesión</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="correo"
            label="Correo"
            type="email"
            required
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Contraseña"
            type="password"
            required
          ></v-text-field>
          <v-btn type="submit" color="primary" block>Ingresar</v-btn>
        </v-form>
        <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/modules/auth/services/auth'

const correo = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  try {
    const user = await login(correo.value, password.value)
    if (user.rol === 'admin') {
      router.push('/admin')
    } else if (user.rol === 'gerente') {
      router.push('/gerente')
    } else {
      error.value = 'Rol no reconocido'
    }
  } catch (err) {
    error.value = 'Credenciales inválidas'
  }
}
</script>
