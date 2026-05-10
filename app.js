/* ============================
   CONFIG
============================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx48SC5rxyMwtcBYEuAtIEUTjEdJIJ3zF0ZaAZ8omRPNBu8vcokvw0kuRY1u2T4vmCRYw/exec";

let data = {
  budget: 0,
  month: "Gennaio",
  year: 2026,
  expenses: []
};

let editIndex = null;
let isSaving = false;

/* ============================
   SEMAFORO
============================ */

function setStatusSaving() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator saving";
  s.textContent = "🟡 Salvataggio...";
}

function setStatusOK() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator ok";
  s.textContent = "🟢 Salvato";
}

function setStatusError() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator error";
  s.textContent = "🔴 Errore";
}

/* ============================
   LOAD DATA (come Vault)
============================ */

async function loadData() {
  try {
    setStatusSaving();
    const res = await fetch(SCRIPT_URL + "?action=get");
    const text = await res.text();

    try {
      data = JSON.parse(text);
    } catch {
      setStatusError();
      return;
    }

    updateUI();
    setStatusOK();
  } catch {
    setStatusError();
  }
}

/* ============================
   SAVE DATA (come Vault)
============================ */

async function saveData() {
  if (isSaving) return;
  isSaving = true;
  setStatusSaving();

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) setStatusOK();
    else setStatusError();
  } catch {
    setStatusError();
  }

  isSaving = false;
}

/* ============================
   UPDATE UI
============================ */

function updateUI() {
  document.getElementById("budgetInput").value = data.budget;
  document.getElementById("monthSelect").value = data.month;
  document.getElementById("yearSelect").value = data.year;

  renderList();
}

/* ============================
   ADD EXPENSE (come addEntry)
============================ */

function addExpense() {
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value.trim();

  if (!desc || isNaN(amount)) return;

  const entry = {
    desc,
    amount,
    category,
    note,
    date: new Date().toISOString().split("T")[0]
  };

  if (editIndex === null) {
    data.expenses.push(entry);
  } else {
    data.expenses[editIndex] = entry;
    editIndex = null;
    addBtn.textContent = "➕ Aggiungi spesa";
  }

  clearForm();
  renderList();
  saveData();
}

/* ============================
   EDIT EXPENSE
============================ */

function editExpense(i) {
  const e = data.expenses[i];

  descInput.value = e.desc;
  amountInput.value = e.amount;
  categoryInput.value = e.category;
  noteInput.value = e.note || "";

  editIndex = i;
  addBtn.textContent = "💾 Salva modifica";
}

/* ============================
   DELETE EXPENSE
============================ */

function deleteExpense(i) {
  data.expenses.splice(i, 1);
  renderList();
  saveData();
}

/* ============================
   CLEAR FORM
============================ */

function clearForm() {
  descInput.value = "";
  amountInput.value = "";
  noteInput.value = "";
  categoryInput.value = "Spesa";
}

/* ============================
   SORT (come Vault)
============================ */

function applySort() {
  const mode = sortSelect.value;

  if (mode === "recent") {
    data.expenses.sort((a, b) => b.date.localeCompare(a.date));
  }

  if (mode === "az") {
    data.expenses.sort((a, b) => a.desc.localeCompare(b.desc));
  }

  if (mode === "za") {
    data.expenses.sort((a, b) => b.desc.localeCompare(a.desc));
  }

  renderList();
}

/* ============================
   RENDER LIST (come Vault)
============================ */

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.expenses.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="itemTitle">${e.desc} — ${e.amount}€</div>
      <div class="itemSub">${e.category} • ${e.date}</div>
      ${e.note ? `<div class="itemNote">${e.note}</div>` : ""}
      <div class="itemBtns">
        <button class="btn-orange" onclick="editExpense(${i})">✏️ Modifica</button>
        <button class="btn-red" onclick="deleteExpense(${i})">🗑️ Elimina</button>
      </div>
    `;

    list.appendChild(div);
  });
}

/* ============================
   LISTENERS
============================ */

budgetInput.addEventListener("change", () => {
  data.budget = parseFloat(budgetInput.value) || 0;
  saveData();
});

monthSelect.addEventListener("change", () => {
  data.month = monthSelect.value;
  saveData();
});

yearSelect.addEventListener("change", () => {
  data.year = parseInt(yearSelect.value);
  saveData();
});

/* ============================
   START
============================ */

loadData();