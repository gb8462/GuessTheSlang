// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// --- INIT FIREBASE FIRST ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- DOM ---
const loading = document.getElementById("loading");
const content = document.getElementById("content");
const logoutBtn = document.getElementById("logoutBtn");

// --- AUTH CHECK ---
onAuthStateChanged(auth, user => {
  loading.style.display = "none";
  content.style.display = "block";

  if (user) {
    console.log("Logged in:", user.email);
    localStorage.setItem("userId", user.uid);
    logoutBtn.style.display = "block";
  } else {
    console.log("Guest mode");
    localStorage.setItem("userId", "guest");
    logoutBtn.style.display = "none";
  }
});

// --- LOGOUT ---
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("You have been logged out!");
  window.location.href = "index.html";
});


// =======================
//     GAME LOGIC
// =======================

const levels = [
  {
    images: [
      "https://i.pinimg.com/736x/b0/a7/9a/b0a79ab6122f864b460ea16113631702.jpg",
      "https://i.pinimg.com/736x/70/08/11/700811a4b44c53a3b2754f4a641b518a.jpg",
      "https://i.pinimg.com/736x/09/bf/fc/09bffc47567bf9c5cf35908515331e6a.jpg",
      "https://i.pinimg.com/736x/b9/2e/09/b92e09396f26831211acbaf3436fd9de.jpg"
    ],
    answer: "LMAO"
  },
  {
    images: [
      "https://i.pinimg.com/736x/e3/20/c1/e320c15d441957a2331d519f8c802120.jpg",
      "https://i.pinimg.com/1200x/a2/d4/d9/a2d4d9c1e0190dca4d47921372be2816.jpg",
      "https://i.pinimg.com/736x/3a/f7/aa/3af7aaa220e9db21c8162eb45fc1bbde.jpg",
      "https://i.pinimg.com/736x/cb/16/e4/cb16e4f2dd63bc3f35a219ac089c7159.jpg"
    ],
    answer: "IDK"
  }
];

// Load levels
let currentLevel = 0;

function loadLevel() {  
  const level = levels[currentLevel];

  document.getElementById("current_level").textContent = `Level: ${currentLevel + 1}`;

  document.getElementById("img1").src = level.images[0];
  document.getElementById("img2").src = level.images[1];
  document.getElementById("img3").src = level.images[2];
  document.getElementById("img4").src = level.images[3];

  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("checkBtn").style.display = "inline-block";
}

loadLevel();

// Check answer
document.getElementById("checkBtn").addEventListener("click", () => {
  const input = document.getElementById("answerInput").value.trim().toUpperCase();
  const correct = levels[currentLevel].answer;

  if (input === correct) {
    document.getElementById("feedback").textContent = "Correct! 🎉";
    document.getElementById("nextBtn").style.display = "inline-block";
    document.getElementById("checkBtn").style.display = "none";
  } else {
    document.getElementById("feedback").textContent = "Try again 😅";
  }
});

// Next level
document.getElementById("nextBtn").addEventListener("click", () => {
  currentLevel++;

  if (currentLevel >= levels.length) {
    alert("You finished all levels!");
    return;
  }

  loadLevel();
});
