// oracolo.js – il cervello dell'oracolo: nessuna grafica qui dentro
import { leggi, scrivi } from './memoria.js';
 
let dati = null;                   // l'archivio delle profezie, caricato una volta sola
const mazzi = leggi('mazzi', {});  // i mazzi mescolati (solo gli id), ricordati dal telefono
 
// 1. Carica il file delle risposte (il percorso è relativo alla PAGINA)
export async function caricaDati() {
  const risposta = await fetch('data/risposte.json');
  dati = await risposta.json();
  return dati;
}
 
// 2. Trasforma la domanda in un elenco di parole pulite
//    "È vero che Luca mi AMA?" → ["e", "vero", "che", "luca", "mi", "ama"]
export function normalizza(testo) {
  return testo
    .toLowerCase()                       // tutto minuscolo
    .normalize('NFD')                    // separa le lettere dagli accenti
    .replace(/[\u0300-\u036f]/g, '')     // butta via gli accenti
    .replace(/[^a-z0-9]/g, ' ')          // tutto ciò che non è lettera o cifra diventa spazio
    .split(' ')                          // spezza sugli spazi
    .filter(parola => parola !== '');    // toglie i pezzi vuoti
}
 
// 3a. Una parola corrisponde a una chiave?
//     "fidanzat*" (con asterisco) = prefisso: va bene fidanzato, fidanzata...
//     "ricca" (senza asterisco)   = parola esatta: "riccardo" NON va bene
function corrisponde(parola, chiave) {
  if (chiave.endsWith('*')) {
    return parola.startsWith(chiave.slice(0, -1));   // chiave senza l'ultimo carattere
  }
  return parola === chiave;
}
 
// 3b. Conta quante parole della domanda corrispondono ad almeno una chiave
function contaCorrispondenze(parole, chiavi) {
  let conteggio = 0;
  for (const parola of parole) {
    if (chiavi.some(chiave => corrisponde(parola, chiave))) {
      conteggio = conteggio + 1;
    }
  }
  return conteggio;
}
 
// 4. Decide di che tipo è la domanda
export function classifica(domanda) {
  const parole = normalizza(domanda);
 
  if (parole.join('').length < 5) return 'vuota';
  if (contaCorrispondenze(parole, dati.parole_vietate) > 0) return 'rimprovero';
  if (contaCorrispondenze(parole, dati.speciali.salute.parole) > 0) return 'salute';
 
  const puntiAmore = contaCorrispondenze(parole, dati.categorie.amore.parole);
  const puntiDenaro = contaCorrispondenze(parole, dati.categorie.denaro.parole);
 
  if (puntiAmore > puntiDenaro) return 'amore';
  if (puntiDenaro > puntiAmore) return 'denaro';
  return 'destino';                      // nessuna parola, oppure parità
}
 
// 5. Un elemento a caso da una lista
function casuale(lista) {
  const posizione = Math.floor(Math.random() * lista.length);
  return lista[posizione];
}
 
// 6. Mescola una lista come un mazzo di carte (algoritmo di Fisher-Yates)
function mescola(lista) {
  const copia = lista.slice();           // lavoriamo su una copia
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const appoggio = copia[i];           // scambia la carta i con la carta j
    copia[i] = copia[j];
    copia[j] = appoggio;
  }
  return copia;
}
 
// 7. Pesca dal mazzo indicato; se è vuoto lo rimescola. Il mazzo viene salvato
function pesca(chiaveMazzo, risposte) {
  let mazzo = mazzi[chiaveMazzo];
  if (!mazzo || mazzo.length === 0) {
    mazzo = mescola(risposte.map(r => r.id));   // un mazzo nuovo fatto di soli id
  }
  const id = mazzo.pop();                       // toglie l'ultima carta
  mazzi[chiaveMazzo] = mazzo;
  scrivi('mazzi', mazzi);                       // il telefono si ricorda a che punto siamo
 
  const scelta = risposte.find(r => r.id === id);
  if (scelta) return scelta;
  return casuale(risposte);                     // id non più presente (archivio modificato): ripiego
}
 
// 8. La funzione principale: dalla domanda alla profezia
export function profetizza(domanda, nome, idCarta) {
  const carta = dati.carte.find(c => c.id === idCarta);
  const tipo = classifica(domanda);
  const nomeGiocatore = nome.trim() || 'Viandante';
 
  let testo;
  let consumaGettone = true;
 
  if (tipo === 'vuota') {
    testo = casuale(dati.speciali.vuota.risposte);
    consumaGettone = false;
  } else if (tipo === 'rimprovero' || tipo === 'salute') {
    testo = casuale(dati.speciali[tipo].risposte);
  } else {
    const candidate = dati.categorie[tipo].risposte.filter(r => r.tono === carta.tono);
    testo = pesca(`${tipo}-${carta.tono}`, candidate).testo;
  }
 
  return {
    tipo: tipo,
    carta: carta,
    testo: testo.replaceAll('{nome}', nomeGiocatore),
    consumaGettone: consumaGettone
  };
}
 
// 9. Tre carte diverse, prese a caso dalle sette
export function treCarteCoperte() {
  return mescola(dati.carte).slice(0, 3);
}
 
// 10. Una delle risposte per la domanda vuota o troppo corta
export function rispostaVuota() {
  return casuale(dati.speciali.vuota.risposte);
}
 
