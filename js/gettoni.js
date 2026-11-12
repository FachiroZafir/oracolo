// gettoni.js – 3 gettoni al giorno, che si rinnovano a mezzanotte
import { leggi, scrivi } from './memoria.js';

export const GETTONI_AL_GIORNO = 3;

// La data di oggi secondo l'orologio del telefono, es. "2026-11-12"
function oggi() {
  const adesso = new Date();
  const anno = adesso.getFullYear();
  const mese = String(adesso.getMonth() + 1).padStart(2, '0');   // i mesi partono da 0!
  const giorno = String(adesso.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

// Legge lo stato dei gettoni; se è cambiato il giorno, li ricarica
function statoAggiornato() {
  const stato = leggi('gettoni', null);
  if (stato === null || stato.data !== oggi()) {
    const nuovo = { rimasti: GETTONI_AL_GIORNO, data: oggi() };
    scrivi('gettoni', nuovo);
    return nuovo;
  }
  return stato;
}

export function gettoniRimasti() {
  return statoAggiornato().rimasti;
}

export function consumaGettone() {
  const stato = statoAggiornato();
  if (stato.rimasti > 0) {
    stato.rimasti = stato.rimasti - 1;
    scrivi('gettoni', stato);
  }
  return stato.rimasti;
}
