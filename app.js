// -----------------------
//    Firebase Imports
// -----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// -----------------------
//    Firebase Config
// -----------------------
const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -----------------------
//      Auth Listener
// -----------------------
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    currentUser = user;
    localStorage.setItem("userId", user.uid);

    // Show logout button, hide login
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
  } else {
    currentUser = null;
    localStorage.removeItem("userId");

    // Show login button, hide logout
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});


// -----------------------
// Helper: run only if element exists
// -----------------------
function onPage(selector, callback) {
  if (document.querySelector(selector)) callback();
}

// Custom Alert
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


// -----------------------
//      AUTH FUNCTIONS
// -----------------------
async function signupUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: email,
      score: 0
    });

    customAlert("Signup successful!");
    localStorage.setItem("userId", user.uid);

    document.getElementById("signupModal").style.display = "none";
  } catch (error) {
    customAlert(error.message);
  }
}

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    localStorage.setItem("userId", user.uid);
    customAlert("Login successful!");

    document.getElementById("loginModal").style.display = "none";
  } catch (error) {
    customAlert(error.message);
  }
}

// ---------------------------
//      LEADERBOARD LOGIC
// ---------------------------

const leaderboardList = document.getElementById("leaderboardList");

async function loadLeaderboard() {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    const players = [];

    snapshot.forEach(doc => {
      players.push(doc.data());
    });

    players.sort((a, b) => b.score - a.score);

    leaderboardList.innerHTML = "";

    players.forEach((player, index) => {
      const rank = index + 1;

      let className = "leaderboard-item";
      if (rank === 1) className += " top-1";
      if (rank === 2) className += " top-2";
      if (rank === 3) className += " top-3";

      leaderboardList.innerHTML += `
        <li class="${className}">
          <span class="rank">#${rank}</span>
          <span class="username">${player.email}</span>
          <span class="score">${player.score}</span>
        </li>
      `;
    });

  } catch (err) {
    console.error("Leaderboard error:", err);
  }
}

if (leaderboardList) loadLeaderboard();

// -----------------------
//      PAGE LOGIC
// -----------------------

// PLAY BUTTON (index)
onPage("#playBtn", () => {
  document.getElementById("playBtn").addEventListener("click", () => {
    window.location.href = "game.html";
  });
});

// LEADERBOARD BUTTON
onPage("#leaderboardBtn", () => {
  document.getElementById("leaderboardBtn").addEventListener("click", () => {
    window.location.href = "leaderboard.html";
  });
});

// BACK BUTTON (leaderboard/game)
onPage("#backBtn", () => {
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});

// -----------------------
//      LOGIN MODAL
// -----------------------
onPage("#loginBtn", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");

  loginBtn.addEventListener("click", () => {
    loginModal.style.display = "flex";
  });
});

// SWITCH TO SIGNUP
onPage("#showSignup", () => {
  const showSignup = document.getElementById("showSignup");
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  showSignup.addEventListener("click", () => {
    loginModal.style.display = "none";
    signupModal.style.display = "flex";
  });
});

// CLOSE LOGIN MODAL
onPage("#closeModal", () => {
  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("loginModal").style.display = "none";
  });
});

// CLOSE SIGNUP MODAL
onPage("#closeSignup", () => {
  document.getElementById("closeSignup").addEventListener("click", () => {
    document.getElementById("signupModal").style.display = "none";
  });
});

// CLICK OUTSIDE TO CLOSE
onPage("#loginModal", () => {
  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("loginModal"))
      document.getElementById("loginModal").style.display = "none";

    if (e.target === document.getElementById("signupModal"))
      document.getElementById("signupModal").style.display = "none";
  });
});

// -----------------------
//      SIGNUP SUBMIT
// -----------------------
onPage("#signupSubmit", () => {
  document.getElementById("signupSubmit").addEventListener("click", () => {
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!email || !password || !confirmPassword)
      return customAlert("Please fill out all fields!");

    if (password !== confirmPassword)
      return customAlert("Passwords do not match!");

    signupUser(email, password);
  });
});

// -----------------------
//      LOGIN SUBMIT
// -----------------------
onPage("#loginSubmit", () => {
  document.getElementById("loginSubmit").addEventListener("click", () => {
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password)
      return customAlert("Please enter both email and password!");

    loginUser(email, password);
  });
});

// -----------------------
//      LOGOUT BUTTON
// -----------------------
onPage("#logoutBtn", () => {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await auth.signOut();
    localStorage.removeItem("userId");
    customAlert("Logged out!");

    window.location.href = "index.html";
  });
});
