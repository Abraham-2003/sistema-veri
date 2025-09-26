<template>
  <div
    v-if="visible"
    class="d-flex flex-column text-white vh-100 p-3"
    style="
      width: 250px;
      background: linear-gradient(135deg, #198754 0%, #54806cff 100%);
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1050;
    "
  >
    <button
      @click="$emit('close')"
      class="btn btn-outline-dark position-fixed top-0 start-0 m-2 z-3"
    >
      ☰
    </button>

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
      <router-link to="/Gerente" class="nav-link text-white py-2 px-3 rounded mb-1">
        Inicio
      </router-link>

      <!-- Otras opciones -->
      <router-link
        v-if="accesoReportes"
        to="/Gerente/Reporte"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Reportes Diarios
      </router-link>

      <!-- Alternativa desactivada -->
      <div
        v-else
        class="nav-link text-white py-2 px-3 rounded mb-1 bg-opacity-25 bg-dark text-muted"
        style="cursor: not-allowed"
      >
        Reportes Diarios <span class="ms-2 small">(Disponible 9–11 y 18–20)</span>
      </div>

      <router-link
        to="/Gerente/ReporteLab"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Reportes Laboratorios
      </router-link>

      <router-link
        to="/Gerente/Solicitudes"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Registrar Solicitudes
      </router-link>

      <router-link
        to="/Gerente/Infraestructura"
        class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="bg-secondary"
      >
        Infraestructura
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
import { defineProps } from "vue";
import { computed } from "vue";

const hora = new Date().getHours();

const accesoReportes = computed(() => {
  return (hora >= 9 && hora < 11) || (hora >= 13 && hora < 20);
});

const props = defineProps({
  visible: Boolean,
});

const router = useRouter();
const user = ref({ nombre: "", foto: "", rol: "" });
const showGestion = ref(false);

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

const logout = () => {
  localStorage.removeItem("user");
  router.push("/login");
};
</script>

<style scoped>
.nav-link:hover,
.dropdown-item:hover {
  background-color: #19573aff;
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

.rotate {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
