import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../firebase/config'
import { collection, addDoc, getDocs } from "firebase/firestore"

export const useEventsStore = defineStore('events', () => {

  const events = ref([])

  const fetchEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"))
    events.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  const addEvent = async (event) => {
    const docRef = await addDoc(collection(db, "events"), event)

    events.value.push({
      id: docRef.id,
      ...event
    })
  }

  return {
    events,
    fetchEvents,
    addEvent
  }
})