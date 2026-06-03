<script setup>

import {
  ref
} from "vue"

import {
  obtenerEmpleados
} from "../../servivces/empleados/empleados.repository"

import {
  generarPlaneacionAnual
} from "../../servivces/vacaciones/vacaciones.scheduler"

// ======================================================

const cargando = ref(false)

// ======================================================

async function generar() {

  try {

    cargando.value = true

    const empleados =
      await obtenerEmpleados()

    const periodo =
      new Date().getFullYear()

    await generarPlaneacionAnual({
      empleados,
      periodo
    })

    alert(
      "Planeación generada"
    )

  } catch (error) {

    console.error(error)

    alert(
      "Error al generar"
    )

  } finally {

    cargando.value = false
  }
}

</script>

<template>

  <button
    class="btn btn-primary"
    @click="generar"
    :disabled="cargando"
  >

    {{
      cargando
        ? "Generando..."
        : "Generar Planeación"
    }}

  </button>

</template>