// app.js – la regia: la macchina a stati del gioco
import { caricaDati, classifica, profetizza, treCarteCoperte, rispostaVuota } from './oracolo.js';
import { gettoniRimasti, consumaGettone } from './gettoni.js';
import { leggiSessione, scriviSessione } from './memoria.js';
 
// Una pausa che si può "aspettare" con await (es. await attendi(1000) = 1 secondo)
const attendi = millisecondi => new Promise(risolvi => setTimeout(risolvi, millisecondi));
 
// ---------- Gli elementi della pagina ----------
const cabina = document.querySelector('.cabina');
const schermate = document.querySelectorAll('.schermata');
const rigaGettoni = document.getElementById('riga-gettoni');
const pulsanteSveglia = document.getElementById('sveglia');
const pulsanteInserisci = document.getElementById('inserisci');
const fessuraGettone = document.querySelector('.fessura-gettone');
const moduloNome = document.getElementById('modulo-nome');
const campoNome = document.getElementById('campo-nome');
const moduloDomanda = document.getElementById('modulo-domanda');
const campoDomanda = document.getElementById('campo-domanda');
const nomeDomanda = document.getElementById('nome-domanda');
const avvisoDomanda = document.getElementById('avviso-domanda');
const contenitoreCarte = document.getElementById('carte');
const bigliettoSimbolo = document.getElementById('biglietto-simbolo');
const bigliettoCarta = document.getElementById('biglietto-carta');
const bigliettoTesto = document.getElementById('biglietto-testo');
const pulsanteAncora = document.getElementById('ancora');
 
// ---------- I disegni: pezzi di SVG che riusano lo sprite ----------
function svgGettone() {
  return '<svg viewBox="0 0 60 60" aria-hidden="true"><use href="#gettone"/></svg>';
}
 
function svgRetro() {
  return '<svg viewBox="0 0 60 90" aria-hidden="true"><use href="#retro-carta"/></svg>';
}
 
function svgFronte(carta) {
  return `<svg viewBox="0 0 60 90" aria-hidden="true">
    <use href="#cornice-carta"/>
    <use href="#simbolo-${carta.id}"/>
    <text x="30" y="81" text-anchor="middle" font-size="8" fill="currentColor">${carta.nome}</text>
  </svg>`;
}
 
// ---------- I dati della partita in corso ----------
const partita = { nome: '', domanda: '', idCarta: '' };
 
// ---------- Il cuore: la macchina a stati ----------
function vaiA(stato) {
  // Mostra solo la schermata di questo stato
  for (const schermata of schermate) {
    schermata.hidden = schermata.dataset.stato !== stato;
  }
  // Il CSS può reagire allo stato: cabina accesa, rito più luminoso...
  cabina.dataset.stato = stato;
  cabina.classList.toggle('sveglio', stato !== 'dormiente' && stato !== 'esaurito');
 
  entraIn(stato);
}
 
// Cosa preparare quando si entra in ciascuno stato
function entraIn(stato) {
  switch (stato) {
    case 'dormiente':
      mostraGettoni();
      break;
    case 'nome':
      campoNome.value = '';
      break;
    case 'domanda':
      nomeDomanda.textContent = partita.nome;
      campoDomanda.value = '';
      avvisoDomanda.textContent = '';
      break;
    case 'carta':
      partita.idCarta = '';
      preparaCarte();
      break;
    case 'rito':
      eseguiRito();
      break;
  }
}
 
// Una moneta disegnata per ogni gettone rimasto
function mostraGettoni() {
  const quanti = gettoniRimasti();
  rigaGettoni.setAttribute('aria-label', `Gettoni di oggi: ${quanti}`);
  if (quanti === 0) {
    rigaGettoni.textContent = 'Nessun gettone per oggi';
  } else {
    rigaGettoni.innerHTML = svgGettone().repeat(quanti);
  }
}
 
// ---------- Le transizioni ----------
 
// Dormiente o biglietto → gettone oppure esaurito
function controllaGettoni() {
  if (gettoniRimasti() > 0) {
    vaiA('gettone');
  } else {
    vaiA('esaurito');
  }
}
 
// Gettone → nome (la prima volta nella sessione) oppure direttamente domanda
function inserisciGettone() {
  partita.nome = leggiSessione('nome', '');
  if (partita.nome) {
    vaiA('domanda');
  } else {
    vaiA('nome');
  }
}
 
// Nome → domanda
function confermaNome(evento) {
  evento.preventDefault();                       // niente ricarica della pagina
  partita.nome = campoNome.value.trim() || 'Viandante';
  scriviSessione('nome', partita.nome);
  vaiA('domanda');
}
 
// Domanda → carta, ma solo se la domanda è valida
function consegnaDomanda(evento) {
  evento.preventDefault();
  if (classifica(campoDomanda.value) === 'vuota') {
    avvisoDomanda.textContent = rispostaVuota(); // si resta qui, il gettone è salvo
    return;
  }
  partita.domanda = campoDomanda.value;
  vaiA('carta');
}
 
// Prepara tre carte coperte: ognuna ha due facce, retro e fronte
function preparaCarte() {
  contenitoreCarte.replaceChildren();            // svuota le carte della volta prima
  contenitoreCarte.classList.remove('scelta');
  for (const carta of treCarteCoperte()) {
    const bottone = document.createElement('button');
    bottone.className = 'carta';
    bottone.setAttribute('aria-label', 'Carta coperta');
    bottone.innerHTML = `
      <div class="carta-interno">
        <div class="faccia faccia-retro">${svgRetro()}</div>
        <div class="faccia faccia-fronte"></div>
      </div>`;
    bottone.addEventListener('click', () => scegliCarta(carta, bottone));
    contenitoreCarte.append(bottone);
  }
}
 
// Carta → rito
async function scegliCarta(carta, bottone) {
  if (partita.idCarta) return;                   // una carta è già stata scelta
  partita.idCarta = carta.id;
 
  // Il fronte viene disegnato solo ora: prima la carta è davvero "coperta"
  bottone.querySelector('.faccia-fronte').innerHTML = svgFronte(carta);
  bottone.dataset.tono = carta.tono;             // il CSS sceglie il colore del tono
  bottone.setAttribute('aria-label', carta.nome);
  bottone.classList.add('girata');               // il CSS la fa ruotare in 3D
  contenitoreCarte.classList.add('scelta');      // le altre si ritirano
 
  await attendi(1800);                           // il tempo di girarla e guardarla
  vaiA('rito');
}
 
// Rito → biglietto: qui la profezia viene estratta e il gettone consumato
async function eseguiRito() {
  await attendi(3500);                           // mani, luci, tremolio: il rito prende tempo
  const r = profetizza(partita.domanda, partita.nome, partita.idCarta);
  if (r.consumaGettone) {
    consumaGettone();
  }
  bigliettoSimbolo.innerHTML = svgFronte(r.carta);
  bigliettoSimbolo.dataset.tono = r.carta.tono;
  bigliettoCarta.textContent = r.carta.frase;
  bigliettoTesto.textContent = r.testo;
  vaiA('biglietto');
}
 
// ---------- Il gettone da trascinare nella fessura ----------
let trascinamento = null;          // null = nessun trascinamento in corso
let gettoneInViaggio = false;      // true mentre il gettone sta cadendo nella fessura
 
// Il centro di un elemento sullo schermo, in pixel
function centro(elemento) {
  const r = elemento.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
 
// Il punto (x, y) è sopra la fessura? Con un margine, perché il dito non è preciso
function sopraLaFessura(x, y) {
  const r = fessuraGettone.getBoundingClientRect();
  const margine = 30;
  return x > r.left - margine && x < r.right + margine &&
         y > r.top - margine && y < r.bottom + margine;
}
 
// Il dito (o il mouse) afferra il gettone
function afferraGettone(evento) {
  if (gettoneInViaggio) return;
  trascinamento = { inizioX: evento.clientX, inizioY: evento.clientY, dx: 0, dy: 0 };
  pulsanteInserisci.setPointerCapture(evento.pointerId);   // segui questo dito anche fuori dal gettone
  pulsanteInserisci.classList.add('in-mano');
}
 
// Il dito si muove: il gettone lo segue
function muoviGettone(evento) {
  if (!trascinamento) return;
  trascinamento.dx = evento.clientX - trascinamento.inizioX;
  trascinamento.dy = evento.clientY - trascinamento.inizioY;
  pulsanteInserisci.style.transform = `translate(${trascinamento.dx}px, ${trascinamento.dy}px)`;
  fessuraGettone.classList.toggle('pronta', sopraLaFessura(evento.clientX, evento.clientY));
}
 
// Il dito si stacca: dentro la fessura, oppure torna al suo posto
async function lasciaGettone(evento) {
  if (!trascinamento) return;
  const dx = trascinamento.dx;
  const dy = trascinamento.dy;
  trascinamento = null;
  pulsanteInserisci.classList.remove('in-mano');
  fessuraGettone.classList.remove('pronta');
 
  const spostamento = Math.hypot(dx, dy);        // quanto si è mosso, in pixel
  if (spostamento < 10 || sopraLaFessura(evento.clientX, evento.clientY)) {
    await gettoneNellaFessura(dx, dy);           // un tocco, o lasciato sulla fessura
  } else {
    await gettoneAlPosto(dx, dy);                // lasciato altrove: torna indietro
  }
}
 
// Animazione: il gettone vola sopra la fessura e ci scivola dentro
async function gettoneNellaFessura(dx, dy) {
  gettoneInViaggio = true;
 
  // Dov'è la fessura rispetto alla posizione di partenza del gettone?
  const gettone = centro(pulsanteInserisci);     // include lo spostamento attuale
  const fessura = centro(fessuraGettone);
  const versoX = fessura.x - (gettone.x - dx);
  const versoY = fessura.y - (gettone.y - dy);
 
  const caduta = pulsanteInserisci.animate([
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: `translate(${versoX}px, ${versoY - 40}px) scale(0.5)`, offset: 0.6 },
    { transform: `translate(${versoX}px, ${versoY}px) scale(0.15)`, opacity: 0 }
  ], { duration: 700, easing: 'ease-in', fill: 'forwards' });
  await caduta.finished;
 
  // La fessura si illumina: il gettone è stato accettato
  await fessuraGettone.animate([
    { boxShadow: '0 0 0 #ffd36b' },
    { boxShadow: '0 0 20px #ffd36b' },
    { boxShadow: '0 0 0 #ffd36b' }
  ], { duration: 500 }).finished;
 
  inserisciGettone();                            // la macchina a stati va avanti
 
  // Rimettiamo il gettone a posto, pronto per la prossima volta (ora è nascosto)
  caduta.cancel();
  pulsanteInserisci.style.transform = '';
  gettoneInViaggio = false;
}
 
// Animazione: il gettone torna dov'era, con un piccolo rimbalzo
async function gettoneAlPosto(dx, dy) {
  await pulsanteInserisci.animate([
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: 'translate(0, 0)' }
  ], { duration: 400, easing: 'cubic-bezier(0.3, 1.6, 0.6, 1)' }).finished;
  pulsanteInserisci.style.transform = '';
}
 
// Dalla tastiera (Invio sul gettone) non si può trascinare: lo inseriamo noi
function gettoneDaTastiera(evento) {
  if (evento.detail === 0 && !gettoneInViaggio) {   // detail 0 = click senza dito né mouse
    gettoneNellaFessura(0, 0);
  }
}
 
// ---------- Colleghiamo gli eventi ----------
pulsanteSveglia.addEventListener('click', controllaGettoni);
pulsanteInserisci.addEventListener('pointerdown', afferraGettone);
pulsanteInserisci.addEventListener('pointermove', muoviGettone);
pulsanteInserisci.addEventListener('pointerup', lasciaGettone);
pulsanteInserisci.addEventListener('pointercancel', lasciaGettone);
pulsanteInserisci.addEventListener('click', gettoneDaTastiera);
moduloNome.addEventListener('submit', confermaNome);
moduloDomanda.addEventListener('submit', consegnaDomanda);
pulsanteAncora.addEventListener('click', controllaGettoni);
 
// ---------- Avvio ----------
await caricaDati();
vaiA('dormiente');
 
