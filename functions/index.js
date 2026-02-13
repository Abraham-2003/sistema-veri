import { onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";

admin.initializeApp();

export const obtenerImagenBase64 = onCall(async (request) => {
  const { path } = request.data;

  if (!path) {
    throw new Error("Path no proporcionado");
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    const [buffer] = await file.download();

    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return { base64 };
  } catch (error) {
    console.error("Error procesando imagen:", path, error);
    throw new Error("No se pudo procesar la imagen");
  }
});
