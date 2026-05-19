// Service worker para notificaciones push en segundo plano (Firebase FCM)
// IMPORTANTE: reemplaza los valores de firebaseConfig con los de tu proyecto Firebase
// Firebase Console → Configuración del proyecto → General → Tus apps

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "REEMPLAZA_CON_TU_API_KEY",
  authDomain: "REEMPLAZA_CON_TU_AUTH_DOMAIN",
  projectId: "REEMPLAZA_CON_TU_PROJECT_ID",
  storageBucket: "REEMPLAZA_CON_TU_STORAGE_BUCKET",
  messagingSenderId: "REEMPLAZA_CON_TU_MESSAGING_SENDER_ID",
  appId: "REEMPLAZA_CON_TU_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "ThinWallet";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
  });
});
