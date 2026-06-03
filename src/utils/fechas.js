// ======================================================

export function normalizarFecha(fecha) {

  if (!fecha) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha
  }

  return new Date(fecha)
    .toISOString()
    .split("T")[0]
}

// ======================================================

export function calcularAntiguedad(fechaIngreso) {

  const ingreso = new Date(fechaIngreso)

  const hoy = new Date()

  let años =
    hoy.getFullYear() -
    ingreso.getFullYear()

  const aunNoCumple =
    hoy.getMonth() < ingreso.getMonth() ||
    (
      hoy.getMonth() === ingreso.getMonth() &&
      hoy.getDate() < ingreso.getDate()
    )

  if (aunNoCumple) {
    años--
  }

  return años
}

// ======================================================

export function obtenerPeriodoVacacional(
  fechaIngreso,
  año
) {

  const ingreso = new Date(fechaIngreso)

  const inicio = new Date(ingreso)

  inicio.setFullYear(
    ingreso.getFullYear() + año
  )

  const fin = new Date(inicio)

  fin.setFullYear(fin.getFullYear() + 1)

  fin.setDate(fin.getDate() - 1)

  return {
    inicio: normalizarFecha(inicio),
    fin: normalizarFecha(fin)
  }
}