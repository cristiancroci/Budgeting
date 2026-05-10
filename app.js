/* ============================
CONFIG
============================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQG6CxE_JjAjw9nd6AVo_j1zQlS7tePiFBwX8Dbq3VF_NmnEYCsoIQk5Ii5M9Q8cT3Fw/exec";

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
  s.textContent = "🔴 Errore salvataggio";
}

/* ============================
LOAD DATA
============================ */

async function loadData() {
  try {
    const res = await fetch(SCRIPT_URL);
    const json = await res.json();
    data = json;

    document.getElementById("budgetInput").value = data.budget;
    document.getElementById("monthSelect").value = data.month;
    document.getElementById("yearInput").value = data.year;

    renderHistory();
  } catch {
    setStatusError();
  }
}

/* ============================
SAVE DATA (FIX DEFINITIVA)
============================ */

async function saveData() {
  if (isSaving) return;
  isSaving = true;
  setStatusSaving();

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data),
      muteHttpExceptions: true
    });

    if (res.ok) setStatusOK();
    else setStatusError();
  } catch {
    setStatusError();
  }

  isSaving = false;
}

/* ============================
AGGIUNTA SPESA
============================ */

document.getElementById("addBtn").addEventListener("click", () => {
  const desc = document.getElementById("descInput").value;
  const cat = document.getElementById("catInput").value;
  const amount = parseFloat(document.getElementById("amountInput").value);

  if (!desc || !amount) return;

  data.expenses.push({ desc, cat, amount });
  renderHistory();
  saveData();
});

/* ============================
RENDER LISTA
============================ */

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  data.expenses.forEach((e, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${e.desc} - ${e.cat}</span>
      <strong>${e.amount}€</strong>
    `;
    list.appendChild(li);
  });
}

/* ============================
EVENTI CAMPI
============================ */

document.getElementById("budgetInput").addEventListener("input", e => {
  data.budget = parseFloat(e.target.value) || 0;
  saveData();
});

document.getElementById("monthSelect").addEventListener("change", e => {
  data.month = e.target.value;
  saveData();
});

document.getElementById("yearInput").addEventListener("input", e => {
  data.year = parseInt(e.target.value);
  saveData();
});

/* ============================
START
============================ */

loadData();