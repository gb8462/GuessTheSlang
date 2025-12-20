// =======================
//        IMPORTS
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
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

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// =======================
//        DOM CACHE
// =======================
const $ = (id) => document.getElementById(id);

const backBtn     = $("backBtn");
const answerBoxes = $("answerBoxes");
const letterBank  = $("letterBank");
const shuffleBtn  = $("shuffleBtn");
const checkBtn    = $("checkBtn");
const nextBtn     = $("nextBtn");
const hintBtn     = $("hintBtn");
const resetBtn    = $("resetLvls");
const scoreText   = $("scoreText");

// =======================
//        UTILITIES
// =======================
function customAlert(message) {
  const modal = $("customAlert");
  const text  = $("alertMessage");
  const ok    = $("alertOk");

  if (!modal || !text || !ok) {
    alert(message);
    return;
  }

  text.textContent = message;
  modal.style.display = "flex";
  ok.onclick = () => modal.style.display = "none";
}

function cleanURL(url = "") {
  return url.replace(/^"+|"+$/g, "").trim();
}

function showSuccessPopup(answer, description) {
  const popup = $("successPopup");
  const word  = $("popupWord");
  const desc  = $("popupDesc");
  const okBtn = $("popupOk");

  if (!popup) return;

  word.textContent = answer;
  desc.textContent = description || "No description available.";
  popup.classList.remove("hidden");

  okBtn.onclick = () => popup.classList.add("hidden");
}

// =======================
//      POINTS SYSTEM
// =======================
const STARTING_POINTS = 50;

function getUserId() {
  return localStorage.getItem("userId") || "guest";
}

// ---------- GUEST ----------
function getGuestPoints() {
  const stored = localStorage.getItem("guestPoints");
  if (stored === null) {
    localStorage.setItem("guestPoints", STARTING_POINTS);
    return STARTING_POINTS;
  }
  return Number(stored);
}

function setGuestPoints(value) {
  localStorage.setItem("guestPoints", value);
}

// ---------- POINTS ----------
async function getPoints() {
  const uid = getUserId();
  if (uid === "guest") return getGuestPoints();

  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().points ?? STARTING_POINTS : STARTING_POINTS;
}

async function addPoints(amount) {
  const uid = getUserId();

  if (uid === "guest") {
    setGuestPoints(getGuestPoints() + amount);
    updatePointsUI();
    return;
  }

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  await updateDoc(ref, {
    points: (snap.data().points ?? STARTING_POINTS) + amount
  });

  updatePointsUI();
}

async function spendPoints(amount) {
  const uid = getUserId();

  if (uid === "guest") {
    const pts = getGuestPoints();
    if (pts < amount) return false;
    setGuestPoints(pts - amount);
    updatePointsUI();
    return true;
  }

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const pts = snap.data().points ?? STARTING_POINTS;
  if (pts < amount) return false;

  await updateDoc(ref, { points: pts - amount });
  updatePointsUI();
  return true;
}

async function updatePointsUI() {
  if (scoreText) scoreText.textContent = `Points: ${await getPoints()}`;
}

// =======================
//        GAME STATE
// =======================
function getLevelKey() {
  return `currentLevel_${getUserId()}`;
}

function getSavedLevel() {
  return Number(localStorage.getItem(getLevelKey())) || 0;
}

function saveLevel(level) {
  localStorage.setItem(getLevelKey(), level);
}

let levels = [];
let currentLevel = getSavedLevel();

function safeLevel() {
  return levels[currentLevel] || null;
}

// =======================
//       LEVEL LOAD
// =======================
async function fetchLevels() {
  const snap = await getDocs(collection(db, "levels"));
  levels = snap.docs.sort((a, b) => a.id.localeCompare(b.id)).map(d => d.data());

  if (!levels.length) return customAlert("No levels found");

  currentLevel = Math.min(currentLevel, levels.length - 1);
  saveLevel(currentLevel);
  loadLevel();
}

function loadLevel() {
  const level = safeLevel();
  if (!level) return;

  $("current_level").textContent = `Level: ${currentLevel + 1}`;

  ["img1","img2","img3","img4"].forEach((id, i) => {
    const img = $(id);
    if (img) img.src = cleanURL(level.images?.[i]);
  });

  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";

  buildAnswerBoxes(level.answer);
  buildLetterTiles(level.answer);
}

// =======================
//      ANSWER BOXES
// =======================
function buildAnswerBoxes(answer = "") {
  answerBoxes.innerHTML = "";
  [...answer].forEach((_, i) => {
    const box = document.createElement("div");
    box.className = "answer-box";
    box.onclick = () => box.textContent && clearBox(i);
    answerBoxes.appendChild(box);
  });
}

function findEmptyBox() {
  return [...answerBoxes.children].findIndex(b => !b.textContent);
}

function clearBox(i) {
  const box = answerBoxes.children[i];
  const tileId = box.dataset.srcTile;

  box.textContent = "";
  delete box.dataset.srcTile;

  if (!tileId) return;
  const tile = letterBank.querySelector(`[data-tile-id='${tileId}']`);
  if (tile) tile.style.visibility = "";
}

// =======================
//      LETTER TILES
// =======================
function buildLetterTiles(answer = "") {
  letterBank.innerHTML = "";

  const needed = {};
  [...answer.toUpperCase()].forEach(l => needed[l] = (needed[l] || 0) + 1);

  let letters = Object.entries(needed).flatMap(([l, c]) => Array(c).fill(l));
  while (letters.length < 12)
    letters.push(String.fromCharCode(65 + Math.random() * 26));

  letters.sort(() => Math.random() - 0.5);

  const uid = Date.now();

  letters.forEach((l, i) => {
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = l;
    tile.dataset.tileId = `${uid}-${i}`;

    tile.onclick = () => {
      if (tile.style.visibility === "hidden") return;
      const idx = findEmptyBox();
      if (idx === -1) return;

      const box = answerBoxes.children[idx];
      box.textContent = l;
      box.dataset.srcTile = tile.dataset.tileId;
      tile.style.visibility = "hidden";
    };

    letterBank.appendChild(tile);
  });
}

// =======================
//        ACTIONS
// =======================
checkBtn.onclick = async () => {
  const level = safeLevel();
  if (!level) return;

  const answer = [...answerBoxes.children].map(b => b.textContent).join("");
  if (answer === level.answer) {
    showSuccessPopup(level.answer, level.description);
    await addPoints(5);
    nextBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
  } else {
    customAlert("Try again 😅");
  }
};

nextBtn.onclick = () => {
  currentLevel++;
  saveLevel(currentLevel);
  currentLevel >= levels.length ? customAlert("All levels done!") : loadLevel();
};

resetBtn.onclick = () => {
  currentLevel = 0;
  saveLevel(0);
  fetchLevels();
  customAlert("Progress reset");
};

backBtn.onclick = () => setTimeout(() => location.href = "index.html", 150);

// =======================
//        START
// =======================
fetchLevels();
updatePointsUI();
