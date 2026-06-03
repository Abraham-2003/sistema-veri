<template>
  <div
    class="d-flex flex-column text-white p-3 sidebar"
    style="width: 250px; background: linear-gradient(135deg, #2c003e 0%, #ff4da6 100%)"
  >
    <!-- Perfil -->
    <div class="text-center mb-4">
      <img
        :src="user.foto ? user.foto : perfilAbraham"
        class="rounded-circle mb-2"
        style="width: 100px; height: 100px"
        alt="Foto de perfil"
      />
      <h5 class="mb-0">{{ user.nombre }}</h5>
      <small style="color: white">{{ user.rol }}</small>
    </div>

    <!-- Navegación -->
    <nav class="flex-grow-1">
      <router-link to="/RecursosHumanos" class="nav-link text-white py-2 px-3 rounded mb-1">
        Inicio
      </router-link>
      <router-link
        to="/RecursosHumanos/Empleados"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Empleados
      </router-link>
      <router-link
        to="/RecursosHumanos/Vacaciones"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Calendario
      </router-link>
      <router-link
        to="/RecursosHumanos/Consultas"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Consultas
      </router-link>


    </nav>

    <!-- Logout -->
    <button @click="logout" class="btn btn-outline-light mt-auto w-100">
      Cerrar sesión
    </button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted, onBeforeUnmount } from "vue";
import perfilAbraham from "../../assets/fotoperfil.png";

const router = useRouter();
const user = ref({ nombre: "", foto: "", rol: "" });
const showGestion = ref(false);

let stopSolicitudes = null;
let stopInfraestructura = null;

onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser) {
    console.warn("No se encontró usuario en localStorage");
    return;
  }

  user.value = storedUser;

  // ❌ Ya NO activamos listeners aquí
  console.log("Sidebar cargado para", storedUser.rol);
});


onBeforeUnmount(() => {
  if (stopSolicitudes) stopSolicitudes();
  if (stopInfraestructura) stopInfraestructura();
});

const logout = () => {
  if (stopSolicitudes) stopSolicitudes();
  if (stopInfraestructura) stopInfraestructura();
  localStorage.removeItem("user");
  router.push("/login");
};
</script>

<style scoped>
.nav-link:hover,
.dropdown-item:hover {
  background-color: #2c3e50;
  transition: background-color 0.2s ease;
}

.gestion-dropdown .submenu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
}

.dropdown-item:hover {
  background-color: #2c3e50;
}

.rotate {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
