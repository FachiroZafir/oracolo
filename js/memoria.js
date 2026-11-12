// memoria.js – l'unico file che parla con la memoria del telefono
//   permanente (localStorage): resta anche chiudendo l'app
//   sessione (sessionStorage): si cancella quando l'app viene chiusa

const PREFISSO = 'oracolo.';   // tutte le nostre chiavi iniziano così

function leggiDa(tipo, chiave, predefinito) {
  try {
    const archivio = tipo === 'sessione' ? sessionStorage : localStorage;
    const testo = archivio.getItem(PREFISSO + chiave);
    if (testo === null) return predefinito;      // mai salvato prima
    return JSON.parse(testo);                    // testo → oggetto
  } catch (errore) {
    return predefinito;                          // memoria non disponibile o dato rovinato
  }
}

function scriviIn(tipo, chiave, valore) {
  try {
    const archivio = tipo === 'sessione' ? sessionStorage : localStorage;
    archivio.setItem(PREFISSO + chiave, JSON.stringify(valore));   // oggetto → testo
  } catch (errore) {
    // memoria non disponibile (es. navigazione privata): si gioca senza ricordare
  }
}

export function leggi(chiave, predefinito) { return leggiDa('permanente', chiave, predefinito); }
export function scrivi(chiave, valore) { scriviIn('permanente', chiave, valore); }
export function leggiSessione(chiave, predefinito) { return leggiDa('sessione', chiave, predefinito); }
export function scriviSessione(chiave, valore) { scriviIn('sessione', chiave, valore); }
