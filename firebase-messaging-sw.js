importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmFe9XziS3hf5IuXmP3KHGx23_hUUWBCU",
  authDomain: "leboard-93a96.firebaseapp.com",
  projectId: "leboard-93a96",
  storageBucket: "leboard-93a96.firebasestorage.app",
  messagingSenderId: "876837050695",
  appId: "1:876837050695:web:db90b431f4dff8acc9d462"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received:', payload);
  const title = 'Le Board — ' + (payload.notification?.title || payload.data?.title || 'Nouvelle notification');
  const body = payload.notification?.body || payload.data?.body || '';
  self.registration.showNotification(title, {
    body: body,
    icon: '/LeBoard/icon-192.png',
    badge: '/LeBoard/icon-192.png',
    vibrate: [200, 100, 200]
  });
});
