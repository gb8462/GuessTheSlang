// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {getFirestore, collection, getDocs, doc, getDoc, updateDoc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs", authDomain: "pics1word-8388a.firebaseapp.com", projectId: "pics1word-8388a", storageBucket: "pics1word-8388a.firebasestorage.app", messagingSenderId: "839569913930", appId: "1:839569913930:web:61a76cd90de9d288258eb3", measurementId: "G-09YM69D70E"};

// --- INIT FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ---
const backBtn     = document.getElementById("backBtn");
const loading     = document.getElementById("loading");
const content     = document.getElementById("content");
const logoutBtn   = document.getElementById("logoutBtn");
const answerInput = document.getElementById("answerInput");
const nextBtn     = document.getElementById("nextBtn");
const checkBtn    = document.getElementById("checkBtn");

// --- AUTH CHECK ---
onAuthStateChanged(auth, user => {

  if (loading)  loading.style.display = "none";
  if (content)  content.style.display = "block";

  if (user) {
    localStorage.setItem("userId", user.uid);
    if (logoutBtn) logoutBtn.style.display = "block";

  } else {
    localStorage.setItem("userId", "guest");
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// --- BACK BUTTON ---
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// --- LOGOUT ---
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("You have been logged out!");
    window.location.href = "index.html";
  });
}

// =======================
//     GAME LOGIC
// =======================

async function addScore(points) {
  const userId = localStorage.getItem("userId");
  if (!userId || userId === "guest") return;

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const currentScore = snap.data().score || 0;

  await updateDoc(userRef, { score: currentScore + points });
}

let levels = [];
let currentLevel = 0;

function cleanURL(url) {
  if (!url) return "";
  return url.replace(/^"+|"+$/g, "").trim();
}

async function fetchLevels() {
  const snap = await getDocs(collection(db, "levels"));
  levels = snap.docs.map(doc => doc.data());
  loadLevel();
}

function loadLevel() {
  const level = levels[currentLevel];

  document.getElementById("current_level").textContent = `Level: ${currentLevel + 1}`;
  document.getElementById("img1").src = cleanURL(level.images[0]);
  document.getElementById("img2").src = cleanURL(level.images[1]);
  document.getElementById("img3").src = cleanURL(level.images[2]);
  document.getElementById("img4").src = cleanURL(level.images[3]);

  answerInput.value = "";
  document.getElementById("feedback").textContent = "";
  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";
}

// --- CHECK ANSWER ---
if (checkBtn) {
  checkBtn.addEventListener("click", () => {
    const input = answerInput.value.trim().toUpperCase();
    const correct = levels[currentLevel].answer;

    if (input === correct) {
      document.getElementById("feedback").textContent = "Correct! 🎉";
      nextBtn.style.display = "inline-block";
      checkBtn.style.display = "none";
      addScore(10);
    } else {
      document.getElementById("feedback").textContent = "Try again 😅";
    }
  });
}

// --- NEXT LEVEL ---
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentLevel++;

    if (currentLevel >= levels.length) {
      alert("You finished all levels!");
      return;
    }

    loadLevel();
  });
}

// --- ENTER KEY ---
if (answerInput) {
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (nextBtn.style.display !== "none") nextBtn.click();
      else checkBtn.click();
    }
  });
}

// Start loading
fetchLevels();