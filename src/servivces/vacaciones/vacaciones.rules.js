// ======================================================
// TABLA VACACIONES MÉXICO
// ======================================================

export const TABLA_VACACIONES = [
  { años: 1, dias: 12 },
  { años: 2, dias: 14 },
  { años: 3, dias: 16 },
  { años: 4, dias: 18 },
  { años: 5, dias: 20 },

  { min: 6, max: 10, dias: 22 },
  { min: 11, max: 15, dias: 24 },
  { min: 16, max: 20, dias: 26 },
  { min: 21, max: 25, dias: 28 },
  { min: 26, max: 30, dias: 30 },

  { min: 31, max: 999, dias: 32 }
]

// ======================================================

export function obtenerDiasVacaciones(años) {

  if (años <= 0) {
    return 0
  }

  for (const regla of TABLA_VACACIONES) {

    // exacto
    if (regla.años && regla.años === años) {
      return regla.dias
    }

    // rango
    if (
      regla.min &&
      años >= regla.min &&
      años <= regla.max
    ) {
      return regla.dias
    }
  }

  return 0
}