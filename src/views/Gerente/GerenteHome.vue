<template>
  <div class="home-gerente container-fluid py-4 text-white text-center">
    <h4 class="mb-4 fw-bold text-success">Bienvenido, {{ user.nombre }}</h4>

    <div class="row g-4 justify-content-center">
      <div class="col-12 col-sm-10 col-md-6 col-lg-4" v-for="card in cards" :key="card.to">
        <router-link :to="card.to" class="card shadow-sm text-decoration-none h-100">
          <img :src="card.img" class="card-img-top" :alt="card.alt" />
          <div class="card-body bg-dark bg-opacity-75 text-white">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text small">{{ card.text }}</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import reportes from '../../assets/Reportes.webp'
import reporteslab from '../../assets/reportelab.jpg'
import solicitues from '../../assets/solicitudes.jpg'
import infraestructura from '../../assets/Infraestructura.jpg'
const user = ref({ nombre: 'Gerente' });

const cards = [
  {
    to: "/Gerente/Reporte",
    img: reportes,
    alt: "Reportes",
    title: "Enviar Reporte Diario",
    text: "Registra el estado de tu verificentro"
  },
  {
    to: "/Gerente/ReporteLab",
    img: reporteslab,
    alt: "Reportes Laboratorio",
    title: "Reportes laboratorios",
    text: "Registra un reporte de laboratorio"
  },
  {
    to: "/Gerente/Solicitudes",
    img: solicitues,
    alt: "Solicitudes",
    title: "Registrar Solicitud",
    text: "Solicita soporte o mantenimiento"
  },
  {
    to: "/Gerente/Infraestructura",
    img: infraestructura,
    alt: "Infraestructura",
    title: "Infraestructura",
    text: "Actualiza el estado de tus equipos"
  }
];

onMounted(() => {
  const stored = JSON.parse(localStorage.getItem('user'));
  if (stored) user.value = stored;
});

</script>

<style scoped>
.card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.card-img-top {
  height: 180px;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
}

@media (min-width: 768px) {
  .home-gerente {
    text-align: left;
  }

  .card-title {
    font-size: 1.2rem;
  }

  .card-text {
    font-size: 0.95rem;
  }
}

</style>
