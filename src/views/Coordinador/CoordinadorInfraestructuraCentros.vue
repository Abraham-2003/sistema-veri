<template>
  <div class="container py-4">
    <h2 class="titulo">Estado de Infraestructura</h2>

    <div class="grid-centros">
      <div
        v-for="centro in centrosProcesados"
        :key="centro.id"
        class="centro-card"
        :class="{ alerta: centro.tieneFalla }"
        @click="verInfraestructuraCentro(centro.id)"
      >
        <div class="centro-header">
          <h3>{{ centro.ubicacion }}</h3>

          <span class="badge" :class="centro.tieneFalla ? 'badge-rojo' : 'badge-verde'">
            {{ centro.tieneFalla ? "Con fallas" : "Operativo" }}
          </span>
        </div>

        <p class="encargado">
          Responsable:
          <span class="nombre">
            {{ nombreGerente(centro.encargado) }}
          </span>
        </p>

        <div v-if="centro.tieneFalla" class="alerta">
          Infraestructura fuera de servicio
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, query, where } from "firebase/firestore";

const router = useRouter();

const centros = ref([]);
const infraestructuras = ref([]);

const gerentes = ref([]);

const cargarGerentes = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));
  gerentes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((u) => u.rol === "Gerente");
};

const cargarCentros = async () => {
  const snapshot = await getDocs(
    query(collection(db, "centros"), where("estatus", "==", "Activo"))
  );

  centros.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const cargarInfraestructura = async () => {
  const snapshot = await getDocs(collection(db, "infraestructura"));
  infraestructuras.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* =========================
   LÓGICA DE CARDS
========================= */

const centrosProcesados = computed(() => {
  return centros.value.map((centro) => {
    const tieneFalla = infraestructuras.value.some(
      (i) => i.centroId === centro.id && i.estatus === "Fuera de servicio"
    );

    return {
      ...centro,
      tieneFalla,
    };
  });
});

const nombreGerente = (gerenteId) => {
  const gerente = gerentes.value.find((g) => g.id === gerenteId);
  return gerente ? gerente.nombre : "Sin asignar";
};

const verInfraestructuraCentro = (centroId) => {
  router.push({
    name: "CoordinadorInfraestructura",
    params: { centroId },
  });
};

onMounted(() => {
  cargarCentros();
  cargarInfraestructura();
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
