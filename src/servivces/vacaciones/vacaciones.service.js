import {
  obtenerDiasVacaciones
} from "./vacaciones.rules"

import {
  calcularAntiguedad
} from "../../utils/fechas"

// ======================================================

export function construirVacacion({
  empleado,
  fechaInicio,
  fechaFin,
  periodo
}) {

  const antiguedad =
    calcularAntiguedad(
      empleado.fechaIngreso
    )

  const diasDisponibles =
    obtenerDiasVacaciones(
      antiguedad
    )

  const inicio =
    new Date(fechaInicio)

  const fin =
    new Date(fechaFin)

  const diferencia =
    Math.ceil(
      (fin - inicio) /
      (1000 * 60 * 60 * 24)
    ) + 1

  return {
    empleadoId: empleado.id,

    centroId:
      empleado.centroId,

    periodo,

    fechaInicio,
    fechaFin,

    dias:
      diferencia,

    diasDisponibles,

    movidaManual: false,

    estado: "programada"
  }
}
// ======================================================

export function detectarConflictos(
  vacaciones,
  maxSimultaneas = 2
) {

  return vacaciones.map(v => {

    let conflictos = 0

    for (const other of vacaciones) {

      if (v.id === other.id) {
        continue
      }

      if (
        v.centroId !== other.centroId
      ) {
        continue
      }

      const inicio1 =
        new Date(v.fechaInicio)

      const fin1 =
        new Date(v.fechaFin)

      const inicio2 =
        new Date(other.fechaInicio)

      const fin2 =
        new Date(other.fechaFin)

      const traslape = (
        inicio1 <= fin2 &&
        fin1 >= inicio2
      )

      if (traslape) {
        conflictos++
      }
    }

    return {
      ...v,

      conflictos,

      riesgo:
        conflictos >=
        maxSimultaneas,

      warning:
        conflictos > 0
    }
  })
}
// ======================================================

export function obtenerColorVacacion(
  vacacion
) {

  if (vacacion.riesgo) {
    return "#dc3545"
  }

  if (vacacion.conflictos > 0) {
    return "#ffc107"
  }

  return "#198754"
}