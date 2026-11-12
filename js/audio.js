// audio.js – i suoni della cabina, generati dal codice (nessun file, nessun diritto d'autore)
import { leggi, scrivi } from './memoria.js';
 
let ctx = null;                        // il "mixer" audio: nasce al primo tocco
let attivo = leggi('audio', true);     // preferenza ricordata dal telefono
let ronzio = null;                     // il ronzio del rito, mentre suona
 
export function audioAttivo() {
  return attivo;
}
 
export function impostaAudio(valore) {
  attivo = valore;
  scrivi('audio', valore);
  if (!valore) fermaRonzio();
}
 
// I telefoni tengono l'audio bloccato finché l'utente non tocca lo schermo:
// questa funzione va chiamata dentro un tocco
export function sbloccaAudio() {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (errore) {
    ctx = null;                        // audio non disponibile: il gioco va avanti in silenzio
  }
}
 
function pronto() {
  return attivo && ctx !== null;
}
 
// Il mattone di tutti i suoni: una nota con volume che sale di colpo e si spegne piano
function nota(frequenza, inizio, durata, forma, volume) {
  const oscillatore = ctx.createOscillator();
  const volumeNota = ctx.createGain();
  oscillatore.type = forma;                         // 'sine', 'triangle', 'square', 'sawtooth'
  oscillatore.frequency.value = frequenza;          // in Hertz: 440 = il La
  volumeNota.gain.setValueAtTime(0.0001, inizio);
  volumeNota.gain.exponentialRampToValueAtTime(volume, inizio + 0.01);   // attacco
  volumeNota.gain.exponentialRampToValueAtTime(0.0001, inizio + durata); // spegnimento
  oscillatore.connect(volumeNota).connect(ctx.destination);             // oscillatore → volume → altoparlante
  oscillatore.start(inizio);
  oscillatore.stop(inizio + durata + 0.05);
}
 
// Il carillon: quattro note che salgono, quando l'oracolo si sveglia
export function suonaCarillon() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const melodia = [784, 988, 1175, 1568];           // Sol, Si, Re, Sol
  melodia.forEach((frequenza, i) => nota(frequenza, t + i * 0.18, 0.7, 'sine', 0.15));
}
 
// La moneta: due tintinnii metallici ravvicinati
export function suonaMoneta() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  nota(1568, t, 0.25, 'triangle', 0.25);
  nota(2093, t + 0.08, 0.45, 'triangle', 0.2);
}
 
// Il gong della rivelazione: una nota grave con le sue armoniche, lunga
export function suonaGong() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  nota(110, t, 3.0, 'sine', 0.45);
  nota(221, t, 2.2, 'sine', 0.2);
  nota(332, t, 1.5, 'sine', 0.1);
  nota(523, t, 0.8, 'triangle', 0.06);
}
 
// Gli scatti della stampante: brevi colpetti, uno per ogni scatto del bigliettino
export function suonaScatti(quanti, intervalloSecondi) {
  if (!pronto()) return;
  const t = ctx.currentTime;
  for (let i = 0; i < quanti; i++) {
    nota(180, t + i * intervalloSecondi, 0.04, 'square', 0.12);
  }
}
 
// Il ronzio meccanico del rito: parte e continua finché non lo fermiamo
export function avviaRonzio() {
  if (!pronto() || ronzio) return;
  const t = ctx.currentTime;
  const oscillatore = ctx.createOscillator();
  const filtro = ctx.createBiquadFilter();
  const volume = ctx.createGain();
  oscillatore.type = 'sawtooth';
  oscillatore.frequency.value = 55;                 // molto grave
  filtro.type = 'lowpass';                          // lascia passare solo i bassi: un ronzio, non un ronzare
  filtro.frequency.value = 300;
  volume.gain.setValueAtTime(0.0001, t);
  volume.gain.exponentialRampToValueAtTime(0.12, t + 0.5);
  oscillatore.connect(filtro).connect(volume).connect(ctx.destination);
  oscillatore.start(t);
  ronzio = { oscillatore: oscillatore, volume: volume };
}
 
export function fermaRonzio() {
  if (!ronzio) return;
  const t = ctx.currentTime;
  ronzio.volume.gain.cancelScheduledValues(t);
  ronzio.volume.gain.setValueAtTime(ronzio.volume.gain.value, t);
  ronzio.volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);   // dissolvenza
  ronzio.oscillatore.stop(t + 0.45);
  ronzio = null;
}
 
