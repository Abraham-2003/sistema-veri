// <template>
//   <FullCalendar :options="options" />
// </template>

// <script setup>
// import FullCalendar from '@fullcalendar/vue3'
// import dayGridPlugin from '@fullcalendar/daygrid'
// import interactionPlugin from '@fullcalendar/interaction'

// const emit = defineEmits(['dateSelected'])

// const props = defineProps({
//   events: Array
// })

// const options = {
//   plugins: [dayGridPlugin, interactionPlugin],
//   initialView: 'dayGridMonth',
//   dateClick: (info) => {
//     emit('dateSelected', info.dateStr)
//   },
//   events: props.events.map(e => ({
//     title: e.title,
//     date: e.date
//   }))
// }
// </script>