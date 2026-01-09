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
//        SOUND FX
// =======================
const clickSfx = new Audio("./config/sounds/click.mp3");
clickSfx.volume = 0.5;

const levelCompleteSfx = new Audio("./config/sounds/levelComplete.mp3");
levelCompleteSfx.volume = 0.7;

const hintSfx = new Audio("./config/sounds/hintFx.mp3");
hintSfx.volume = 0.6;

document.addEventListener("pointerdown", () => {
  clickSfx.play().then(() => {
    clickSfx.pause();
    clickSfx.currentTime = 0;
  }).catch(() => {});
}, { once: true });

function playClick() {
  const sfx = clickSfx.cloneNode();
  sfx.playbackRate = 0.95 + Math.random() * 0.1;
  sfx.play().catch(() => {});
}

document.addEventListener("click", (e) => {
  if (
    e.target.closest("button") ||
    e.target.classList.contains("letter-tile") ||
    e.target.classList.contains("answer-box")
  ) playClick();
});

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

function levelConfettiBurst() {
  const canvas = document.getElementById("levelConfetti");
  const ctx = canvas.getContext("2d");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const confettiCount = 40;
  const gravity = 0.4;

  const pieces = Array.from({ length: confettiCount }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -8 - 4,
    size: Math.random() * 6 + 4,
    color: `hsl(${Math.random() * 360}, 90%, 60%)`
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach(p => {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // stop when all confetti is off-screen
    if (pieces.some(p => p.y < canvas.height)) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

function showSuccessPopup(answer, description) {
  const popup = document.getElementById("successPopup");
  const word  = document.getElementById("popupWord");
  const desc  = document.getElementById("popupDesc");
  const okBtn = document.getElementById("popupOk");

  if (!popup || !word || !desc || !okBtn) return;

  word.textContent = answer;
  desc.textContent = description || "No description available.";

  popup.classList.remove("hidden");

  okBtn.onclick = () => {
    popup.classList.add("hidden");
  };
}

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  // LIMITED amount
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height, // start above screen
    r: Math.random() * 5 + 4,
    dy: Math.random() * 3 + 2,
    dx: Math.random() * 2 - 1, // slight sideways drift
    color: `hsl(${Math.random() * 360}, 85%, 60%)`
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let active = 0;

    pieces.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;

      if (p.y <= canvas.height + p.r) {
        active++;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // keep animating ONLY while pieces exist
    if (active > 0) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

async function showEndPopup() {
  const popup = document.getElementById("endPopup");
  const yesBtn = document.getElementById("endYes");
  const noBtn  = document.getElementById("endNo");
  const pointsText = document.getElementById("totalPointsText");

  if (!popup || !yesBtn || !noBtn) return;

  const points = await getPoints();
  pointsText.textContent = `Total Points: ${points}`;

  popup.classList.remove("hidden");
  launchConfetti();

  yesBtn.onclick = () => {
    location.href = "dictionary.html";
  };

  noBtn.onclick = () => {
    popup.classList.add("hidden");
  };
}

function playLevelComplete() {
  levelCompleteSfx.currentTime = 0;
  levelCompleteSfx.play().catch(() => {});
}

function playHintSound() {
  hintSfx.currentTime = 0;
  hintSfx.play().catch(() => {});
}

// =======================
//      POINTS SYSTEM
// =======================

const STARTING_POINTS = 50;

// who am I?
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

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return STARTING_POINTS;

  return snap.data().points ?? STARTING_POINTS;
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

  const current = snap.data().points ?? STARTING_POINTS;

  await updateDoc(ref, {
    points: current + amount
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

// ---------- UI ----------
async function updatePointsUI() {
  if (!scoreText) return;
  scoreText.textContent = `Points: ${await getPoints()}`;
}

// =======================
//       GAME STATE
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

function setUI(enabled) {
  [hintBtn, shuffleBtn, checkBtn, nextBtn]
    .forEach(b => b && (b.disabled = !enabled));
}

setUI(false);

function getHintKey() {
  return `hintState_${getUserId()}`;
}

function getHintState() {
  return JSON.parse(localStorage.getItem(getHintKey()) || "{}");
}

function saveHintState(state) {
  localStorage.setItem(getHintKey(), JSON.stringify(state));
}

function getHintLimit(answerLength) {
  if (answerLength <= 2) return 0;
  if (answerLength === 3) return 1;
  if (answerLength <= 5) return 2;
  return 3;
}

let checkInProgress = false;
let hintInProgress = false;
let nextInProgress = false;

// =======================
//       LEVEL LOAD
// =======================
async function fetchLevels() {
  try {
    const snap = await getDocs(collection(db, "levels"));
    levels = snap.docs
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(d => d.data());

    if (!levels.length) return customAlert("No levels found");

    currentLevel = Math.min(currentLevel, levels.length - 1);
    saveLevel(currentLevel);

    loadLevel();
    setUI(true);
  } catch (e) {
    console.error(e);
    customAlert("Failed to load levels");
  }
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
  restoreHints();
}

// =======================
//      ANSWER BOXES
// =======================
function getLetterBoxes() {
  return [...answerBoxes.querySelectorAll(".answer-box[data-letter]")];
}

const MAX_LETTERS_PER_ROW = 6; // tweak this

function splitAnswerIntoRows(answer, maxLetters) {
  const words = answer.split(" ");

  const rows = [];
  let currentRow = [];
  let currentLen = 0;

  for (const word of words) {
    const len = word.length;

    if (currentLen + len <= maxLetters) {
      currentRow.push(word);
      currentLen += len;
    } else {
      rows.push(currentRow.join(" "));
      currentRow = [word];
      currentLen = len;
    }
  }

  if (currentRow.length) {
    rows.push(currentRow.join(" "));
  }

  return rows;
}

function applyBoxSizingMode(answer) {
  const hasSpace = answer.includes(" ");
  const wordLength = answer.length;

  answerBoxes.classList.remove("shrink-word");
  answerBoxes.classList.remove("long-word");
  answerBoxes.classList.remove("very-long");

  if (hasSpace) {
    answerBoxes.style.flexWrap = "wrap";
    return;
  }

  if (wordLength > 7) {
    answerBoxes.classList.add("shrink-word");
    answerBoxes.classList.add("long-word");
    answerBoxes.style.flexWrap = "nowrap";

    if (wordLength > 9) {
      answerBoxes.classList.add("very-long"); // 👉 min-width: 30px
    }

  } else {
    answerBoxes.style.flexWrap = "wrap";
  }
}

function buildAnswerBoxes(answer = "") {

  applyBoxSizingMode(answer.toUpperCase());

  answerBoxes.innerHTML = "";

  let letterIndex = 0; // 👈 REQUIRED

  let rows;

  if (answer.includes(" ")) {
    rows = splitAnswerIntoRows(answer, MAX_LETTERS_PER_ROW);
  } else {
    rows = [answer]; // 👈 single long word stays one row
  }

  rows.forEach(row => {
    for (const char of row) {
      if (char === " ") {
        const space = document.createElement("div");
        space.className = "answer-space";
        answerBoxes.appendChild(space);
        continue;
      }

      const box = document.createElement("div");
      box.className = "answer-box";
      box.dataset.index = letterIndex;
      box.dataset.letter = "true"; // 👈 THIS IS THE KEY

      box.onclick = () => {
        if (!box.textContent) return;
        clearBox(Number(box.dataset.index));
      };

      answerBoxes.appendChild(box);
      letterIndex++;
    }

    const br = document.createElement("div");
    br.style.flexBasis = "100%";
    br.style.height = "0";
    answerBoxes.appendChild(br);
  });
}

function findEmptyBox() {
  return getLetterBoxes().findIndex(b => !b.textContent);
}

function clearBox(i) {
  const box = getLetterBoxes()[i];
  if (!box) return;

  const tileId = box.dataset.srcTile;

  box.textContent = "";
  delete box.dataset.srcTile;

  if (!tileId) return;
  const tile = letterBank.querySelector(
    `[data-tile-id='${tileId}']`
  );
  if (tile) tile.style.visibility = "";
}

// =======================
//      LETTER TILES
// =======================
function buildLetterTiles(answer = "") {
  letterBank.innerHTML = "";

  const needed = {};
  [...answer.toUpperCase()].forEach(l => {
    if (l !== " ") {
      needed[l] = (needed[l] || 0) + 1;
    }
  });

  let letters = Object.entries(needed)
    .flatMap(([l, c]) => Array(c).fill(l));

  while (letters.length < 12) {
    letters.push(
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    );
  }

  // 🔒 hard safety filter
  letters = letters.filter(l => l && l.trim() !== "");

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

      const box = getLetterBoxes()[idx];
      box.textContent = l;
      box.dataset.srcTile = tile.dataset.tileId;
      tile.style.visibility = "hidden";
    };

    letterBank.appendChild(tile);
  });
}

function restoreHints() {
  const level = safeLevel();
  if (!level) return;

  const answer = level.answer.toUpperCase();
  const state = getHintState();
  const revealed = state[currentLevel] || [];

  revealed.forEach(letterIndex => {
    const box = [...answerBoxes.children]
      .find(b => Number(b.dataset.index) === letterIndex);

    if (!box) return;

    const tile = [...letterBank.children].find(
      t =>
        t.textContent === answer[letterIndex] &&
        t.style.visibility !== "hidden"
    );

    if (!tile) return;

    box.textContent = answer[letterIndex];
    box.dataset.srcTile = tile.dataset.tileId;
    tile.style.visibility = "hidden";
  });
}


// =======================
//      SCORE SYSTEM
// =======================

async function addScore(amount) {
  const uid = getUserId();
  if (uid === "guest") return;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  await updateDoc(ref, {
    score: (snap.data().score || 0) + amount
  });
}

// Save Completed Levels
function markLevelCompleted(levelIndex) {
  const uid = getUserId(); // VERY IMPORTANT

  const key = `completedLevels_${uid}`;
  const completed = JSON.parse(
    localStorage.getItem(key) || "[]"
  );

  if (!completed.includes(levelIndex)) {
    completed.push(levelIndex);
    localStorage.setItem(
      key,
      JSON.stringify(completed)
    );
  }
}

// =======================
//         ACTIONS
// =======================

checkBtn.onclick = async () => {
  if (checkInProgress) return;
  checkInProgress = true;
  checkBtn.disabled = true;

  const level = safeLevel();
  if (!level) {
    checkInProgress = false;
    checkBtn.disabled = false;
    return;
  }

  const answer = getLetterBoxes()
    .map(b => b.textContent)
    .join("");

  const correct = level.answer.replaceAll(" ", "");

  if (answer === correct) {
    playLevelComplete();
    showSuccessPopup(level.answer, level.description);
    levelConfettiBurst();

    await addPoints(5);
    await addScore(10);
    markLevelCompleted(currentLevel);

    await updatePointsUI(); // 🔥 THIS WAS MISSING

    nextBtn.style.display = "inline-block";
    checkBtn.style.display = "none";

    checkInProgress = false;
    checkBtn.disabled = false;
    return;
  }

  customAlert("Try again 😅");
  checkInProgress = false;
  checkBtn.disabled = false;
};

nextBtn.onclick = async () => {
  if (nextInProgress) return; // 🚫 stop spam
  nextInProgress = true;
  nextBtn.disabled = true;

  try {
    currentLevel++;
    saveLevel(currentLevel);

    if (currentLevel >= levels.length) {
      await showEndPopup(); // important to await
    } else {
      loadLevel();
    }
  } finally {
    // re-enable ONLY if not end screen
    if (currentLevel < levels.length) {
      nextBtn.disabled = false;
      nextInProgress = false;
    }
  }
};

// =======================
//         SHUFFLE
// =======================
shuffleBtn.onclick = () => {
  if (!letterBank.children.length) return;

  [...letterBank.children]
    .sort(() => Math.random() - 0.5)
    .forEach(tile => letterBank.appendChild(tile));
};

// =======================
//          HINT
// =======================

hintBtn.onclick = async () => {
  if (hintInProgress) return;
  hintInProgress = true;
  hintBtn.disabled = true;

  const unlock = () => {
    hintInProgress = false;
    hintBtn.disabled = false;
  };

  try {
    const level = safeLevel();
    if (!level) return unlock();

    // real answer
    const answer = level.answer.toUpperCase();

    // ❗ letter-only (spaces removed)
    const answerNoSpaces = answer.replaceAll(" ", "");

    const limit = getHintLimit(answerNoSpaces.length);

    if (limit === 0) {
      customAlert("Hints are disabled for short words 👀");
      return unlock();
    }

    const state = getHintState();
    const usedHints = state[currentLevel] || [];

    if (usedHints.length >= limit) {
      customAlert(`Hint limit reached (${limit}/${limit})`);
      return unlock();
    }

    // ⭐ IMPORTANT:
    // use ONLY real letter boxes
    const candidates = getLetterBoxes()
      .map(box => ({
        box,
        letterIndex: Number(box.dataset.index)
      }))
      .filter(({ box, letterIndex }) =>
        box.textContent !== answerNoSpaces[letterIndex]
      );

    if (!candidates.length) {
      customAlert("All letters are already revealed 😉");
      return unlock();
    }

    // 💰 charge ONLY once we know a hint exists
    if (!(await spendPoints(10))) {
      customAlert("Not enough points!");
      return unlock();
    }

    playHintSound();

    const { box, letterIndex } =
      candidates[Math.floor(Math.random() * candidates.length)];

    // clear wrong one before revealing
    if (box.textContent) clearBox(letterIndex);

    // find matching visible tile
    const tile = [...letterBank.children].find(
      t =>
        t.textContent === answerNoSpaces[letterIndex] &&
        t.style.visibility !== "hidden"
    );

    if (!tile) return unlock();

    // reveal final hint
    box.textContent = answerNoSpaces[letterIndex];
    box.dataset.srcTile = tile.dataset.tileId;
    tile.style.visibility = "hidden";

    // save hint state
    state[currentLevel] ??= [];
    state[currentLevel].push(letterIndex);
    saveHintState(state);

  } finally {
    unlock();
  }
};

const resetPopup   = document.getElementById("resetPopup");
const resetConfirm = document.getElementById("resetConfirm");
const resetCancel  = document.getElementById("resetCancel");

resetBtn.onclick = () => {
  resetPopup.classList.remove("hidden");
};

resetConfirm.onclick = () => {
  const uid = getUserId();

  currentLevel = 0;
  saveLevel(0);

  // 🔥 CLEAR ALL HINTS
  localStorage.removeItem(`hintState_${uid}`);

  fetchLevels();

  resetPopup.classList.add("hidden");
  customAlert("Progress reset");
};

resetCancel.onclick = () => {
  resetPopup.classList.add("hidden");
};

backBtn.onclick = () => {
  setTimeout(() => location.href = "index.html", 150);
};

// =======================
//         START
// =======================
fetchLevels();
updatePointsUI();