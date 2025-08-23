import { onSnapshot, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const centroCache = {};

async function getNombreCentro(centroId) {
  if (centroCache[centroId]) return centroCache[centroId];
  const docRef = doc(db, 'centros', centroId);
  const docSnap = await getDoc(docRef);
  const nombre = docSnap.exists() ? docSnap.data().ubicacion : 'Centro desconocido';
  centroCache[centroId] = nombre;
  return nombre;
}

export function listenToSolicitudes() {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user || user.rol !== 'Administrador') {
    console.log('Listener bloqueado: usuario no autorizado')
    return null
  }

  const unsubscribe = onSnapshot(collection(db, 'solicitudes'), (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const data = change.doc.data()
      const nombreCentro = await getNombreCentro(data.centroId)

      if (change.type === 'added') {
        window.$alert(`📬 Nueva solicitud en ${nombreCentro}`)
      }
      if (change.type === 'modified') {
        window.$alert(`🔧 Solicitud modificada en ${nombreCentro}`)
      }
    })
  })

  console.log('Listener de solicitudes activado')
  return unsubscribe
}
