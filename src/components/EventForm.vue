// <template>
//   <div class="form-container">

//     <!-- TÍTULO -->
//     <div class="field">
//       <label>Título</label>
//       <input 
//         v-model="event.title" 
//         placeholder="Ej: Revisión de unidad"
//       />
//     </div>

//     <!-- DESCRIPCIÓN -->
//     <div class="field">
//       <label>Descripción</label>
//       <textarea 
//         v-model="event.description" 
//         placeholder="Detalles del evento..."
//       />
//     </div>

//     <!-- IMPORTANCIA -->
//     <div class="field">
//       <label>Importancia</label>
//       <div class="importance-selector">
//         <button 
//           v-for="level in levels" 
//           :key="level.value"
//           :class="['chip', level.value, { active: event.importance === level.value }]"
//           @click="event.importance = level.value"
//         >
//           {{ level.label }}
//         </button>
//       </div>
//     </div>

//     <!-- 📎 UPLOADER -->
//     <div v-if="showUploader" class="field uploader">
//       <label>Evidencia (PDF)</label>
//       <FileUploader @uploaded="addFile" />

//       <div v-if="event.files.length" class="files-preview">
//         <span v-for="f in event.files" :key="f.url">
//           📎 {{ f.name }}
//         </span>
//       </div>
//     </div>

//     <!-- ACCIONES -->
//     <div class="actions">
//       <button class="btn cancel" @click="$emit('cancel')">
//         Cancelar
//       </button>

//       <button class="btn save" @click="save">
//         Guardar
//       </button>
//     </div>

//   </div>
// </template>

// <script setup>
// import { reactive, watch } from 'vue'
// import FileUploader from './FileUploader.vue'

// const emit = defineEmits(['save','cancel'])

// const props = defineProps({
//   date: String,
//   showUploader: Boolean
// })

// const event = reactive({
//   title: '',
//   description: '',
//   importance: 'media',
//   date: props.date,
//   files: []
// })

// const levels = [
//   { value: 'baja', label: 'Baja' },
//   { value: 'media', label: 'Media' },
//   { value: 'alta', label: 'Alta' }
// ]

// // 🔥 FIX IMPORTANTE (fecha reactiva)
// watch(() => props.date, (newDate) => {
//   event.date = newDate
// })

// const addFile = (file) => {
//   event.files.push(file)
// }

// const save = () => {
//   if (!event.title) {
//     alert('El título es obligatorio')
//     return
//   }

//   emit('save', { ...event })

//   // reset
//   event.title = ''
//   event.description = ''
//   event.importance = 'media'
//   event.files = []
// }
// </script>
// <style scoped>
// .form-container {
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
// }

// /* CAMPOS */
// .field {
//   display: flex;
//   flex-direction: column;
//   gap: 4px;
// }

// label {
//   font-size: 12px;
//   color: #666;
// }

// input, textarea {
//   border: 1px solid #ddd;
//   border-radius: 8px;
//   padding: 8px;
//   font-size: 13px;
// }

// textarea {
//   resize: none;
// }

// /* IMPORTANCIA */
// .importance-selector {
//   display: flex;
//   gap: 6px;
// }

// .chip {
//   padding: 5px 10px;
//   border-radius: 20px;
//   border: none;
//   cursor: pointer;
//   font-size: 12px;
//   background: #eee;
// }

// .chip.baja.active { background: #10b981; color: white; }
// .chip.media.active { background: #f59e0b; color: white; }
// .chip.alta.active { background: #ef4444; color: white; }

// /* UPLOADER */
// .uploader {
//   border-top: 1px solid #eee;
//   padding-top: 8px;
// }

// .files-preview span {
//   display: block;
//   font-size: 12px;
//   color: #2563eb;
// }

// /* BOTONES */
// .actions {
//   display: flex;
//   justify-content: space-between;
//   margin-top: 10px;
// }

// .btn {
//   padding: 8px 12px;
//   border-radius: 8px;
//   border: none;
//   cursor: pointer;
// }

// .cancel {
//   background: #e5e7eb;
// }

// .save {
//   background: #2563eb;
//   color: white;
// }
// </style>