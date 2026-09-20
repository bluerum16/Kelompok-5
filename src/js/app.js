// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.
let tasks = [];
let nextId = 1;

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
  tasks.forEach((task) => {
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
    // Tambahkan tombol "Edit" di sini. Saat diklik, ganti `span`
    // menjadi <input> berisi teks task supaya bisa diubah,
    // lalu simpan perubahannya saat user menekan Enter / klik Save.

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
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
// Buat function editTask(id, newText) yang mengubah task.text
// untuk task dengan id yang cocok, lalu panggil renderTasks().

// TODO (Fitur #6 - Clear Completed):
// Buat function clearCompleted() yang menghapus semua task dengan
// completed === true dari array "tasks", lalu panggil renderTasks().
// Jangan lupa tambahkan event listener untuk tombol #clear-completed.

// TODO (Fitur #3 - Filter Task):
// Simpan filter yang sedang aktif di sebuah variabel, misalnya
// `let currentFilter = "all";`, lalu tambahkan event listener untuk
// setiap .filter-btn yang mengubah currentFilter dan memanggil
// renderTasks() ulang.

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

renderTasks();
