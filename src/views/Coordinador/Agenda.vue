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
          <span class="author">👤{{ selectedEvent.assignedToName || selectedEvent.userName }}</span>
        </div>

        <!-- ARCHIVOS -->
        <div v-if="selectedEvent.files?.length">
          <div v-for="f in selectedEvent.files" :key="f.url" class="file-card">
            <p>📎 {{ f.name }}</p>

            <iframe :src="f.url"></iframe>

            <a :href="f.url" target="_blank" download>
              Descargar
            </a>
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

        <button class="secondary-btn" @click="selectedEvent = null">
          ← Volver
        </button>
      </div>

      <!-- LISTA -->
      <div v-else class="panel-body">

        <div v-if="eventsOfDay.length === 0 && !showForm" class="empty">
          <p>No hay eventos</p>
          <button class="primary-btn" @click="showForm = true">
            + Agregar evento
          </button>
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
            <small>👤 {{ e.assignedToName || e.userName }}</small>
          </div>

          <button class="secondary-btn" @click="showForm = true">
            + Nuevo evento
          </button>
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
            <label>Importancia</label>
            <div class="chips">
              <button 
                v-for="lvl in ['baja','media','alta']"
                :key="lvl"
                :class="['chip', lvl, { active: newEvent.importance === lvl }]"
                @click="newEvent.importance = lvl"
              >
                {{ lvl }}
              </button>
            </div>
          </div>

          <div class="actions">
            <button class="btn cancel" @click="showForm = false">
              Cancelar
            </button>
            <button class="btn save" @click="saveEvent">
              Guardar
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

// Firebase
import { db, storage } from '../../firebase/config'
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

const getUser = () => {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

// estado
const events = ref([])

const selectedDate = ref(null)
const showPanel = ref(false)
const selectedEvent = ref(null)

const showForm = ref(false)
const showUploader = ref(false)

const newEvent = ref({
  title: '',
  description: '',
  importance: 'media',
  date: ''
})

// cargar eventos
onMounted(async () => {
  const user = getUser()
  if (!user) {
    alert("No hay usuario en localStorage")
  }

  const snapshot = await getDocs(collection(db, "events"))
  events.value = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
})

const calendarEvents = computed(() =>
  events.value.map(e => {

    // 🔥 lógica correcta
    const displayUser =
      e.assignedToName ||  // eventos del admin
      e.userName ||        // eventos del coordinador
      "Sin asignar"

    return {
      title: e.title,
      date: e.date,
      extendedProps: {
        importance: e.importance,
        displayUser
      }
    }
  })
)
// config calendario
const calendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  events: calendarEvents,

  dateClick: async (info) => {
    selectedDate.value = info.dateStr
    newEvent.value.date = info.dateStr
    showPanel.value = true
    selectedEvent.value = null

    await nextTick()
    window.dispatchEvent(new Event('resize'))
  },

  // 🔥 PERSONALIZAR EVENTO
  eventContent: (arg) => {
  const { title } = arg.event
  const { importance, displayUser } = arg.event.extendedProps

  return {
    html: `
      <div class="fc-event-custom ${importance}">
        <div class="fc-title">${title}</div>
        <div class="fc-user">👤 ${displayUser}</div>
      </div>
    `
  }
}
}

// eventos por día
const eventsOfDay = computed(() =>
  events.value.filter(e => e.date === selectedDate.value)
)

// guardar evento
const saveEvent = async () => {
  const user = getUser()

  if (!user) {
    alert("No hay usuario")
    return
  }

  if (!newEvent.value.title) return

  const data = {
    ...newEvent.value,
    files: [],
    userId: user.id,
    userName: user.name || user.nombre
  }

  const docRef = await addDoc(collection(db, "events"), data)

  events.value.push({
    id: docRef.id,
    ...data
  })

  showForm.value = false
}

// seleccionar evento
const selectEvent = (e) => {
  selectedEvent.value = e
}

// subir archivo
const uploadFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const fileRef = storageRef(storage, `events/${Date.now()}_${file.name}`)

  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  const newFile = { name: file.name, url }

  selectedEvent.value.files = selectedEvent.value.files || []
  selectedEvent.value.files.push(newFile)

  await updateDoc(doc(db, "events", selectedEvent.value.id), {
    files: selectedEvent.value.files
  })

  showUploader.value = false
}

// cerrar panel
const closePanel = async () => {
  showPanel.value = false
  selectedEvent.value = null

  await nextTick()
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 200)
}
</script>

<style scoped>
.agenda-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* CALENDARIO */
.calendar {
  flex-grow: 1;
  flex-basis: 100%;
  min-width: 0;
  transition: all 0.3s ease;
}

/* CUANDO HAY PANEL */
.calendar.with-panel {
  flex-basis: 70%;
}

/* PANEL */
.panel {
  width: 30%;
  max-width: 400px;
  min-width: 320px;
  background: white;
  border-left: 1px solid #eee;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s ease;
}

/* ANIMACIÓN */
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
.fc-custom-event {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 6px;
  color: white;
  margin-top: 2px;
}

.fc-custom-event.alta { background: #ef4444; }
.fc-custom-event.media { background: #f59e0b; }
.fc-custom-event.baja { background: #10b981; }


.panel-header {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.panel-body {
  padding: 15px;
  overflow-y: auto;
}

.event-card {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.event-card:hover {
  background: #f3f4f6;
}

.meta {
  display: flex;
  justify-content: space-between;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  color: white;
}

.badge.alta { background: #ef4444; }
.badge.media { background: #f59e0b; }
.badge.baja { background: #10b981; }

.file-card {
  background: #f3f4f6;
  padding: 8px;
  border-radius: 8px;
  margin-top: 10px;
}

iframe {
  width: 100%;
  height: 150px;
  border: none;
}

.form-card {
  background: #fff;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
}

.field {
  margin-bottom: 10px;
}

input, textarea {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.chips {
  display: flex;
  gap: 5px;
}

.chip {
  padding: 5px 10px;
  border-radius: 20px;
  border: none;
  background: #eee;
}

.chip.active {
  background: #2563eb;
  color: white;
}

.actions {
  display: flex;
  justify-content: space-between;
}

.primary-btn {
  background: #2563eb;
  color: white;
  padding: 6px;
  border-radius: 6px;
  border: none;
}

.btn.cancel {
  background: #e5e7eb;
}

.btn.save {
  background: #2563eb;
  color: white;
}

.empty {
  text-align: center;
}.fc-event-custom {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 6px;
  color: white;
  overflow: hidden;
}

.fc-event-custom .fc-title {
  font-weight: bold;
  line-height: 1.2;
}

.fc-event-custom .fc-user {
  font-size: 9px;
  opacity: 0.8;
}

/* colores */
.fc-event-custom.alta {
  background: #ef4444;
}

.fc-event-custom.media {
  background: #f59e0b;
}

.fc-event-custom.baja {
  background: #10b981;
}
</style>