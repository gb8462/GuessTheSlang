// =======================
//        IMPORTS
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// =======================
//     FIREBASE CONFIG
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// =======================
//          DOM
// =======================
const container = document.querySelector(".container");
const backBtn   = document.getElementById("backBtn");

// =======================
//         HELPERS
// =======================
function getUserId() {
  return localStorage.getItem("userId") || "guest";
}

function getCompletedLevels() {
  const uid = getUserId();
  return JSON.parse(
    localStorage.getItem(`completedLevels_${uid}`) || "[]"
  );
}

function getCommunityText(comm) {
  const map = {
    Gaming: "🎮 Gaming",
    Meme: "🤣 Meme",
    Tech: "💻 Tech",
    Fandom: "🌟 Fandom",
    Creator: "🎥 Creator"
  };
  return map[comm] || comm || "No tag";
}

function getDifficultyText(diff) {
  const map = {
    Easy: "⭐ Easy",
    Medium: "⭐⭐ Medium",
    Hard: "⭐⭐⭐ Hard"
  };
  return map[diff] || diff || "Unknown";
}

// =======================
//     LOAD DICTIONARY
// =======================
async function loadDictionary() {
  try {
    const snap = await getDocs(collection(db, "levels"));

    const levels = snap.docs
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(d => d.data());

    if (!levels.length) {
      container.textContent = "No entries yet.";
      return;
    }

    const uid = getUserId();
    const completed = getCompletedLevels();

    container.innerHTML = "";

    levels.forEach((level, index) => {
      const entry = document.createElement("div");
      entry.className = "entry";

      const isGuest = uid === "guest";
      const isUnlocked = !isGuest && completed.includes(index);

      if (isUnlocked) {
        entry.innerHTML = `
          <div class="word">
            ${level.answer}
            <span class="unlocked-badge">UNLOCKED</span>
          </div>

          <div class="tags-row">
            <span class="tag community-tag">${getCommunityText(level.community)}</span>
            <span class="tag difficulty-tag ${level.difficulty?.toLowerCase() || ""}">
              ${getDifficultyText(level.difficulty)}
            </span>
          </div>

          <div class="desc">${level.description || "No description yet."}</div>
        `;

      } else {
        entry.classList.add("locked");
        entry.innerHTML = `
          <div class="word">🔒 ?????</div>
          <div class="lock-label">
            ${isGuest
              ? "Login to unlock this slang"
              : "Solve the level to unlock"}
          </div>
        `;
      }

      container.appendChild(entry);
    });

  } catch (err) {
    console.error(err);
    container.textContent = "Failed to load dictionary.";
  }
}

// =======================
//         EVENTS
// =======================
backBtn.onclick = () => {
  setTimeout(() => location.href = "index.html", 150);
};

// =======================
//          START
// =======================
loadDictionary();
