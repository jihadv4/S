document.addEventListener("DOMContentLoaded", () => {
  // Form elements
  const courseSelect = document.getElementById("course")
  const sirSelect = document.getElementById("sir")
  const roomSelect = document.getElementById("room")
  const buildingSelect = document.getElementById("building")
  const dateInput = document.getElementById("date")
  const startTimeInput = document.getElementById("start-time")
  const endTimeInput = document.getElementById("end-time")

  // Buttons
  const addClassButton = document.getElementById("add-class")
  const resetFormButton = document.getElementById("reset-form")
  const updateClassButton = document.getElementById("update-class")
  const cancelEditButton = document.getElementById("cancel-edit")
  const copyScheduleButton = document.getElementById("copy-schedule")
  const clearAllButton = document.getElementById("clear-all")

  // Display elements
  const scheduleList = document.getElementById("schedule-list")
  const outputText = document.getElementById("output-text")
  const formFeedback = document.getElementById("form-feedback")
  const notification = document.getElementById("success-notification")
  const notificationMessage = document.getElementById("notification-message")

  // Validation message elements
  const courseValidation = document.getElementById("course-validation")
  const sirValidation = document.getElementById("sir-validation")
  const roomValidation = document.getElementById("room-validation")
  const buildingValidation = document.getElementById("building-validation")
  const dateValidation = document.getElementById("date-validation")
  const startTimeValidation = document.getElementById("start-time-validation")
  const endTimeValidation = document.getElementById("end-time-validation")

  // Store all scheduled classes
  let classes = []
  let editingIndex = -1
  let draggedItem = null

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]
  dateInput.min = today

  // Format date for display
  function formatDate(dateString) {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format time for display
  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(Number.parseInt(hours, 10))
    date.setMinutes(Number.parseInt(minutes, 10))

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Check if there's a time conflict with existing classes
  function hasTimeConflict(newClass, excludeIndex = -1) {
    return classes.some((existingClass, index) => {
      // Skip the class being edited
      if (index === excludeIndex) {
        return false
      }

      // Only check conflicts for the same date
      if (existingClass.date !== newClass.date) {
        return false
      }

      const newStart = new Date(`2000-01-01T${newClass.startTime}`)
      const newEnd = new Date(`2000-01-01T${newClass.endTime}`)
      const existingStart = new Date(`2000-01-01T${existingClass.startTime}`)
      const existingEnd = new Date(`2000-01-01T${existingClass.endTime}`)

      // Check if the new class overlaps with an existing class
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      )
    })
  }

  // Show notification
  function showNotification(message) {
    notificationMessage.textContent = message
    notification.classList.add("show")

    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  // Show form feedback
  function showFormFeedback(message, type) {
    formFeedback.textContent = message
    formFeedback.className = "form-feedback"
    formFeedback.classList.add(type)

    setTimeout(() => {
      formFeedback.style.display = "none"
      formFeedback.className = "form-feedback"
    }, 3000)
  }

  // Generate formatted output
  function generateFormattedOutput() {
    if (classes.length === 0) {
      outputText.textContent = "No classes scheduled yet."
      return
    }

    // Group classes by date
    const classesByDate = {}
    classes.forEach((cls) => {
      if (!classesByDate[cls.date]) {
        classesByDate[cls.date] = []
      }
      classesByDate[cls.date].push(cls)
    })

    let output = ""

    // Generate output for each date
    for (const date in classesByDate) {
      const dateClasses = classesByDate[date]
      const formattedDate = formatDate(date)

      output += `${formattedDate}\n`
      output += "Tomorrow's class schedule:\n\n"

      dateClasses.forEach((cls) => {
        output += `⭕️${cls.course}--(${formatTime(cls.startTime)}-${formatTime(cls.endTime)})--${cls.sir}--(${cls.room}-${cls.building})\n`
      })

      output += "\n\n"
    }

    outputText.textContent = output.trim()
  }

  // Render the schedule
  function renderSchedule() {
    scheduleList.innerHTML = ""

    if (classes.length === 0) {
      scheduleList.innerHTML = "<p>No classes scheduled yet.</p>"
      generateFormattedOutput()
      return
    }

    // Sort classes by date and start time
    classes.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date)
      }
      return a.startTime.localeCompare(b.startTime)
    })

    // Group classes by date
    const classesByDate = {}
    classes.forEach((cls) => {
      if (!classesByDate[cls.date]) {
        classesByDate[cls.date] = []
      }
      classesByDate[cls.date].push(cls)
    })

    // Render classes grouped by date
    for (const date in classesByDate) {
      const dateClasses = classesByDate[date]
      const dateHeader = document.createElement("h3")
      dateHeader.textContent = formatDate(date)
      scheduleList.appendChild(dateHeader)

      dateClasses.forEach((cls, index) => {
        const classItem = document.createElement("div")
        classItem.className = "class-item"
        classItem.draggable = true
        classItem.dataset.index = classes.indexOf(cls)

        // Drag and drop event listeners
        classItem.addEventListener("dragstart", handleDragStart)
        classItem.addEventListener("dragend", handleDragEnd)
        classItem.addEventListener("dragover", handleDragOver)
        classItem.addEventListener("dragenter", handleDragEnter)
        classItem.addEventListener("dragleave", handleDragLeave)
        classItem.addEventListener("drop", handleDrop)

        const classTitle = document.createElement("h3")
        classTitle.innerHTML = `
          <span class="drag-handle">&#9776;</span>
          ${cls.course}
        `

        const classDetails = document.createElement("div")
        classDetails.className = "class-details"

        classDetails.innerHTML = `
          <p><strong>Instructor:</strong> ${cls.sir}</p>
          <p><strong>Location:</strong> Room ${cls.room}, ${cls.building}</p>
          <p><strong>Time:</strong> ${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}</p>
          <p><strong>Date:</strong> ${formatDate(cls.date)}</p>
        `

        const classActions = document.createElement("div")
        classActions.className = "class-actions"

        const editButton = document.createElement("button")
        editButton.className = "action-btn edit-btn"
        editButton.textContent = "Edit"
        editButton.addEventListener("click", () => {
          editClass(classes.indexOf(cls))
        })

        const deleteButton = document.createElement("button")
        deleteButton.className = "action-btn delete-btn"
        deleteButton.textContent = "Delete"
        deleteButton.addEventListener("click", () => {
          deleteClass(classes.indexOf(cls))
        })

        classActions.appendChild(editButton)
        classActions.appendChild(deleteButton)

        classItem.appendChild(classTitle)
        classItem.appendChild(classDetails)
        classItem.appendChild(classActions)

        scheduleList.appendChild(classItem)
      })
    }

    generateFormattedOutput()
  }

  // Validate form
  function validateForm() {
    let isValid = true

    // Course validation
    if (!courseSelect.value) {
      courseValidation.textContent = "Please select a course"
      courseSelect.parentElement.classList.add("invalid")
      isValid = false
    } else {
      courseValidation.textContent = ""
      courseSelect.parentElement.classList.remove("invalid")
      courseSelect.parentElement.classList.add("valid")
    }

    // Instructor validation
    if (!sirSelect.value) {
      sirValidation.textContent = "Please select an instructor"
      sirSelect.parentElement.classList.add("invalid")
      isValid = false
    } else {
      sirValidation.textContent = ""
      sirSelect.parentElement.classList.remove("invalid")
      sirSelect.parentElement.classList.add("valid")
    }

    // Room validation
    if (!roomSelect.value) {
      roomValidation.textContent = "Please select a room"
      roomSelect.parentElement.classList.add("invalid")
      isValid = false
    } else {
      roomValidation.textContent = ""
      roomSelect.parentElement.classList.remove("invalid")
      roomSelect.parentElement.classList.add("valid")
    }

    // Building validation
    if (!buildingSelect.value) {
      buildingValidation.textContent = "Please select a building"
      buildingSelect.parentElement.classList.add("invalid")
      isValid = false
    } else {
      buildingValidation.textContent = ""
      buildingSelect.parentElement.classList.remove("invalid")
      buildingSelect.parentElement.classList.add("valid")
    }

    // Date validation
    if (!dateInput.value) {
      dateValidation.textContent = "Please select a date"
      dateInput.parentElement.classList.add("invalid")
      isValid = false
    } else {
      const selectedDate = new Date(dateInput.value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        dateValidation.textContent = "Date cannot be in the past"
        dateInput.parentElement.classList.add("invalid")
        isValid = false
      } else {
        dateValidation.textContent = ""
        dateInput.parentElement.classList.remove("invalid")
        dateInput.parentElement.classList.add("valid")
      }
    }

    // Start time validation
    if (!startTimeInput.value) {
      startTimeValidation.textContent = "Please select a start time"
      startTimeInput.parentElement.classList.add("invalid")
      isValid = false
    } else {
      startTimeValidation.textContent = ""
      startTimeInput.parentElement.classList.remove("invalid")
      startTimeInput.parentElement.classList.add("valid")
    }

    // End time validation
    if (!endTimeInput.value) {
      endTimeValidation.textContent = "Please select an end time"
      endTimeInput.parentElement.classList.add("invalid")
      isValid = false
    } else if (startTimeInput.value && startTimeInput.value >= endTimeInput.value) {
      endTimeValidation.textContent = "End time must be after start time"
      endTimeInput.parentElement.classList.add("invalid")
      isValid = false
    } else {
      endTimeValidation.textContent = ""
      endTimeInput.parentElement.classList.remove("invalid")
      endTimeInput.parentElement.classList.add("valid")
    }

    return isValid
  }

  // Real-time validation
  function setupRealTimeValidation() {
    // Course validation
    courseSelect.addEventListener("change", () => {
      if (!courseSelect.value) {
        courseValidation.textContent = "Please select a course"
        courseSelect.parentElement.classList.add("invalid")
        courseSelect.parentElement.classList.remove("valid")
      } else {
        courseValidation.textContent = ""
        courseSelect.parentElement.classList.remove("invalid")
        courseSelect.parentElement.classList.add("valid")
      }
    })

    // Instructor validation
    sirSelect.addEventListener("change", () => {
      if (!sirSelect.value) {
        sirValidation.textContent = "Please select an instructor"
        sirSelect.parentElement.classList.add("invalid")
        sirSelect.parentElement.classList.remove("valid")
      } else {
        sirValidation.textContent = ""
        sirSelect.parentElement.classList.remove("invalid")
        sirSelect.parentElement.classList.add("valid")
      }
    })

    // Room validation
    roomSelect.addEventListener("change", () => {
      if (!roomSelect.value) {
        roomValidation.textContent = "Please select a room"
        roomSelect.parentElement.classList.add("invalid")
        roomSelect.parentElement.classList.remove("valid")
      } else {
        roomValidation.textContent = ""
        roomSelect.parentElement.classList.remove("invalid")
        roomSelect.parentElement.classList.add("valid")
      }
    })

    // Building validation
    buildingSelect.addEventListener("change", () => {
      if (!buildingSelect.value) {
        buildingValidation.textContent = "Please select a building"
        buildingSelect.parentElement.classList.add("invalid")
        buildingSelect.parentElement.classList.remove("valid")
      } else {
        buildingValidation.textContent = ""
        buildingSelect.parentElement.classList.remove("invalid")
        buildingSelect.parentElement.classList.add("valid")
      }
    })

    // Date validation
    dateInput.addEventListener("change", () => {
      if (!dateInput.value) {
        dateValidation.textContent = "Please select a date"
        dateInput.parentElement.classList.add("invalid")
        dateInput.parentElement.classList.remove("valid")
      } else {
        const selectedDate = new Date(dateInput.value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
          dateValidation.textContent = "Date cannot be in the past"
          dateInput.parentElement.classList.add("invalid")
          dateInput.parentElement.classList.remove("valid")
        } else {
          dateValidation.textContent = ""
          dateInput.parentElement.classList.remove("invalid")
          dateInput.parentElement.classList.add("valid")
        }
      }
    })

    // Start time validation
    startTimeInput.addEventListener("change", () => {
      if (!startTimeInput.value) {
        startTimeValidation.textContent = "Please select a start time"
        startTimeInput.parentElement.classList.add("invalid")
        startTimeInput.parentElement.classList.remove("valid")
      } else {
        startTimeValidation.textContent = ""
        startTimeInput.parentElement.classList.remove("invalid")
        startTimeInput.parentElement.classList.add("valid")

        // Also validate end time if it exists
        if (endTimeInput.value) {
          if (startTimeInput.value >= endTimeInput.value) {
            endTimeValidation.textContent = "End time must be after start time"
            endTimeInput.parentElement.classList.add("invalid")
            endTimeInput.parentElement.classList.remove("valid")
          } else {
            endTimeValidation.textContent = ""
            endTimeInput.parentElement.classList.remove("invalid")
            endTimeInput.parentElement.classList.add("valid")
          }
        }
      }
    })

    // End time validation
    endTimeInput.addEventListener("change", () => {
      if (!endTimeInput.value) {
        endTimeValidation.textContent = "Please select an end time"
        endTimeInput.parentElement.classList.add("invalid")
        endTimeInput.parentElement.classList.remove("valid")
      } else if (startTimeInput.value && startTimeInput.value >= endTimeInput.value) {
        endTimeValidation.textContent = "End time must be after start time"
        endTimeInput.parentElement.classList.add("invalid")
        endTimeInput.parentElement.classList.remove("valid")
      } else {
        endTimeValidation.textContent = ""
        endTimeInput.parentElement.classList.remove("invalid")
        endTimeInput.parentElement.classList.add("valid")
      }
    })

    // Add focus/blur effects for visual feedback
    const formInputs = document.querySelectorAll("select, input")
    formInputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("active")
      })

      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("active")
      })
    })
  }

  // Add class
  function addClass() {
    if (!validateForm()) {
      return
    }

    // Create new class object
    const newClass = {
      course: courseSelect.value,
      sir: sirSelect.value,
      room: roomSelect.value,
      building: buildingSelect.value,
      date: dateInput.value,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
    }

    // Check for time conflicts
    if (hasTimeConflict(newClass)) {
      showFormFeedback("Time conflict with an existing class. Please choose a different time.", "error")
      return
    }

    // Add to classes array
    classes.push(newClass)

    // Show success message
    showFormFeedback("Class added successfully!", "success")
    showNotification("Class added successfully!")

    // Add pulse animation to the schedule container
    document.querySelector(".schedule-container").classList.add("pulse")
    setTimeout(() => {
      document.querySelector(".schedule-container").classList.remove("pulse")
    }, 500)

    // Reset form
    resetForm()

    // Render updated schedule
    renderSchedule()
  }

  // Edit class
  function editClass(index) {
    editingIndex = index
    const classToEdit = classes[index]

    // Fill form with class data
    courseSelect.value = classToEdit.course
    sirSelect.value = classToEdit.sir
    roomSelect.value = classToEdit.room
    buildingSelect.value = classToEdit.building
    dateInput.value = classToEdit.date
    startTimeInput.value = classToEdit.startTime
    endTimeInput.value = classToEdit.endTime

    // Validate all fields
    validateForm()

    // Show update and cancel buttons, hide add button
    addClassButton.style.display = "none"
    updateClassButton.style.display = "block"
    cancelEditButton.style.display = "block"

    // Highlight the class being edited
    const classItems = document.querySelectorAll(".class-item")
    classItems.forEach((item) => {
      if (Number.parseInt(item.dataset.index) === index) {
        item.classList.add("editing")
      }
    })

    // Scroll to form
    document.querySelector(".scheduler-form").scrollIntoView({ behavior: "smooth" })
  }

  // Update class
  function updateClass() {
    if (!validateForm()) {
      return
    }

    // Create updated class object
    const updatedClass = {
      course: courseSelect.value,
      sir: sirSelect.value,
      room: roomSelect.value,
      building: buildingSelect.value,
      date: dateInput.value,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
    }

    // Check for time conflicts (excluding the class being edited)
    if (hasTimeConflict(updatedClass, editingIndex)) {
      showFormFeedback("Time conflict with an existing class. Please choose a different time.", "error")
      return
    }

    // Update class in array
    classes[editingIndex] = updatedClass

    // Show success message
    showFormFeedback("Class updated successfully!", "success")
    showNotification("Class updated successfully!")

    // Reset form and editing state
    resetForm()
    cancelEdit()

    // Render updated schedule
    renderSchedule()
  }

  // Delete class
  function deleteClass(index) {
    // Remove class from array
    classes.splice(index, 1)

    // Show notification
    showNotification("Class deleted successfully!")

    // Render updated schedule
    renderSchedule()
  }

  // Reset form
  function resetForm() {
    courseSelect.selectedIndex = 0
    sirSelect.selectedIndex = 0
    roomSelect.selectedIndex = 0
    buildingSelect.selectedIndex = 0
    dateInput.value = ""
    startTimeInput.value = ""
    endTimeInput.value = ""

    // Reset validation states
    const formGroups = document.querySelectorAll(".form-group")
    formGroups.forEach((group) => {
      group.classList.remove("valid", "invalid")
    })

    const validationMessages = document.querySelectorAll(".validation-message")
    validationMessages.forEach((message) => {
      message.textContent = ""
    })
  }

  // Cancel edit
  function cancelEdit() {
    editingIndex = -1

    // Show add button, hide update and cancel buttons
    addClassButton.style.display = "block"
    updateClassButton.style.display = "none"
    cancelEditButton.style.display = "none"

    // Remove highlighting from all class items
    const classItems = document.querySelectorAll(".class-item")
    classItems.forEach((item) => {
      item.classList.remove("editing")
    })
  }

  // Copy schedule to clipboard
  function copySchedule() {
    if (classes.length === 0) {
      showNotification("No schedule to copy!")
      return
    }

    navigator.clipboard
      .writeText(outputText.textContent)
      .then(() => {
        showNotification("Schedule copied to clipboard!")
      })
      .catch((err) => {
        showNotification("Failed to copy schedule!")
        console.error("Failed to copy: ", err)
      })
  }

  // Clear all classes
  function clearAllClasses() {
    if (classes.length === 0) {
      showNotification("No classes to clear!")
      return
    }

    if (confirm("Are you sure you want to clear all classes?")) {
      classes = []
      renderSchedule()
      showNotification("All classes cleared!")
    }
  }

  // Drag and drop handlers

  function handleDragStart(e) {
    draggedItem = this
    this.classList.add("dragging")

    // Set data for drag operation
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", this.dataset.index)

    // Create a ghost image
    const ghostElement = this.cloneNode(true)
    ghostElement.style.opacity = "0.5"
    document.body.appendChild(ghostElement)
    e.dataTransfer.setDragImage(ghostElement, 0, 0)

    // Remove ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement)
    }, 0)
  }

  function handleDragEnd() {
    this.classList.remove("dragging")
    draggedItem = null

    // Remove all drag placeholders
    const placeholders = document.querySelectorAll(".drag-placeholder")
    placeholders.forEach((placeholder) => placeholder.remove())
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  function handleDragEnter(e) {
    e.preventDefault()

    // Only add placeholder if this is not the dragged item
    if (this !== draggedItem) {
      // Remove existing placeholders
      const existingPlaceholders = document.querySelectorAll(".drag-placeholder")
      existingPlaceholders.forEach((placeholder) => placeholder.remove())

      // Create placeholder
      const placeholder = document.createElement("div")
      placeholder.className = "drag-placeholder"

      // Insert placeholder before or after the current item
      const rect = this.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2

      if (e.clientY < midpoint) {
        this.parentNode.insertBefore(placeholder, this)
      } else {
        this.parentNode.insertBefore(placeholder, this.nextSibling)
      }
    }
  }

  function handleDragLeave() {
    // We'll handle placeholder removal in dragEnter and drop
  }

  function handleDrop(e) {
    e.preventDefault()

    // Remove all placeholders
    const placeholders = document.querySelectorAll(".drag-placeholder")
    placeholders.forEach((placeholder) => placeholder.remove())

    // Get the dragged item's index
    const draggedIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))

    // Only proceed if we're not dropping onto the same item
    if (this !== draggedItem) {
      // Get the target index
      const targetIndex = Number.parseInt(this.dataset.index)

      // Determine if we're dropping before or after the target
      const rect = this.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      let newIndex

      if (e.clientY < midpoint) {
        // Dropping before the target
        newIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
      } else {
        // Dropping after the target
        newIndex = targetIndex < draggedIndex ? targetIndex + 1 : targetIndex
      }

      // Reorder the classes array
      const movedClass = classes.splice(draggedIndex, 1)[0]
      classes.splice(newIndex, 0, movedClass)

      // Re-render the schedule
      renderSchedule()
      showNotification("Class order updated!")
    }
  }

  // Event listeners
  addClassButton.addEventListener("click", addClass)
  resetFormButton.addEventListener("click", resetForm)
  updateClassButton.addEventListener("click", updateClass)
  cancelEditButton.addEventListener("click", cancelEdit)
  copyScheduleButton.addEventListener("click", copySchedule)
  clearAllButton.addEventListener("click", clearAllClasses)

  // Setup real-time validation
  setupRealTimeValidation()

  // Initial render
  renderSchedule()
})
