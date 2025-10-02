# 🚀 Quick Start Guide

## Inicio Rápido (5 minutos)

### 1. Instalar dependencias

```bash
pnpm install
# o: npm install
```

### 2. Configurar .env

```bash
cp .env.example .env
# Edita .env y cambia API_SECRET_KEY por una clave segura
```

### 3. Iniciar servidor

```bash
pnpm dev
# o: npm run dev
```

### 4. Abrir interfaz web

```
http://localhost:3000
```

### 5. Configurar API Key en la interfaz

1. Click en "Configuración" en la interfaz
2. Ingresa el mismo API_SECRET_KEY del .env
3. Guarda

### 6. Crear tu primera sesión

1. En la interfaz, completa el formulario "Nueva Sesión"
2. Ingresa un ID de cliente (ej: "mi-empresa")
3. Click en "Crear Sesión"
4. Se generará automáticamente un código QR

### 7. Escanear QR con WhatsApp

1. Abre WhatsApp en tu teléfono
2. Ve a: **Configuración → Dispositivos vinculados**
3. Toca **"Vincular dispositivo"**
4. Escanea el código QR mostrado en la interfaz

### 8. Enviar mensaje de prueba

1. Una vez conectado, selecciona la sesión en "Enviar Mensaje"
2. Ingresa un número con código de país (ej: 521234567890)
3. Escribe tu mensaje
4. Click en "Enviar Mensaje"

---

## 📝 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor con hot-reload
pnpm build           # Compilar TypeScript
pnpm start           # Producción

# Docker
docker-compose up -d         # Iniciar con Docker
docker-compose logs -f       # Ver logs
docker-compose down          # Detener

# Script de gestión
./manage.sh help            # Ver todos los comandos
./manage.sh status          # Ver estado
./manage.sh backup          # Backup de sesiones
```

---

## 🔗 URLs Importantes

- **Interfaz Web**: http://localhost:3000
- **Configuración**: http://localhost:3000/config.html
- **Health Check**: http://localhost:3000/api/health
- **API Docs**: Ver README.md

---

## 🆘 Problemas Comunes

### El servidor no inicia

```bash
# Verifica que el puerto 3000 esté libre
lsof -i :3000
# Si está ocupado, cámbialo en .env
```

### Error de API Key

```bash
# Verifica que el API_KEY en la interfaz coincida con el .env
cat .env | grep API_SECRET_KEY
```

### No aparece el QR

- Espera unos segundos después de crear la sesión
- Haz click en "Actualizar" en la lista de sesiones
- Haz click en "Ver QR"

### Sesión se desconecta

- No uses la misma sesión en múltiples dispositivos
- Revisa que el directorio `sessions/` tenga permisos correctos
- Verifica los logs: `docker-compose logs -f` o en la consola del servidor

---

## 📚 Más Información

- **README.md**: Documentación completa de la API
- **DEPLOY.md**: Guía de despliegue en producción
- **api-tests.http**: Tests de API con REST Client
- **examples.http**: Ejemplos prácticos paso a paso

---

**¡Listo! 🎉 Ya puedes gestionar múltiples instancias de WhatsApp.**
