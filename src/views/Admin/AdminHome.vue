<template>
  <div class="admin-layout">
    <main class="admin-content">
      <h2 class="mb-4">Bienvenido, {{ user.nombre || "Administrador" }}</h2>

      <div class="row mb-4">
        <div class="col-12 col-md-6 mb-3">
          <div class="card text-white bg-primary mb-3">
            <div class="card-body">
              <h5 class="card-title">Verificentros Activos</h5>
              <p class="card-text display-6">{{ centrosActivos }}</p>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6 mb-3">
          <div class="card text-white bg-success mb-3">
            <div class="card-body">
              <h5 class="card-title">Reportes Hoy</h5>
              <p class="card-text display-6">0</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 mb-3">
          <div class="card text-white bg-danger mb-3">
            <div class="card-body">
              <h5 class="card-title">Solicitudes</h5>
              <p class="card-text display-6">{{ solicitudesActivas }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <div class="row mb-4">
        <div class="col-md-4">
          <router-link to="/Administrador/Reportes" class="text-decoration-none">
            <div class="card border-primary text-primary text-center p-3">
              <h5>📊 Ir a Reportes</h5>
            </div>
          </router-link>
        </div>

        <div class="col-md-4">
          <router-link to="/Administrador/Solicitudes" class="text-decoration-none">
            <div class="card border-warning text-warning text-center p-3">
              <h5>📨 Ver Solicitudes</h5>
            </div>
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>
<script>
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'

const db = getFirestore()

async function obtenerCentrosActivos() {
  const q = query(collection(db, 'centros'), where('estatus', '==', 'Activo'))
  const snapshot = await getDocs(q)
  return snapshot.size
}

async function obtenerSolicitudesActivas() {
  const q = query(collection(db, 'solicitudes'))
  const snapshot = await getDocs(q)
  return snapshot.size
}

export default {
  data() {
    return {
      user: JSON.parse(localStorage.getItem("user")) || {},
      centrosActivos: 0,
      solicitudesActivas: 0,
    };
  },
  async mounted() {
    this.centrosActivos = await obtenerCentrosActivos();
    this.solicitudesActivas = await obtenerSolicitudesActivas();
  },
};
</script>

<style scoped>
.admin-content {
  flex: 1;
  padding: 2rem;
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.card-text.display-6 {
  font-size: 2.5rem;
  font-weight: bold;
}
</style>
