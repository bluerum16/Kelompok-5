// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// DOM Pagination
const paginationContainer = document.getElementById("pagination");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.
let tasks = [];
let nextId = 1;
let currentFilter = "all";
let currentPage = 1;
const tasksPerPage = 5;

// TODO (Fitur #4 - Simpan ke localStorage):
// Saat aplikasi pertama kali dibuka, load "tasks" dari localStorage
// (kalau ada) sebelum renderTasks() dipanggil pertama kali di bawah.
// Hint: gunakan JSON.parse(localStorage.getItem("tasks")) dan cek
// null-nya sebelum dipakai.
const storedTasks = localStorage.getItem("tasks");

if (storedTasks !== null) {
  tasks = JSON.parse(storedTasks);

  // Sesuaikan ID berikutnya agar tidak bentrok
  // dengan ID task yang sudah tersimpan.
  nextId = Math.max(...tasks.map((task) => task.id), 0) + 1;
}

function renderTasks() {
  taskList.innerHTML = "";

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });

  const activeTasksCount = tasks.filter(t => !t.completed).length;
  const counterElement = document.getElementById('task-counter');
  if (counterElement) {
    counterElement.textContent = `${activeTasksCount} task tersisa`;
  } //task 5, ditaro diatas biar kalo daftar tasknya kosong, counternya akan ke update
  // TODO (Fitur #4 - Simpan ke localStorage):
  // Setiap kali renderTasks() dipanggil, data "tasks" sudah berubah,
  // jadi ini tempat yang pas untuk menyimpan ulang ke localStorage.
  // Hint: localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("tasks", JSON.stringify(tasks));

  if (tasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "Belum ada task. Tambahkan satu di atas!";
    taskList.appendChild(emptyState);
    return;
  }

  // TODO (Fitur #3 - Filter Task):
  // Sebelum di-loop, filter dulu "tasks" sesuai filter aktif
  // (semua / aktif / selesai). Sekarang semua task selalu ditampilkan.
  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  // Update Pagination UI
  if (filteredTasks.length > tasksPerPage) {
    paginationContainer.style.display = "flex";
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  } else {
    paginationContainer.style.display = "none";
  }

  if (filteredTasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent =
      currentFilter === "active"
        ? "Tidak ada task aktif."
        : "Belum ada task yang selesai.";
    taskList.appendChild(emptyState);
    return;
  }

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  paginatedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    // TODO (Fitur #1 - Tandai Selesai):
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleComplete(task.id));
    if (task.completed) {
      li.classList.add("completed");
    }

    const span = document.createElement("span");
    span.textContent = task.text;

    // TODO (Fitur #2 - Edit Task):
    const editBtn = document.createElement("button");
    editBtn.className = "btn edit-btn";
    editBtn.innerHTML = "✎";
    editBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = task.text;
      input.className = "edit-input";
      
      li.replaceChild(input, span);
      input.focus();
      
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          editTask(task.id, input.value);
        }
      });
      
      input.addEventListener("blur", () => {
        editTask(task.id, input.value);
      });
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn delete-btn";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "task-actions";
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actionsDiv);
    taskList.appendChild(li);
  });

  // TODO (Fitur #5 - Counter):
  // Update elemen #task-counter di sini setiap kali renderTasks() dipanggil,
  // isinya jumlah task yang belum selesai. Contoh: "3 task tersisa".
}

function addTask(text) {
  const trimmed = text.trim();
  if (trimmed === "") return;

  // Fitur #4 - Pastikan ID baru tidak bentrok
  // dengan ID task yang sudah ada.
  nextId = Math.max(...tasks.map((task) => task.id), 0) + 1;

  tasks.push({
    id: nextId++,
    text: trimmed,
    completed: false,
  });

  // Kembali ke halaman pertama setiap menambah task agar kelihatan kalau ditambahkan ke bawah (kalau urutannya descending)
  // Atau karena kita push ke array akhir, kita bisa lompat ke halaman terakhir:
  const totalAfterAdd = tasks.length;
  currentPage = Math.ceil(totalAfterAdd / tasksPerPage) || 1;

  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();  
}

// TODO (Fitur #1 - Tandai Selesai):
function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

// TODO (Fitur #2 - Edit Task):
function editTask(id, newText) {
  const trimmed = newText.trim();
  if (trimmed === "") return;

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    renderTasks();
  }
}

// Fitur #6 - Hapus semua task yang sudah dicentang selesai.
// Task yang belum selesai tetap dipertahankan.
function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  renderTasks();
}

// TODO (Fitur #3 - Filter Task):
// Simpan filter yang sedang aktif di sebuah variabel, misalnya
// `let currentFilter = "all";`, lalu tambahkan event listener untuk
// setiap .filter-btn yang mengubah currentFilter dan memanggil
// renderTasks() ulang.
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    currentPage = 1; // Reset halaman saat filter berubah
    renderTasks();
  });
});

// Event Listener Pagination
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTasks();
  }
});

nextBtn.addEventListener("click", () => {
  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderTasks();
  }
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

renderTasks();
