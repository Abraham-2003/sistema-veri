<template>
  <div class="container py-4">
    <h3 class="mb-4">Gestión de Proveedores</h3>

    <button class="btn btn-success mb-3" @click="abrirModal()">Nuevo proveedor</button>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Nombre</th>
          <th>Contacto</th>
          <th>Servicio</th>
      
        </tr>
      </thead>
      <tbody>
        <tr v-for="prov in proveedoresPaginados" :key="prov.id">
          <td>{{ prov.nombre }}</td>
          <td>{{ prov.contacto }}</td>
          <td>{{ prov.servicio }}</td>
          
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

const proveedores = ref([])
const nuevo = ref({ nombre: '', contacto: '', servicio: '' })
const editando = ref(null)
const paginaActual = ref(1)
const porPagina = 10

const cargarProveedores = async () => {
  const snapshot = await getDocs(collection(db, 'proveedores'))
  proveedores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const guardarProveedor = async () => {
  if (editando.value) {
    await updateDoc(doc(db, 'proveedores', editando.value), { ...nuevo.value })
    editando.value = null
  } else {
    await addDoc(collection(db, 'proveedores'), { ...nuevo.value })
  }
  nuevo.value = { nombre: '', contacto: '', servicio: '' }
  bootstrap.Modal.getInstance(document.getElementById('modalProveedor')).hide()
  cargarProveedores()
}

const abrirModal = (prov = null) => {
  if (prov) {
    nuevo.value = { ...prov }
    editando.value = prov.id
  } else {
    nuevo.value = { nombre: '', contacto: '', servicio: '' }
    editando.value = null
  }
  new bootstrap.Modal(document.getElementById('modalProveedor')).show()
}


const totalPaginas = computed(() => Math.ceil(proveedores.value.length / porPagina))
const proveedoresPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return proveedores.value.slice(inicio, inicio + porPagina)
})

onMounted(() => {
  cargarProveedores()
})
</script>
