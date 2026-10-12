const SHEETDB_URL = "https://sheetdb.io/api/v1/kolk6lmwxwxwk";

// Hardcoded PINs
const PIN_M = "2003";
const PIN_N = "2000";

let currentSelectedProfile = "";

// Check if logged in on load
window.onload = () => {
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    showDashboard(savedUser);
  }
};

// --- AUTHENTICATION ---
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

function logout() {
  localStorage.removeItem("loggedInUser");
  document.getElementById("main-view").classList.remove("active");
  document.getElementById("main-view").classList.add("hidden");
  
  const profileView = document.getElementById("profile-view");
  profileView.classList.remove("hidden");
  profileView.classList.add("active");
}

// --- DASHBOARD NAVIGATION ---
function showDashboard(profileName) {
  document.getElementById("profile-view").classList.remove("active");
  document.getElementById("profile-view").classList.add("hidden");
  
  const mainView = document.getElementById("main-view");
  mainView.classList.remove("hidden");
  mainView.classList.add("active");
  
  startCountdown();
  updateStats(); // Runs day counter immediately
  loadScores();
  loadEvents();
}

// --- FLOATING ACTION MENU ---

// Toggle between Dashboard and "Choose a Date" Activity Screen
function toggleAddScreen() {
  const mainView = document.getElementById("main-view");
  const chooseView = document.getElementById("choose-date-view");

  if (chooseView.classList.contains("hidden")) {
    mainView.classList.add("hidden");
    mainView.classList.remove("active");
    chooseView.classList.remove("hidden");
    chooseView.classList.add("active");
  } else {
    chooseView.classList.add("hidden");
    chooseView.classList.remove("active");
    mainView.classList.remove("hidden");
    mainView.classList.add("active");
  }
}

// Select category and open details form
function selectCategory(categoryName) {
  document.getElementById("choose-date-view").classList.add("hidden");
  
  const addView = document.getElementById("add-event-view");
  addView.classList.remove("hidden");
  addView.classList.add("active");

  // Pre-fill event type select element
  const typeSelect = document.getElementById("event-type");
  if (typeSelect) typeSelect.value = categoryName;
}

// Helper to calculate Dual Timezones (UKT/London & SGT/Singapore)
function formatDualTimezones(dateStr, timeStr, baseTz) {
  const [year, month, day] = dateStr.split('-');
  const [hours, mins] = timeStr.split(':');
  
  // Convert based on Singapore (+8) or London (+0)
  let baseOffset = baseTz === 'SG' ? 8 : 0;
  let utcTime = new Date(Date.UTC(year, month - 1, day, hours - baseOffset, mins));

  let uktStr = utcTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/London' });
  let sgtStr = utcTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' });

  return `
    <div class="tz-container">
      <span class="tz-badge tz-ukt">${uktStr} UKT</span>
      <span class="tz-badge tz-sgt">${sgtStr} SGT</span>
    </div>
  `;
}

// Updated loadEvents 
async function loadEvents() {
  const eventsList = document.getElementById("upcoming-events-list");
  if (eventsList) eventsList.innerHTML = "<p style='font-size: 12px; color: #888;'>Loading events...</p>";

  try {
    const response = await fetch(`${SHEETDB_URL}?sheet=Events`);
    const data = await response.json();

    // Update the Our Stats numbers using the fetched database records
    updateStats(data);

    if (!eventsList) return;
    eventsList.innerHTML = "";

    const activeEvents = data.filter(row => !row.winner || row.winner.trim() === "");

    if (activeEvents.length === 0) {
      eventsList.innerHTML = "<p style='font-size: 12px; color: #888;'>No upcoming events.</p>";
      return;
    }

    activeEvents.forEach((row) => {
      const safeName = encodeURIComponent(row.event_name);
      const actionLabel = (row.event_type || "").toLowerCase().includes("book") ? "Review" : "Claim";
      const tzBadgesHTML = formatDualTimezones(row.date, row.time, row.timezone);

      const cardHTML = `
        <div class="event-card">
          <button class="delete-btn" onclick="deleteEvent('${safeName}')">
            <i class="fa-solid fa-trash"></i>
          </button>
          
          <div class="event-details">
            <h4>${row.event_name}</h4>
            <p>${row.date}</p>
            ${tzBadgesHTML}
          </div>
          
          <button class="claim-btn" onclick="claimPoints('${safeName}', ${row.points_worth}, this)">${actionLabel}</button>
          <i class="fa-solid fa-pen-to-square" style="color: #8da9ee; margin-left: 10px; cursor: pointer;"></i>
        </div>
      `;
      eventsList.innerHTML += cardHTML;
    });

  } catch (error) {
    console.error("Error fetching events:", error);
    if (eventsList) eventsList.innerHTML = "<p style='font-size: 12px; color: red;'>Failed to load events.</p>";
  }
}

// --- COUNTDOWN LOGIC ---
function startCountdown() {
  const targetDate = new Date("2027-01-08T07:00:00Z").getTime();
  
  const timer = setInterval(function() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      clearInterval(timer);
      document.getElementById("countdown-display").innerHTML = "<div style='width:100%; text-align:center;'>We are together! 🎉</div>";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("cd-days").innerText = String(days).padStart(2, '0');
    document.getElementById("cd-hours").innerText = String(hours).padStart(2, '0');
    document.getElementById("cd-minutes").innerText = String(minutes).padStart(2, '0');
    document.getElementById("cd-seconds").innerText = String(seconds).padStart(2, '0');
  }, 1000);
}

// --- DATABASE LOGIC (SHEETDB) ---
async function loadScores() {
  try {
    const response = await fetch(`${SHEETDB_URL}?sheet=Scores`);
    const data = await response.json();

    data.forEach(row => {
      if (row.profile === "M") {
        document.getElementById("score-M").innerText = row.score;
      } else if (row.profile === "N") {
        document.getElementById("score-N").innerText = row.score;
      }
    });
  } catch (error) {
    console.error("Error fetching scores:", error);
  }
}

async function saveEvent(event) {
  event.preventDefault(); 
  
  const btn = document.getElementById("submit-event-btn");
  btn.innerText = "Saving...";
  btn.disabled = true;

  const newRowData = {
    date: document.getElementById("event-date").value,
    time: document.getElementById("event-time").value,
    timezone: document.getElementById("event-timezone").value,
    event_name: document.getElementById("event-name").value,
    event_type: document.getElementById("event-type").value,
    points_worth: document.getElementById("event-points").value,
    winner: "" 
  };

  try {
    const response = await fetch(`${SHEETDB_URL}?sheet=Events`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: [newRowData] }) 
    });

    if (response.ok) {
      document.getElementById("add-event-form").reset();
      closeAddEvent();
    } else {
      alert("Failed to save. Check your connection.");
    }
  } catch (error) {
    console.error("Error saving event:", error);
    alert("Error connecting to database.");
  } finally {
    btn.innerText = "Save Event";
    btn.disabled = false;
  }
}

async function loadEvents() {
    const eventsList = document.getElementById("upcoming-events-list");
    eventsList.innerHTML = "<p style='font-size: 12px; color: #888;'>Loading events...</p>";
  
    try {
      const response = await fetch(`${SHEETDB_URL}?sheet=Events`);
      const data = await response.json();
  
      eventsList.innerHTML = ""; // Clear loading text
  
      // Filter to only show events that don't have a winner yet
      const activeEvents = data.filter(row => row.winner === "");
  
      if (activeEvents.length === 0) {
        eventsList.innerHTML = "<p style='font-size: 12px; color: #888;'>No upcoming events.</p>";
        return;
      }
  
      // Loop through the data and build a card for each event
      activeEvents.forEach((row, index) => {
        // Note: use the index or a unique ID to know which row to delete/update later
        const safeName = encodeURIComponent(row.event_name);
        const cardHTML = `
          <div class="event-card">
            <button class="delete-btn" onclick="deleteEvent('${safeName}')">
              <i class="fa-solid fa-trash"></i>
            </button>
            
            <div class="event-details">
              <h4>${row.event_name} <span class="points-badge">+${row.points_worth} pts</span></h4>
              <p>${row.date} @ ${row.time} (${row.timezone})</p>
            </div>
            
            <button class="claim-btn" onclick="claimPoints('${safeName}', ${row.points_worth}, this)">Claim</button>
          </div>
        `;
        eventsList.innerHTML += cardHTML;
      });
  
    } catch (error) {
      console.error("Error fetching events:", error);
      eventsList.innerHTML = "<p style='font-size: 12px; color: red;'>Failed to load events.</p>";
    }
  }
  
// --- DATABASE: DELETE EVENT ---
async function deleteEvent(eventName) {
    // Adds a safety check so you don't accidentally delete something
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) return;
  
    try {
      // Tells SheetDB to find the row where event_name matches, and delete it
      const response = await fetch(`${SHEETDB_URL}/event_name/${eventName}?sheet=Events`, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
      });
  
      if (response.ok) {
        loadEvents(); // Instantly reloads the dashboard to remove the card
      } else {
        alert("Failed to delete. Check your connection.");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }
  
  // --- DATABASE: CLAIM POINTS ---
  async function claimPoints(eventName, pointsWorth, btnElement) {
    // Verifies you are assigning the points to the person currently logged in
    if (!confirm(`Claim ${pointsWorth} points for ${currentSelectedProfile}?`)) return;
  
    // Visual feedback while the database updates
    btnElement.innerText = "Claiming...";
    btnElement.disabled = true;
  
    try {
      // STEP 1: Update the Events sheet to mark the as the winner
      await fetch(`${SHEETDB_URL}/event_name/${eventName}?sheet=Events`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: { winner: currentSelectedProfile } })
      });
  
      // STEP 2: Fetch the current score from the Scores tab
      const scoreRes = await fetch(`${SHEETDB_URL}/profile/${currentSelectedProfile}?sheet=Scores`);
      const scoreData = await scoreRes.json();
      
      let currentScore = 0;
      if (scoreData && scoreData.length > 0) {
        currentScore = parseInt(scoreData[0].score) || 0;
      }
      
      // Calculate the new total
      const newScore = currentScore + parseInt(pointsWorth);
  
      // STEP 3: Save the new total score back to the Scores tab
      await fetch(`${SHEETDB_URL}/profile/${currentSelectedProfile}?sheet=Scores`, {
        method: "PATCH",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: { score: newScore } })
      });
  
      // STEP 4: Refresh the UI to show the new score and remove the claimed event
      loadScores();
      loadEvents(); 
      
    } catch (error) {
      console.error("Error claiming points:", error);
      alert("Something went wrong updating the database.");
      btnElement.innerText = "Claim";
      btnElement.disabled = false;
    }
  }

  // --- CALCULATE OUR STATS ---
function updateStats(eventsData = []) {
  // 1. Calculate Days Apart starting from 12 Sep 2026
  const startDate = new Date("2026-09-12T00:00:00");
  const today = new Date();
  const diffTime = Math.max(0, today - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysElem = document.getElementById("stat-days-apart");
  if (daysElem) daysElem.innerText = diffDays;

  // 2. Count completed dates (events where winner is logged)
  const completedEvents = eventsData.filter(row => row.winner && row.winner.trim() !== "");
  const datesElem = document.getElementById("stat-dates-count");
  if (datesElem) datesElem.innerText = completedEvents.length;

  // 3. Count completed books (completed events matching "Book" or "Book Club")
  const completedBooks = completedEvents.filter(row => {
    const type = (row.event_type || "").toLowerCase();
    const name = (row.event_name || "").toLowerCase();
    return type.includes("book") || name.includes("book") || type.includes("read");
  });

  const booksElem = document.getElementById("stat-books-count");
  if (booksElem) booksElem.innerText = completedBooks.length;
}