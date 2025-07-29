document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const taskInput = document.getElementById("new-task");
    const addTaskButton = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const minutesSpan = document.getElementById("minutes");
    const secondsSpan = document.getElementById("seconds");
    const startButton = document.getElementById("start-timer");
    const resetButton = document.getElementById("reset-timer");
    const sessionLabel = document.getElementById("session-label");
    const pomodoroCountSpan = document.getElementById("pomodoro-count");
    const body = document.body;

    let tasks = [];
    let timerInterval;
    let timeLeft;
    let sessionCount = 0;
    let pomodoroCount = 0;
    let sessionType = "work"; // Default: Work session

    // 📌 Load saved tasks
    chrome.storage.sync.get("tasks", function (data) {
        tasks = data.tasks || [];
        renderTasks();
    });

    // 📌 Load Pomodoro count
    chrome.storage.sync.get("pomodoroCount", function (result) {
        pomodoroCount = result.pomodoroCount || 0;
        pomodoroCountSpan.textContent = pomodoroCount;
    });

    // 📌 Event Listeners
    addTaskButton.addEventListener("click", addTask);
    taskInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") addTask();
    });
    startButton.addEventListener("click", startTimer);
    resetButton.addEventListener("click", resetTimer);

    // 📝 **Add Task to UI**
    function addTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        tasks.push({ text: taskText, completed: false });
        taskInput.value = ""; // Clear input

        saveTasks();
        renderTasks();
    }

    // 🎨 **Render Task List**
    function renderTasks() {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            li.classList.add("task-item");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.addEventListener("change", () => toggleTask(index));

            const text = document.createElement("span");
            text.textContent = task.text;
            if (task.completed) text.style.textDecoration = "line-through";

            li.appendChild(checkbox);
            li.appendChild(text);
            taskList.appendChild(li);
        });

        updateProgress();
    }

    // ✅ **Toggle Task Completion**
    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    // 💾 **Save Tasks**
    function saveTasks() {
        chrome.storage.sync.set({ tasks });
    }

    // 📊 **Update Progress Bar**
    function updateProgress() {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Completed`;
    }

    // ⏳ **Set Initial Timer**
    setTime(sessionType);
    updateUI();

    // ⏰ **Start Timer**
    function startTimer() {
        if (!timerInterval) {
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    // 🔄 **Reset Timer**
    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        sessionCount = 0;
        pomodoroCount = 0;
        sessionType = "work";
        setTime(sessionType);
        updateUI();
        savePomodoroCount();
    }

    // ⏳ **Set Time Based on Session**
    function setTime(type) {
        if (type === "work") timeLeft = 25 * 60;
        else if (type === "short-break") timeLeft = 5 * 60;
        else if (type === "long-break") timeLeft = 15 * 60;
    }

    // ⏱️ **Update Timer**
    function updateTimer() {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            notifyUser();
            switchSession();
        }
    }

    // 🎯 **Update Display**
    function updateDisplay() {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        minutesSpan.textContent = minutes.toString().padStart(2, "0");
        secondsSpan.textContent = seconds.toString().padStart(2, "0");
    }

    // 🔄 **Switch Sessions Automatically**
    function switchSession() {
        if (sessionType === "work") {
            sessionCount++;
            pomodoroCount++;
            savePomodoroCount();
            sessionType = sessionCount % 2 === 0 ? "long-break" : "short-break";
        } 
        else {
            sessionType = "work";
        }

        setTime(sessionType);
        updateUI();
    }

    // 🎨 **Update UI Based on Session**
    function updateUI() {
        updateDisplay();
        sessionLabel.textContent = sessionType === "work" ? "Work Session" :
                                   sessionType === "short-break" ? "Short Break" : "Long Break";

        body.className = sessionType;
        pomodoroCountSpan.textContent = pomodoroCount;
    }

    // 💾 **Save Pomodoro Count**
    function savePomodoroCount() {
        chrome.storage.sync.set({ pomodoroCount });
    }

    // 🔔 **Show Notification**
    function notifyUser() {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "assets/icon.png",
                title: "Time's Up!",
                message: sessionType === "work" ? "Take a break!" : "Time to get back to work!",
                priority: 2
            });
        }
    }
});
