<template>
  <div class="container py-4">
    <h3 class="mb-4">Gestión de Laboratorios</h3>

    <button class="btn btn-success mb-3" @click="abrirModal()">➕ Nuevo laboratorio</button>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Nombre</th>
          <th>Contacto</th>
          <th>Especialidad</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lab in laboratoriosPaginados" :key="lab.id">
          <td>{{ lab.nombre }}</td>
          <td>{{ lab.contacto }}</td>
          <td>{{ lab.especialidad }}</td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="abrirModal(lab)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="eliminarLaboratorio(lab.id)">Eliminar</button>
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

    <!-- Modal -->
    <div class="modal fade" id="modalLaboratorio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="guardarLaboratorio">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar laboratorio' : 'Nuevo laboratorio' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input v-model="nuevo.nombre" placeholder="Nombre" class="form-control mb-2" />
            <input v-model="nuevo.contacto" placeholder="Contacto" class="form-control mb-2" />
            <input v-model="nuevo.especialidad" placeholder="Especialidad" class="form-control mb-2" />
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
import { ref, computed, onMounted } from 'vue'
import { db } from '../../servivces/auth.js'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore'
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'

const laboratorios = ref([])
const nuevo = ref({ nombre: '', contacto: '', especialidad: '' })
const editando = ref(null)
const paginaActual = ref(1)
const porPagina = 10

const cargarLaboratorios = async () => {
  const snapshot = await getDocs(collection(db, 'laboratorios'))
  laboratorios.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const guardarLaboratorio = async () => {
  if (editando.value) {
    await updateDoc(doc(db, 'laboratorios', editando.value), { ...nuevo.value })
    editando.value = null
  } else {
    await addDoc(collection(db, 'laboratorios'), { ...nuevo.value })
  }
  nuevo.value = { nombre: '', contacto: '', especialidad: '' }
  bootstrap.Modal.getInstance(document.getElementById('modalLaboratorio')).hide()
  cargarLaboratorios()
}

const abrirModal = (lab = null) => {
  if (lab) {
    nuevo.value = { ...lab }
    editando.value = lab.id
  } else {
    nuevo.value = { nombre: '', contacto: '', especialidad: '' }
    editando.value = null
  }
  new bootstrap.Modal(document.getElementById('modalLaboratorio')).show()
}

const eliminarLaboratorio = async (id) => {
  await deleteDoc(doc(db, 'laboratorios', id))
  cargarLaboratorios()
}

const totalPaginas = computed(() => Math.ceil(laboratorios.value.length / porPagina))
const laboratoriosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return laboratorios.value.slice(inicio, inicio + porPagina)
})

onMounted(() => {
  cargarLaboratorios()
})
</script>
