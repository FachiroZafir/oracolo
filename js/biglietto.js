// biglietto.js – disegna il bigliettino su canvas e lo condivide come immagine
const LARGHEZZA = 900;
const ALTEZZA = 1100;
const COLORI = {
  cartoncino: '#f3d9a4',
  inchiostro: '#2b1a12',
  oro: '#a8781f',
  propizio: '#9a6b12',
  ammonitore: '#8e1c1c',
  enigmatico: '#4b3a8c'
};
 
let fileImmagine = null;   // l'ultimo bigliettino, pronto da condividere
 
// Trasforma il simbolo SVG della carta (preso dallo sprite) in un'immagine disegnabile
async function immagineSimbolo(carta, colore) {
  const forme = document.getElementById(`simbolo-${carta.id}`).innerHTML;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90" width="180" height="270" color="${colore}">${forme}</svg>`;
  const immagine = new Image();
  immagine.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await immagine.decode();             // aspetta che l'immagine sia pronta
  return immagine;
}
 
// Spezza un testo in righe che non superano larghezzaMax (il canvas non va a capo da solo)
function righe(ctx, testo, larghezzaMax) {
  const parole = testo.split(' ');
  const risultato = [];
  let riga = '';
  for (const parola of parole) {
    const prova = riga === '' ? parola : `${riga} ${parola}`;
    if (ctx.measureText(prova).width > larghezzaMax && riga !== '') {
      risultato.push(riga);            // la riga è piena: la chiudiamo
      riga = parola;                   // e la parola apre la successiva
    } else {
      riga = prova;
    }
  }
  if (riga !== '') risultato.push(riga);
  return risultato;
}
 
// Scrive più righe centrate, una sotto l'altra; restituisce dove è arrivato
function scriviRighe(ctx, testo, y, interlinea, larghezzaMax) {
  for (const riga of righe(ctx, testo, larghezzaMax)) {
    ctx.fillText(riga, LARGHEZZA / 2, y);
    y = y + interlinea;
  }
  return y;
}
 
// Un piccolo rombo decorativo
function rombo(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}
 
// Disegna il bigliettino: profezia = { nome, carta, testo }
export async function disegnaBiglietto(canvas, profezia) {
  canvas.width = LARGHEZZA;
  canvas.height = ALTEZZA;
  const ctx = canvas.getContext('2d');
  const coloreTono = COLORI[profezia.carta.tono];
  const centro = LARGHEZZA / 2;
 
  // 1. Il cartoncino e la doppia cornice
  ctx.fillStyle = COLORI.cartoncino;
  ctx.fillRect(0, 0, LARGHEZZA, ALTEZZA);
  ctx.strokeStyle = COLORI.oro;
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, LARGHEZZA - 48, ALTEZZA - 48);
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, LARGHEZZA - 88, ALTEZZA - 88);
  ctx.fillStyle = COLORI.oro;
  rombo(ctx, 44, 44, 12);
  rombo(ctx, LARGHEZZA - 44, 44, 12);
  rombo(ctx, 44, ALTEZZA - 44, 12);
  rombo(ctx, LARGHEZZA - 44, ALTEZZA - 44, 12);
 
  // 2. L'intestazione
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORI.inchiostro;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('GRAN FACHIRO ZAFIR', centro, 140);
  ctx.fillStyle = COLORI.oro;
  ctx.font = 'italic 36px Georgia, serif';
  ctx.fillText(`Profezia per ${profezia.nome}`, centro, 196);
  ctx.strokeStyle = COLORI.oro;
  ctx.beginPath();
  ctx.moveTo(160, 232);
  ctx.lineTo(LARGHEZZA - 160, 232);
  ctx.stroke();
 
  // 3. Il simbolo e il nome della carta
  const simbolo = await immagineSimbolo(profezia.carta, coloreTono);
  ctx.drawImage(simbolo, centro - 90, 250, 180, 270);
  ctx.fillStyle = coloreTono;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(profezia.carta.nome.toUpperCase(), centro, 560);
 
  // 4. La frase della carta e la profezia, che vanno a capo da sole
  ctx.fillStyle = COLORI.inchiostro;
  ctx.font = 'italic 36px Georgia, serif';
  let y = scriviRighe(ctx, profezia.carta.frase, 630, 48, LARGHEZZA - 200);
  ctx.font = '46px Georgia, serif';
  scriviRighe(ctx, profezia.testo, y + 50, 64, LARGHEZZA - 200);
 
  // 5. Il piede: data e avvertenza
  const data = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillStyle = COLORI.oro;
  ctx.font = '30px Georgia, serif';
  ctx.fillText(data, centro, ALTEZZA - 150);
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText("Solo per divertimento: l'oracolo non prevede il futuro", centro, ALTEZZA - 95);
 
  // 6. Prepariamo SUBITO il file, così la condivisione partirà al primo tocco
  const blob = await new Promise(risolvi => canvas.toBlob(risolvi, 'image/png'));
  fileImmagine = new File([blob], 'profezia-zafir.png', { type: 'image/png' });
}
 
// Il telefono sa condividere un'immagine?
export function condivisionePossibile() {
  return fileImmagine !== null && navigator.canShare !== undefined &&
         navigator.canShare({ files: [fileImmagine] });
}
 
// Condivide (WhatsApp, Telegram, mail…) oppure, se non si può, scarica l'immagine
export async function condividiBiglietto() {
  if (!fileImmagine) return;
  if (condivisionePossibile()) {
    try {
      await navigator.share({
        files: [fileImmagine],
        title: 'La mia profezia',
        text: 'Il Gran Fachiro Zafir ha parlato.'
      });
    } catch (errore) {
      // l'utente ha chiuso il pannello di condivisione: nulla da fare
    }
  } else {
    const indirizzo = URL.createObjectURL(fileImmagine);   // un indirizzo temporaneo per il file
    const link = document.createElement('a');
    link.href = indirizzo;
    link.download = fileImmagine.name;                     // "scarica" invece di "apri"
    link.click();
    setTimeout(() => URL.revokeObjectURL(indirizzo), 1000);
  }
}
 
