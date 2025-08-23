<template>
  <div class="container py-4">
    <h3 class="mb-4">Estado de Infraestructura</h3>

    <!-- Filtro por centro -->
    <select v-model="filtroCentro" class="form-select mb-3">
      <option value="">Todos los centros</option>
      <option v-for="centro in centros" :key="centro.id" :value="centro.id">
        {{ centro.ubicacion }}
      </option>
    </select>

    <button class="btn btn-success mb-3" @click="abrirModal()">➕ Nuevo elemento</button>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Elemento</th>
          <th>Estatus</th>
          <th>Última Revisión</th>
          <th>Observaciones</th>
          <th>Centro</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in infraestructuraFiltrada" :key="item.id">
          <td>{{ item.elemento }}</td>
          <td :class="item.estatus === 'Operativo' ? 'text-success' : 'text-danger'">{{ item.estatus }}</td>
          <td>{{ item.ultimaRevision }}</td>
          <td>{{ item.observaciones }}</td>
          <td>{{ obtenerNombreCentro(item.centroId) }}</td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="abrirModal(item)">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div class="modal fade" id="modalInfra" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="guardarInfraestructura">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar elemento' : 'Nuevo elemento' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input v-model="nuevo.elemento" placeholder="Elemento" class="form-control mb-2" />

            <select v-model="nuevo.estatus" class="form-select mb-2">
              <option value="Operativo">Operativo</option>
              <option value="Fuera de servicio">Fuera de servicio</option>
            </select>

            <textarea v-model="nuevo.observaciones" placeholder="Observaciones" class="form-control mb-2" />

            <select v-model="nuevo.centroId" class="form-select mb-2">
              <option disabled value="">Selecciona un centro</option>
              <option v-for="centro in centros" :key="centro.id" :value="centro.id">
                {{ centro.ubicacion }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Guardar</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../../servivces/auth.js'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc
} from 'firebase/firestore'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'

const infraestructura = ref([])
const centros = ref([])
const filtroCentro = ref('')
const nuevo = ref({ elemento: '', estatus: 'Operativo', observaciones: '', centroId: '' })
const editando = ref(null)

const cargarInfraestructura = async () => {
  const snapshot = await getDocs(collection(db, 'infraestructura'))
  infraestructura.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, 'centros'))
  centros.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const guardarInfraestructura = async () => {
  const hoy = new Date().toISOString().split('T')[0]
  nuevo.value.ultimaRevision = hoy

  if (editando.value) {
    await updateDoc(doc(db, 'infraestructura', editando.value), { ...nuevo.value })
    editando.value = null
  } else {
    await addDoc(collection(db, 'infraestructura'), { ...nuevo.value })
  }

  nuevo.value = { elemento: '', estatus: 'Operativo', observaciones: '', centroId: '' }
  bootstrap.Modal.getInstance(document.getElementById('modalInfra')).hide()
  cargarInfraestructura()
}

const abrirModal = (item = null) => {
  if (item) {
    nuevo.value = { ...item }
    editando.value = item.id
  } else {
    nuevo.value = { elemento: '', estatus: 'Operativo', observaciones: '', centroId: '' }
    editando.value = null
  }
  new bootstrap.Modal(document.getElementById('modalInfra')).show()
}

const infraestructuraFiltrada = computed(() => {
  if (!filtroCentro.value) return infraestructura.value
  return infraestructura.value.filter(i => i.centroId === filtroCentro.value)
})

const obtenerNombreCentro = (id) => {
  const centro = centros.value.find(c => c.id === id)
  return centro ? centro.ubicacion : '—'
}

onMounted(() => {
  cargarInfraestructura()
  cargarCentros()
})
</script>
