const SHEETDB_URL = "https://sheetdb.io/api/v1/kolk6lmwxwxwk"

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

  // --- Countdown Timer Logic ---
function startCountdown() {
    // Target: Jan 8, 2027 at 07:00 AM London Time (GMT)
    // "Z" indicates UTC/GMT time.
    const targetDate = new Date("2027-01-08T07:00:00Z").getTime();
  
    // Update the countdown every 1 second (1000 milliseconds)
    const timer = setInterval(function() {
      const now = new Date().getTime();
      const distance = targetDate - now;
  
      // If the countdown is finished, stop the timer and display a message
      if (distance < 0) {
        clearInterval(timer);
        document.getElementById("countdown-display").innerHTML = "<div style='width:100%; text-align:center;'>We are together! 🎉</div>";
        return;
      }
  
      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
      // Inject the calculated numbers into the HTML, padding single digits with a zero
      document.getElementById("cd-days").innerText = String(days).padStart(2, '0');
      document.getElementById("cd-hours").innerText = String(hours).padStart(2, '0');
      document.getElementById("cd-minutes").innerText = String(minutes).padStart(2, '0');
      document.getElementById("cd-seconds").innerText = String(seconds).padStart(2, '0');
      
    }, 1000);
  }
  
  // Modify your existing showDashboard function to start the countdown when the dashboard loads
  function showDashboard(profileName) {
    document.getElementById("profile-view").classList.remove("active");
    document.getElementById("profile-view").classList.add("hidden");
    
    const mainView = document.getElementById("main-view");
    mainView.classList.remove("hidden");
    mainView.classList.add("active");
    
    // Make sure you have a <h1 id="welcome-message"> in your HTML if you want to keep this line
    if(document.getElementById("welcome-message")) {
      document.getElementById("welcome-message").innerText = `Welcome back, ${profileName}!`;
    }
  
    // Start the countdown when the dashboard appears
    startCountdown();
  }

  // Add this function to fetch and display the scores
async function loadScores() {
    try {
      // Append ?sheet=Scores to tell the API specifically which tab to read
      const response = await fetch(`${SHEETDB_URL}?sheet=Scores`);
      const data = await response.json();
  
      // The data comes back as an array of rows: 
      // e.g., [{profile: "M", score: "10"}, {profile: "N", score: "15"}]
      data.forEach(row => {
        if (row.profile === "M") {
          document.getElementById("score-M").innerText = row.score;
        } else if (row.profile === "N") {
          document.getElementById("score-N").innerText = row.score;
        }
      });
    } catch (error) {
      console.error("Error fetching scores:", error);
      // You can optionally add a fallback here, like showing "-" if offline
    }
  }

  // Update your existing showDashboard function
function showDashboard(profileName) {
    document.getElementById("profile-view").classList.remove("active");
    document.getElementById("profile-view").classList.add("hidden");
    
    const mainView = document.getElementById("main-view");
    mainView.classList.remove("hidden");
    mainView.classList.add("active");
    
    // Start the countdown clock
    startCountdown();
    
    // Fetch the live scores from Google Sheets
    loadScores();
  }