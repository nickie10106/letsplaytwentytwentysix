// Hardcoded PINs for this simple setup
const PIN_M = "2003";
const PIN_N = "2000";

let currentSelectedProfile = "";

// Check if a user is already logged in when the app loads
window.onload = () => {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    showDashboard(savedUser);
  }
};

function selectProfile(profileName) {
  currentSelectedProfile = profileName;
  document.getElementById("profile-view").classList.remove("active");
  
  const pinView = document.getElementById("pin-view");
  pinView.classList.remove("hidden");
  pinView.classList.add("active");
  
  document.getElementById("pin-prompt").innerText = `Enter PIN for ${profileName}`;
  document.getElementById("pin-input").value = "";
  document.getElementById("pin-error").classList.add("hidden");
  document.getElementById("pin-input").focus();
}

function goBack() {
  currentSelectedProfile = "";
  document.getElementById("pin-view").classList.remove("active");
  document.getElementById("pin-view").classList.add("hidden");
  
  document.getElementById("profile-view").classList.add("active");
}

function verifyPin() {
  const enteredPin = document.getElementById("pin-input").value;
  const errorText = document.getElementById("pin-error");
  
  let isCorrect = false;
  if (currentSelectedProfile === "M" && enteredPin === PIN_M) isCorrect = true;
  if (currentSelectedProfile === "N" && enteredPin === PIN_N) isCorrect = true;

  if (isCorrect) {
    localStorage.setItem("loggedInUser", currentSelectedProfile);
    errorText.classList.add("hidden");
    document.getElementById("pin-view").classList.remove("active");
    document.getElementById("pin-view").classList.add("hidden");
    showDashboard(currentSelectedProfile);
  } else {
    errorText.classList.remove("hidden");
    document.getElementById("pin-input").value = "";
  }
}

function showDashboard(profileName) {
  document.getElementById("profile-view").classList.remove("active");
  document.getElementById("profile-view").classList.add("hidden");
  
  const mainView = document.getElementById("main-view");
  mainView.classList.remove("hidden");
  mainView.classList.add("active");
  
  document.getElementById("welcome-message").innerText = `Welcome back, ${profileName}!`;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  document.getElementById("main-view").classList.remove("active");
  document.getElementById("main-view").classList.add("hidden");
  
  const profileView = document.getElementById("profile-view");
  profileView.classList.remove("hidden");
  profileView.classList.add("active");
}

// Toggles the floating action menu open and closed
function toggleFab() {
    const menu = document.getElementById("fab-menu");
    const mainBtn = document.getElementById("fab-main-btn");
    
    menu.classList.toggle("open");
    mainBtn.classList.toggle("open");
  }
  
  // Opens the Add Event view
  function openAddEvent() {
    toggleFab(); // Close the menu when an option is clicked
    alert("This will open the Add Event form!"); 
  }
  
  // Opens the Edit Event view
  function openEditEvent() {
    toggleFab(); 
    alert("This will open the Edit Event list!"); 
  }