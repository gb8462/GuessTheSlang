// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// --- INIT FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ---
const backBtn     = document.getElementById("backBtn");
const answerBoxes = document.getElementById("answerBoxes");
const letterBank  = document.getElementById("letterBank");
const shuffleBtn  = document.getElementById("shuffleBtn");
const checkBtn    = document.getElementById("checkBtn");
const nextBtn     = document.getElementById("nextBtn");

// --- BACK BUTTON ---
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// --- CUSTOM ALERT ---
function customAlert(message) {
  const alertModal = document.getElementById("customAlert");
  const alertMsg = document.getElementById("alertMessage");
  const alertOk = document.getElementById("alertOk");

  alertMsg.textContent = message;
  alertModal.style.display = "flex";

  alertOk.onclick = () => {
    alertModal.style.display = "none";
  };
}

// =======================
//       SCORE UPDATE
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

// =======================
//      GLOBALS
// =======================
let levels = [];
let currentLevel = 0;

// =======================
//     FETCH LEVELS
// =======================
async function fetchLevels() {
  const snap = await getDocs(collection(db, "levels"));
  levels = snap.docs.map(doc => doc.data());
  loadLevel();
}

function cleanURL(url) {
  if (!url) return "";
  return url.replace(/^"+|"+$/g, "").trim();
}

// =======================
//     LOAD LEVEL
// =======================
function loadLevel() {
  const level = levels[currentLevel];

  document.getElementById("current_level").textContent = `Level: ${currentLevel + 1}`;
  document.getElementById("img1").src = cleanURL(level.images[0]);
  document.getElementById("img2").src = cleanURL(level.images[1]);
  document.getElementById("img3").src = cleanURL(level.images[2]);
  document.getElementById("img4").src = cleanURL(level.images[3]);

  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";

  generateAnswerBoxes(level.answer);
  generateLetterTiles(level.answer);
}

// =======================
//    ANSWER BOXES UI
// =======================
function generateAnswerBoxes(answer) {
  answerBoxes.innerHTML = "";

  [...answer].forEach(() => {
    const box = document.createElement("div");
    box.classList.add("answer-box");
    box.textContent = "";
    answerBoxes.appendChild(box);
  });
}

// =======================
//     LETTER TILES UI
// =======================
function generateLetterTiles(answer) {
  letterBank.innerHTML = "";

  let letters = [...answer.toUpperCase()];

  while (letters.length < 12) {
    letters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  }

  letters.sort(() => Math.random() - 0.5);

  letters.forEach(letter => {
    const tile = document.createElement("div");
    tile.classList.add("letter-tile");
    tile.textContent = letter;

    tile.addEventListener("click", () => {
      fillNextBox(letter);
      tile.style.visibility = "hidden";
    });

    letterBank.appendChild(tile);
  });
}

// =======================
//  FILL NEXT EMPTY BOX
// =======================
function fillNextBox(letter) {
  const boxes = document.querySelectorAll(".answer-box");

  for (let box of boxes) {
    if (box.textContent === "") {
      box.textContent = letter;
      return;
    }
  }
}

// =======================
//      COLLECT ANSWER
// =======================
function getPlayerAnswer() {
  const boxes = document.querySelectorAll(".answer-box");
  return [...boxes].map(b => b.textContent).join("");
}

// =======================
//      CHECK ANSWER
// =======================
checkBtn.addEventListener("click", () => {
  const player = getPlayerAnswer();
  const correct = levels[currentLevel].answer;

  if (player === correct) {
    customAlert("Correct! 🎉");
    nextBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
    addScore(10);
  } else {
    customAlert("Try again 😅");
  }
});

// =======================
//      NEXT LEVEL
// =======================
nextBtn.addEventListener("click", () => {
  currentLevel++;

  if (currentLevel >= levels.length) {
    customAlert("You finished all levels!");
    return;
  }

  loadLevel();
});

// =======================
//     SHUFFLE BUTTON
// =======================
shuffleBtn.addEventListener("click", () => {
  generateLetterTiles(levels[currentLevel].answer);
});

// Start game
fetchLevels();