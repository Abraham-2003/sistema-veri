<template>
  <div class="container py-4">
    <h3 class="mb-4">Gestión de Centros</h3>

    <button class="btn btn-success mb-3" @click="abrirModal()">Nuevo Centro</button>

    <!-- Tabla -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Ubicación</th>
          <th>Encargado</th>
          <th>Lineas</th>
          <th>Estatus</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="centro in centrosPaginados" :key="centro.id">
          <td>{{ centro.ubicacion }}</td>
          <td>{{ nombreEncargado(centro.encargado) }}</td>
          <td>{{ centro.lineas }}</td>
          <td>
            <span :class="centro.estatus === 'Activo' ? 'text-success' : 'text-danger'">
              {{ centro.estatus }}
            </span>
          </td>
          <td>
            <button class="btn btn-warning btn-sm me-2" @click="abrirModal(centro)">
              Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="desactivarCentro(centro)">
              Desactivar
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
    <div class="modal fade" id="modalCentro" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <form class="modal-content" @submit.prevent="guardarCentro">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? "Editar Centro" : "Nuevo Centro" }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input
              v-model="nuevo.ubicacion"
              placeholder="Ubicación"
              class="form-control mb-2"
            />
            <input
              v-model="nuevo.lineas"
              placeholder="Número de líneas"
              type="number"
              class="form-control mb-2"
            />
            <select v-model="nuevo.lineaDual" class="form-select mb-2">
              <option disabled value="">Selecciona la línea dual</option>
              <option v-for="n in parseInt(nuevo.lineas) || 0" :key="n" :value="n">
                Línea {{ n }}
              </option>
            </select>

            <select v-model="nuevo.encargado" class="form-select mb-2">
              <option disabled value="">Selecciona un encargado</option>
              <option v-for="gerente in gerentes" :key="gerente.id" :value="gerente.id">
                {{ gerente.nombre }}
              </option>
            </select>

            <select v-model="nuevo.estatus" class="form-select mb-2">
              <option value="Activo">Activo</option>
              <option value="Desactivado">Desactivado</option>
            </select>
            <hr />
<h6 class="mb-3">Microbanca por línea</h6>

<div v-for="(linea, index) in nuevo.microbancaPorLinea" :key="index" class="mb-3 border rounded p-2">
  <strong>Línea {{ index + 1 }}</strong>
  <input
    v-model="linea.marca"
    placeholder="Marca"
    class="form-control mb-2"
  />
  <input
    v-model="linea.serie"
    placeholder="Número de serie"
    class="form-control mb-2"
  />
  <input
    v-model="linea.serieNox"
    placeholder="Número de serie NOX"
    class="form-control mb-2"
  />
  <input
    v-model="linea.serieOxigeno"
    placeholder="Número de serie Oxígeno"
    class="form-control mb-2"
  />
</div>

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
import { ref, computed, onMounted, watch} from "vue";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, addDoc, updateDoc, doc, setDoc } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const centros = ref([]);
const gerentes = ref([]);
const nuevo = ref({
  ubicacion: "",
  lineas: "",
  encargado: "",
  estatus: "Activo",
  lineaDual: "",
  microbancaPorLinea: [],
});

watch(() => nuevo.value.lineas, (lineas) => {
  const n = parseInt(lineas);
  if (!isNaN(n)) {
    nuevo.value.microbancaPorLinea = Array.from({ length: n }, (_, i) => {
      return nuevo.value.microbancaPorLinea[i] || {
        marca: "",
        serie: "",
        serieNox: "",
        serieOxigeno: "",
      };
    });
  } else {
    nuevo.value.microbancaPorLinea = [];
  }
});

const editando = ref(null);
const paginaActual = ref(1);
const porPagina = 10;
const nombreEncargado = (id) => {
  const gerente = gerentes.value.find((g) => g.id === id);
  return gerente ? gerente.nombre : "Sin asignar";
};

const cargarCentros = async () => {
  const snapshot = await getDocs(collection(db, "centros"));
  centros.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const cargarGerentes = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));
  gerentes.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((u) => u.rol === "Gerente");
};

const guardarCentro = async () => {
  let centroId = null;

  if (editando.value) {
    await updateDoc(doc(db, "centros", editando.value), { ...nuevo.value });
    centroId = editando.value;
    editando.value = null;
  } else {
    const centroRef = await addDoc(collection(db, "centros"), { ...nuevo.value });
    centroId = centroRef.id;
  }

  if (nuevo.value.encargado) {
    const usuarioRef = doc(db, "usuarios", nuevo.value.encargado);
    await updateDoc(usuarioRef, { centroId });
    console.log(`[✅ Centro asignado al gerente] ${nuevo.value.encargado} → ${centroId}`);
  }
  nuevo.value = { ubicacion: "", lineas: "", encargado: "", estatus: "Activo" };
  bootstrap.Modal.getInstance(document.getElementById("modalCentro")).hide();
  cargarCentros();
};

const abrirModal = (centro = null) => {
  if (centro) {
    nuevo.value = {
      ubicacion: centro.ubicacion || "",
      lineas: centro.lineas || "",
      encargado: centro.encargado || "",
      estatus: centro.estatus || "Activo",
      lineaDual: centro.lineaDual || "",
      microbancaPorLinea: Array.isArray(centro.microbancaPorLinea)
        ? centro.microbancaPorLinea
        : [],
    };
    editando.value = centro.id;
  } else {
    nuevo.value = {
      ubicacion: "",
      lineas: "",
      encargado: "",
      estatus: "Activo",
      lineaDual: "",
      microbancaPorLinea: [],
    };
    editando.value = null;
  }

  new bootstrap.Modal(document.getElementById("modalCentro")).show();
};


const desactivarCentro = async (centro) => {
  await updateDoc(doc(db, "centros", centro.id), { ...centro, estatus: "Desactivado" });
  cargarCentros();
};

const totalPaginas = computed(() => Math.ceil(centros.value.length / porPagina));
const centrosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina;
  return centros.value.slice(inicio, inicio + porPagina);
});

onMounted(() => {
  cargarCentros();
  cargarGerentes();
});
</script>
