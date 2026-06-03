import { db } from "../../firebase/config"

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

import {
  normalizarFecha
} from "../../utils/fechas"

// ======================================================

const COLLECTION = "vacaciones"

// ======================================================

export async function obtenerVacaciones({
  centroId = null,
  periodo = null
} = {}) {

  let ref = collection(db, COLLECTION)

  const filtros = []

  if (centroId) {
    filtros.push(
      where("centroId", "==", centroId)
    )
  }

  if (periodo) {
    filtros.push(
      where("periodo", "==", periodo)
    )
  }

  const q =
    filtros.length
      ? query(ref, ...filtros)
      : ref

  const snapshot = await getDocs(q)

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

// ======================================================

export async function crearVacacion(
  vacacion
) {

  const payload = {
    ...vacacion,

    fechaInicio:
      normalizarFecha(
        vacacion.fechaInicio
      ),

    fechaFin:
      normalizarFecha(
        vacacion.fechaFin
      )
  }

  const docRef =
    await addDoc(
      collection(db, COLLECTION),
      payload
    )

  return docRef.id
}

// ======================================================

export async function actualizarVacacion(
  id,
  data
) {

  await updateDoc(
    doc(db, COLLECTION, id),
    {
      ...data,

      fechaInicio:
        normalizarFecha(
          data.fechaInicio
        ),

      fechaFin:
        normalizarFecha(
          data.fechaFin
        )
    }
  )
}

// ======================================================

export async function eliminarVacacion(
  id
) {

  await deleteDoc(
    doc(db, COLLECTION, id)
  )
}