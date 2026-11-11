// 1. Troviamo nella pagina gli elementi che ci servono
const pulsante = document.getElementById('sveglia');
const insegna = document.querySelector('.insegna');
const cabina = document.querySelector('.cabina');

// 2. Lo stato dell'oracolo: all'inizio dorme
let sveglio = false;

// 3. La funzione che inverte lo stato e aggiorna la scena
function cambiaStato() {
  sveglio = !sveglio;

  if (sveglio) {
    insegna.textContent = 'Ti ascolto, viandante...';
    pulsante.textContent = "Lascia dormire l'oracolo";
    cabina.classList.add('sveglio');
  } else {
    insegna.textContent = 'Gran Fachiro Zafir';
    pulsante.textContent = "Sveglia l'oracolo";
    cabina.classList.remove('sveglio');
  }
}

// 4. Colleghiamo la funzione al tocco sul pulsante
pulsante.addEventListener('click', cambiaStato);
