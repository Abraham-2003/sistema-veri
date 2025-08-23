import { db } from '../firebase/config.js'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function login(correo, password) {
  const q = query(
    collection(db, 'usuarios'),
    where('correo', '==', correo),
    where('password', '==', password)
  )
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    return snapshot.docs[0].data()
  } else {
    throw new Error('Credenciales inválidas')
  }
}

export { db }
