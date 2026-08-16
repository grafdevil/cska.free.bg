import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB92YVJ517MyHYTOZA6RH7ydgckBYFuZMg",
    authDomain: "studious-loader-483606-b9.firebaseapp.com",
    databaseURL: "https://studious-loader-483606-b9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "studious-loader-483606-b9",
    storageBucket: "studious-loader-483606-b9.firebasestorage.app",
    messagingSenderId: "301695598830",
    appId: "1:301695598830:web:f716b09ff815d0a3ab33ff"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let trackList = [];
let currentTrackIndex = 0;

const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const trackTitle = document.getElementById("track-title");

onValue(ref(db, 'music'), (snapshot) => {
    const data = snapshot.val();
    trackList = [];
    
    if (data) {
        // Събираме песните в масив
        Object.values(data).forEach(song => {
            trackList.push({
                order: song.order !== undefined ? song.order : 99, // ако няма номер, го слагаме накрая
                title: song.title,
                url: song.url
            });
        });

        // Сортираме масива по номера (order) във възходящ ред (1, 2, 3...)
        trackList.sort((a, b) => a.order - b.order);
    }

    if (trackList.length > 0) {
        currentTrackIndex = 0; // Винаги започваме от първата след сортирането
        updateTrack();
    } else {
        if (trackTitle) trackTitle.textContent = "Няма налични песни.";
    }
});

function updateTrack() {
    if (trackList.length === 0) return;
    
    const currentTrack = trackList[currentTrackIndex];
    
    audio.src = currentTrack.url;
    if (trackTitle) {
        trackTitle.textContent = currentTrack.title;
    }
    audio.load();
}

function playTrack() {
    if (trackList.length === 0) return;
    audio.play().then(() => {
        if (playPauseBtn) playPauseBtn.textContent = "⏸";
    }).catch(err => {
        console.log("Автоматичното пускане е спряно от браузъра", err);
    });
}

function pauseTrack() {
    audio.pause();
    if (playPauseBtn) playPauseBtn.textContent = "▶";
}

if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
        if (audio.paused) playTrack();
        else pauseTrack();
    });
}

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (trackList.length === 0) return;
        currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
        updateTrack();
        playTrack();
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        if (trackList.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
        updateTrack();
        playTrack();
    });
}

audio.addEventListener("ended", () => {
    if (nextBtn) nextBtn.click();
});