
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
 
// Prepara tre carte coperte
function preparaCarte() {
  contenitoreCarte.replaceChildren();            // svuota le carte della volta prima
  for (const carta of treCarteCoperte()) {
    const bottone = document.createElement('button');
    bottone.className = 'carta';
    bottone.innerHTML = svgRetro();
    bottone.setAttribute('aria-label', 'Carta coperta');
    bottone.addEventListener('click', () => scegliCarta(carta, bottone));
    contenitoreCarte.append(bottone);
  }
}
 
// Carta → rito
async function scegliCarta(carta, bottone) {
  if (partita.idCarta) return;                   // una carta è già stata scelta
  partita.idCarta = carta.id;
  bottone.innerHTML = svgFronte(carta);           // la carta si gira
  bottone.dataset.tono = carta.tono;             // il CSS sceglie il colore del tono
  bottone.setAttribute('aria-label', carta.nome);
  bottone.classList.add('girata');
  await attendi(1200);
  vaiA('rito');
}
 
// Rito → biglietto: qui la profezia viene estratta e il gettone consumato
async function eseguiRito() {
  await attendi(2500);
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
 
// ---------- Colleghiamo gli eventi ----------
pulsanteSveglia.addEventListener('click', controllaGettoni);
pulsanteInserisci.addEventListener('click', inserisciGettone);
moduloNome.addEventListener('submit', confermaNome);
moduloDomanda.addEventListener('submit', consegnaDomanda);
pulsanteAncora.addEventListener('click', controllaGettoni);
 
// ---------- Avvio ----------
await caricaDati();
vaiA('dormiente');
