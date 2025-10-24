// Data structure and initialization
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
let currentDay = "Sunday"
let defaultSchedules = {}
let tempSchedules = {}
let editingId = null
let editingIsTemp = false

// Initialize app
function init() {
  loadSchedules()
  setupEventListeners()
  renderSchedule()
  setDefaultDate()
  handleResize()
  window.addEventListener("resize", handleResize)
}

// Set date matching the selected day
function setDefaultDate() {
  const dateInput = document.getElementById('date')
  const today = new Date()
  
  // Find the next occurrence of the selected day
  const currentDayIndex = today.getDay()
  const targetDayIndex = DAYS.indexOf(currentDay)
  const daysUntilTarget = (targetDayIndex + 7 - currentDayIndex) % 7
  
  // Set date to the next occurrence of the selected day
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + daysUntilTarget)
  
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  dateInput.value = `${year}-${month}-${day}`
}

// Load schedules from localStorage
function loadSchedules() {
  try {
    const stored = localStorage.getItem("defaultSchedules");
    if (stored) {
      defaultSchedules = JSON.parse(stored);
    } else {
      DAYS.forEach((day) => {
        defaultSchedules[day] = [];
      });
      saveDefaultSchedules();
    }

    const tempStored = localStorage.getItem("tempSchedules");
    if (tempStored) {
      tempSchedules = JSON.parse(tempStored);
    } else {
      DAYS.forEach((day) => {
        tempSchedules[day] = [];
      });
    }
  } catch (error) {
    console.error("Failed to load schedules from local storage:", error);
    showFeedback("Could not load schedules. Please check your browser settings.", "error");
  }
}

// Save default schedules
function saveDefaultSchedules() {
  try {
    localStorage.setItem("defaultSchedules", JSON.stringify(defaultSchedules));
  } catch (error) {
    console.error("Failed to save default schedules to local storage:", error);
    showFeedback("Could not save default schedule. Your changes may not be saved.", "error");
  }
}

// Save temp schedules
function saveTempSchedules() {
  try {
    localStorage.setItem("tempSchedules", JSON.stringify(tempSchedules));
  } catch (error) {
    console.error("Failed to save temporary schedules to local storage:", error);
    showFeedback("Could not save temporary schedule. Your changes may not be saved.", "error");
  }
}

// Get current schedule (temp overrides default)
function getCurrentSchedule(day) {
  if (tempSchedules[day] && tempSchedules[day].length > 0) {
    return tempSchedules[day]
  }
  return defaultSchedules[day] || []
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
      e.target.classList.add("active")
      currentDay = e.target.dataset.day
      cancelEdit()
      renderSchedule()
      setDefaultDate() // Update date when day changes
    })
  })

  // Form submission
  document.getElementById("classForm").addEventListener("submit", handleAddClass)

  document.getElementById("copyBtn").addEventListener("click", handleCopy)

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", handleReset)

  document.getElementById("cancelBtn").addEventListener("click", cancelEdit)

  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

function handleEditClass(id, isTemp) {
  const schedule = isTemp ? tempSchedules[currentDay] : defaultSchedules[currentDay]
  const classItem = schedule.find((c) => c.id === id)

  if (!classItem) return

  // Populate form with class data
  document.getElementById("course").value = classItem.course
  document.getElementById("instructor").value = classItem.instructor
  document.getElementById("room").value = classItem.room
  document.getElementById("building").value = classItem.building
  document.getElementById("startTime").value = classItem.startTime
  document.getElementById("endTime").value = classItem.endTime
  document.getElementById("date").value = classItem.date || ""
  document.getElementById("tempOnly").checked = classItem.tempOnly

  // Set editing state
  editingId = id
  editingIsTemp = isTemp

  // Update UI
  document.getElementById("formTitle").textContent = "Edit Class"
  document.getElementById("submitBtn").textContent = "Update Class"
  document.getElementById("cancelBtn").style.display = "inline-flex"

  // Scroll to form
  document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" })
}

function cancelEdit() {
  editingId = null
  editingIsTemp = false
  document.getElementById("classForm").reset()
  document.getElementById("formTitle").textContent = "Add Class"
  document.getElementById("submitBtn").textContent = "Add Class"
  document.getElementById("cancelBtn").style.display = "none"
  setDefaultDate() // Reset date to today after canceling
}

// Handle add/update class
function handleAddClass(e) {
  e.preventDefault()

  const course = document.getElementById("course").value
  const instructor = document.getElementById("instructor").value
  const room = document.getElementById("room").value
  const building = document.getElementById("building").value
  const startTime = document.getElementById("startTime").value
  const endTime = document.getElementById("endTime").value
  const date = document.getElementById("date").value
  const tempOnly = document.getElementById("tempOnly").checked

  if (!course || !instructor || !room || !building || !startTime || !endTime) {
    alert("Please fill in all required fields")
    return
  }

  // Validate that the selected date matches the current day
  if (date) {
    const selectedDate = new Date(date)
    const dayOfWeek = DAYS[selectedDate.getDay()]
    if (dayOfWeek !== currentDay) {
      alert(`The selected date (${date}) is a ${dayOfWeek}. Please select a date that falls on ${currentDay}.`)
      return
    }
  }

  if (editingId) {
    const schedule = editingIsTemp ? tempSchedules[currentDay] : defaultSchedules[currentDay]
    const classItem = schedule.find((c) => c.id === editingId)

    if (classItem) {
      classItem.course = course
      classItem.instructor = instructor
      classItem.room = room
      classItem.building = building
      classItem.startTime = startTime
      classItem.endTime = endTime
      classItem.date = date
      classItem.tempOnly = tempOnly

      if (editingIsTemp) {
        saveTempSchedules()
      } else {
        saveDefaultSchedules()
      }
    }

    cancelEdit()
  } else {
    const newClass = {
      id: Date.now(),
      course,
      instructor,
      room,
      building,
      startTime,
      endTime,
      date,
      tempOnly,
    }

    if (tempOnly) {
      if (!tempSchedules[currentDay]) {
        tempSchedules[currentDay] = [];
      }
      tempSchedules[currentDay].push(newClass);
      saveTempSchedules();
    } else {
      if (!defaultSchedules[currentDay]) {
        defaultSchedules[currentDay] = [];
      }
      defaultSchedules[currentDay].push(newClass);
      saveDefaultSchedules();
    }

    document.getElementById("classForm").reset();
    setDefaultDate(); // Reset date to the default for the current day
  }

  renderSchedule();

  // Scroll to the newly added/updated class
  setTimeout(() => {
    const classId = editingId || (newClass && newClass.id);
    if (classId) {
      const classCard = document.querySelector(`[data-class-id="${classId}"]`);
      if (classCard) {
        classCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    editingId = null; // Reset editingId after scrolling
  }, 100);
}

// Handle delete class
function handleDeleteClass(id, isTemp) {
  const schedule = isTemp ? tempSchedules[currentDay] : defaultSchedules[currentDay]
  const index = schedule.findIndex((c) => c.id === id)
  if (index > -1) {
    schedule.splice(index, 1)
    if (isTemp) {
      saveTempSchedules()
    } else {
      saveDefaultSchedules()
    }
    renderSchedule()
  }
}

// Render schedule for current day
function renderSchedule() {
  const classList = document.getElementById("classList")
  const dayTitle = document.getElementById("dayTitle")
  dayTitle.textContent = currentDay

  const schedule = getCurrentSchedule(currentDay)

  if (schedule.length === 0) {
    classList.innerHTML = '<div class="empty-message"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><p>No classes scheduled for this day. Enjoy your free time!</p></div>';
    return;
  }

  // Sort by start time
  const sorted = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime))

  classList.innerHTML = sorted
    .map((cls) => {
      const isTemp = tempSchedules[currentDay]?.some((c) => c.id === cls.id)
      return `
            <div class="class-card" data-class-id="${cls.id}">
                <div class="class-info">
                    <div class="class-time">${cls.startTime} - ${cls.endTime}</div>
                    <div class="class-course">${cls.course}</div>
                    <div class="class-details">
                        <div><strong>Instructor:</strong> ${cls.instructor}</div>
                        <div><strong>Room:</strong> ${cls.room} | <strong>Building:</strong> ${cls.building}</div>
                        ${cls.date ? `<div><strong>Date:</strong> ${cls.date}</div>` : ""}
                    </div>
                    ${isTemp ? '<div class="class-temp-badge">Temporary (Today Only)</div>' : ""}
                </div>
                <div class="class-actions">
                    <!-- Added edit button -->
                    <button class="btn btn-edit" onclick="handleEditClass(${cls.id}, ${isTemp})">Edit</button>
                    <button class="btn btn-danger" onclick="handleDeleteClass(${cls.id}, ${isTemp})">Delete</button>
                </div>
            </div>
        `
    })
    .join("")
}

function handleCopy() {
  const schedule = getCurrentSchedule(currentDay);

  if (schedule.length === 0) {
    showFeedback("No classes to copy for this day", "error");
    return;
  }

  // Sort by start time
  const sorted = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Get the date for formatting
  const dateValue = document.getElementById('date').value;
  const dateObj = dateValue ? new Date(dateValue) : new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  // Generate formatted text
  let formattedText = `${formattedDate}\n`;
  formattedText += "Tomorrow's class schedule:\n\n";

  sorted.forEach((cls) => {
    const courseName = cls.course.split('-')[1] || cls.course;
    const instructorName = cls.instructor.split('.')[1]?.trim() || cls.instructor;
    formattedText += `⭕️${courseName}--`;
    formattedText += `(${formatTime(cls.startTime)}-${formatTime(cls.endTime)})--`;
    formattedText += `${instructorName}--`;
    formattedText += `(${cls.room}-${cls.building})\n\n`;
    formattedText += `AMAT2101 -> Advanced Calculus\n`;
    formattedText += `AMAT2102 -> Geometry of Three Dimensions\n`;
    formattedText += `AMAT2103 -> Ordinary Differential Equations with Modeling\n`;
    formattedText += `MAT2104 -> Tensor Analysis\n`;
    formattedText += `PHYS2111 -> Heat and Thermodynamics\n`;
    formattedText += `STAT2112 -> Sample Survey and Demography\n`;
    formattedText += `AMAT2120 -> Practical (Using MATLAB)\n`;
  });

  // Copy to clipboard
  navigator.clipboard
    .writeText(formattedText)
    .then(() => {
      showFeedback(`${currentDay}'s schedule copied to clipboard!`);
    })
    .catch(() => {
      showFeedback("Failed to copy to clipboard", "error");
    });
}

function showFeedback(message, type = "success") {
  const feedbackEl = document.createElement("div");
  feedbackEl.classList.add("feedback", `feedback--${type}`);
  feedbackEl.textContent = message;
  document.body.appendChild(feedbackEl);

  setTimeout(() => {
    feedbackEl.remove();
  }, 3000);
}

// Handle reset
// Helper function to format time from 24h to 12h format with AM/PM
function formatTime(time24h) {
  const [hours, minutes] = time24h.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour}:${minutes} ${ampm}`
}

function handleReset() {
  if (confirm("Are you sure you want to reset to the default schedule? This will remove all temporary changes.")) {
    tempSchedules = {}
    DAYS.forEach((day) => {
      tempSchedules[day] = []
    })
    saveTempSchedules()
    cancelEdit()
    renderSchedule()
  }
}

function handleResize() {
  const body = document.body;
  if (window.innerWidth < 768) {
    body.classList.add("is-mobile");
  } else {
    body.classList.remove("is-mobile");
  }
}

// Start app
init()
