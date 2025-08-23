<template>
  <div class="container py-4">
    <h3 class="mb-4">Gestión de Usuarios</h3>

    <!-- Botón para abrir modal de nuevo usuario -->
    <button class="btn btn-success mb-3" @click="abrirModal()">➕ Nuevo Usuario</button>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="usuario in usuariosPaginados" :key="usuario.id">
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.correo }}</td>
          <td>{{ usuario.rol }}</td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="abrirModal(usuario)">
              Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="eliminarUsuario(usuario.id)">
              Eliminar
            </button>
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
        <li
          class="page-item"
          v-for="n in totalPaginas"
          :key="n"
          :class="{ active: paginaActual === n }"
        >
          <button class="page-link" @click="paginaActual = n">{{ n }}</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
      </ul>
    </nav>

    <!-- Modal -->
    <div class="modal fade" id="modalUsuario" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="guardarUsuario">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editando ? "Editar Usuario" : "Nuevo Usuario" }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input
              v-model="nuevo.nombre"
              placeholder="Nombre"
              class="form-control mb-2"
            />
            <input
              v-model="nuevo.correo"
              placeholder="Correo"
              class="form-control mb-2"
            />
            <div class="input-group mb-2">
              <input
                :type="verPassword ? 'text' : 'password'"
                v-model="nuevo.password"
                placeholder="Contraseña"
                class="form-control"
              />
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="verPassword = !verPassword"
              >
                <i :class="verPassword ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
              </button>
            </div>
            <select v-model="nuevo.rol" class="form-select mb-2">
              <option disabled value="">Selecciona un rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Gerente">Gerente</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">Guardar</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
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
const porPagina = 5;
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
