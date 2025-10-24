<template>
  <div
    class="d-flex flex-column text-white p-3 sidebar"
    style="width: 250px; background: linear-gradient(135deg, #1f2d3d 0%, #586d82 100%)"
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
      <router-link to="/Administrador" class="nav-link text-white py-2 px-3 rounded mb-1">
        Inicio
      </router-link>

      <!-- Gestión Dropdown -->
      <div class="gestion-dropdown mb-1">
        <button
          class="btn text-white w-100 text-start d-flex justify-content-between align-items-center"
          @click="showGestion = !showGestion"
        >
          Gestión
          <span :class="{ rotate: showGestion }">▾</span>
        </button>
        <div v-show="showGestion" class="submenu mt-1">
          <router-link
            class="dropdown-item"
            to="/Administrador/Gestion"
            active-class="bg-secondary"
            >Usuarios</router-link
          >
          <router-link
            class="dropdown-item"
            to="/Administrador/Gestion Centros"
            active-class="bg-secondary"
            >Centros</router-link
          >
          <router-link
            class="dropdown-item"
            to="/Administrador/Gestion Lab"
            active-class="bg-secondary"
            >Laboratorios</router-link
          >
          <router-link
            class="dropdown-item"
            to="/Administrador/Gestion Provedores"
            active-class="bg-secondary"
            >Proveedores</router-link
          >
        </div>
      </div>

      <!-- Otras opciones -->
      <router-link
        to="/Administrador/Reportes"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Reportes
      </router-link>

      <router-link
        to="/Administrador/ReportesLab"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Reportes Laboratorios
      </router-link>
      <router-link
        to="/Administrador/ConsultasAdmin"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Consultas
      </router-link>
      <router-link
        to="/Administrador/Solicitudes"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Solicitudes
      </router-link>
      <router-link
        to="/Administrador/OrdenServicio"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Ordenes de servicio
      </router-link>
      <router-link
        to="/Administrador/Infraestructura"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Infraestructura
      </router-link>
    </nav>
    <br />
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
import { listenToSolicitudes } from "../../firebase/firestoreListeners";

const router = useRouter();
const user = ref({ nombre: "", foto: "", rol: "" });
const showGestion = ref(false);

let stopSolicitudes = null;
let stopInfraestructura = null;

onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser) {
    user.value = storedUser;

    if (storedUser.rol === "Administrador") {
      stopSolicitudes = listenToSolicitudes();
      console.log("Listeners activados para administrador");
    } else {
      console.log("Usuario sin permisos para listeners");
    }
  } else {
    console.warn("No se encontró usuario en localStorage");
  }
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
