import { db } from "../../firebase/config"

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

// ======================================================

const COLLECTION = "centros"

// ======================================================

export async function obtenerCentros() {

  const snapshot =
    await getDocs(
      collection(db, COLLECTION)
    )

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

// ======================================================

export async function crearCentro(
  centro
) {

  const docRef =
    await addDoc(
      collection(db, COLLECTION),
      centro
    )

  return docRef.id
}

// ======================================================

export async function actualizarCentro(
  id,
  data
) {

  await updateDoc(
    doc(db, COLLECTION, id),
    data
  )
}

// ======================================================

export async function eliminarCentro(
  id
) {

  await deleteDoc(
    doc(db, COLLECTION, id)
  )
}