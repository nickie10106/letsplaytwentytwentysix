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

// --- FORM NAVIGATION ---
function toggleAddScreen() {
  closeAllForms();
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

function openAddForm(type) {
  document.getElementById("choose-date-view").classList.add("hidden");
  document.getElementById("choose-date-view").classList.remove("active");

  if (type === 'book') {
    document.getElementById("add-book-view").classList.remove("hidden");
    document.getElementById("add-book-view").classList.add("active");
  } else if (type === 'comp') {
    document.getElementById("add-comp-view").classList.remove("hidden");
    document.getElementById("add-comp-view").classList.add("active");
  } else if (type === 'event') {
    document.getElementById("add-event-view").classList.remove("hidden");
    document.getElementById("add-event-view").classList.add("active");
  }
}

function closeAllForms() {
  const formViews = ["choose-date-view", "add-book-view", "add-comp-view", "add-event-view"];
  formViews.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.classList.add("hidden");
      elem.classList.remove("active");
    }
  });

  const mainView = document.getElementById("main-view");
  if (mainView) {
    mainView.classList.remove("hidden");
    mainView.classList.add("active");
  }
}

// Auto-populate time 
// Calculates the exact hour difference between London and Singapore for a given date
function getUktToSgtOffset(dateStr) {
  if (!dateStr) return 7; // Default to BST (+7h) if no date is picked yet
  
  const [y, m, d] = dateStr.split('-').map(Number);
  const testDate = new Date(y, m - 1, d);

  try {
    const londonHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/London', hour: 'numeric', hour12: false }).format(testDate));
    const sgHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false }).format(testDate));
    return (sgHour - londonHour + 24) % 24 || 7;
  } catch (e) {
    return 7;
  }
}

// Typing or picking UKT auto-fills SGT
function syncTimeFromUKT(prefix) {
  const dateVal = document.getElementById(`${prefix}-date`)?.value;
  const uktElem = document.getElementById(`${prefix}-time-ukt`);
  const sgtElem = document.getElementById(`${prefix}-time-sgt`);

  if (!uktElem || !sgtElem || !uktElem.value) return;

  const offset = getUktToSgtOffset(dateVal);
  const [hours, mins] = uktElem.value.split(':').map(Number);
  
  const sgtHours = (hours + offset) % 24;
  sgtElem.value = `${String(sgtHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Typing or picking SGT auto-fills UKT
function syncTimeFromSGT(prefix) {
  const dateVal = document.getElementById(`${prefix}-date`)?.value;
  const uktElem = document.getElementById(`${prefix}-time-ukt`);
  const sgtElem = document.getElementById(`${prefix}-time-sgt`);

  if (!uktElem || !sgtElem || !sgtElem.value) return;

  const offset = getUktToSgtOffset(dateVal);
  const [hours, mins] = sgtElem.value.split(':').map(Number);
  
  const uktHours = (hours - offset + 24) % 24;
  uktElem.value = `${String(uktHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}


// Convert 24h string to 12h AM/PM
function format12Hour(timeStr) {
  if (!timeStr) return "";
  let [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ampm}`;
}

// Convert YYYY-MM-DD to "2nd November 2026"
function formatHumanDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
  return `${getOrdinal(day)} ${monthName} ${year}`;
}

// SAVE DATA TO SHEETDB
async function saveNewActivity(e, eventType) {
  e.preventDefault();

  let name = "", date = "", uktTime = "", points = 0;

  if (eventType === 'Book Club') {
    name = document.getElementById("book-name").value;
    date = document.getElementById("book-date").value;
    uktTime = document.getElementById("book-time-ukt").value;
  } else if (eventType === 'Competition') {
    name = document.getElementById("comp-name").value;
    date = document.getElementById("comp-date").value;
    uktTime = document.getElementById("comp-time-ukt").value;
    points = document.getElementById("comp-points").value;
  } else {
    name = document.getElementById("event-name").value;
    date = document.getElementById("event-date").value;
    uktTime = document.getElementById("event-time-ukt").value;
  }

  const newRowData = {
    date: date,
    time: uktTime,
    timezone: "LON",
    event_name: name,
    event_type: eventType,
    points_worth: points || 0,
    winner: ""
  };

  try {
    const response = await fetch(`${SHEETDB_URL}?sheet=Events`, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ data: [newRowData] })
    });

    if (response.ok) {
      closeAllForms();
      loadEvents();
    } else {
      alert("Error saving activity.");
    }
  } catch (err) {
    console.error(err);
    alert("Connection error.");
  }
}

// DISPLAY UPCOMING EVENTS (Matches Screenshot 18)
async function loadEvents() {
  const eventsList = document.getElementById("upcoming-events-list");
  if (!eventsList) return;

  try {
    const response = await fetch(`${SHEETDB_URL}?sheet=Events`);
    const data = await response.json();

    updateStats(data);
    eventsList.innerHTML = "";

    const activeEvents = data.filter(row => !row.winner || row.winner.trim() === "");

    if (activeEvents.length === 0) {
      eventsList.innerHTML = "<p style='font-size: 12px; color: #888;'>No upcoming events.</p>";
      return;
    }

    activeEvents.forEach((row) => {
      const safeName = encodeURIComponent(row.event_name);
      const isBook = (row.event_type || "").toLowerCase().includes("book");
      const actionLabel = isBook ? "Review" : "Claim";
      
      const humanDate = formatHumanDate(row.date);

      // Derive UKT and SGT times
      let uktTimeFormatted = "";
      let sgtTimeFormatted = "";
      if (row.time) {
        const [h, m] = row.time.split(':').map(Number);
        uktTimeFormatted = format12Hour(row.time);
        const sgtH = (h + 7) % 24;
        sgtTimeFormatted = format12Hour(`${sgtH}:${m}`);
      }

      const cardHTML = `
        <div class="event-card">
          <button class="delete-btn" onclick="deleteEvent('${safeName}')">
            <i class="fa-solid fa-trash"></i>
          </button>
          
          <div class="event-card-left">
            <h4>${row.event_name}</h4>
            <div class="event-date-text">${humanDate}</div>
            <div class="tz-container">
              <span class="tz-badge tz-ukt">${uktTimeFormatted} UKT</span>
              <span class="tz-badge tz-sgt">${sgtTimeFormatted} SGT</span>
            </div>
          </div>
          
          <div class="event-card-right">
            <button class="claim-btn" onclick="claimPoints('${safeName}', ${row.points_worth}, this)">${actionLabel}</button>
            <i class="fa-solid fa-pen-to-square edit-icon" onclick="openEditEvent()"></i>
          </div>
        </div>
      `;
      eventsList.innerHTML += cardHTML;
    });

  } catch (error) {
    console.error("Error fetching events:", error);
    eventsList.innerHTML = "<p style='font-size: 12px; color: red;'>Failed to load events.</p>";
  }
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
  const startDate = new Date(2026, 8, 2);
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