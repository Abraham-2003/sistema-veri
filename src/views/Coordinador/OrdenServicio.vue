<template>
  <div class="container py-4">
    <h3 class="mb-4">Órdenes de Servicio</h3>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Centro</th>
          <th>Fecha</th>
          <th>Orden #</th>
          <th>Falla reportada</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="orden in ordenesPaginadas" :key="orden.id">
          <td>{{ nombreCentro(orden.centroId) }}</td>
          <td>{{ orden.fecha }}</td>
          <td>{{ orden.ordenNumero }}</td>
          <td>{{ orden.falla }}</td>
          <td>
            <button class="btn btn-info btn-sm me-2" @click="verDetalles(orden)">Ver detalles</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <nav>
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li class="page-item" v-for="n in totalPaginas" :key="n" :class="{ active: paginaActual === n }">
          <button class="page-link" @click="paginaActual = n">{{ n }}</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>

    <!-- Modal de detalles -->
    <div class="modal fade" id="modalDetalles" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la Orden</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p><strong>Centro:</strong> {{ nombreCentro(seleccionada.centroId) }}</p>
            <p><strong>Fecha:</strong> {{ seleccionada.fecha }}</p>
            <p><strong>Orden #:</strong> {{ seleccionada.ordenNumero }}</p>
            <p><strong>Líneas:</strong> {{ Array.isArray(seleccionada.lineas) ? seleccionada.lineas.join(', ') : '—' }}</p>
            <p><strong>Hora inicio:</strong> {{ seleccionada.horaInicio }}</p>
            <p><strong>Hora término:</strong> {{ seleccionada.horaTermino }}</p>
            <p><strong>Recibe:</strong> {{ seleccionada.recibe }}</p>
            <p><strong>Proveedor:</strong> {{ seleccionada.proveedor }}</p>
            <p><strong>Técnico:</strong> {{ seleccionada.tecnico }}</p>
            <p><strong>Reporte #:</strong> {{ seleccionada.reporteNumero }}</p>
            <p><strong>Falla:</strong> {{ seleccionada.falla }}</p>
            <p><strong>Trabajo:</strong> {{ seleccionada.trabajo }}</p>
            <p><strong>Status:</strong> {{ seleccionada.status }}</p>
            <p><strong>Observaciones:</strong> {{ seleccionada.observaciones }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../../servivces/auth.js'
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'

const ordenes = ref([])
const centros = ref([])
const seleccionada = ref({})
const paginaActual = ref(1)
const porPagina = 10

const cargarOrdenes = async () => {
  const snapshot = await getDocs(collection(db, 'ordenesServicio'))
  ordenes.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, 'centros'))
  centros.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const nombreCentro = (id) => {
  const centro = centros.value.find(c => c.id === id)
  return centro ? centro.ubicacion : 'Sin centro'
}

const verDetalles = (orden) => {
  seleccionada.value = orden
  new bootstrap.Modal(document.getElementById('modalDetalles')).show()
}



const totalPaginas = computed(() => Math.ceil(ordenes.value.length / porPagina))
const ordenesPaginadas = computed(() => {
  const ordenadas = [...ordenes.value]
    .filter(o => o.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const inicio = (paginaActual.value - 1) * porPagina
  return ordenadas.slice(inicio, inicio + porPagina)
})

onMounted(() => {
  cargarOrdenes()
  cargarCentros()
})
</script>
