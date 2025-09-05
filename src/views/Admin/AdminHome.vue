<template>
  <div class="admin-layout">
    <main class="admin-content">
      <h2 class="titulo">Bienvenido, {{ user.nombre || "Administrador" }}</h2>

      <!-- Estadísticas principales -->
      <div class="grid-stats">
        <div class="stat-card azul">
          <div class="stat-info">
            <h5>Verificentros Activos</h5>
            <p class="stat-value">{{ centrosActivos }}</p>
          </div>
          <div class="stat-icon">🏢</div>
        </div>

        <div class="stat-card verde">
          <div class="stat-info">
            <h5>Reportes Hoy</h5>
            <p class="stat-value">{{ reportesHoy }}</p>
          </div>
          <div class="stat-icon">📝</div>
        </div>

        <div class="stat-card rojo">
          <div class="stat-info">
            <h5>Solicitudes</h5>
            <p class="stat-value">{{ solicitudesActivas }}</p>
          </div>
          <div class="stat-icon">📩</div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <h3 class="subtitulo">Accesos Rápidos</h3>
      <div class="grid-accesos">
        <router-link to="/Administrador/Reportes" class="acceso-card azul-borde">
          📊 <span>Ir a Reportes</span>
        </router-link>

        <router-link to="/Administrador/Solicitudes" class="acceso-card amarillo-borde">
          📬 <span>Ver Solicitudes</span>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'
import dayjs from 'dayjs'

const db = getFirestore()

async function obtenerReportesHoy() {
  const hoy = dayjs().format('YYYY-MM-DD')
  const q = query(collection(db, 'reportes'), where('fecha', '==', hoy))
  const snapshot = await getDocs(q)
  return snapshot.size
}

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
      reportesHoy: 0,
    };
  },
  async mounted() {
    this.centrosActivos = await obtenerCentrosActivos();
    this.solicitudesActivas = await obtenerSolicitudesActivas();
    this.reportesHoy = await obtenerReportesHoy();
  },
};
</script>

<style scoped>
/* Layout */
.admin-content {
  flex: 1;
  padding: 2rem;
}

/* Títulos */
.titulo {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.subtitulo {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: #34495e;
}

/* Grid de estadísticas */
.grid-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.stat-info h5 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.3rem;
  font-weight: 700;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

/* Colores */
.azul {
  background: linear-gradient(135deg, #007bff, #0056b3);
}
.verde {
  background: linear-gradient(135deg, #28a745, #1e7e34);
}
.rojo {
  background: linear-gradient(135deg, #dc3545, #a71d2a);
}

/* Accesos rápidos */
.grid-accesos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem;
}

.acceso-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

.acceso-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}

.azul-borde {
  border: 2px solid #007bff;
  color: #007bff;
}
.amarillo-borde {
  border: 2px solid #ffc107;
  color: #856404;
}
</style>
