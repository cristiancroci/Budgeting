let state={meseCorrente:"",mesi:{}};
const $=id=>document.getElementById(id);

function getMonthKey(){
 let d=new Date();
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
}

function mese(){return state.mesi[state.meseCorrente];}

function load(){
 try{
   let r=localStorage.getItem("budgetingState");
   if(r) state=JSON.parse(r);
 }catch{}

 // ⭐ BACKUP AUTOMATICO
 let backup = localStorage.getItem("budgetingBackup");
 if (backup) {
     try { state = JSON.parse(backup); } catch {}
 }

 if(!state.meseCorrente) state.meseCorrente=getMonthKey();
 if(!state.mesi[state.meseCorrente])
   state.mesi[state.meseCorrente]={budget:0,extra:0,entries:[]};
}

function save(){
 localStorage.setItem("budgetingState",JSON.stringify(state));
 localStorage.setItem("budgetingBackup",JSON.stringify(state));
}

function initMonthPicker(){
 $("mesePicker").value=state.meseCorrente;
}

$("mesePicker").addEventListener("change",()=>{
 let key=$("mesePicker").value;
 if(!state.mesi[key])
   state.mesi[key]={budget:0,extra:0,entries:[]};
 state.meseCorrente=key;
 save();
 render();
});

function total(){
 return (mese().budget||0)+(mese().extra||0);
}

function render(){
 initMonthPicker();

 let t=total();
 $("totalInfo").textContent="Budget totale: "+t+"€";
 $("budgetInput").value=mese().budget||"";

 let nec=0,des=0,ris=0;
 mese().entries.forEach(e=>{
   if(e.cat==="Necessità") nec+=e.amount;
   if(e.cat==="Desideri") des+=e.amount;
   if(e.cat==="Risparmio") ris+=e.amount;
 });

 let maxNec = (t * 0.50);
 let maxDes = (t * 0.30);
 let maxRis = (t * 0.20);

 let dispNec = (maxNec - nec).toFixed(2);
 let dispDes = (maxDes - des).toFixed(2);
 let dispRis = (maxRis - ris).toFixed(2);

 let pN=t?Math.min(100,nec/(t*0.5)*100):0;
 let pD=t?Math.min(100,des/(t*0.3)*100):0;
 let pR=t?Math.min(100,ris/(t*0.2)*100):0;

 $("barNec").style.width=pN+"%";
 $("barDes").style.width=pD+"%";
 $("barRis").style.width=pR+"%";

 $("textNec").textContent =
   `${nec.toFixed(2)}€ di ${maxNec.toFixed(2)}€ totali = disponibili ${dispNec}€`;

 $("textDes").textContent =
   `${des.toFixed(2)}€ di ${maxDes.toFixed(2)}€ totali = disponibili ${dispDes}€`;

 $("textRis").textContent =
   `${ris.toFixed(2)}€ di ${maxRis.toFixed(2)}€ totali = disponibili ${dispRis}€`;

 let L=$("list");
 L.innerHTML="";

 if(mese().entries.length===0){
   L.innerHTML=`<div class="empty">Nessuna spesa.</div>`;
   return;
 }

 mese().entries.forEach((e,i)=>{

   // ⭐ ICONA CATEGORIA
   let icon = e.cat === "Necessità" ? "🛒" :
              e.cat === "Desideri" ? "🎉" :
              "💰";

   let p=t?Math.min(100,e.amount/t*100):0;

   let d=document.createElement("div");
   d.className="entry entry-" + e.cat;
   d.dataset.index=i;

   d.innerHTML=`
   <div class="entryTop">
     <div>
       <div class="entryDesc">${icon} ${e.desc}</div>
       <div class="entryMeta">${e.cat} · ${e.date}</div>
     </div>
     <div class="entryActions">
       <div class="entryAmount">-${e.amount}€</div>
       <span class="edit">✏️</span>
       <span class="delete">🗑</span>
     </div>
   </div>
   <div class="barOuter"><div class="barInner" style="width:${p}%"></div></div>
   <div class="percentText">${p.toFixed(0)}%</div>`;

   L.appendChild(d);
 });
}

function addEntry(){
 let d=$("descInput").value.trim();
 let a=parseFloat($("amountInput").value);
 let c=$("catInput").value;

 // ⭐ DATA MANUALE
 let date = $("dateInput").value
     ? new Date($("dateInput").value).toLocaleDateString("it-IT")
     : new Date().toLocaleDateString("it-IT");

 if(!d||!a||!c) return;

 mese().entries.push({desc:d,amount:a,cat:c,date});

 $("descInput").value="";
 $("amountInput").value="";
 $("catInput").value="";
 $("dateInput").value="";

 save();
 render();
}

function addExtra(){
 let x=parseFloat($("extraInput").value);
 if(!x) return;
 mese().extra+=x;
 $("extraInput").value="";
 save();
 render();
}

function edit(i){
 let e=mese().entries[i];
 let d=prompt("Descrizione:",e.desc);if(d===null)return;
 let a=parseFloat(prompt("Importo:",e.amount));if(!a)return;
 let c=prompt("Categoria:",e.cat);if(!c)return;
 e.desc=d;e.amount=a;e.cat=c;
 save();render();
}

function del(i){
 if(!confirm("Eliminare?"))return;
 mese().entries.splice(i,1);
 save();render();
}

$("addBtn").onclick=addEntry;
$("addExtraBtn").onclick=addExtra;

$("budgetInput").onchange=()=>{
 let b=parseFloat($("budgetInput").value);
 if(b>=0){mese().budget=b;save();render();}
};

$("list").onclick=e=>{
 let el=e.target.closest(".entry");if(!el)return;
 let i=el.dataset.index;
 if(e.target.classList.contains("edit"))edit(i);
 if(e.target.classList.contains("delete"))del(i);
};

$("exportBtn").onclick=()=>{
 let blob=new Blob([JSON.stringify(state)],{type:"application/json"});
 let a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="budget.json";
 a.click();
};

$("importBtn").onclick=()=>{$("fileInput").click();};
$("fileInput").onchange=()=>{
 let f=$("fileInput").files[0];
 let r=new FileReader();
 r.onload=e=>{state=JSON.parse(e.target.result);save();render();};
 r.readAsText(f);
};

load();
render();