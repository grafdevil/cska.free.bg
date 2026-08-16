// firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyB92YVJ517MyHYTOZA6RH7ydgckBYFuZMg",
  authDomain: "studious-loader-483606-b9.firebaseapp.com",
  databaseURL: "https://studious-loader-483606-b9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "studious-loader-483606-b9",
  storageBucket: "studious-loader-483606-b9.firebasestorage.app",
  messagingSenderId: "301695598830",
  appId: "1:301695598830:web:f716b09ff815d0a3ab33ff"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
