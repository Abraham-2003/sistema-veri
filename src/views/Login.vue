<template>
  <div class="login-wrapper d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow p-4 bg-white rounded" style="width: 100%; max-width: 400px">
      <h4 class="mb-4 text-center text-success">Iniciar sesión</h4>

      <div class="mb-3">
        <label for="email" class="form-label">Correo electrónico</label>
        <input
          type="email"
          id="email"
          v-model="email"
          class="form-control"
          placeholder="ejemplo@correo.com"
        />
      </div>

      <div class="mb-3 position-relative">
        <label for="password" class="form-label">Contraseña</label>
        <input
          :type="mostrarPassword ? 'text' : 'password'"
          id="password"
          v-model="password"
          class="form-control pe-5"
          placeholder="••••••••"
        />
        <span class="toggle-password" @click="mostrarPassword = !mostrarPassword">
          <i :class="mostrarPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </span>
      </div>

      <button @click="handleLogin" class="btn btn-success w-100" :disabled="loading">
        {{ loading ? "Ingresando..." : "Ingresar" }}
      </button>

      <div v-if="error" class="alert alert-danger mt-3 text-center">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { db } from "../servivces/auth.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import 'bootstrap-icons/font/bootstrap-icons.css';


const router = useRouter();
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref(null);
const mostrarPassword = ref(false);


const handleLogin = async () => {
  loading.value = true;
  error.value = null;

  try {
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("correo", "==", email.value));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      error.value = "Usuario no encontrado";
    } else {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.password === password.value) {
        localStorage.setItem("user", JSON.stringify(userData));
        router.push(`/${userData.rol}`);
      } else {
        error.value = "Contraseña incorrecta";
      }
    }
  } catch (err) {
    error.value = "Error al conectar con la base de datos";
    console.error(err);
  }

  loading.value = false;
};
</script>
<style>
.login-wrapper {
  background: linear-gradient(135deg, #1f2d3d 0%, #198754 100%);
}
.toggle-password {
  position: absolute;
  top: 38px;
  right: 12px;
  cursor: pointer;
  color: #6c757d;
  font-size: 1.2rem;
}

</style>
