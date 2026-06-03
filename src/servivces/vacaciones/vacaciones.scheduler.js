import {
  construirVacacion
} from "./vacaciones.service"

import {
  crearVacacion,
  obtenerVacaciones
} from "./vacaciones.repository"

import {
  calcularAntiguedad
} from "../../utils/fechas"

// ======================================================

export async function generarPlaneacionAnual({
  empleados,
  periodo
}) {

  const existentes =
    await obtenerVacaciones({
      periodo
    })

  const resultados = []

  for (const empleado of empleados) {

    // ==========================================
    // IGNORAR INACTIVOS
    // ==========================================

    if (!empleado.activo) {
      continue
    }

    // ==========================================
    // EVITAR DUPLICADOS
    // ==========================================

    const yaExiste =
      existentes.some(v => {

        return (
          v.empleadoId === empleado.id &&
          v.periodo === periodo
        )
      })

    if (yaExiste) {
      continue
    }

    // ==========================================
    // CALCULAR ANTIGÜEDAD
    // ==========================================

    const antiguedad =
      calcularAntiguedad(
        empleado.fechaIngreso
      )

    if (antiguedad <= 0) {
      continue
    }

    // ==========================================
    // FECHA SUGERIDA
    // ==========================================

    const fechaBase =
      obtenerFechaSugerida(
        empleado,
        periodo
      )

    const fechaFin =
      calcularFechaFin(
        fechaBase,
        antiguedad
      )

    // ==========================================
    // CREAR VACACIÓN
    // ==========================================

    const vacacion =
      construirVacacion({

        empleado,

        periodo,

        fechaInicio:
          fechaBase,

        fechaFin
      })

    const id =
      await crearVacacion(
        vacacion
      )

    resultados.push({
      id,
      ...vacacion
    })
  }

  return resultados
}
// ======================================================

function obtenerFechaSugerida(
  empleado,
  periodo
) {

  const ingreso =
    new Date(
      empleado.fechaIngreso
    )

  const fecha =
    new Date(ingreso)

  fecha.setFullYear(periodo)

  return fecha
    .toISOString()
    .split("T")[0]
}
// ======================================================

function calcularFechaFin(
  fechaInicio,
  antiguedad
) {

  const inicio =
    new Date(fechaInicio)

  let dias = 12

  // simplificado temporal
  if (antiguedad >= 2) dias = 14
  if (antiguedad >= 3) dias = 16
  if (antiguedad >= 4) dias = 18
  if (antiguedad >= 5) dias = 20

  const fin =
    new Date(inicio)

  fin.setDate(
    fin.getDate() + dias - 1
  )

  return fin
    .toISOString()
    .split("T")[0]
}
// ======================================================

export function detectarFaltantes({
  empleados,
  vacaciones,
  periodo
}) {

  return empleados.filter(emp => {

    if (!emp.activo) {
      return false
    }

    return !vacaciones.some(v => {

      return (
        v.empleadoId === emp.id &&
        v.periodo === periodo
      )
    })
  })
}
// ======================================================

export function detectarSaturacion(
  vacaciones
) {

  const mapa = {}

  for (const vacacion of vacaciones) {

    const key =
      `${vacacion.centroId}-${vacacion.fechaInicio}`

    if (!mapa[key]) {
      mapa[key] = 0
    }

    mapa[key]++
  }

  return mapa
}