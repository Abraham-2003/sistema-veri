import { db } from "../../firebase/config"

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

import {
  normalizarFecha
} from "../../utils/fechas"

// ======================================================

export async function obtenerEmpleados() {

  const snapshot =
    await getDocs(
      collection(db, "empleados")
    )

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

// ======================================================

export async function crearEmpleado(
  empleado
) {

  const payload = {
    ...empleado,

    fechaIngreso:
      normalizarFecha(
        empleado.fechaIngreso
      ),

    activo: true
  }

  const docRef =
    await addDoc(
      collection(db, "empleados"),
      payload
    )

  return docRef.id
}

// ======================================================

export async function actualizarEmpleado(
  id,
  empleado
) {

  await updateDoc(
    doc(db, "empleados", id),
    {
      ...empleado,

      fechaIngreso:
        normalizarFecha(
          empleado.fechaIngreso
        )
    }
  )
}

// ======================================================

export async function eliminarEmpleado(
  id
) {

  await deleteDoc(
    doc(db, "empleados", id)
  )
}