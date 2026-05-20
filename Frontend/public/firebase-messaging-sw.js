// Service worker para notificaciones push en segundo plano (Firebase FCM)
// Este archivo se sirve estático, no procesa import.meta.env, por eso la
// config va inline. Los valores son públicos (apiKey de Web ≠ secret).

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCtidQJbTHBfdh5KPskxh1tYCqDr1j3cRA",
  authDomain: "thinwallet-30a1a.firebaseapp.com",
  projectId: "thinwallet-30a1a",
  storageBucket: "thinwallet-30a1a.firebasestorage.app",
  messagingSenderId: "291342405998",
  appId: "1:291342405998:web:636b8ae7e20fed8d06b17f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "ThinWallet";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
  });
});
