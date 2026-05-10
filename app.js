/* ============================
   CONFIG
============================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQG6CxE_JjAjw9nd6AVo_j1zQlS7tePiFBwX8Dbq3VF_NmnEYCsoIQk5Ii5M9Q8cT3Fw/exec";

let entries = [];   // spese
let editIndex = null;
let deleteIndex = null;
let isSaving = false;

/* ============================
   CARICAMENTO
============================ */

async function load() {
  try {
    const r = await fetch(SCRIPT_URL + "?action=load");
    const t = await r.text();
    entries = t ? JSON.parse(t) : [];
  } catch {
    entries = [];
  }
  render();
}

/* ============================
   SALVATAGGIO
============================ */

let saveTimeout = null;

function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(save, 500);
}

async function save() {
  const status = document.getElementById("saveStatus");
  status.className = "statusIndicator saving";
  status.textContent = "🟡 Salvataggio...";
  isSaving = true;

  try {
    const data = encodeURIComponent(JSON.stringify(entries));
    await fetch(SCRIPT_URL + "?action=save&data=" + data);

    status.className = "statusIndicator ok";
    status.textContent = "🟢 Salvato";
  } catch {
    status.className = "statusIndicator err";
    status.textContent = "🔴 Errore";
  }

  isSaving = false;
}

/* ============================
   RENDER
============================ */

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  entries.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "entry";

    div.innerHTML = `
      <div class="entryTitle">💸 ${escapeHtml(e.desc)}</div><br>

      <div class="entryRow">🏷️ <span class="label">Categoria:</span> ${escapeHtml(e.cat)}</div>
      <div class="entryRow">💰 <span class="label">Importo:</span> ${e.amount}€</div>
      <div class="entryRow">📅 <span class="label">Mese:</span> ${escapeHtml(e.month)} ${e.year}</div>

      <br>

      <button class="btn-edit" onclick="startEdit(${i})">✏️ Modifica</button>
      <button class="btn-delete" onclick="confirmDelete(${i})">🗑️ Elimina</button>
    `;

    list.appendChild(div);
  });
}

/* ============================
   AGGIUNTA / MODIFICA
============================ */

function addEntry() {
  const desc = document.getElementById("descInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const cat = document.getElementById("catInput").value;
  const month = document.getElementById("monthSelect").value;
  const year = document.getElementById("yearInput").value;

  if (!desc || !amount) return;

  const obj = { desc, amount, cat, month, year };

  if (editIndex === null) {
    entries.push(obj);
  } else {
    entries[editIndex] = obj;
    editIndex = null;

    addBtn.innerHTML = "➕ Aggiungi spesa";
    addBtn.className = "btn-crazy";
  }

  clearForm();
  render();
  autoSave();
}

function startEdit(i) {
  const e = entries[i];
  editIndex = i;

  document.getElementById("descInput").value = e.desc;
  document.getElementById("amountInput").value = e.amount;
  document.getElementById("catInput").value = e.cat;
  document.getElementById("monthSelect").value = e.month;
  document.getElementById("yearInput").value = e.year;

  addBtn.innerHTML = "💾 Salva Modifica";
  addBtn.className = "btn-save";
}

function clearForm() {
  document.getElementById("descInput").value = "";
  document.getElementById("amountInput").value = "";
}

/* ============================
   ELIMINAZIONE
============================ */

function confirmDelete(i) {
  deleteIndex = i;

  const overlay = document.createElement("div");
  overlay.className = "confirmOverlay";
  overlay.id = "confirmOverlay";

  overlay.innerHTML = `
    <div class="confirmBox">
      <h3>Eliminare questa spesa?</h3>

      <div class="confirmButtons">
        <button class="btn-cancel" onclick="cancelDelete()">❌ Annulla</button>
        <button class="btn-delete" onclick="doDelete()">🗑️ Elimina</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function cancelDelete() {
  document.getElementById("confirmOverlay").remove();
  deleteIndex = null;
}

function doDelete() {
  entries.splice(deleteIndex, 1);
  deleteIndex = null;
  document.getElementById("confirmOverlay").remove();
  render();
  autoSave();
}

/* ============================
   UTILITY
============================ */

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/* ============================
   START
============================ */

const addBtn = document.getElementById("addBtn");
load();