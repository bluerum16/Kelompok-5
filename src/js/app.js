// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const STORAGE_KEY = "todo-board-data";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.

const groupList = document.getElementById("group-list");
const addGroupBtn = document.getElementById("add-group");
const renameGroupBtn = document.getElementById("rename-group");
const moveGroupUpBtn = document.getElementById("move-group-up");
const moveGroupDownBtn = document.getElementById("move-group-down");

const groupTitle = document.getElementById("group-title");
const groupCount = document.getElementById("group-count");
const totalTaskCount = document.getElementById("total-task-count");
const saveStatus = document.getElementById("save-status");
const taskCounter = document.getElementById("task-counter");
const themeToggle = document.getElementById("theme-toggle");

// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

let currentFilter = "all";
let draggedTaskId = null;

let data = loadData();

function createInitialData() {
  return {
    nextGroupId: 2,
    nextTaskId: 1,
    activeGroupId: 1,
    groups: [
      {
        id: 1,
        name: "My To Do List",
        tasks: [],
      },
    ],
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  // Kompatibilitas dengan versi sebelumnya yang menyimpan
  // task langsung di localStorage dengan key "tasks".
  if (saved === null) {
    const oldTasks = localStorage.getItem("tasks");

    if (oldTasks !== null) {
      try {
        const parsedOldTasks = JSON.parse(oldTasks);

        if (Array.isArray(parsedOldTasks)) {
          const initialData = createInitialData();

          initialData.groups[0].tasks = parsedOldTasks;

          initialData.nextTaskId = Math.max(...parsedOldTasks.map((task) => Number(task.id) || 0), 0) + 1;

          return initialData;
        }
      } catch (error) {
        console.error("Data tasks lama tidak valid:", error);
      }
    }

    return createInitialData();
  }

  try {
    const parsed = JSON.parse(saved);

    if (!parsed || !Array.isArray(parsed.groups) || parsed.groups.length === 0) {
      return createInitialData();
    }

    // Memastikan setiap group mempunyai array tasks.
    parsed.groups.forEach((group) => {
      if (!Array.isArray(group.tasks)) {
        group.tasks = [];
      }
    });

    if (!parsed.activeGroupId) {
      parsed.activeGroupId = parsed.groups[0].id;
    }

    // Cari ID group terbesar.
    parsed.nextGroupId = Math.max(...parsed.groups.map((group) => Number(group.id) || 0), 0) + 1;

    // Cari ID task terbesar dari seluruh group.
    const allTasks = parsed.groups.flatMap((group) => group.tasks);

    parsed.nextTaskId = Math.max(...allTasks.map((task) => Number(task.id) || 0), 0) + 1;

    return parsed;
  } catch (error) {
    console.error("Data localStorage tidak valid:", error);

    return createInitialData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  saveStatus.textContent = "● Tersimpan";

  clearTimeout(saveData.statusTimer);

  saveData.statusTimer = setTimeout(() => {
    saveStatus.textContent = "● Tersimpan";
  }, 300);
}

function getActiveGroup() {
  let group = data.groups.find((item) => item.id === data.activeGroupId);

  if (!group) {
    group = data.groups[0];
    data.activeGroupId = group.id;
  }

  return group;
}

function getTaskById(id) {
  const group = getActiveGroup();

  return group.tasks.find((task) => task.id === id);
}

// ------------------------------------------------------------
// GROUP RENDER
// ------------------------------------------------------------

function renderGroups() {
  groupList.innerHTML = "";

  data.groups.forEach((group, index) => {
    const item = document.createElement("div");

    item.className = "group-item";

    if (group.id === data.activeGroupId) {
      item.classList.add("active");
    }

    const selectButton = document.createElement("button");

    selectButton.type = "button";
    selectButton.className = "group-select";

    const name = document.createElement("span");

    name.className = "group-name";
    name.textContent = group.name;

    const meta = document.createElement("span");

    meta.className = "group-meta";
    meta.textContent = `${group.tasks.length} task`;

    selectButton.appendChild(name);
    selectButton.appendChild(meta);

    selectButton.addEventListener("click", () => {
      data.activeGroupId = group.id;

      currentFilter = "all";

      saveData();
      renderAll();
    });

    const move = document.createElement("div");

    move.className = "group-move";

    const up = document.createElement("button");

    up.type = "button";
    up.textContent = "↑";
    up.title = "Naikkan grup";
    up.disabled = index === 0;

    up.addEventListener("click", (event) => {
      event.stopPropagation();

      moveGroup(index, -1);
    });

    const down = document.createElement("button");

    down.type = "button";
    down.textContent = "↓";
    down.title = "Turunkan grup";
    down.disabled = index === data.groups.length - 1;

    down.addEventListener("click", (event) => {
      event.stopPropagation();

      moveGroup(index, 1);
    });

    move.appendChild(up);
    move.appendChild(down);

    item.appendChild(selectButton);
    item.appendChild(move);

    groupList.appendChild(item);
  });

  groupCount.textContent = `${data.groups.length} grup`;

  const total = data.groups.reduce((sum, group) => sum + group.tasks.length, 0);

  totalTaskCount.textContent = `${total} task`;
}

// ------------------------------------------------------------
// TASK RENDER
// ------------------------------------------------------------

function renderTasks() {
  const group = getActiveGroup();

  groupTitle.textContent = group.name;

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });

  const activeTasksCount = group.tasks.filter((task) => !task.completed).length;

  taskCounter.textContent = `${activeTasksCount} task tersisa`;

  taskList.innerHTML = "";

  let visibleTasks = group.tasks;

  if (currentFilter === "active") {
    visibleTasks = group.tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    visibleTasks = group.tasks.filter((task) => task.completed);
  }

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("li");

    emptyState.className = "empty-state";

    if (group.tasks.length === 0) {
      emptyState.textContent = "Belum ada task. Tambahkan satu di atas!";
    } else if (currentFilter === "active") {
      emptyState.textContent = "Tidak ada task aktif.";
    } else {
      emptyState.textContent = "Belum ada task yang selesai.";
    }

    taskList.appendChild(emptyState);

    return;
  }

  visibleTasks.forEach((task) => {
    const li = createTaskElement(task);

    taskList.appendChild(li);
  });
}

function createTaskElement(task) {
  const li = document.createElement("li");

  li.className = "task-item";
  li.draggable = true;
  li.dataset.id = task.id;

  if (task.completed) {
    li.classList.add("completed");
  }

  // ----------------------------------------------------------
  // DRAG HANDLE
  // ----------------------------------------------------------

  const handle = document.createElement("span");

  handle.className = "drag-handle";
  handle.textContent = "⋮⋮";
  handle.title = "Geser task";

  // ----------------------------------------------------------
  // CHECKBOX
  // ----------------------------------------------------------

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;

  checkbox.addEventListener("change", () => {
    toggleComplete(task.id);
  });

  // ----------------------------------------------------------
  // TASK TEXT
  // ----------------------------------------------------------

  const span = document.createElement("span");

  span.className = "task-text";
  span.textContent = task.text;

  // ----------------------------------------------------------
  // ACTION BUTTONS
  // ----------------------------------------------------------

  const actions = document.createElement("div");

  actions.className = "task-actions";

  const group = getActiveGroup();

  const index = group.tasks.findIndex((item) => item.id === task.id);

  // UP
  const upBtn = document.createElement("button");

  upBtn.type = "button";
  upBtn.className = "task-action";
  upBtn.textContent = "↑";
  upBtn.title = "Naikkan task";
  upBtn.disabled = index === 0;

  upBtn.addEventListener("click", () => {
    moveTask(task.id, -1);
  });

  // DOWN
  const downBtn = document.createElement("button");

  downBtn.type = "button";
  downBtn.className = "task-action";
  downBtn.textContent = "↓";
  downBtn.title = "Turunkan task";

  downBtn.disabled = index === group.tasks.length - 1;

  downBtn.addEventListener("click", () => {
    moveTask(task.id, 1);
  });

  // EDIT
  const editBtn = document.createElement("button");

  editBtn.type = "button";
  editBtn.className = "task-action";
  editBtn.textContent = "✎";
  editBtn.title = "Edit task";

  editBtn.addEventListener("click", () => {
    startEditTask(li, task);
  });

  // DELETE
  const deleteBtn = document.createElement("button");

  deleteBtn.type = "button";
  deleteBtn.className = "task-action delete";

  deleteBtn.textContent = "✕";
  deleteBtn.title = "Hapus task";

  deleteBtn.addEventListener("click", () => {
    deleteTask(task.id);
  });

  actions.appendChild(upBtn);
  actions.appendChild(downBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(handle);
  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(actions);

  // ----------------------------------------------------------
  // DRAG & DROP
  // ----------------------------------------------------------

  li.addEventListener("dragstart", () => {
    draggedTaskId = task.id;

    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    draggedTaskId = null;

    li.classList.remove("dragging");

    document.querySelectorAll(".drag-over").forEach((element) => {
      element.classList.remove("drag-over");
    });
  });

  li.addEventListener("dragover", (event) => {
    event.preventDefault();

    if (draggedTaskId === task.id) {
      return;
    }

    li.classList.add("drag-over");
  });

  li.addEventListener("dragleave", () => {
    li.classList.remove("drag-over");
  });

  li.addEventListener("drop", (event) => {
    event.preventDefault();

    li.classList.remove("drag-over");

    if (draggedTaskId === null || draggedTaskId === task.id) {
      return;
    }

    moveTaskBefore(draggedTaskId, task.id);
  });

  return li;
}

// ------------------------------------------------------------
// TASK CRUD
// ------------------------------------------------------------

function addTask(text) {
  const trimmed = text.trim();

  if (trimmed === "") {
    return;
  }

  const group = getActiveGroup();

  const task = {
    id: data.nextTaskId++,
    text: trimmed,
    completed: false,
  };

  group.tasks.push(task);

  saveData();
  renderAll();
}

function deleteTask(id) {
  const group = getActiveGroup();

  group.tasks = group.tasks.filter((task) => task.id !== id);

  saveData();
  renderAll();
}

function toggleComplete(id) {
  const task = getTaskById(id);

  if (!task) {
    return;
  }

  task.completed = !task.completed;

  saveData();
  renderAll();
}

function editTask(id, newText) {
  const trimmed = newText.trim();

  if (trimmed === "") {
    return;
  }

  const task = getTaskById(id);

  if (!task) {
    return;
  }

  task.text = trimmed;

  saveData();
  renderAll();
}

function clearCompleted() {
  const group = getActiveGroup();

  group.tasks = group.tasks.filter((task) => !task.completed);

  saveData();
  renderAll();
}

// ------------------------------------------------------------
// TASK ORDER
// ------------------------------------------------------------

function moveTask(id, direction) {
  const group = getActiveGroup();

  const index = group.tasks.findIndex((task) => task.id === id);

  const newIndex = index + direction;

  if (index === -1 || newIndex < 0 || newIndex >= group.tasks.length) {
    return;
  }

  const temp = group.tasks[index];

  group.tasks[index] = group.tasks[newIndex];

  group.tasks[newIndex] = temp;

  saveData();
  renderAll();
}

function moveTaskBefore(sourceId, targetId) {
  const group = getActiveGroup();

  const sourceIndex = group.tasks.findIndex((task) => task.id === sourceId);

  const targetIndex = group.tasks.findIndex((task) => task.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return;
  }

  const [movedTask] = group.tasks.splice(sourceIndex, 1);

  let newIndex = targetIndex;

  if (sourceIndex < targetIndex) {
    newIndex -= 1;
  }

  group.tasks.splice(newIndex, 0, movedTask);

  saveData();
  renderAll();
}

// ------------------------------------------------------------
// EDIT TASK UI
// ------------------------------------------------------------

function startEditTask(li, task) {
  const span = li.querySelector(".task-text");

  if (!span) {
    return;
  }

  const input = document.createElement("input");

  input.type = "text";
  input.className = "edit-input";
  input.value = task.text;

  li.replaceChild(input, span);

  input.focus();
  input.select();

  let finished = false;

  function finishEdit() {
    if (finished) {
      return;
    }

    finished = true;

    const newText = input.value.trim();

    if (newText !== "") {
      editTask(task.id, newText);
    } else {
      renderTasks();
    }
  }

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      finishEdit();
    }

    if (event.key === "Escape") {
      finished = true;

      renderTasks();
    }
  });

  input.addEventListener("blur", finishEdit);
}

// ------------------------------------------------------------
// GROUP CRUD
// ------------------------------------------------------------

function addGroup() {
  const name = prompt("Nama grup baru:");

  if (name === null) {
    return;
  }

  const trimmed = name.trim();

  if (trimmed === "") {
    return;
  }

  const group = {
    id: data.nextGroupId++,
    name: trimmed,
    tasks: [],
  };

  data.groups.push(group);

  data.activeGroupId = group.id;

  currentFilter = "all";

  saveData();
  renderAll();
}

function renameGroup() {
  const group = getActiveGroup();

  const name = prompt("Nama grup:", group.name);

  if (name === null) {
    return;
  }

  const trimmed = name.trim();

  if (trimmed === "") {
    return;
  }

  group.name = trimmed;

  saveData();
  renderAll();
}

// ------------------------------------------------------------
// GROUP ORDER
// ------------------------------------------------------------

function moveGroup(index, direction) {
  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= data.groups.length) {
    return;
  }

  const temp = data.groups[index];

  data.groups[index] = data.groups[newIndex];

  data.groups[newIndex] = temp;

  saveData();
  renderAll();
}

// ------------------------------------------------------------
// RENDER ALL
// ------------------------------------------------------------

function renderAll() {
  renderGroups();
  renderTasks();

  const groupIndex = data.groups.findIndex((group) => group.id === data.activeGroupId);

  moveGroupUpBtn.disabled = groupIndex <= 0;

  moveGroupDownBtn.disabled = groupIndex === -1 || groupIndex >= data.groups.length - 1;
}

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  addTask(taskInput.value);

  taskInput.value = "";

  taskInput.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    renderTasks();
  });
});

addGroupBtn.addEventListener("click", addGroup);

renameGroupBtn.addEventListener("click", renameGroup);

moveGroupUpBtn.addEventListener("click", () => {
  const index = data.groups.findIndex((group) => group.id === data.activeGroupId);

  moveGroup(index, -1);
});

moveGroupDownBtn.addEventListener("click", () => {
  const index = data.groups.findIndex((group) => group.id === data.activeGroupId);

  moveGroup(index, 1);
});

// ------------------------------------------------------------
// INITIAL RENDER
// ------------------------------------------------------------

renderAll();

// ------------------------------------------------------------
// THEME
// ------------------------------------------------------------

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}

function updateThemeButton() {
  const isDark = document.body.classList.contains("dark-mode");

  themeToggle.textContent = isDark ? "☀️" : "🌙";

  themeToggle.title = isDark ? "Gunakan Light Mode" : "Gunakan Dark Mode";
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  updateThemeButton();
}

themeToggle.addEventListener("click", toggleTheme);

updateThemeButton();
