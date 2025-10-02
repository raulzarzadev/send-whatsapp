# WhatsApp Multi-Instance API 📱

API RESTful para gestionar múltiples instancias de WhatsApp usando [Baileys](https://github.com/WhiskeySockets/Baileys). Perfecto para empresas que necesitan conectar múltiples números de WhatsApp a diferentes clientes o aplicaciones.

## 🌟 Cara3. **Configurar**

```bash
git clone <tu-repositorio>
cd send-whatsapp
cp .env.example .env
nano .env  # Editar variables
```

4. **Ejecutar**

````bash
docker-compose up -d
# o con docker compose: docker compose up -d
```✅ **Multi-instancia**: Maneja múltiples sesiones de WhatsApp simultáneamente
- ✅ **API RESTful**: Endpoints fáciles de integrar
- ✅ **Gestión de QR**: Obtén códigos QR para autenticación
- ✅ **Persistencia**: Las sesiones se mantienen después de reiniciar
- ✅ **Autenticación**: Protección con API keys
- ✅ **Docker Ready**: Fácil despliegue con Docker y Docker Compose
- ✅ **TypeScript**: Código tipado y mantenible
- ✅ **Cloud Ready**: Listo para desplegar en cualquier nube

## 📋 Requisitos Previos

- Node.js 18+ o Docker
- pnpm (recomendado), npm o yarn
- Cuenta de WhatsApp para cada instancia

## 🚀 Instalación

### Opción 1: Instalación Local

1. **Clonar el repositorio**

```bash
git clone <tu-repositorio>
cd send-whatsapp
````

2. **Instalar dependencias**

```bash
pnpm install
# o con npm: npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
PORT=3000
API_SECRET_KEY=tu-clave-secreta-super-segura
LOG_LEVEL=info
SESSIONS_DIR=./sessions
```

4. **Ejecutar en desarrollo**

```bash
pnpm dev
# o con npm: npm run dev
```

5. **Compilar y ejecutar en producción**

```bash
pnpm build
pnpm start
# o con npm: npm run build && npm start
```

### Opción 2: Docker

1. **Configurar variables de entorno**

```bash
cp .env.example .env
# Edita el archivo .env con tus valores
```

2. **Construir y ejecutar con Docker Compose**

```bash
docker-compose up -d
```

3. **Ver logs**

```bash
docker-compose logs -f
```

## 📚 Uso de la API

### Autenticación

Todas las peticiones (excepto `/`) requieren el header `x-api-key`:

```bash
curl -H "x-api-key: tu-clave-secreta" http://localhost:3000/api/health
```

### Endpoints Disponibles

#### 1. Health Check

```bash
GET /api/health
```

**Respuesta:**

```json
{
  "success": true,
  "message": "WhatsApp API is running",
  "timestamp": "2025-10-02T10:30:00.000Z"
}
```

#### 2. Crear Nueva Sesión

```bash
POST /api/sessions
Content-Type: application/json
x-api-key: tu-clave-secreta

{
  "clientId": "cliente-123",
  "sessionId": "opcional-custom-id"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-generado",
    "clientId": "cliente-123",
    "status": "connecting",
    "createdAt": "2025-10-02T10:30:00.000Z",
    "lastActivity": "2025-10-02T10:30:00.000Z"
  }
}
```

#### 3. Obtener Código QR

```bash
GET /api/sessions/{sessionId}/qr
x-api-key: tu-clave-secreta
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "qrCode": "código-qr-string",
    "sessionId": "uuid",
    "status": "qr"
  }
}
```

💡 **Tip**: Escanea el código QR con WhatsApp desde tu teléfono en: Configuración > Dispositivos vinculados > Vincular dispositivo

#### 4. Listar Todas las Sesiones

```bash
GET /api/sessions
x-api-key: tu-clave-secreta
```

**Filtrar por cliente:**

```bash
GET /api/sessions?clientId=cliente-123
x-api-key: tu-clave-secreta
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "uuid",
      "clientId": "cliente-123",
      "status": "connected",
      "phone": "1234567890",
      "createdAt": "2025-10-02T10:30:00.000Z",
      "lastActivity": "2025-10-02T10:35:00.000Z"
    }
  ],
  "count": 1
}
```

#### 5. Obtener Sesión Específica

```bash
GET /api/sessions/{sessionId}
x-api-key: tu-clave-secreta
```

#### 6. Enviar Mensaje

```bash
POST /api/messages/send
Content-Type: application/json
x-api-key: tu-clave-secreta

{
  "sessionId": "uuid-de-sesion",
  "to": "1234567890",
  "message": "¡Hola desde la API!"
}
```

**Nota**: El número puede estar con o sin `@s.whatsapp.net`. La API lo agrega automáticamente si es necesario.

**Respuesta:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "sessionId": "uuid",
    "to": "1234567890",
    "sentAt": "2025-10-02T10:40:00.000Z"
  }
}
```

#### 7. Eliminar Sesión

```bash
DELETE /api/sessions/{sessionId}
x-api-key: tu-clave-secreta
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

## 📊 Estados de Sesión

- `connecting`: Iniciando conexión
- `qr`: Esperando escaneo de código QR
- `connected`: Sesión activa y lista para enviar mensajes
- `disconnected`: Sesión desconectada

## 🌐 Despliegue en la Nube

### AWS EC2 / DigitalOcean / Linode

1. **Conectar al servidor**

```bash
ssh usuario@tu-servidor
```

2. **Instalar Docker y Docker Compose**

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Clonar y configurar**

```bash
git clone <tu-repositorio>
cd send-whatsapp
cp .env.example .env
nano .env  # Editar variables
```

4. **Ejecutar**

```bash
docker-compose up -d
```

5. **Configurar firewall**

```bash
sudo ufw allow 3000/tcp
sudo ufw enable
```

### Railway.app

1. Crear nuevo proyecto en [Railway](https://railway.app)
2. Conectar repositorio de GitHub
3. Agregar variables de entorno:
   - `PORT`: 3000
   - `API_SECRET_KEY`: tu-clave-secreta
   - `LOG_LEVEL`: info
4. Railway detectará automáticamente el Dockerfile y desplegará

### Render.com

1. Crear nuevo Web Service en [Render](https://render.com)
2. Conectar repositorio
3. Configurar:
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
4. Agregar variables de entorno
5. Agregar disco persistente en `/app/sessions`

### Heroku

```bash
heroku login
heroku create tu-app-whatsapp
heroku config:set API_SECRET_KEY=tu-clave-secreta
git push heroku main
```

### Docker Hub + VPS

```bash
# Build y push
docker build -t tu-usuario/whatsapp-api .
docker push tu-usuario/whatsapp-api

# En el servidor
docker pull tu-usuario/whatsapp-api
docker run -d -p 3000:3000 \
  -e API_SECRET_KEY=tu-clave \
  -v ./sessions:/app/sessions \
  tu-usuario/whatsapp-api
```

## 🔒 Seguridad

1. **Cambiar API_SECRET_KEY**: Siempre usa una clave fuerte en producción
2. **HTTPS**: Usa un proxy inverso (Nginx, Caddy) con certificado SSL
3. **Firewall**: Limita el acceso solo a IPs confiables si es posible
4. **Rate Limiting**: Considera agregar rate limiting para prevenir abuso
5. **Backups**: Haz respaldo regular del directorio `sessions/`

## 📁 Estructura del Proyecto

```
send-whatsapp/
├── src/
│   ├── config/          # Configuración de la app
│   ├── middleware/      # Middlewares (autenticación)
│   ├── routes/          # Rutas de la API
│   ├── services/        # Lógica de negocio (SessionManager)
│   ├── types/           # Tipos TypeScript
│   └── index.ts         # Punto de entrada
├── sessions/            # Datos de sesiones (generado)
├── .env                 # Variables de entorno
├── Dockerfile           # Configuración Docker
├── docker-compose.yml   # Orquestación Docker
├── package.json         # Dependencias
└── tsconfig.json        # Configuración TypeScript
```

## 🛠️ Solución de Problemas

### El QR no aparece

- Verifica que la sesión esté en estado `qr`
- Espera unos segundos después de crear la sesión
- Consulta el endpoint `/api/sessions/{sessionId}/qr`

### Sesión se desconecta constantemente

- Asegúrate de que el directorio `sessions/` sea persistente
- No uses la misma sesión en múltiples instancias simultáneamente
- WhatsApp puede desconectar sesiones antiguas o sospechosas

### Error al enviar mensajes

- Verifica que la sesión esté `connected`
- El número debe ser válido (con código de país)
- No envíes mensajes masivos para evitar baneo de WhatsApp

### Puerto en uso

```bash
# Cambiar puerto en .env
PORT=3001
```

## 📝 Ejemplo de Integración

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const API_KEY = 'tu-clave-secreta';

// Crear sesión
async function createSession(clientId) {
  const response = await axios.post(
    `${API_URL}/sessions`,
    { clientId },
    { headers: { 'x-api-key': API_KEY } }
  );
  return response.data.data;
}

// Enviar mensaje
async function sendMessage(sessionId, to, message) {
  const response = await axios.post(
    `${API_URL}/messages/send`,
    { sessionId, to, message },
    { headers: { 'x-api-key': API_KEY } }
  );
  return response.data;
}

// Uso
(async () => {
  const session = await createSession('mi-cliente');
  console.log('Session ID:', session.sessionId);

  // Esperar a que se conecte...
  await sendMessage(session.sessionId, '1234567890', 'Hola!');
})();
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api'
API_KEY = 'tu-clave-secreta'

headers = {'x-api-key': API_KEY}

# Crear sesión
response = requests.post(
    f'{API_URL}/sessions',
    json={'clientId': 'mi-cliente'},
    headers=headers
)
session = response.json()['data']

# Enviar mensaje
requests.post(
    f'{API_URL}/messages/send',
    json={
        'sessionId': session['sessionId'],
        'to': '1234567890',
        'message': 'Hola desde Python!'
    },
    headers=headers
)
```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ⚠️ Disclaimer

Este proyecto utiliza la biblioteca Baileys que no está oficialmente respaldada por WhatsApp. Úsalo bajo tu propio riesgo. El uso excesivo puede resultar en el baneo de tu número de WhatsApp.

## 📧 Soporte

Para preguntas o problemas, abre un issue en GitHub.

---

**¡Desarrollado con ❤️ para la comunidad!**
