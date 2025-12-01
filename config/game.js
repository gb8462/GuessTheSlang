// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {getFirestore,collection,getDocs,doc,getDoc,updateDoc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
const hintBtn     = document.getElementById("hintBtn");
const resetBtn    = document.getElementById("resetLvls");

// --- BACK BUTTON ---
backBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

// --- CUSTOM ALERT ---
function customAlert(message) {
  const modal = document.getElementById("customAlert");
  const alertMessage = document.getElementById("alertMessage");
  const alertOk = document.getElementById("alertOk");

  if (!modal || !alertMessage || !alertOk) {
    // fallback
    alert(message);
    return;
  }

  alertMessage.textContent = message;
  modal.style.display = "flex";

  alertOk.onclick = () => {
    modal.style.display = "none";
  };
}

// =======================
//       SCORE UPDATE
// =======================
async function getUserRef() {
  const userId = localStorage.getItem("userId");
  if (!userId || userId === "guest") return null;
  return doc(db, "users", userId);
}

async function addScore(points) {
  const userRef = await getUserRef();
  if (!userRef) return;

  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const score = (snap.data().score || 0) + points;
  await updateDoc(userRef, { score });
}

async function getScore() {
  const userRef = await getUserRef();
  if (!userRef) return 0;

  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data().score || 0) : 0;
}

async function deductScore(amount) {
  const userRef = await getUserRef();
  if (!userRef) return false;

  const snap = await getDoc(userRef);
  if (!snap.exists()) return false;

  const score = snap.data().score || 0;
  if (score < amount) return false;

  await updateDoc(userRef, { score: score - amount });
  return true;
}

// =======================
//        GLOBALS
// =======================
let levels = [];
let currentLevel = 0;

// On startup, restore progress *before anything else*
const savedLevel = localStorage.getItem("currentLevel");
if (savedLevel !== null) {
  const n = parseInt(savedLevel, 10);
  if (!Number.isNaN(n) && n >= 0) currentLevel = n;
}

// disable interactive buttons until levels load
function setUIEnabled(enabled) {
  // nextBtn may be shown/hidden by game state; disabling ensures clicks do nothing while loading
  [hintBtn, shuffleBtn, checkBtn, nextBtn].forEach(btn => {
    if (!btn) return;
    btn.disabled = !enabled;
  });
}
setUIEnabled(false);

// =======================
//       HINT LOGIC
// =======================
function safeGetCurrentLevel() {
  if (!levels.length) return null;
  if (currentLevel < 0 || currentLevel >= levels.length) return null;
  return levels[currentLevel];
}

function revealOneCorrectLetter() {
  const level = safeGetCurrentLevel();
  if (!level) return false;

  const correct = (level.answer || "").toUpperCase();
  if (!correct) return false;

  const boxes = [...document.querySelectorAll(".answer-box")];

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    // guard for index > answer length
    if (i >= correct.length) continue;

    if (box.textContent !== correct[i]) {
      if (box.textContent) clearBox(i);

      box.textContent = correct[i];

      const tile = [...letterBank.querySelectorAll(".letter-tile")]
        .find(t => t.textContent === correct[i] && t.style.visibility !== "hidden");

      if (tile) {
        tile.style.visibility = "hidden";
        tile.dataset.visible = "false";
        tile.dataset.filledAt = i;
      }

      // keep dataset.srcTile for box so clearBox can restore
      if (tile && tile.dataset.tileId) {
        box.dataset.srcTile = tile.dataset.tileId;
      }

      return true;
    }
  }

  return false;
}

hintBtn?.addEventListener("click", async () => {
  // guard UI
  if (!safeGetCurrentLevel()) {
    customAlert("Level not ready yet.");
    return;
  }

  const HINT_COST = 10;

  if (!(await deductScore(HINT_COST))) {
    customAlert("Not enough points for a hint!");
    return;
  }

  if (!revealOneCorrectLetter()) {
    customAlert("Nothing to reveal!");
  }
});

// =======================
//      NEXT LEVEL BTN
// =======================
nextBtn?.addEventListener("click", () => {
  // guard
  if (!levels.length) return;

  currentLevel++;
  localStorage.setItem("currentLevel", currentLevel);

  if (currentLevel >= levels.length) {
    customAlert("You finished all levels!");
    return;
  }

  loadLevel();
});

// =======================
//       FETCH LEVELS
// =======================
async function fetchLevels() {
  try {
    setUIEnabled(false);

    const snap = await getDocs(collection(db, "levels"));

    levels = snap.docs
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(d => d.data());

    // validate levels array
    if (!levels.length) {
      customAlert("No levels found in database.");
      return;
    }

    // clamp currentLevel if out of range
    if (currentLevel >= levels.length) currentLevel = 0;
    if (currentLevel < 0) currentLevel = 0;
    localStorage.setItem("currentLevel", currentLevel);

    loadLevel();
    setUIEnabled(true);
  } catch (err) {
    console.error("fetchLevels error:", err);
    customAlert("Failed to load levels. Check your internet or Firebase rules.");
  }
}

function cleanURL(url) {
  if (!url) return "";
  return url.replace(/^"+|"+$/g, "").trim();
}

// =======================
//       LOAD LEVEL
// =======================
function loadLevel() {
  const level = safeGetCurrentLevel();
  if (!level) return;

  // update UI header
  const header = document.getElementById("current_level");
  if (header) header.textContent = `Level: ${currentLevel + 1}`;

  // set images (use cleanURL guard)
  const imgs = ["img1", "img2", "img3", "img4"].map(id => document.getElementById(id));
  imgs.forEach((imgEl, idx) => {
    if (!imgEl) return;
    imgEl.src = cleanURL((level.images && level.images[idx]) || "");
  });

  // show/hide buttons
  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";

  // regenerate UI
  generateAnswerBoxes(level.answer || "");
  generateLetterTiles(level.answer || "");
}

// =======================
//    ANSWER BOXES UI
// =======================
function generateAnswerBoxes(answer) {
  answerBoxes.innerHTML = "";

  const len = (answer || "").length;
  for (let i = 0; i < len; i++) {
    const box = document.createElement("div");
    box.classList.add("answer-box");
    box.dataset.index = i;            // identify box
    box.textContent = "";
    // clicking a filled box will deselect / restore tile
    box.addEventListener("click", () => {
      if (box.textContent === "") return;
      clearBox(parseInt(box.dataset.index, 10));
    });
    answerBoxes.appendChild(box);
  }
}

// =======================
//     LETTER TILES UI
// =======================
function generateLetterTiles(answer) {
  letterBank.innerHTML = "";

  // 1) Count required letters (respect frequency) from answer
  const required = {};
  [...(answer || "").toUpperCase()].forEach(ch => {
    required[ch] = (required[ch] || 0) + 1;
  });

  // 2) Build initial array that includes all required letters
  let letters = [];
  Object.entries(required).forEach(([ch, count]) => {
    for (let i = 0; i < count; i++) letters.push(ch);
  });

  // 3) Fill remaining slots up to 12 with random letters (A-Z)
  while (letters.length < 12) {
    letters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  }

  // 4) Shuffle the letters array
  letters.sort(() => Math.random() - 0.5);

  // 5) Create tiles with stable ids so we can restore them later
  // include a timestamp to avoid id collisions if regenerate repeatedly
  const idPrefix = `t${Date.now()}-`;
  letters.forEach((letter, i) => {
    const tile = document.createElement("div");
    tile.classList.add("letter-tile");
    tile.textContent = letter;
    tile.dataset.tileId = `${idPrefix}${i}`;   // stable id unique per generation
    tile.dataset.visible = "true";

    tile.addEventListener("click", () => {
      // ignore clicks on hidden tiles
      if (tile.style.visibility === "hidden") return;

      const nextIndex = findNextEmptyBoxIndex();
      if (nextIndex === -1) return; // no empty boxes

      // fill box and mark tile as used
      const box = answerBoxes.querySelector(`.answer-box[data-index="${nextIndex}"]`);
      if (!box) return;
      box.textContent = letter;
      box.dataset.srcTile = tile.dataset.tileId; // remember which tile filled it

      tile.style.visibility = "hidden";
      tile.dataset.visible = "false";
      tile.dataset.filledAt = nextIndex;
    });

    letterBank.appendChild(tile);
  });
}

// =======================
//  FIND NEXT EMPTY BOX
// =======================
function findNextEmptyBoxIndex() {
  const boxes = document.querySelectorAll(".answer-box");
  for (let box of boxes) {
    if (box.textContent === "") return parseInt(box.dataset.index, 10);
  }
  return -1;
}

// =======================
//    CLEAR (DESELECT) BOX
// =======================
function clearBox(boxIndex) {
  const box = answerBoxes.querySelector(`.answer-box[data-index="${boxIndex}"]`);
  if (!box) return;

  const tileId = box.dataset.srcTile;
  box.textContent = "";
  delete box.dataset.srcTile;

  // find the tile that was used and restore it
  if (tileId) {
    const tile = letterBank.querySelector(`.letter-tile[data-tile-id="${tileId}"]`);
    if (tile) {
      tile.style.visibility = ""; // restore visibility
      tile.dataset.visible = "true";
      delete tile.dataset.filledAt;
    } else {
      // in case tile node was removed or replaced for some reason:
      // recreate a visible tile with that letter (fallback)
      const restored = document.createElement("div");
      restored.classList.add("letter-tile");
      restored.textContent = ""; // unknown letter if not found
      letterBank.appendChild(restored);
    }
  } else {
    // no tile recorded (edge case) — nothing to restore
  }
}

// =======================
//       RESET BUTTON
// =======================
resetBtn?.addEventListener("click", () => {
  currentLevel = 0;
  localStorage.setItem("currentLevel", 0);

  // re-fetch levels to ensure UI and data are in sync
  fetchLevels();

  customAlert("Progress reset! You're back to Level 1.");
});

// =======================
//       SHUFFLE UI
// =======================
// Shuffle function that does NOT regenerate tiles
// - shuffles visible tiles in the letter bank (re-orders DOM)
// - also scrambles letters among filled answer boxes only (keeps box count and tile associations)
function shuffleTilesAndFilledBoxes() {
  // 1) Shuffle letter tiles DOM order (preserve visibility states)
  const tiles = Array.from(letterBank.querySelectorAll(".letter-tile"));
  tiles.sort(() => Math.random() - 0.5);
  tiles.forEach(t => letterBank.appendChild(t));

  // 2) Shuffle letters among currently filled boxes ONLY (do not touch empty ones)
  const filledBoxes = Array.from(answerBoxes.querySelectorAll(".answer-box"))
    .filter(b => b.textContent !== "");

  if (filledBoxes.length <= 1) return; // nothing meaningful to shuffle

  // Extract letters and their source tile ids
  const letters = filledBoxes.map(b => b.textContent);
  const tileIds = filledBoxes.map(b => b.dataset.srcTile || null);

  // Shuffle letters array (Fisher-Yates)
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
    [tileIds[i], tileIds[j]] = [tileIds[j], tileIds[i]];
  }

  // Put shuffled letters + tile associations back into boxes
  filledBoxes.forEach((box, idx) => {
    box.textContent = letters[idx];
    box.dataset.srcTile = tileIds[idx] || "";

    // Update the tile.filledAt mapping to match new box index if tile exists
    if (tileIds[idx]) {
      const tile = letterBank.querySelector(`.letter-tile[data-tile-id="${tileIds[idx]}"]`);
      if (tile) {
        tile.dataset.filledAt = box.dataset.index;
      }
    }
  });
}

// =======================
//  OPTIONAL: get current answer string
// =======================
function getCurrentAnswerFromBoxes() {
  return Array.from(answerBoxes.querySelectorAll(".answer-box"))
    .map(b => b.textContent || "")
    .join("");
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
checkBtn?.addEventListener("click", () => {
  const level = safeGetCurrentLevel();
  if (!level) {
    customAlert("Level not ready.");
    return;
  }

  const player = getPlayerAnswer();
  const correct = level.answer || "";

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
//     SHUFFLE BUTTON
// =======================

shuffleBtn?.addEventListener("click", () => {
  // guard
  if (!safeGetCurrentLevel()) {
    customAlert("Level not ready.");
    return;
  }
  shuffleTilesAndFilledBoxes();
});

// Sound effects
const clickSfx = new Audio("sounds/click.mp3");
clickSfx.volume = 0.5; // optional

document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        clickSfx.currentTime = 0;
        clickSfx.play();
    });
});


// Start game
fetchLevels();
