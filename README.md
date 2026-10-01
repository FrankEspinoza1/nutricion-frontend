# nutricion-frontend

Componente **frontend** del proyecto Nutricion Sin Enredos.
Instituto Certus - Grupo 2 - Evidencia 3 (AA3).

## Responsabilidad del componente

Contiene la interfaz que utiliza el usuario final. Se ejecuta por completo
en el navegador y no procesa informacion en el servidor: consume la API
del componente backend mediante peticiones HTTPS y muestra los resultados.

## Organizacion del codigo

```
nutricion-frontend/
├── index.html      Estructura de la pagina: formulario y tabla
├── styles.css      Estilos propios del proyecto
├── app.js          Logica de la interfaz y consumo de la API
└── Dockerfile      Definicion del contenedor (Nginx)
```

La separacion en tres archivos responde a las tres responsabilidades del
frontend: estructura, presentacion y comportamiento. `app.js` concentra
todas las llamadas a la API en una unica constante `API_BASE`, de modo que
cambiar la direccion del backend no obliga a modificar el resto del codigo.

## Comunicacion con el backend

El frontend esta alojado en un dominio distinto al del backend, por lo que
las peticiones son de origen cruzado. El backend las acepta porque tiene
habilitado CORS.

| Accion del usuario | Peticion que envia |
|---|---|
| Abrir la pagina | GET /api/servicios |
| Guardar un servicio | POST /api/servicios |
| Editar un servicio | PUT /api/servicios/:id |
| Eliminar un servicio | DELETE /api/servicios/:id |

## Tecnologias

HTML5, CSS3, JavaScript y Bootstrap 5.3. Contenedor basado en `nginx:alpine`.

## Despliegue

Desplegado en **Vercel**, que distribuye los archivos estaticos desde una
red de entrega de contenido. Al no ser un proceso en ejecucion, este
componente no se suspende por inactividad.

## Ejecucion local

Basta con abrir `index.html` en el navegador.

Con Docker:

```
docker build -t nutricion-frontend .
docker run -p 8080:80 nutricion-frontend
```
