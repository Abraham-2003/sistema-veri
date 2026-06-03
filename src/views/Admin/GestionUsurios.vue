<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-semibold mb-0">Gestión de Usuarios</h3>

      <button class="btn btn-success btn-sm" @click="abrirModal()">
        Nuevo usuario
      </button>
    </div>

    <!-- Tabla -->
    <div class="table-responsive">
      <table class="table infra-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th class="d-none d-md-table-cell">Correo</th>
            <th>Rol</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="usuario in usuariosPaginados" :key="usuario.id">
            <td class="fw-medium">
              {{ usuario.nombre }}
            </td>

            <td class="d-none d-md-table-cell text-muted small">
              {{ usuario.correo }}
            </td>

            <td>
              <span class="role-pill">
                {{ usuario.rol }}
              </span>
            </td>

            <td class="text-end">
              <div class="action-buttons">
                <button
                  class="btn btn-light btn-sm"
                  @click="abrirModal(usuario)"
                  title="Editar"
                >
                  <i class="bi bi-pencil-square"></i>
                </button>

                <button
                  class="btn btn-light btn-sm text-danger"
                  @click="eliminarUsuario(usuario.id)"
                  title="Eliminar"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="usuariosPaginados.length === 0">
            <td colspan="4" class="text-center text-muted py-4">
              No hay usuarios registrados
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
    <div
      class="modal fade"
      id="modalUsuario"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="guardarUsuario">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editando ? "Editar usuario" : "Nuevo usuario" }}
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
              <label class="form-label small">Correo</label>
              <input v-model="nuevo.correo" class="form-control form-control-sm" />
            </div>

            <div class="mb-2">
              <label class="form-label small">Contraseña</label>
              <div class="input-group input-group-sm">
                <input
                  :type="verPassword ? 'text' : 'password'"
                  v-model="nuevo.password"
                  class="form-control"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="verPassword = !verPassword"
                >
                  <i
                    :class="verPassword ? 'bi bi-eye' : 'bi bi-eye-slash'"
                  ></i>
                </button>
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label small">Rol</label>
              <select
                v-model="nuevo.rol"
                class="form-select form-select-sm"
              >
                <option disabled value="">Selecciona un rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Gerente">Gerente</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
              </select>
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
import { ref, computed, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const usuarios = ref([]);
const nuevo = ref({ nombre: "", correo: "", password: "", rol: "" });
const editando = ref(null);
const paginaActual = ref(1);
const porPagina = 10;
const verPassword = ref(false);

const cargarUsuarios = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));
  usuarios.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const guardarUsuario = async () => {
  if (editando.value) {
    await updateDoc(doc(db, "usuarios", editando.value), { ...nuevo.value });
    editando.value = null;
  } else {
    await addDoc(collection(db, "usuarios"), { ...nuevo.value });
  }
  nuevo.value = { nombre: "", correo: "", password: "", rol: "" };
  bootstrap.Modal.getInstance(document.getElementById("modalUsuario")).hide();
  cargarUsuarios();
};

const abrirModal = (usuario = null) => {
  if (usuario) {
    nuevo.value = { ...usuario };
    editando.value = usuario.id;
  } else {
    nuevo.value = { nombre: "", correo: "", password: "", rol: "" };
    editando.value = null;
  }
  new bootstrap.Modal(document.getElementById("modalUsuario")).show();
};

const eliminarUsuario = async (id) => {
  await deleteDoc(doc(db, "usuarios", id));
  cargarUsuarios();
};

const totalPaginas = computed(() => Math.ceil(usuarios.value.length / porPagina));
const usuariosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return usuarios.value.slice(inicio, inicio + porPagina);
});

onMounted(() => {
  cargarUsuarios();
});
</script>
<style scoped>
/* Base corporativa */
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
.role-pill {
  padding: 4px 10px;
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