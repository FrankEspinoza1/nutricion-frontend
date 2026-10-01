# El frontend son archivos estaticos: no necesita Node en produccion.
# Se sirven con Nginx, que es un servidor web ligero y muy eficiente.
FROM nginx:alpine

# Se copian los archivos del sitio a la carpeta que Nginx publica
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js     /usr/share/nginx/html/

# Nginx escucha por el puerto 80 dentro del contenedor
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
