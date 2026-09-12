const events = [
  { name:"Falta de agua", icon:"🏜️", kind:"bad",  delta:-1, message:"La planta recibió poca agua y se debilitó." },
  { name:"Agua adecuada", icon:"💧", kind:"good", delta: 1, message:"¡Buena suerte! La planta recibió el agua que necesitaba y mejora." },
  { name:"Falta de nutrientes", icon:"⚠️", kind:"bad",  delta:-1, message:"La planta no recibió suficientes nutrientes y perdió fuerza." },
  { name:"Nutrientes adecuados", icon:"🧪", kind:"good", delta: 1, message:"Los nutrientes fueron adecuados. La planta tiene mejores condiciones para crecer." },
  { name:"Problema de luz", icon:"🔆", kind:"bad",  delta:-1, message:"La luz no fue adecuada. La planta se estresó y se debilitó." },
  { name:"Luz adecuada", icon:"☀️", kind:"good", delta: 1, message:"La cantidad de luz fue adecuada. La planta aprovecha bien la energía." },
  { name:"Exceso de agua", icon:"🌊", kind:"bad",  delta:-2, message:"Hubo demasiada agua. Las raíces sufrieron y la planta retrocede dos estados." },
  { name:"Crecimiento excelente", icon:"🌱", kind:"good", delta: 2, message:"¡Gran suerte! Las condiciones fueron excelentes y la planta avanza dos estados." }
];

const stages = {
  0:{title:"Planta muerta", detail:"La planta ya no pudo recuperarse.", img:"images/estado_0_muerta.png"},
  1:{title:"Casi muerta", detail:"La planta está en estado crítico.", img:"images/estado_1_casi_muerta.png"},
  2:{title:"Marchita", detail:"La planta está muy debilitada.", img:"images/estado_2_marchita.png"},
  3:{title:"Estresada", detail:"La planta muestra signos de estrés.", img:"images/estado_3_estresada.png"},
  4:{title:"Plántula", detail:"Plántula saludable", img:"images/estado_4_plantula.png"},
  5:{title:"Planta joven", detail:"La planta joven está creciendo.", img:"images/estado_5_joven.png"},
  6:{title:"Crecimiento medio", detail:"La planta se desarrolla bien.", img:"images/estado_6_crecimiento.png"},
  7:{title:"Planta madura", detail:"La planta está cerca de lograrlo.", img:"images/estado_7_madura.png"},
  8:{title:"Planta excelente", detail:"¡Cultivo completamente desarrollado!", img:"images/estado_8_victoria.png"}
};

let plantStage = 4;
let spins = 0;
let spinning = false;
let finished = false;
let endAnimationActive = false;
let currentRotation = 0;
let currentImage = stages[4].img;

const $ = id => document.getElementById(id);
const sonidoCorrecto = new Audio("sonidos/correcto.mp3");
const sonidoIncorrecto = new Audio("sonidos/incorrecto.mp3");
const sonidoGanadorFinal = new Audio("sonidos/ganador_final.mp3");
const sonidoPerdedorFinal = new Audio("sonidos/perdedor_trompeta.mp3");
sonidoCorrecto.preload = "auto";
sonidoIncorrecto.preload = "auto";
sonidoGanadorFinal.preload = "auto";
sonidoPerdedorFinal.preload = "auto";

function reproducirSonidoResultado(tipo){
  const audio = tipo === "good" ? sonidoCorrecto : sonidoIncorrecto;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(()=>{});
}

function reproducirSonidoFinal(win){
  const audio = win ? sonidoGanadorFinal : sonidoPerdedorFinal;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(()=>{});
}

const wheel = $("wheel");
const spinButton = $("spinButton");
const plantImage = $("plantImage");
const plantStageBox = document.querySelector(".plant-stage");
const resultCard = $("resultCard");
const endOverlay = $("endOverlay");
const endCard = $("endCard");

function safeSetText(id, text){
  const el = $(id);
  if(el) el.textContent = text;
}

function randomEventIndex(){
  if(window.crypto && window.crypto.getRandomValues){
    const value = new Uint8Array(1);
    window.crypto.getRandomValues(value);
    return value[0] % events.length;
  }
  return Math.floor(Math.random()*events.length);
}
function desiredRotationFor(index){ return (360 - index*45) % 360; }

function spinWheel(forcedKind=null){
  if(endAnimationActive) return;
  if(finished){ restartGame(); return; }
  if(spinning) return;

  spinning = true;
  spinButton.classList.remove("attention");
  spinButton.disabled = true;
  spinButton.textContent = "🎡 GIRANDO...";

  if(resultCard){
    resultCard.className = "result-card neutral visually-hidden";
  }
  safeSetText("resultKind", "LA RULETA ESTÁ GIRANDO");
  safeSetText("resultTitle", "Espera el resultado");
  safeSetText("resultMessage", "La suerte está decidiendo qué ocurrirá con la planta...");
  safeSetText("resultIcon", "🎡");

  let index;
  if(forcedKind==="good" || forcedKind==="bad"){
    const candidates = events
      .map((event,i)=>({event,i}))
      .filter(item=>item.event.kind===forcedKind)
      .map(item=>item.i);
    index = candidates[Math.floor(Math.random()*candidates.length)];
  }else{
    index = randomEventIndex();
  }
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const desired = desiredRotationFor(index);
  const delta = (desired - currentMod + 360) % 360;
  currentRotation += 6*360 + delta;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(()=> applyEvent(index), 3720);
}

function applyEvent(index){
  const event = events[index];
  reproducirSonidoResultado(event.kind);
  spins++;
  safeSetText("spinCount", `Giros: ${spins}`);
  safeSetText("lastEvent", `${event.icon} ${event.name}`);

  if(resultCard){
    resultCard.className = `result-card ${event.kind} visually-hidden`;
  }
  safeSetText("resultIcon", event.icon);
  safeSetText("resultKind", event.kind==="good" ? "RESULTADO FAVORABLE" : "MAL RESULTADO");
  safeSetText("resultTitle", event.name);
  safeSetText("resultMessage", event.message);

  safeSetText("floatingIcon", event.icon);
  safeSetText("floatingText", event.kind==="good" ? "La planta mejora" : "La planta se debilita");

  flash(event.kind);

  let next = plantStage + event.delta;

  if(next <= 0){
    plantStage = 0;
    updatePlant();
    setTimeout(()=>finishGame(false,event),900);
    return;
  }

  plantStage = Math.min(8,next);
  updatePlant();

  if(plantStage >= 8){
    setTimeout(()=>finishGame(true,event),950);
    return;
  }

  spinning = false;
  spinButton.disabled = false;
  spinButton.textContent = "🎡 GIRAR RULETA";
}

function flash(kind){
  const el = kind==="good" ? $("goodFlash") : $("badFlash");
  el.classList.remove("animate");
  void el.offsetWidth;
  el.classList.add("animate");
  setTimeout(()=>el.classList.remove("animate"),1200);
}

function updatePlant(){
  const stage = stages[plantStage];
  safeSetText("plantTitle", stage.title);
  safeSetText("progressState", stage.detail);
  safeSetText("stageName", `Estado: ${stage.title}`);

  const pct = plantStage===0 ? 0 : Math.round(plantStage/8*100);
  safeSetText("progressText", `${pct}%`);
  $("progressFill").style.width = plantStage===0 ? "0%" : `${((plantStage-1)/7)*100}%`;

  const lifeBadge = $("lifeBadge");
  if(plantStage===0){
    lifeBadge.textContent = "🥀 Muerta";
    lifeBadge.className = "life-badge dead";
    plantStageBox.classList.add("dead");
  }else if(plantStage<=2){
    lifeBadge.textContent = "🚨 En peligro";
    lifeBadge.className = "life-badge danger";
    plantStageBox.classList.remove("dead");
  }else if(plantStage===3){
    lifeBadge.textContent = "⚠️ Estresada";
    lifeBadge.className = "life-badge warning";
    plantStageBox.classList.remove("dead");
  }else{
    lifeBadge.textContent = "🌿 Viva";
    lifeBadge.className = "life-badge healthy";
    plantStageBox.classList.remove("dead");
  }

  document.querySelectorAll(".stage-dot").forEach(dot=>{
    const n = Number(dot.dataset.stage);
    dot.classList.toggle("active", n===plantStage);
    dot.classList.toggle("passed", plantStage>0 && n<plantStage);
  });

  if(currentImage !== stage.img){
    plantStageBox.classList.add("changing");
    const preload = new Image();
    preload.onload = ()=>{
      plantImage.src = stage.img;
      currentImage = stage.img;
      setTimeout(()=>plantStageBox.classList.remove("changing"), 80);
    };
    preload.src = stage.img;
  }
}


function startVictoryConfetti(){
  const old = document.querySelector(".confetti-layer");
  if(old) old.remove();

  const layer = document.createElement("div");
  layer.className = "confetti-layer";

  const colors = ["#ff4d6d","#ffd166","#06d6a0","#118ab2","#9b5de5","#f15bb5","#fee440","#00bbf9"];

  for(let i=0;i<140;i++){
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random()*100 + "vw";
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.width = (6 + Math.random()*8) + "px";
    piece.style.height = (9 + Math.random()*14) + "px";
    piece.style.animationDuration = (2.8 + Math.random()*2.2) + "s";
    piece.style.animationDelay = (Math.random()*1.2) + "s";
    piece.style.setProperty("--drift", ((Math.random()-.5)*260) + "px");
    piece.style.setProperty("--spin", (540 + Math.random()*900) + "deg");
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
}

function stopVictoryConfetti(){
  const layer = document.querySelector(".confetti-layer");
  if(layer) layer.remove();
}

function finishGame(win,event){
  reproducirSonidoFinal(win);
  finished = true;
  spinning = false;
  endAnimationActive = true;
  spinButton.disabled = true;
  spinButton.textContent = "↻ JUGAR DE NUEVO";

  safeSetText("endSpins", spins);
  safeSetText("endStage", plantStage);

  if(win){
    endCard.className = "end-card win";
    endOverlay.classList.add("celebration");
    safeSetText("endIcon", "🏆");
    safeSetText("endTitle", "¡GANASTE!");
    safeSetText("endMessage", "¡FELICIDADES!");
    safeSetText("floatingIcon", "🏆");
    safeSetText("floatingText", "¡Cultivo logrado!");
    startVictoryConfetti();
  }else{
    endCard.className = "end-card lose";
    endOverlay.classList.add("lose-flash");
    safeSetText("endIcon", "🥀");
    safeSetText("endTitle", "LA PLANTA MURIÓ");
    safeSetText("endMessage", "PERDISTE");
    safeSetText("floatingIcon", "🥀");
    safeSetText("floatingText", "La planta murió");
  }

  setTimeout(()=>{
    endOverlay.classList.remove("hidden");
    setTimeout(()=>{
      endOverlay.classList.add("hidden");
      endOverlay.classList.remove("lose-flash");
      endOverlay.classList.remove("celebration");
      stopVictoryConfetti();
      endAnimationActive = false;
      spinButton.disabled = false;
      spinButton.classList.add("attention");
    }, 5000);
  }, 420);
}

function restartGame(){
  plantStage = 4;
  spins = 0;
  spinning = false;
  finished = false;
  endAnimationActive = false;

  safeSetText("spinCount", "Giros: 0");
  safeSetText("lastEvent", "Aún no giraste la ruleta");

  if(resultCard){
    resultCard.className = "result-card neutral visually-hidden";
  }
  safeSetText("resultIcon", "🎡");
  safeSetText("resultKind", "LISTO PARA JUGAR");
  safeSetText("resultTitle", "Gira la ruleta");
  safeSetText("resultMessage", "La planta comienza como una pequeña plántula. La suerte decidirá cómo evoluciona.");

  safeSetText("floatingIcon", "🌱");
  safeSetText("floatingText", "Comienza el cultivo");

  endOverlay.classList.add("hidden");
  endOverlay.classList.remove("lose-flash");
  endOverlay.classList.remove("celebration");
  stopVictoryConfetti();
  spinButton.classList.remove("attention");
  spinButton.textContent = "🎡 GIRAR RULETA";
  spinButton.disabled = false;

  updatePlant();
}

Object.values(stages).forEach(stage=>{
  const img = new Image();
  img.src = stage.img;
});

spinButton.addEventListener("click", spinWheel);
updatePlant();



// ============================================================
// CONTROL CON TECLA ESPACIO
// Espacio = acciona el mismo botón principal:
// - GIRAR RULETA durante el juego.
// - JUGAR DE NUEVO cuando la partida terminó.
// ============================================================
document.addEventListener("keydown", (event)=>{
  if(event.code !== "Space" || event.repeat) return;

  // Evita que la barra espaciadora desplace la página.
  event.preventDefault();

  // Ejecuta exactamente la misma acción que el botón principal.
  if(!spinButton.disabled){
    spinButton.click();
  }
});



// ============================================================
// BOTÓN DE PANTALLA COMPLETA
// ============================================================
const fullscreenButton = document.getElementById("fullscreenButton");

function getFullscreenElement(){
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function isFullscreen(){
  return !!getFullscreenElement();
}

async function requestFullscreenFor(element){
  if(element.requestFullscreen){
    await element.requestFullscreen();
  }else if(element.webkitRequestFullscreen){
    element.webkitRequestFullscreen();
  }else if(element.msRequestFullscreen){
    element.msRequestFullscreen();
  }
}

async function exitFullscreenSafe(){
  if(document.exitFullscreen){
    await document.exitFullscreen();
  }else if(document.webkitExitFullscreen){
    document.webkitExitFullscreen();
  }else if(document.msExitFullscreen){
    document.msExitFullscreen();
  }
}

async function toggleFullscreen(){
  try{
    if(isFullscreen()){
      await exitFullscreenSafe();
    }else{
      const root = document.documentElement;
      await requestFullscreenFor(root);
    }
  }catch(error){
    console.warn("No se pudo cambiar el modo de pantalla completa.", error);
  }finally{
    setTimeout(updateFullscreenButton, 120);
  }
}

function updateFullscreenButton(){
  if(!fullscreenButton) return;
  const active = isFullscreen();
  fullscreenButton.setAttribute("aria-label", active ? "Salir de pantalla completa" : "Pantalla completa");
  fullscreenButton.title = active ? "Salir de pantalla completa" : "Pantalla completa";
  fullscreenButton.textContent = active ? "SALIR DE PANTALLA COMPLETA" : "PANTALLA COMPLETA";
}

if(fullscreenButton){
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
  document.addEventListener("msfullscreenchange", updateFullscreenButton);

  document.addEventListener("keydown", (event)=>{
    if(event.repeat) return;
    if(event.key && event.key.toLowerCase() === "p"){
      event.preventDefault();
      fullscreenButton.click();
    }
  });

  updateFullscreenButton();
}
