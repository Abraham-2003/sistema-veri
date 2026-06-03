<template>
  <div class="agenda-container">
    <!-- CALENDARIO -->
    <div class="calendar" :class="{ 'with-panel': showPanel }">
      <FullCalendar :options="{ ...calendarOptions, events: calendarEvents }" />
    </div>

    <!-- PANEL -->
    <div v-show="showPanel" class="panel">
      <!-- HEADER -->
      <div class="panel-header">
        <div>
          <h2>{{ selectedDate }}</h2>
          <small v-if="selectedEvent">Detalle del evento</small>
        </div>
        <button @click="closePanel">✕</button>
      </div>

      <!-- DETALLE EVENTO -->
      <div v-if="selectedEvent" class="panel-body">
        <h3>{{ selectedEvent.title }}</h3>
        <p>{{ selectedEvent.description }}</p>

        <div class="meta">
          <span class="badge" :class="selectedEvent.importance">
            {{ selectedEvent.importance }}
          </span>
          <div class="meta">
            <span>
              👤
              {{ selectedEvent.assignedToName || selectedEvent.userName }}
            </span>

            <span v-if="selectedEvent.createdByName">
              🧑 {{ selectedEvent.createdByName }}
            </span>
          </div>
        </div>

        <!-- ARCHIVOS -->
        <div v-if="selectedEvent.files?.length">
          <div v-for="f in selectedEvent.files" :key="f.url" class="file-card">
            <p>📎 {{ f.name }}</p>

            <iframe :src="f.url"></iframe>

            <a :href="f.url" target="_blank" download> Descargar </a>
          </div>
        </div>

        <button class="primary-btn" @click="showUploader = true">
          Adjuntar evidencia
        </button>

        <input
          v-if="showUploader"
          type="file"
          accept="application/pdf"
          @change="uploadFile"
        />

        <button class="secondary-btn" @click="selectedEvent = null">← Volver</button>
      </div>

      <!-- LISTA -->
      <div v-else class="panel-body">
        <div v-if="eventsOfDay.length === 0 && !showForm" class="empty">
          <p>No hay eventos</p>
          <button class="primary-btn" @click="showForm = true">+ Agregar evento</button>
        </div>

        <div v-if="eventsOfDay.length > 0">
          <div
            v-for="e in eventsOfDay"
            :key="e.id"
            class="event-card"
            @click="selectEvent(e)"
          >
            <h4>{{ e.title }}</h4>
            <p>{{ e.description }}</p>
            <small> 👤 {{ e.assignedToName || e.userName }} </small>
          </div>

          <button class="secondary-btn" @click="showForm = true">+ Nuevo evento</button>
        </div>

        <!-- FORMULARIO -->
        <div v-if="showForm" class="form-card">
          <div class="field">
            <label>Título</label>
            <input v-model="newEvent.title" />
          </div>

          <div class="field">
            <label>Descripción</label>
            <textarea v-model="newEvent.description"></textarea>
          </div>
          <div class="field">
            <label>Asignar a</label>
            <select v-model="newEvent.assignedToId">
              <option disabled value="">Selecciona coordinador</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Importancia</label>
            <div class="chips">
              <button
                v-for="lvl in ['baja', 'media', 'alta']"
                :key="lvl"
                :class="['chip', lvl, { active: newEvent.importance === lvl }]"
                @click="newEvent.importance = lvl"
              >
                {{ lvl }}
              </button>
            </div>
          </div>

          <div class="actions">
            <button class="btn cancel" @click="showForm = false">Cancelar</button>
            <button class="btn save" @click="saveEvent">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// Firebase
import { db, storage } from "../../firebase/config";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// estado
const events = ref([]);
const users = ref([]);
const selectedDate = ref(null);
const showPanel = ref(false);
const selectedEvent = ref(null);

const showForm = ref(false);
const showUploader = ref(false);

const newEvent = ref({
  title: "",
  description: "",
  importance: "media",
  date: "",
  assignedToId: "", // 🔥 NUEVO
});
// cargar eventos
onMounted(async () => {
  const user = getUser();

  if (!user) {
    alert("No hay usuario en localStorage");
  }

  const snapshot = await getDocs(collection(db, "events"));
  events.value = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  await loadUsers(); // 🔥 IMPORTANTE
});
const loadUsers = async () => {
  const snapshot = await getDocs(collection(db, "usuarios"));

  users.value = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((u) => u.rol === "Coordinador");
};
const calendarEvents = computed(() =>
  events.value.map((e) => {

    const displayUser =
      e.assignedToName ||
      e.userName ||
      "Sin asignar";

    return {
      id: e.id, // 🔥 IMPORTANTÍSIMO
      title: e.title,
      date: e.date,

      extendedProps: {
        importance: e.importance,
        displayUser,
      },
    };
  })
);

// config calendario
const calendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],

  initialView: "dayGridMonth",

  locale: "es",

  height: "100%",

  fixedWeekCount: false,

  dayMaxEvents: 2,

  eventDisplay: "block",

  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "",
  },

  buttonText: {
    today: "Hoy",
  },

  events: calendarEvents,

  // CLICK EN DÍA
  dateClick: async (info) => {

    selectedDate.value = info.dateStr;

    newEvent.value.date = info.dateStr;

    selectedEvent.value = null;

    showForm.value = false;

    showPanel.value = true;

    await nextTick();

    window.dispatchEvent(new Event("resize"));
  },

  // CLICK EN EVENTO
  eventClick: async (info) => {

    const eventId = info.event.id;

    const evento = events.value.find((e) => e.id === eventId);

    if (!evento) return;

    selectedEvent.value = evento;

    selectedDate.value = evento.date;

    showForm.value = false;

    showPanel.value = true;

    await nextTick();

    window.dispatchEvent(new Event("resize"));
  },

  // DISEÑO EVENTOS
  eventContent: (arg) => {

    const { title } = arg.event;

    const { importance, displayUser } = arg.event.extendedProps;

    return {
      html: `
        <div class="fc-event-custom ${importance}">
          <div class="fc-event-top">
            <span class="fc-dot"></span>
            <div class="fc-title">${title}</div>
          </div>

          <div class="fc-user">
            👤 ${displayUser}
          </div>
        </div>
      `,
    };
  },
};

// eventos por día
const eventsOfDay = computed(() =>
  events.value.filter((e) => e.date === selectedDate.value)
);

// guardar evento
const saveEvent = async () => {
  const user = getUser();

  if (!user) {
    alert("No hay usuario");
    return;
  }

  if (!newEvent.value.title || !newEvent.value.assignedToId) {
    alert("Faltan datos");
    return;
  }

  const assignedUser = users.value.find((u) => u.id === newEvent.value.assignedToId);

  if (!assignedUser) {
    alert("Usuario no válido");
    return;
  }

  const data = {
    title: newEvent.value.title,
    description: newEvent.value.description,
    importance: newEvent.value.importance,
    date: newEvent.value.date,

    createdById: user.id,
    createdByName: user.name || user.nombre || "Admin",

    assignedToId: assignedUser.id,
    assignedToName: assignedUser.name || assignedUser.nombre || "Sin nombre",

    files: [],
  };

  const docRef = await addDoc(collection(db, "events"), data);

  events.value.push({
    id: docRef.id,
    ...data,
  });

  showForm.value = false;
};

// seleccionar evento
const selectEvent = (e) => {
  selectedEvent.value = e;
};

// subir archivo
const uploadFile = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileRef = storageRef(storage, `events/${Date.now()}_${file.name}`);

  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  const newFile = { name: file.name, url };

  selectedEvent.value.files = selectedEvent.value.files || [];
  selectedEvent.value.files.push(newFile);

  await updateDoc(doc(db, "events", selectedEvent.value.id), {
    files: selectedEvent.value.files,
  });

  showUploader.value = false;
};

// cerrar panel
const closePanel = async () => {
  showPanel.value = false;
  selectedEvent.value = null;

  await nextTick();
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 200);
};
</script>

<style scoped>
.agenda-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
}

/* ================= CALENDARIO ================= */
.calendar {
  flex-grow: 1;
  flex-basis: 100%;
  min-width: 0;
  transition: all 0.3s ease;
  padding: 10px;
}

.calendar.with-panel {
  flex-basis: 70%;
}

/* ================= PANEL ================= */
.panel {
  width: 30%;
  max-width: 420px;
  min-width: 340px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s ease;
  box-shadow: -4px 0 20px rgba(0,0,0,0.05);
  border-radius: 12px 0 0 12px;
}

/* HEADER */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.panel-header small {
  color: #64748b;
  font-size: 12px;
}

/* BODY */
.panel-body {
  padding: 18px;
  overflow-y: auto;
}

/* ================= EVENT CARD ================= */
.event-card {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.event-card:hover {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  transform: translateY(-2px);
}

.event-card h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.event-card p {
  margin: 4px 0;
  font-size: 12px;
  color: #64748b;
}

/* ================= META ================= */
.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #475569;
}

/* ================= BADGE ================= */
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.badge.alta {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.badge.media {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.badge.baja {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* ================= ARCHIVOS ================= */
.file-card {
  background: #f1f5f9;
  padding: 10px;
  border-radius: 10px;
  margin-top: 10px;
}

iframe {
  width: 100%;
  height: 140px;
  border-radius: 8px;
  margin-top: 5px;
  border: none;
}

/* ================= FORM ================= */
.form-card {
  background: #ffffff;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  margin-top: 10px;
}

.field {
  margin-bottom: 12px;
}

label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

input,
textarea,
select {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
  font-size: 13px;
  transition: 0.2s;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* ================= CHIPS ================= */
.chips {
  display: flex;
  gap: 6px;
  margin-top: 5px;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: #e5e7eb;
  font-size: 11px;
  cursor: pointer;
  transition: 0.2s;
}

.chip:hover {
  opacity: 0.8;
}

.chip.active {
  background: #2563eb;
  color: white;
}

/* ================= BOTONES ================= */
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.primary-btn,
.btn.save {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn:hover,
.btn.save:hover {
  transform: scale(1.03);
}

.btn.cancel {
  background: #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
}

/* ================= EMPTY ================= */
.empty {
  text-align: center;
  color: #64748b;
  margin-top: 40px;
}

/* ================= EVENTOS CALENDARIO ================= */

.fc-event-custom {
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 100%;

  overflow: hidden;
  padding: 3px 6px;
  border-radius: 6px;
  color: white;

  font-size: 10px;
  line-height: 1.1;
}
.fc-event-custom .fc-title {
  font-weight: 600;

  overflow: hidden;
  text-overflow: ellipsis;
}
.fc-event-custom {
  width: 100%;
  border-radius: 10px;
  padding: 6px 8px;
  overflow: hidden;

  backdrop-filter: blur(6px);

  box-shadow:
    0 2px 6px rgba(0,0,0,0.08);

  transition: all .2s ease;
}

.fc-event-custom:hover {
  transform: scale(1.02);
}

.fc-event-top {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.9);
  flex-shrink: 0;
}

.fc-title {
  font-size: 11px;
  font-weight: 700;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fc-user {
  margin-top: 3px;

  font-size: 9px;

  opacity: .9;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.fc-daygrid-event) {
  overflow: hidden !important;
  white-space: nowrap;
}

:deep(.fc-event-main) {
  overflow: hidden;
}
.fc-event-custom .fc-user {
  font-size: 9px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* colores */
.fc-event-custom.alta {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.fc-event-custom.media {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.fc-event-custom.baja {
  background: linear-gradient(135deg, #10b981, #059669);
}
:deep(.fc) {
  --fc-border-color: #e2e8f0;

  --fc-page-bg-color: transparent;

  --fc-neutral-bg-color: #f8fafc;

  --fc-today-bg-color: rgba(37, 99, 235, 0.08);

  font-family: 'Inter', sans-serif;
}

:deep(.fc-toolbar-title) {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

:deep(.fc-button) {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;

  border-radius: 10px !important;

  box-shadow: 0 2px 5px rgba(0,0,0,0.04);

  transition: all .2s ease;
}

:deep(.fc-button:hover) {
  background: #f8fafc !important;
}

:deep(.fc-daygrid-day-frame) {
  padding: 4px;
}

:deep(.fc-day-today) {
  border-radius: 12px;
}

:deep(.fc-daygrid-day-number) {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

:deep(.fc-col-header-cell-cushion) {
  color: #64748b;
  font-weight: 600;
  text-decoration: none;
}

:deep(.fc-scrollgrid) {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
/* ================= ANIMACIÓN ================= */
@keyframes slideIn {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
