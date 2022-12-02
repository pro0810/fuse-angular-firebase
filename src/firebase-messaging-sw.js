importScripts("https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js");

firebase.initializeApp({
  messagingSenderId: "895591780322"
});

const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the background (Web app is closed or not in browser focus) then you should implement this optional method
messaging.setBackgroundMessageHandler(function(payload) {
  // Customize notification here
  var notificationTitle = "Background Message Title";
  var notificationOptions = {
    body: "Background Message body."
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
