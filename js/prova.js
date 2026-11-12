// prova.js – collega il laboratorio al cervello dell'oracolo
import { caricaDati, profetizza } from './oracolo.js';

const campoNome = document.getElementById('nome');
const campoDomanda = document.getElementById('domanda');
const sceltaCarta = document.getElementById('carta');
const pulsante = document.getElementById('chiedi');
const esito = document.getElementById('esito');

// Aspettiamo che l'archivio sia caricato
const dati = await caricaDati();

// Riempiamo la tendina con le 7 carte
for (const carta of dati.carte) {
  const opzione = document.createElement('option');
  opzione.value = carta.id;
  opzione.textContent = `${carta.nome} (${carta.tono})`;
  sceltaCarta.append(opzione);
}

// Al click: chiediamo la profezia e mostriamo tutto
pulsante.addEventListener('click', () => {
  const r = profetizza(campoDomanda.value, campoNome.value, sceltaCarta.value);
  esito.textContent =
    `Tipo: ${r.tipo}\n` +
    `Carta: ${r.carta.nome} (${r.carta.tono})\n` +
    `Gettone consumato: ${r.consumaGettone}\n\n` +
    `${r.carta.frase}\n${r.testo}`;
});
