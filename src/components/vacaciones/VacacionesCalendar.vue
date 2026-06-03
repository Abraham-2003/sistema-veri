<script setup>
import {
  ref,
  computed,
  onMounted
} from "vue"

import FullCalendar
from "@fullcalendar/vue3"

import dayGridPlugin
from "@fullcalendar/daygrid"

import interactionPlugin
from "@fullcalendar/interaction"

import {
  obtenerVacaciones
} from "../../servivces/vacaciones/vacaciones.repository"

import {
  detectarConflictos,
  obtenerColorVacacion
} from "../../servivces/vacaciones/vacaciones.service"

import {
  actualizarVacacion
} from "../../servivces/vacaciones/vacaciones.repository"

// ======================================================

const vacaciones = ref([])

// ======================================================

const vacacionesProcesadas =
  computed(() => {

    return detectarConflictos(
      vacaciones.value
    )
})

// ======================================================

const eventos = computed(() => {

  return vacacionesProcesadas.value.map(v => ({

    id: v.id,

    title:
      v.nombreEmpleado || "Empleado",

    start: v.fechaInicio,

    end:
      sumarDia(v.fechaFin),

    backgroundColor:
      obtenerColorVacacion(v),

    borderColor:
      obtenerColorVacacion(v),

    extendedProps: {
      vacacion: v
    }
  }))
})

// ======================================================

const calendarOptions = computed(() => ({

  plugins: [
    dayGridPlugin,
    interactionPlugin
  ],

  initialView: "dayGridMonth",

  editable: true,

  eventDurationEditable: true,

  height: "auto",

  events: eventos.value,

  eventDrop: moverVacacion,

  eventResize: redimensionarVacacion
}))

// ======================================================

async function cargarVacaciones() {

  vacaciones.value =
    await obtenerVacaciones()
}

// ======================================================

async function moverVacacion(info) {

  const vacacion =
    info.event.extendedProps.vacacion

  const nuevaInicio =
    info.event.startStr

  const nuevaFin =
    restarDia(
      info.event.endStr
    )

  await actualizarVacacion(
    vacacion.id,
    {
      fechaInicio: nuevaInicio,
      fechaFin: nuevaFin,
      movidaManual: true
    }
  )

  await cargarVacaciones()
}

// ======================================================

async function redimensionarVacacion(
  info
) {

  const vacacion =
    info.event.extendedProps.vacacion

  await actualizarVacacion(
    vacacion.id,
    {
      fechaInicio:
        info.event.startStr,

      fechaFin:
        restarDia(
          info.event.endStr
        ),

      movidaManual: true
    }
  )

  await cargarVacaciones()
}

// ======================================================

function sumarDia(fecha) {

  const d = new Date(fecha)

  d.setDate(d.getDate() + 1)

  return d
    .toISOString()
    .split("T")[0]
}

// ======================================================

function restarDia(fecha) {

  const d = new Date(fecha)

  d.setDate(d.getDate() - 1)

  return d
    .toISOString()
    .split("T")[0]
}

// ======================================================

onMounted(cargarVacaciones)
</script>

<template>

  <div class="vacaciones-calendar">

    <FullCalendar
      :options="calendarOptions"
    />

  </div>

</template>