// <template>
//   <div class="panel-container">
//     <!-- HEADER -->
//     <div class="panel-header">
//       <div>
//         <h2>{{ date }}</h2>
//         <p class="subtitle">Agenda del día</p>
//       </div>

//       <button class="close-btn" @click="$emit('close')">✕</button>
//     </div>


//       <!-- 📎 DETALLE EVENTO -->
// <div v-if="selectedEvent" class="event-detail">

//   <h3>{{ selectedEvent.title }}</h3>
//   <p>{{ selectedEvent.description }}</p>

//   <span class="badge">{{ selectedEvent.importance }}</span>

//   <!-- archivos -->
//   <div v-if="selectedEvent.files?.length" class="files">
//     <a v-for="f in selectedEvent.files" :key="f.url" :href="f.url" target="_blank">
//       📎 {{ f.name }}
//     </a>
//   </div>

//   <!-- BOTÓN -->
//   <button class="primary-btn" @click="showUploader = true">
//     Adjuntar evidencia
//   </button>

//   <!-- UPLOADER -->
//   <div v-if="showUploader">
//     <FileUploader @uploaded="addFileToEvent" />
//   </div>

//   <button class="secondary-btn" @click="$emit('back')">
//     ← Volver
//   </button>
// <!-- 📋 LISTA -->
// <div v-else>

//       <!-- 📋 LISTA DE EVENTOS -->
//       <div v-if="events.length > 0" class="events-list">
//         <div v-for="e in events" :key="e.id" class="event-card">
//           <div class="event-header">
//             <h3>{{ e.title }}</h3>
//             <span :class="['badge', e.importance]">
//               {{ e.importance }}
//             </span>
//           </div>

//           <p class="desc">{{ e.description }}</p>

//           <!-- 📎 ARCHIVOS -->
//           <div v-if="e.files?.length" class="files">
//             <a v-for="f in e.files" :key="f.url" :href="f.url" target="_blank">
//               📎 {{ f.name }}
//             </a>
//           </div>
//         </div>

//         <!-- botón agregar otro -->
//         <button class="secondary-btn" @click="showForm = true">+ Nuevo evento</button>
//       </div>

//       <!-- 🧾 FORMULARIO -->
//       <div v-if="showForm" class="form-container">
//         <EventForm
//           :date="date"
//           :showUploader="events.length > 0 || showForm"
//           @save="handleSave"
//           @cancel="showForm = false"
//         />
//       </div>
//     </div>
//   </div>
// </template>

// <script setup>
// import { ref } from "vue";
// import EventForm from "./EventForm.vue";

// const showForm = ref(false);

// const emit = defineEmits(["create"]);

// defineProps({
//   date: String,
//   events: Array,
// });

// const handleSave = (event) => {
//   emit("create", event);
//   showForm.value = false;
// };
// </script>
// <style scoped>
// .panel-container {
//   display: flex;
//   flex-direction: column;
//   height: 100%;
// }

// /* HEADER */
// .panel-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 16px;
//   border-bottom: 1px solid #eee;
// }

// .panel-header h2 {
//   margin: 0;
//   font-size: 18px;
// }

// .subtitle {
//   font-size: 12px;
//   color: #888;
// }

// .close-btn {
//   background: none;
//   border: none;
//   cursor: pointer;
//   font-size: 16px;
// }

// /* BODY */
// .panel-body {
//   flex: 1;
//   overflow-y: auto;
//   padding: 16px;
// }

// /* EMPTY */
// .empty-state {
//   text-align: center;
//   margin-top: 50px;
//   color: #777;
// }

// /* BOTONES */
// .primary-btn {
//   margin-top: 10px;
//   background: #2563eb;
//   color: white;
//   padding: 10px;
//   border-radius: 8px;
//   border: none;
//   cursor: pointer;
// }

// .secondary-btn {
//   margin-top: 10px;
//   background: #e5e7eb;
//   padding: 8px;
//   border-radius: 8px;
//   border: none;
//   cursor: pointer;
// }

// /* EVENTOS */
// .events-list {
//   display: flex;
//   flex-direction: column;
//   gap: 10px;
// }

// .event-card {
//   background: #f9fafb;
//   padding: 12px;
//   border-radius: 10px;
//   border: 1px solid #eee;
// }

// .event-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .desc {
//   font-size: 13px;
//   color: #555;
// }

// /* IMPORTANCIA */
// .badge {
//   font-size: 11px;
//   padding: 3px 6px;
//   border-radius: 6px;
//   color: white;
// }

// .badge.alta {
//   background: #ef4444;
// }
// .badge.media {
//   background: #f59e0b;
// }
// .badge.baja {
//   background: #10b981;
// }

// /* FILES */
// .files a {
//   display: block;
//   font-size: 12px;
//   color: #2563eb;
// }

// /* FORM */
// .form-container {
//   margin-top: 15px;
//   padding-top: 10px;
//   border-top: 1px solid #eee;
// }
// </style>
