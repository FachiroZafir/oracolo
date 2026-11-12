
// prova.js – collega il laboratorio al cervello, ai gettoni e alla memoria
import { caricaDati, profetizza } from './oracolo.js';
import { gettoniRimasti, consumaGettone } from './gettoni.js';
import { leggiSessione, scriviSessione, scrivi } from './memoria.js';
 
const campoNome = document.getElementById('nome');
const campoDomanda = document.getElementById('domanda');
const sceltaCarta = document.getElementById('carta');
const pulsante = document.getElementById('chiedi');
const pulsanteMezzanotte = document.getElementById('mezzanotte');
const campoGettoni = document.getElementById('gettoni');
const esito = document.getElementById('esito');
 
function mostraGettoni() {
  campoGettoni.textContent = `Gettoni rimasti oggi: ${gettoniRimasti()}`;
}
 
// Aspettiamo che l'archivio sia caricato
const dati = await caricaDati();
 
// Riempiamo la tendina con le 7 carte
for (const carta of dati.carte) {
  const opzione = document.createElement('option');
  opzione.value = carta.id;
  opzione.textContent = `${carta.nome} (${carta.tono})`;
  sceltaCarta.append(opzione);
}
 
// Il nome resta finché l'app non viene chiusa
campoNome.value = leggiSessione('nome', '');
mostraGettoni();
 
// Al click: controlliamo i gettoni, chiediamo la profezia, mostriamo tutto
pulsante.addEventListener('click', () => {
  if (gettoniRimasti() === 0) {
    esito.textContent = "L'oracolo dorme. Torna domani, viandante.";
    return;                                     // esce subito: niente profezia
  }
 
  scriviSessione('nome', campoNome.value.trim());
  const r = profetizza(campoDomanda.value, campoNome.value, sceltaCarta.value);
 
  if (r.consumaGettone) {
    consumaGettone();
  }
  mostraGettoni();
 
  esito.textContent =
    `Tipo: ${r.tipo}\n` +
    `Carta: ${r.carta.nome} (${r.carta.tono})\n` +
    `Gettone consumato: ${r.consumaGettone}\n\n` +
    `${r.carta.frase}\n${r.testo}`;
});
 
// Solo per il laboratorio: finge che l'ultimo azzeramento sia di tanto tempo fa
pulsanteMezzanotte.addEventListener('click', () => {
  scrivi('gettoni', { rimasti: 0, data: '2000-01-01' });
  mostraGettoni();
});
