<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Gestión de Proveedores</h3>

      <button class="btn btn-success btn-sm" @click="abrirModal()">
        Nuevo proveedor
      </button>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th class="d-none d-md-table-cell">Contacto</th>
            <th>Servicio</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="prov in proveedoresPaginados" :key="prov.id">
            <td class="fw-medium">
              {{ prov.nombre }}
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ prov.contacto }}
            </td>

            <td>
              <span class="service-pill">
                {{ prov.servicio }}
              </span>
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <button
                  class="btn btn-light btn-sm"
                  @click="abrirModal(prov)"
                  title="Editar"
                >
                  ✏️
                </button>

                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarProveedor(prov.id)"
                  title="Eliminar"
                >
                  🗑
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="proveedoresPaginados.length === 0">
            <td colspan="4" class="text-center text-muted py-4">
              No hay proveedores registrados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <nav class="mt-3">
      <ul class="pagination pagination-sm justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">
            Anterior
          </button>
        </li>

        <li class="page-item disabled">
          <span class="page-link">
            Página {{ paginaActual }}
          </span>
        </li>

        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">
            Siguiente
          </button>
        </li>
      </ul>
    </nav>

    <!-- Modal -->
    <div class="modal fade" id="modalProveedor" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarProveedor">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editando ? 'Editar proveedor' : 'Nuevo proveedor' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>

          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label small">Nombre</label>
              <input v-model="nuevo.nombre" class="form-control form-control-sm" />
            </div>

            <div class="mb-2">
              <label class="form-label small">Contacto</label>
              <input v-model="nuevo.contacto" class="form-control form-control-sm" />
            </div>

            <div class="mb-2">
              <label class="form-label small">Servicio</label>
              <input v-model="nuevo.servicio" class="form-control form-control-sm" />
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-bs-dismiss="modal"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-success btn-sm">
              Guardar
            </button>
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

const eliminarProveedor = async (id) => {
  await deleteDoc(doc(db, 'proveedores', id))
  cargarProveedores()
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
<style scoped>
/* Tabla base */
.infra-table {
  background: #fff;
  border-collapse: separate;
  border-spacing: 0;
}

.infra-table thead th {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
}

.infra-table tbody tr {
  transition: background 0.15s ease;
}

.infra-table tbody tr:hover {
  background: #f8f9fa;
}

.infra-table td {
  vertical-align: middle;
  border-top: none;
}

/* Pills */
.service-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  background: #eef1f4;
  font-size: 0.75rem;
  font-weight: 500;
  color: #495057;
}

/* Acciones */
.action-buttons {
  display: inline-flex;
  gap: 6px;
}
</style>