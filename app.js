/* =====================================================================
   Componente FRONTEND - Pagina publica
   Proyecto Nutricion Sin Enredos - Grupo 2

   Este componente se ejecuta por completo en el navegador del usuario y
   consume la API del componente backend, alojado en otro dominio.
   ===================================================================== */

const API_BASE = 'https://nutricion-sin-enredos.onrender.com';
const API_SERVICIOS = API_BASE + '/api/servicios';
const API_CITAS     = API_BASE + '/api/citas';

// Numero de WhatsApp del consultorio (sin + ni espacios)
const WHATSAPP = '51944148838';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

let diasAtencion  = [1,2,3,4,5,6];
let mesVisible    = new Date();
let fechaElegida  = null;
let horaElegida   = null;
let servicios     = [];

/* ---------------------------------------------------------------------
   Utilidades
--------------------------------------------------------------------- */

// Devuelve la fecha en formato AAAA-MM-DD sin desplazamiento de zona horaria
function aISO(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

function textoFecha(fecha) {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()} de ${fecha.getFullYear()}`;
}

function mostrarAviso(texto, esError) {
  const aviso = document.getElementById('aviso');
  aviso.className = 'aviso ' + (esError ? 'error' : 'exito');
  aviso.textContent = texto;
  if (!esError) setTimeout(() => { aviso.textContent = ''; }, 4000);
}

/* ---------------------------------------------------------------------
   Catalogo de servicios
--------------------------------------------------------------------- */
async function cargarServicios() {
  const lista = document.getElementById('listaServicios');
  const select = document.getElementById('servicio');

  try {
    const respuesta = await fetch(API_SERVICIOS);
    servicios = await respuesta.json();

    if (!servicios.length) {
      lista.innerHTML = '<p class="vacio">Todavía no hay servicios publicados.</p>';
      select.innerHTML = '<option value="">No hay servicios disponibles</option>';
      return;
    }

    lista.innerHTML = servicios.map(s => `
      <article class="servicio">
        <div class="cat">${s.categoria || 'General'}</div>
        <h3>${s.nombre}</h3>
        <p>${s.descripcion || 'Consulta nutricional personalizada.'}</p>
        <div class="pie">
          <span class="precio">S/ ${s.precio}</span>
          <span class="duracion">${s.duracion} min</span>
        </div>
      </article>
    `).join('');

    select.innerHTML = '<option value="">Selecciona un servicio</option>' +
      servicios.map(s => `<option value="${s._id}">${s.nombre} — S/ ${s.precio}</option>`).join('');

  } catch (error) {
    lista.innerHTML = '<p class="vacio">No se pudo conectar con el servidor. Intenta recargar la página.</p>';
    select.innerHTML = '<option value="">Sin conexión</option>';
  }
}

/* ---------------------------------------------------------------------
   Configuracion de la agenda
--------------------------------------------------------------------- */
async function cargarConfiguracion() {
  try {
    const respuesta = await fetch(API_CITAS + '/configuracion');
    const config = await respuesta.json();
    if (Array.isArray(config.diasAtencion)) diasAtencion = config.diasAtencion;
  } catch (error) {
    // Si no responde, se mantienen los valores por defecto
  }
  dibujarCalendario();
}

/* ---------------------------------------------------------------------
   Calendario
--------------------------------------------------------------------- */
function dibujarCalendario() {
  const cal = document.getElementById('calendario');
  cal.innerHTML = '';

  document.getElementById('mesActual').textContent =
    MESES[mesVisible.getMonth()] + ' ' + mesVisible.getFullYear();

  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay();
  const totalDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 0; i < primerDia; i++) cal.appendChild(document.createElement('div'));

  for (let d = 1; d <= totalDias; d++) {
    const fecha = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d);
    const btn = document.createElement('button');
    btn.className = 'cal-dia';
    btn.textContent = d;

    const esPasado = fecha < hoy;
    const seAtiende = diasAtencion.includes(fecha.getDay());

    if (!esPasado && seAtiende) {
      btn.classList.add('libre');
      btn.onclick = () => {
        fechaElegida = fecha;
        horaElegida = null;
        dibujarCalendario();
        cargarHorarios(aISO(fecha));
        actualizarResumen();
      };
    } else {
      btn.classList.add('cerrado');
      btn.disabled = true;
    }

    if (fechaElegida && fecha.toDateString() === fechaElegida.toDateString()) {
      btn.classList.add('activo');
    }

    cal.appendChild(btn);
  }
}

/* ---------------------------------------------------------------------
   Horarios disponibles de un dia
--------------------------------------------------------------------- */
async function cargarHorarios(fechaISO) {
  const cont = document.getElementById('horarios');
  cont.innerHTML = '<span style="font-size:.88rem;color:var(--gris)">Consultando disponibilidad...</span>';

  try {
    const respuesta = await fetch(API_CITAS + '/disponibilidad/' + fechaISO);
    const datos = await respuesta.json();

    if (!datos.atiende) {
      cont.innerHTML = `<span style="font-size:.88rem;color:var(--gris)">${datos.motivo || 'Ese día no hay atención.'}</span>`;
      return;
    }

    cont.innerHTML = '';
    datos.horarios.forEach(h => {
      const btn = document.createElement('button');
      btn.className = 'hora' + (horaElegida === h.hora ? ' activo' : '');
      btn.textContent = h.hora;
      btn.disabled = !h.disponible;
      if (!h.disponible) btn.title = 'Horario ya reservado';
      btn.onclick = () => {
        horaElegida = h.hora;
        cargarHorarios(fechaISO);
        actualizarResumen();
      };
      cont.appendChild(btn);
    });

  } catch (error) {
    cont.innerHTML = '<span style="font-size:.88rem;color:var(--rojo)">No se pudo consultar la disponibilidad.</span>';
  }
}

/* ---------------------------------------------------------------------
   Resumen de la seleccion
--------------------------------------------------------------------- */
function actualizarResumen() {
  const r = document.getElementById('resumenCita');
  if (fechaElegida && horaElegida) {
    r.textContent = `Cita para el ${textoFecha(fechaElegida)} a las ${horaElegida}.`;
  } else if (fechaElegida) {
    r.textContent = `Fecha: ${textoFecha(fechaElegida)}. Ahora elige un horario.`;
  } else {
    r.textContent = 'Aún no has seleccionado fecha ni horario.';
  }
}

/* ---------------------------------------------------------------------
   Registro de la cita
--------------------------------------------------------------------- */
document.getElementById('btnReservar').onclick = async () => {
  const boton = document.getElementById('btnReservar');

  const datos = {
    servicio: document.getElementById('servicio').value,
    paciente: document.getElementById('paciente').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    correo:   document.getElementById('correo').value.trim(),
    motivo:   document.getElementById('motivo').value.trim(),
    fecha:    fechaElegida ? aISO(fechaElegida) : '',
    hora:     horaElegida || ''
  };

  if (!datos.fecha || !datos.hora) {
    return mostrarAviso('Selecciona una fecha y un horario en el calendario.', true);
  }
  if (!datos.servicio) {
    return mostrarAviso('Elige el servicio que deseas reservar.', true);
  }
  if (!datos.paciente || !datos.telefono || !datos.correo) {
    return mostrarAviso('Completa tu nombre, WhatsApp y correo.', true);
  }
  if (!/^\S+@\S+\.\S+$/.test(datos.correo)) {
    return mostrarAviso('El correo electrónico no tiene un formato válido.', true);
  }

  boton.disabled = true;
  boton.textContent = 'Registrando...';

  try {
    const respuesta = await fetch(API_CITAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      // 409 significa que alguien tomó ese horario mientras se completaba el formulario
      if (respuesta.status === 409) {
        cargarHorarios(datos.fecha);
        horaElegida = null;
        actualizarResumen();
      }
      throw new Error(resultado.mensaje || 'No se pudo registrar la cita');
    }

    mostrarConfirmacion(resultado);

  } catch (error) {
    mostrarAviso(error.message, true);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Confirmar reserva';
  }
};

/* ---------------------------------------------------------------------
   Pantalla de confirmacion
--------------------------------------------------------------------- */
function mostrarConfirmacion(cita) {
  document.getElementById('panelFormulario').style.display = 'none';
  document.getElementById('panelConfirmacion').style.display = 'block';

  const nombreServicio = cita.servicio?.nombre || 'Consulta';
  document.getElementById('detalleConfirmacion').textContent =
    `${nombreServicio} — ${textoFecha(new Date(cita.fecha + 'T12:00:00'))} a las ${cita.hora}.`;

  const texto =
    'Hola, acabo de reservar una cita.%0A' +
    `Nombre: ${cita.paciente}%0A` +
    `Servicio: ${nombreServicio}%0A` +
    `Fecha: ${cita.fecha}%0A` +
    `Hora: ${cita.hora}`;

  document.getElementById('btnWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${texto}`;
}

document.getElementById('btnNuevaReserva').onclick = () => {
  document.getElementById('panelConfirmacion').style.display = 'none';
  document.getElementById('panelFormulario').style.display = 'block';

  ['paciente','telefono','correo','motivo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('servicio').value = '';
  fechaElegida = null;
  horaElegida = null;
  dibujarCalendario();
  actualizarResumen();
  document.getElementById('horarios').innerHTML =
    '<span style="font-size:.88rem;color:var(--gris)">Selecciona primero una fecha.</span>';
};

/* ---------------------------------------------------------------------
   Navegacion del calendario y del menu
--------------------------------------------------------------------- */
document.getElementById('mesAnterior').onclick = () => {
  mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1);
  dibujarCalendario();
};
document.getElementById('mesSiguiente').onclick = () => {
  mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1);
  dibujarCalendario();
};
document.getElementById('navToggle').onclick = () => {
  document.getElementById('menu').classList.toggle('abierto');
};
document.getElementById('enlaceWhatsappPie').href = `https://wa.me/${WHATSAPP}`;

/* ---------------------------------------------------------------------
   Arranque
--------------------------------------------------------------------- */
cargarServicios();
cargarConfiguracion();
actualizarResumen();
