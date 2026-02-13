<template>
  <div class="container py-4">
    <h2 class="titulo">Vencimientos por Centro</h2>

    <div class="grid-centros">
      <div
        v-for="centro in centrosConRiesgo"
        :key="centro.id"
        class="centro-card"
        :class="centro.riesgo.clase"
        @click="verDetalleCentro(centro)"
      >
        <div class="centro-header">
          <h3>{{ centro.ubicacion }}</h3>
          <span class="badge" :class="centro.riesgo.badge">
            {{ centro.riesgo.texto }}
          </span>
        </div>

        <p class="encargado">
          Responsable:
          <span class="nombre">{{ nombreEncargado(centro.encargado) }}</span>
        </p>

        <div class="vencimiento-info">
          <strong>Próximo vencimiento:</strong>
          <span>{{ centro.riesgo.fecha }}</span>
        </div>

        <div v-if="centro.riesgo.dias <= 30" class="alerta">
          {{ centro.riesgo.dias }} días restantes
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

const router = useRouter();

const centros = ref([]);
const reportesLab = ref([]);
const gerentes = ref([]);

/* 🔹 Cargas */
const cargarCentros = async () => {
  const snap = await getDocs(collection(db, "centros"));
  centros.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const cargarReportesLab = async () => {
  const snap = await getDocs(collection(db, "ReporteLab"));
  reportesLab.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const cargarGerentes = async () => {
  const snap = await getDocs(collection(db, "usuarios"));
  gerentes.value = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.rol === "Gerente");
};

/* 🔹 Helpers */
const nombreEncargado = (id) => {
  const g = gerentes.value.find((x) => x.id === id);
  return g ? g.nombre : "Sin asignar";
};

/* 🔹 Cálculo de riesgo */
const centrosConRiesgo = computed(() => {
  return centros.value.map((centro) => {
    const reportesCentro = reportesLab.value.filter(
      (r) => r.centroId === centro.id && r.vencimiento
    );

    if (reportesCentro.length === 0) {
      return {
        ...centro,
        riesgo: {
          dias: null,
          texto: "Sin reportes",
          fecha: "—",
          clase: "ok",
          badge: "badge-verde",
        },
      };
    }

    const fechas = reportesCentro.map((r) => dayjs(r.vencimiento));

    const proximo = fechas.sort((a, b) => a.diff(b))[0];
    const dias = proximo.diff(dayjs(), "day");

    if (dias <= 7) {
      return buildRiesgo(centro, dias, proximo, "Crítico", "critico", "badge-rojo");
    }

    if (dias <= 30) {
      return buildRiesgo(centro, dias, proximo, "Próximo", "proximo", "badge-amarillo");
    }

    return buildRiesgo(centro, dias, proximo, "En regla", "ok", "badge-verde");
  });
});

const buildRiesgo = (centro, dias, fecha, texto, clase, badge) => ({
  ...centro,
  riesgo: {
    dias,
    texto,
    fecha: fecha.format("DD/MM/YYYY"),
    clase,
    badge,
  },
});

/* 🔹 Navegación */
const verDetalleCentro = (centro) => {
  router.push({
    name: "ReportesLaboratorioCentro",
    params: { centroId: centro.id },
  });
};

onMounted(() => {
  cargarCentros();
  cargarReportesLab();
  cargarGerentes();
});
</script>
<style scoped>
.titulo {
  font-size: 1.9rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.grid-centros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.6rem;
}

/* Card */
.centro-card {
  background: #fff;
  border-radius: 18px;
  padding: 1.4rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 6px solid transparent;
}

.centro-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.15);
}

/* Header */
.centro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.centro-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #34495e;
}

/* Badge */
.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-verde {
  background: #d4edda;
  color: #155724;
}

.badge-amarillo {
  background: #fff3cd;
  color: #856404;
}

.badge-rojo {
  background: #f8d7da;
  color: #721c24;
}

/* Texto */
.encargado {
  font-size: 0.9rem;
  margin: 0.8rem 0;
  color: #7f8c8d;
}

.nombre {
  font-weight: 600;
  color: #2c3e50;
}

.vencimiento-info {
  font-size: 0.9rem;
  color: #34495e;
}

/* Alerta */
.alerta {
  margin-top: 1rem;
  text-align: center;
  padding: 0.6rem;
  border-radius: 10px;
  background: #fdecea;
  color: #842029;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
