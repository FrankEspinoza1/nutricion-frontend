/* =====================================================================
   interacciones.js  -  Nutricion Sin Enredos
   Proyecto Grupo 2 - Instituto Certus

   Interacciones de la interfaz de la pagina publica.

   Es un archivo independiente de app.js: no comparte variables ni
   funciones con el, de modo que si algo falla aqui, la reserva de
   citas sigue funcionando con normalidad.

   Contiene tres funciones:
     1. Boton de retorno al inicio
     2. Ano automatico en el pie de pagina
     3. Aparicion progresiva de las secciones al desplazarse
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. Boton de retorno al inicio

   El boton no esta escrito en el HTML: se crea desde aqui y se agrega
   al final del documento. Permanece oculto hasta que la persona baja
   mas de 400 pixeles.
--------------------------------------------------------------------- */
function crearBotonVolverArriba() {
  const boton = document.createElement('button');
  boton.className = 'volver-arriba';
  boton.setAttribute('aria-label', 'Volver al inicio de la pagina');
  boton.innerHTML = '&uarr;';

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.body.appendChild(boton);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      boton.classList.add('visible');
    } else {
      boton.classList.remove('visible');
    }
  });
}


/* ---------------------------------------------------------------------
   2. Ano automatico en el pie de pagina

   Evita tener que editar el HTML cada 1 de enero: el ano se toma de la
   fecha del sistema y se agrega al texto legal del pie.
--------------------------------------------------------------------- */
function actualizarAnoDelPie() {
  const pie = document.querySelector('.pie-legal');
  if (!pie) return;

  const ano = new Date().getFullYear();
  pie.textContent = pie.textContent.trim() + ' · ' + ano;
}


/* ---------------------------------------------------------------------
   3. Aparicion progresiva de las secciones

   Se usa IntersectionObserver, que avisa cuando un elemento entra en
   la pantalla.

   Importante: la clase que oculta el elemento se agrega desde aqui, no
   desde el HTML. Asi, si este archivo no llegara a cargarse, las
   secciones se verian igual que siempre en lugar de quedar invisibles.

   Si el navegador es antiguo y no reconoce IntersectionObserver, la
   funcion termina sin hacer nada y la pagina se muestra normal.
--------------------------------------------------------------------- */
function activarAparicionDeSecciones() {
  if (!('IntersectionObserver' in window)) return;

  const secciones = document.querySelectorAll('.seccion, .franja');
  if (!secciones.length) return;

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);   // una sola vez por seccion
      }
    });
  }, { threshold: 0.12 });

  secciones.forEach((seccion) => {
    seccion.classList.add('revelar');
    observador.observe(seccion);
  });
}


/* ---------------------------------------------------------------------
   Arranque

   Todo se ejecuta dentro de un try para que un error aqui no afecte al
   resto de la pagina.
--------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    crearBotonVolverArriba();
    actualizarAnoDelPie();
    activarAparicionDeSecciones();
  } catch (error) {
    console.warn('interacciones.js no pudo iniciarse:', error);
  }
});
