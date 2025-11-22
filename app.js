// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, setDoc, doc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Auth state listener ---
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    localStorage.setItem("userId", user.uid);
  } else {
    currentUser = null;
    localStorage.removeItem("userId");
  }
});

// --- Define signup/login functions ---
async function signupUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: email,
      score: 0
    });

    alert("Signup successful!");
    localStorage.setItem("userId", user.uid);
    signupModal.style.display = "none";
    window.location.href = "game.html";
  } catch (error) {
    alert(error.message);
  }
}

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    localStorage.setItem("userId", user.uid);
    alert("Login successful!");
    loginModal.style.display = "none";
    window.location.href = "game.html";
  } catch (error) {
    alert(error.message);
  }
}

// --- DOM stuff ---
const playBtn = document.getElementById("playBtn");
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const closeModal = document.getElementById("closeModal");
const closeSignup = document.getElementById("closeSignup");
const showSignup = document.getElementById("showSignup");

playBtn.addEventListener("click", () => {
  // Always allow Play
  window.location.href = "game.html";
});


loginBtn.addEventListener("click", () => loginModal.style.display = "block");
showSignup.addEventListener("click", () => {
  loginModal.style.display = "none";
  signupModal.style.display = "block";
});

closeModal.addEventListener("click", () => loginModal.style.display = "none");
closeSignup.addEventListener("click", () => signupModal.style.display = "none");

window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === signupModal) signupModal.style.display = "none";
});

const signupSubmit = document.getElementById("signupSubmit");
signupSubmit.addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!email || !password || !confirmPassword) return alert("Please fill out all fields!");
  if (password !== confirmPassword) return alert("Passwords do not match!");
  
  signupUser(email, password);
});

const loginSubmit = document.getElementById("loginSubmit");
loginSubmit.addEventListener("click", () => {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Please enter both email and password!");
  
  loginUser(email, password);
});
