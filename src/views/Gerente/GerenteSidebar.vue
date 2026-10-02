<template>
  <div v-if="visible" class="d-flex flex-column text-white vh-100 p-3" style="
  width: 250px;
  background: linear-gradient(
    180deg,
    #8b6b2e 0%,
    #1a1a1a 60%,
    #000000  100%
  );
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  box-shadow: 4px 0 20px rgba(0,0,0,.30);
">
    <button @click="$emit('close')" class="btn btn-outline-dark position-fixed top-0 start-0 m-2 z-3">
      ☰
    </button>

    <!-- Perfil -->
    <div class="text-center mb-4">
      <img :src="user.foto ? user.foto : perfilAbraham" class="rounded-circle mb-3 perfil-sidebar"
        alt="Foto de perfil" />
      <h5 class="mb-0">{{ user.nombre }}</h5>
      <small style="color: white">{{ user.rol }}</small>
    </div>

    <!-- Navegación -->
    <nav class="flex-grow-1">
      <router-link to="/Gerente" class="nav-link text-white py-2 px-3 rounded mb-1" active-class="sidebar-active">
        Inicio
      </router-link>

      <!-- Otras opciones -->
      <router-link v-if="accesoReportes" to="/Gerente/Reporte" class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="sidebar-active">
        Reportes Diarios
      </router-link>

      <!-- Alternativa desactivada -->
      <div v-else class="nav-link text-white py-2 px-3 rounded mb-1 bg-opacity-25 bg-dark text-muted"
        style="cursor: not-allowed">
        Reportes Diarios <span class="ms-2 small">(Disponible 9–11 y 18–20)</span>
      </div>

      <router-link to="/Gerente/ReporteLab" class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="sidebar-active">
        Reportes Laboratorios
      </router-link>

      <router-link to="/Gerente/Solicitudes" class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="sidebar-active">
        Registrar Solicitudes
      </router-link>
      <router-link to="/Gerente/OrdenServicio" class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="sidebar-active">
        Orden de servicio
      </router-link>
      <router-link to="/Gerente/Infraestructura" class="nav-link text-white py-2 px-3 rounded mb-1"
        active-class="sidebar-active">
        Infraestructura
      </router-link>
    </nav>

    <!-- Logout -->
    <button @click="logout" class="btn btn-light mt-auto w-100 logout-btn">
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
  return (hora >= 7 && hora < 11) || (hora >= 11 && hora < 22);
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
.perfil-sidebar {
  width: 95px;
  height: 95px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, .25);
  box-shadow: 0 4px 15px rgba(0, 0, 0, .2);
}

.sidebar-link {
  color: rgba(255, 255, 255, .9);
  text-decoration: none;
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 6px;
  transition: all .25s ease;
  display: block;
  font-weight: 500;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, .12);
  color: white;
  transform: translateX(4px);
}

.sidebar-active {
  background: rgba(255, 255, 255, .18);
  backdrop-filter: blur(8px);
  color: white !important;
  font-weight: 600;
  box-shadow: inset 3px 0 0 rgba(255, 255, 255, .8);
}

.logout-btn {
  border-radius: 12px;
  font-weight: 600;
  transition: all .25s ease;
}

.logout-btn:hover {
  transform: translateY(-2px);
}

.nav-link:hover,
.dropdown-item:hover {
  background: rgba(255, 255, 255, .12);
}

.dropdown-item {
  color: white;
  border-radius: 10px;
  transition: .25s;
}

.rotate {
  transform: rotate(180deg);
  transition: transform .3s ease;
}
</style>