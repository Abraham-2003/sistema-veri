<template>
  <div class="container py-4">
    <h3 class="mb-4">Órdenes de Servicio</h3>

    <button class="btn btn-success mb-3" @click="abrirFormulario()">Nueva orden</button>

    <!-- Tabla de historial -->
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>Fecha</th>
          <th>Orden #</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="orden in ordenesPaginadas" :key="orden.id">
          <td>{{ orden.fecha }}</td>
          <td>{{ orden.ordenNumero }}</td>

          <td>
            <button class="btn btn-info btn-sm" @click="verDetalles(orden)">
              Ver detalles
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

    <!-- Modal de formulario -->
    <div class="modal fade" id="modalFormulario" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <form class="modal-content" @submit.prevent="guardarOrden">
          <div class="modal-header">
            <h5 class="modal-title">Nueva Orden de Servicio</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.fecha"
                  type="date"
                  class="form-control"
                  placeholder="Fecha"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.ordenNumero"
                  class="form-control"
                  placeholder="Número de orden"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.horaInicio"
                  type="time"
                  class="form-control"
                  placeholder="Hora inicio"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.horaTermino"
                  type="time"
                  class="form-control"
                  placeholder="Hora término"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.recibe"
                  class="form-control"
                  placeholder="Quién recibe al proveedor"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.proveedor"
                  class="form-control"
                  placeholder="Proveedor"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.tecnico"
                  class="form-control"
                  placeholder="Técnico"
                />
              </div>
              <div class="col-md-6 mb-2">
                <input
                  v-model="nueva.reporteNumero"
                  class="form-control"
                  placeholder="Número de reporte"
                />
              </div>
              <div class="col-md-12 mb-2">
                <input
                  v-model="nueva.lineasTexto"
                  class="form-control"
                  placeholder="Líneas atendidas (ej. 1,2,3)"
                />
              </div>
              <div class="col-md-12 mb-2">
                <textarea
                  v-model="nueva.falla"
                  class="form-control"
                  placeholder="Falla reportada"
                ></textarea>
              </div>
              <div class="col-md-12 mb-2">
                <textarea
                  v-model="nueva.trabajo"
                  class="form-control"
                  placeholder="Trabajo realizado"
                ></textarea>
              </div>
              <div class="col-md-12 mb-2">
                <select v-model="nueva.status" class="form-select">
                  <option disabled value="">Status actual de la línea</option>
                  <option value="Operativa">Operativa</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Fuera de servicio">Fuera de servicio</option>
                </select>
              </div>
              <div class="col-md-12 mb-2">
                <textarea
                  v-model="nueva.observaciones"
                  class="form-control"
                  placeholder="Observaciones"
                ></textarea>
              </div>
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

    <!-- Modal de detalles -->
    <div class="modal fade" id="modalDetalles" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la Orden</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p><strong>Fecha:</strong> {{ seleccionada.fecha }}</p>
            <p><strong>Orden #:</strong> {{ seleccionada.ordenNumero }}</p>
            <p>
              <strong>Líneas:</strong>
              {{
                Array.isArray(seleccionada.lineas) ? seleccionada.lineas.join(", ") : "—"
              }}
            </p>
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
import { ref, computed, onMounted } from "vue";
import { db } from "../../servivces/auth.js";
import { collection, getDocs, addDoc, doc } from "firebase/firestore";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min.js";

const ordenes = ref([]);
const nueva = ref({
  fecha: "",
  ordenNumero: "",
  lineasTexto: "",
  horaInicio: "",
  horaTermino: "",
  recibe: "",
  proveedor: "",
  tecnico: "",
  reporteNumero: "",
  falla: "",
  trabajo: "",
  status: "",
  observaciones: "",
});
const seleccionada = ref({});
const paginaActual = ref(1);
const porPagina = 10;

const cargarOrdenes = async () => {
  const snapshot = await getDocs(collection(db, "ordenesServicio"));
  ordenes.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const guardarOrden = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const centroId = user?.centroId || "sin-centro";

  const lineas = nueva.value.lineasTexto
    .split(",")
    .map((l) => l.trim())
    .filter((l) => l);

  const orden = {
    ...nueva.value,
    lineas,
    centroId,
  };

  delete orden.lineasTexto;

  await addDoc(collection(db, "ordenesServicio"), orden);
  bootstrap.Modal.getInstance(document.getElementById("modalFormulario")).hide();
  nueva.value = {
    fecha: "",
    ordenNumero: "",
    lineasTexto: "",
    horaInicio: "",
    horaTermino: "",
    recibe: "",
    proveedor: "",
    tecnico: "",
    reporteNumero: "",
    falla: "",
    trabajo: "",
    status: "",
    observaciones: "",
  };

  cargarOrdenes();
  ordenes.value.forEach(o => console.log(o.fecha, new Date(o.fecha)))

};

const verDetalles = (orden) => {
  seleccionada.value = orden;
  new bootstrap.Modal(document.getElementById("modalDetalles")).show();
};

const abrirFormulario = () => {
  nueva.value = {
    fecha: "",
    ordenNumero: "",
    lineasTexto: "",
    horaInicio: "",
    horaTermino: "",
    recibe: "",
    proveedor: "",
    tecnico: "",
    reporteNumero: "",
    falla: "",
    trabajo: "",
    status: "",
    observaciones: "",
  };
  new bootstrap.Modal(document.getElementById("modalFormulario")).show();
};

const totalPaginas = computed(() => Math.ceil(ordenes.value.length / porPagina));
const ordenesPaginadas = computed(() => {
  const user = JSON.parse(localStorage.getItem("user"))
  const centroId = user?.centroId || "sin-centro"

  const propias = ordenes.value.filter(o => o.centroId === centroId)

  const ordenadas = propias
    .filter(o => o.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  const inicio = (paginaActual.value - 1) * porPagina
  return ordenadas.slice(inicio, inicio + porPagina)
})


onMounted(() => {
  cargarOrdenes();
});
</script>
