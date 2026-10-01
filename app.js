/* =====================================================================
   Componente FRONTEND de Nutricion Sin Enredos

   Este componente se despliega por separado del backend. Por eso la
   direccion de la API ya no es relativa: apunta al dominio completo
   del componente backend alojado en Render.
   ===================================================================== */

const API_BASE = 'https://nutricion-sin-enredos.onrender.com';
const API = API_BASE + '/api/servicios';

const tabla       = document.getElementById('tabla');
const aviso       = document.getElementById('aviso');
const tituloForm  = document.getElementById('tituloForm');
const btnGuardar  = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');

const campos = {
  id:          document.getElementById('idServicio'),
  nombre:      document.getElementById('nombre'),
  categoria:   document.getElementById('categoria'),
  descripcion: document.getElementById('descripcion'),
  precio:      document.getElementById('precio'),
  duracion:    document.getElementById('duracion')
};

function mostrarAviso(texto, esError) {
  aviso.className = 'small mt-3 ' + (esError ? 'text-danger' : 'text-success');
  aviso.textContent = texto;
  setTimeout(() => { aviso.textContent = ''; }, 3000);
}

function limpiarFormulario() {
  campos.id.value = '';
  campos.nombre.value = '';
  campos.categoria.value = '';
  campos.descripcion.value = '';
  campos.precio.value = '';
  campos.duracion.value = '';
  tituloForm.textContent = 'Nuevo servicio';
  btnGuardar.textContent = 'Guardar';
  btnCancelar.classList.add('d-none');
}

// LEER: carga la lista y la dibuja en la tabla
async function cargarServicios() {
  try {
    const respuesta = await fetch(API);
    const servicios = await respuesta.json();

    if (servicios.length === 0) {
      tabla.innerHTML = '<tr><td colspan="6" class="text-secondary small">Todavía no hay servicios registrados.</td></tr>';
      return;
    }

    tabla.innerHTML = servicios.map(s => `
      <tr>
        <td class="fw-semibold">${s.nombre}</td>
        <td class="small text-secondary">${s.categoria || '-'}</td>
        <td class="small text-secondary">${s.descripcion || '-'}</td>
        <td>S/ ${s.precio}</td>
        <td>${s.duracion} min</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary" onclick="editarServicio('${s._id}')">Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarServicio('${s._id}')">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    tabla.innerHTML = '<tr><td colspan="6" class="text-danger small">No se pudo conectar con el servidor de aplicación.</td></tr>';
  }
}

// CREAR o ACTUALIZAR
btnGuardar.onclick = async () => {
  const datos = {
    nombre:      campos.nombre.value.trim(),
    categoria:   campos.categoria.value.trim(),
    descripcion: campos.descripcion.value.trim(),
    precio:      Number(campos.precio.value),
    duracion:    Number(campos.duracion.value)
  };

  if (!datos.nombre || !datos.precio || !datos.duracion) {
    mostrarAviso('Completa nombre, precio y duración.', true);
    return;
  }

  const id = campos.id.value;
  const url = id ? API + '/' + id : API;
  const metodo = id ? 'PUT' : 'POST';

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    if (!respuesta.ok) throw new Error();

    mostrarAviso(id ? 'Servicio actualizado.' : 'Servicio creado.', false);
    limpiarFormulario();
    cargarServicios();
  } catch (error) {
    mostrarAviso('No se pudo guardar el servicio.', true);
  }
};

// Carga un servicio en el formulario para editarlo
async function editarServicio(id) {
  try {
    const respuesta = await fetch(API + '/' + id);
    const s = await respuesta.json();

    campos.id.value = s._id;
    campos.nombre.value = s.nombre;
    campos.categoria.value = s.categoria;
    campos.descripcion.value = s.descripcion;
    campos.precio.value = s.precio;
    campos.duracion.value = s.duracion;

    tituloForm.textContent = 'Editar servicio';
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    mostrarAviso('No se pudo cargar el servicio.', true);
  }
}

// ELIMINAR
async function eliminarServicio(id) {
  if (!confirm('¿Eliminar este servicio?')) return;
  try {
    const respuesta = await fetch(API + '/' + id, { method: 'DELETE' });
    if (!respuesta.ok) throw new Error();
    mostrarAviso('Servicio eliminado.', false);
    cargarServicios();
  } catch (error) {
    mostrarAviso('No se pudo eliminar el servicio.', true);
  }
}

btnCancelar.onclick = limpiarFormulario;

cargarServicios();
