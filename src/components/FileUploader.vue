// <template>
//   <input type="file" accept="application/pdf" @change="upload" />
// </template>

// <script setup>
// import { storage } from '../firebase/config.js'
// import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

// const emit = defineEmits(['uploaded'])

// const upload = async (e) => {
//   const file = e.target.files[0]
//   if (!file) return

//   const fileRef = storageRef(storage, `events/${Date.now()}_${file.name}`)

//   await uploadBytes(fileRef, file)
//   const url = await getDownloadURL(fileRef)

//   emit('uploaded', {
//     name: file.name,
//     url
//   })
// }
// </script>