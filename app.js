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
   GRUPPI 50‑30‑20
============================ */

const groupMap = {
  "Spesa": "necessita",
  "Bollette": "necessita",
  "Auto": "necessita",
  "Salute": "necessita",

  "Shopping": "desideri",
  "Tempo libero": "desideri",
  "Ristoranti": "desideri",
  "Hobby": "desideri",

  "Risparmio": "risparmio",
  "Investimenti": "risparmio"
};

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
   LOAD DATA
============================ */

async function loadData() {
  try {
    setStatusSaving();
    const res = await fetch(SCRIPT_URL + "?action=get");
    const text = await res.text();
    data = JSON.parse(text);
    updateUI();
    setStatusOK();
  } catch {
    setStatusError();
  }
}

/* ============================
   SAVE DATA
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
   CALCOLI 50‑30‑20
============================ */

function calculateTotals() {
  const budget = data.budget;

  const limits = {
    necessita: budget * 0.50,
    desideri: budget * 0.30,
    risparmio: budget * 0.20
  };

  const totals = { necessita: 0, desideri: 0, risparmio: 0 };

  data.expenses.forEach(e => {
    totals[e.group] += e.amount;
  });

  const residui = {
    necessita: limits.necessita - totals.necessita,
    desideri: limits.desideri - totals.desideri,
    risparmio: limits.risparmio - totals.risparmio
  };

  const totaleSpese = totals.necessita + totals.desideri + totals.risparmio;
  const residuoTotale = budget - totaleSpese;

  return { limits, totals, residui, totaleSpese, residuoTotale };
}

/* ============================
   UPDATE UI
============================ */

function updateUI() {
  document.getElementById("budgetInput").value = data.budget;
  document.getElementById("monthSelect").value = data.month;
  document.getElementById("yearSelect").value = data.year;

  renderList();
  updateSummary();
}

/* ============================
   UPDATE SUMMARY (50‑30‑20)
============================ */

function updateSummary() {
  const { limits, totals, residui, totaleSpese, residuoTotale } = calculateTotals();

  necLimit.textContent = limits.necessita.toFixed(2) + "€";
  desLimit.textContent = limits.desideri.toFixed(2) + "€";
  risLimit.textContent = limits.risparmio.toFixed(2) + "€";

  necUsed.textContent = totals.necessita.toFixed(2) + "€";
  desUsed.textContent = totals.desideri.toFixed(2) + "€";
  risUsed.textContent = totals.risparmio.toFixed(2) + "€";

  necLeft.textContent = residui.necessita.toFixed(2) + "€";
  desLeft.textContent = residui.desideri.toFixed(2) + "€";
  risLeft.textContent = residui.risparmio.toFixed(2) + "€";

  totaleSpeseEl = document.getElementById("totaleSpese");
  residuoTotaleEl = document.getElementById("residuoTotale");

  totaleSpeseEl.textContent = totaleSpese.toFixed(2) + "€";
  residuoTotaleEl.textContent = residuoTotale.toFixed(2) + "€";

  updateSemaforo(limits, totals, residuoTotale);
}

/* ============================
   SEMAFORO LOGICA
============================ */

function updateSemaforo(limits, totals, residuoTotale) {
  if (residuoTotale < 0 ||
      totals.necessita > limits.necessita ||
      totals.desideri > limits.desideri ||
      totals.risparmio > limits.risparmio) {
    setStatusError();
    return;
  }

  if (totals.necessita > limits.necessita * 0.7 ||
      totals.desideri > limits.desideri * 0.7 ||
      totals.risparmio > limits.risparmio * 0.7) {
    const s = document.getElementById("saveStatus");
    s.className = "statusIndicator saving";
    s.textContent = "🟡 Attenzione";
    return;
  }

  setStatusOK();
}

/* ============================
   ADD EXPENSE
============================ */

function addExpense() {
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value.trim();

  if (!desc || isNaN(amount)) return;

  const group = groupMap[category];

  const entry = {
    desc,
    amount,
    category,
    group,
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
  updateSummary();
  saveData();
}

/* ============================
   EDIT
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
   DELETE
============================ */

function deleteExpense(i) {
  data.expenses.splice(i, 1);
  renderList();
  updateSummary();
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
   SORT
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
   RENDER LIST
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
  updateSummary();
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