<template>
  <div class="empleados-container">
    <div class="header">
      <h3>Empleados registrados</h3>

      <button class="btn btn-success" @click="nuevoEmpleado">Registrar empleado</button>
    </div>

    <table class="table table-hover align-middle">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Centro</th>
          <th>Fecha ingreso</th>
          <th>Antigüedad</th>
          <th width="180">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="emp in empleados" :key="emp.id">
          <td>{{ emp.nombre }}</td>

          <td>{{ nombreCentro(emp.centroId) }}</td>

          <td>{{ formatoFecha(emp.fechaIngreso) }}</td>

          <td>{{ calcularAntiguedad(emp.fechaIngreso) }}</td>

          <td class="d-flex gap-2">
            <button class="btn btn-warning btn-sm" @click="editarEmpleado(emp)">
              Editar
            </button>

            <button class="btn btn-danger btn-sm" @click="eliminarEmpleado(emp)">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <EmpleadoForm
      v-if="mostrarForm"
      :empleadoEditar="empleadoSeleccionado"
      @cerrar="cerrarModal"
      @guardar="guardarEmpleado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

import EmpleadoForm from "./EmpleadoForm.vue";

import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from "../../servivces/empleados/empleados.repository"

const empleados = ref([]);
const centros = ref([]);

const mostrarForm = ref(false);

const empleadoSeleccionado = ref(null);

// ======================================================

const cargarDatos = async () => {
  empleados.value = await obtenerEmpleados();

  centros.value = await obtenerCentros();
};

// ======================================================

const nombreCentro = (id) => {
  const centro = centros.value.find((c) => c.id === id);

  return centro?.ubicacion || "—";
};

// ======================================================

const formatoFecha = (f) => {
  if (!f) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(f));
};

// ======================================================

const calcularAntiguedad = (f) => {
  if (!f) return "—";

  const fechaIngreso = new Date(f);

  const hoy = new Date();

  let años = hoy.getFullYear() - fechaIngreso.getFullYear();

  const m = hoy.getMonth() - fechaIngreso.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < fechaIngreso.getDate())) {
    años--;
  }

  return `${años} años`;
};

// ======================================================

const nuevoEmpleado = () => {
  empleadoSeleccionado.value = null;

  mostrarForm.value = true;
};

// ======================================================

const editarEmpleado = (emp) => {
  empleadoSeleccionado.value = { ...emp };

  mostrarForm.value = true;
};

// ======================================================

const cerrarModal = () => {
  mostrarForm.value = false;

  empleadoSeleccionado.value = null;
};

// ======================================================

const guardarEmpleado = async (empleado) => {
  if (empleado.id) {
    await actualizarEmpleadoFirestore(empleado.id, empleado);
  } else {
    await crearEmpleado(empleado)
  }

  await cargarDatos();

  cerrarModal();
};

// ======================================================

// ======================================================

onMounted(cargarDatos);
</script>

<style scoped>
.empleados-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

table {
  border-radius: 12px;
  overflow: hidden;
}
</style>
