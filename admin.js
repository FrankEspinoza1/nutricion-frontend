/* =====================================================================
   Componente FRONTEND - Panel del nutricionista
   Proyecto Nutricion Sin Enredos - Grupo 2

   Consume los mismos endpoints que la pagina publica, pero expone las
   operaciones de gestion: cambiar el estado de una cita y administrar
   el catalogo de servicios.
   ===================================================================== */

const API_BASE = 'https://nutricion-sin-enredos.onrender.com';
const API_SERVICIOS = API_BASE + '/api/servicios';
const API_CITAS     = API_BASE + '/api/citas';

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'];

let filtroEstado = '';

/* ---------------------------------------------------------------------
   Utilidades
--------------------------------------------------------------------- */
function textoFecha(iso) {
  const f = new Date(iso + 'T12:00:00');
  if (isNaN(f.getTime())) return iso;
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

function aviso(id, texto, esError) {
  const el = document.getElementById(id);
  el.className = 'aviso ' + (esError ? 'error' : 'exito');
  el.textContent = texto;
  setTimeout(() => { el.textContent = ''; }, 3500);
}

/* ---------------------------------------------------------------------
   Resumen del panel
--------------------------------------------------------------------- */
async function cargarResumen() {
  try {
    const r = await fetch(API_CITAS + '/resumen');
    const d = await r.json();
    const valores = [d.total, d.pendientes, d.confirmadas, d.citasHoy];
    document.querySelectorAll('#resumen .tarjeta-dato strong')
      .forEach((el, i) => el.textContent = valores[i] ?? 0);
  } catch (error) {
    // El resumen es informativo: si falla, el panel sigue operativo
  }
}

/* ---------------------------------------------------------------------
   Citas
--------------------------------------------------------------------- */
async function cargarCitas() {
  const tabla = document.getElementById('tablaCitas');
  tabla.innerHTML = '<tr><td colspan="6" class="vacio">Cargando citas...</td></tr>';

  try {
    const url = filtroEstado ? `${API_CITAS}?estado=${filtroEstado}` : API_CITAS;
    const respuesta = await fetch(url);
    const citas = await respuesta.json();

    if (!citas.length) {
      tabla.innerHTML = '<tr><td colspan="6" class="vacio">No hay citas que mostrar.</td></tr>';
      return;
    }

    tabla.innerHTML = citas.map(c => `
      <tr>
        <td>
          <strong>${textoFecha(c.fecha)}</strong><br>
          <span style="color:var(--gris);font-size:.85rem">${c.hora}</span>
        </td>
        <td>${c.paciente}</td>
        <td style="font-size:.85rem;color:var(--gris)">
          ${c.telefono}<br>${c.correo}
        </td>
        <td style="font-size:.88rem">${c.servicio ? c.servicio.nombre : '—'}</td>
        <td><span class="estado ${c.estado}">${c.estado}</span></td>
        <td style="white-space:nowrap">
          ${c.estado !== 'confirmada'
            ? `<button class="btn btn-verde btn-sm" onclick="cambiarEstado('${c._id}','confirmada')">Confirmar</button>` : ''}
          ${c.estado !== 'cancelada'
            ? `<button class="btn btn-borde btn-sm" onclick="cambiarEstado('${c._id}','cancelada')">Cancelar</button>` : ''}
        </td>
      </tr>
    `).join('');

  } catch (error) {
    tabla.innerHTML = '<tr><td colspan="6" class="vacio">No se pudo conectar con el servidor.</td></tr>';
  }
}

async function cambiarEstado(id, estado) {
  if (estado === 'cancelada' && !confirm('¿Cancelar esta cita? El horario quedará libre nuevamente.')) return;

  try {
    const r = await fetch(`${API_CITAS}/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    if (!r.ok) throw new Error();
    cargarCitas();
    cargarResumen();
  } catch (error) {
    alert('No se pudo actualizar el estado de la cita.');
  }
}

document.querySelectorAll('.filtro').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    filtroEstado = btn.dataset.estado;
    cargarCitas();
  };
});

/* ---------------------------------------------------------------------
   Servicios
--------------------------------------------------------------------- */
const campos = {
  id:          document.getElementById('idServicio'),
  nombre:      document.getElementById('nombre'),
  categoria:   document.getElementById('categoria'),
  descripcion: document.getElementById('descripcion'),
  precio:      document.getElementById('precio'),
  duracion:    document.getElementById('duracion')
};

function limpiarFormulario() {
  Object.values(campos).forEach(c => c.value = '');
  document.getElementById('tituloForm').textContent = 'Nuevo servicio';
  document.getElementById('btnGuardar').textContent = 'Guardar';
  document.getElementById('btnCancelar').style.display = 'none';
}

async function cargarServicios() {
  const tabla = document.getElementById('tablaServicios');
  try {
    const respuesta = await fetch(API_SERVICIOS);
    const servicios = await respuesta.json();

    if (!servicios.length) {
      tabla.innerHTML = '<tr><td colspan="4" class="vacio">Aún no hay servicios publicados.</td></tr>';
      return;
    }

    tabla.innerHTML = servicios.map(s => `
      <tr>
        <td>
          <strong>${s.nombre}</strong><br>
          <span style="color:var(--gris);font-size:.82rem">${s.categoria || 'General'}</span>
        </td>
        <td>S/ ${s.precio}</td>
        <td>${s.duracion} min</td>
        <td style="white-space:nowrap">
          <button class="btn btn-borde btn-sm" onclick="editarServicio('${s._id}')">Editar</button>
          <button class="btn btn-borde btn-sm" onclick="eliminarServicio('${s._id}')">Eliminar</button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    tabla.innerHTML = '<tr><td colspan="4" class="vacio">No se pudo conectar con el servidor.</td></tr>';
  }
}

document.getElementById('btnGuardar').onclick = async () => {
  const datos = {
    nombre:      campos.nombre.value.trim(),
    categoria:   campos.categoria.value.trim(),
    descripcion: campos.descripcion.value.trim(),
    precio:      Number(campos.precio.value),
    duracion:    Number(campos.duracion.value)
  };

  if (!datos.nombre || !datos.precio || !datos.duracion) {
    return aviso('avisoServicio', 'Completa nombre, precio y duración.', true);
  }

  const id = campos.id.value;
  try {
    const respuesta = await fetch(id ? `${API_SERVICIOS}/${id}` : API_SERVICIOS, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!respuesta.ok) throw new Error();

    aviso('avisoServicio', id ? 'Servicio actualizado.' : 'Servicio creado.', false);
    limpiarFormulario();
    cargarServicios();
  } catch (error) {
    aviso('avisoServicio', 'No se pudo guardar el servicio.', true);
  }
};

async function editarServicio(id) {
  try {
    const r = await fetch(`${API_SERVICIOS}/${id}`);
    const s = await r.json();

    campos.id.value = s._id;
    campos.nombre.value = s.nombre;
    campos.categoria.value = s.categoria || '';
    campos.descripcion.value = s.descripcion || '';
    campos.precio.value = s.precio;
    campos.duracion.value = s.duracion;

    document.getElementById('tituloForm').textContent = 'Editar servicio';
    document.getElementById('btnGuardar').textContent = 'Actualizar';
    document.getElementById('btnCancelar').style.display = 'block';
    window.scrollTo({ top: document.getElementById('servicios').offsetTop - 60, behavior: 'smooth' });
  } catch (error) {
    aviso('avisoServicio', 'No se pudo cargar el servicio.', true);
  }
}

async function eliminarServicio(id) {
  if (!confirm('¿Eliminar este servicio del catálogo?')) return;
  try {
    const r = await fetch(`${API_SERVICIOS}/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    aviso('avisoServicio', 'Servicio eliminado.', false);
    cargarServicios();
  } catch (error) {
    aviso('avisoServicio', 'No se pudo eliminar el servicio.', true);
  }
}

document.getElementById('btnCancelar').onclick = limpiarFormulario;

/* ---------------------------------------------------------------------
   Arranque
--------------------------------------------------------------------- */
cargarResumen();
cargarCitas();
cargarServicios();
