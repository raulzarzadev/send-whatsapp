# Sistema de Logging de Mensajes

## 📋 Descripción

Se ha implementado un sistema completo de logging que guarda todos los mensajes enviados a través de la API en una base de datos SQLite.

## 🎯 Características

- ✅ **Logging automático** de todos los mensajes enviados (exitosos y fallidos)
- ✅ **Filtros avanzados** por sesión, cliente, número, estado, fechas
- ✅ **Estadísticas** de mensajes enviados y fallidos
- ✅ **Base de datos SQLite** - no requiere servidor de base de datos
- ✅ **Paginación** para grandes volúmenes de logs
- ✅ **Índices optimizados** para consultas rápidas

## 📦 Instalación

### Problema con npm

Si experimentas errores al instalar con npm, sigue estos pasos:

```bash
# Opción 1: Limpiar completamente npm
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Opción 2: Usar yarn en su lugar
npm install -g yarn
yarn install

# Opción 3: Instalar manualmente better-sqlite3
npm install better-sqlite3@11.5.0 --save
npm install @types/better-sqlite3@7.6.12 --save-dev
```

### Verificación de instalación

```bash
# Verificar que better-sqlite3 se instaló correctamente
npm list better-sqlite3
```

## 🗄️ Estructura de la Base de Datos

### Tabla: `message_logs`

| Campo        | Tipo     | Descripción                             |
| ------------ | -------- | --------------------------------------- |
| `id`         | INTEGER  | ID autoincremental (Primary Key)        |
| `session_id` | TEXT     | ID de la sesión que envió el mensaje    |
| `client_id`  | TEXT     | ID del cliente propietario de la sesión |
| `to_number`  | TEXT     | Número de destino del mensaje           |
| `message`    | TEXT     | Contenido del mensaje                   |
| `status`     | TEXT     | Estado: 'sent' o 'failed'               |
| `error`      | TEXT     | Mensaje de error (si falló)             |
| `timestamp`  | DATETIME | Fecha y hora del envío                  |
| `created_at` | DATETIME | Fecha de creación del registro          |

### Índices

- `idx_session_id` - Para consultas por sesión
- `idx_client_id` - Para consultas por cliente
- `idx_to_number` - Para consultas por número de destino
- `idx_status` - Para consultas por estado
- `idx_timestamp` - Para consultas por fecha

## 🚀 Uso

### Enviar mensaje (con logging automático)

```bash
curl -X POST https://tu-dominio.com/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-api-key" \
  -d '{
    "sessionId": "session-001",
    "to": "521234567890",
    "message": "Hola, este mensaje será registrado"
  }'
```

### Consultar logs

```bash
# Obtener todos los logs
curl -X GET https://tu-dominio.com/api/messages/logs \
  -H "x-api-key: tu-api-key"

# Filtrar por sesión
curl -X GET https://tu-dominio.com/api/messages/logs?sessionId=session-001 \
  -H "x-api-key: tu-api-key"

# Filtrar por cliente
curl -X GET https://tu-dominio.com/api/messages/logs?clientId=restaurante-xyz \
  -H "x-api-key: tu-api-key"

# Filtrar por estado
curl -X GET https://tu-dominio.com/api/messages/logs?status=failed \
  -H "x-api-key: tu-api-key"

# Filtrar por rango de fechas
curl -X GET "https://tu-dominio.com/api/messages/logs?startDate=2025-10-01&endDate=2025-10-02" \
  -H "x-api-key: tu-api-key"

# Con paginación
curl -X GET "https://tu-dominio.com/api/messages/logs?limit=50&offset=0" \
  -H "x-api-key: tu-api-key"
```

### Obtener estadísticas

```bash
# Estadísticas globales
curl -X GET https://tu-dominio.com/api/messages/stats \
  -H "x-api-key: tu-api-key"

# Estadísticas por sesión
curl -X GET https://tu-dominio.com/api/messages/stats?sessionId=session-001 \
  -H "x-api-key: tu-api-key"

# Estadísticas por cliente
curl -X GET https://tu-dominio.com/api/messages/stats?clientId=restaurante-xyz \
  -H "x-api-key: tu-api-key"
```

## 📊 Respuestas de la API

### GET /messages/logs

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sessionId": "session-001",
      "clientId": "restaurante-xyz",
      "to": "521234567890",
      "message": "Hola",
      "status": "sent",
      "error": null,
      "timestamp": "2025-10-02T10:35:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /messages/stats

```json
{
  "success": true,
  "data": {
    "total": 150,
    "sent": 142,
    "failed": 8
  }
}
```

## 🔧 Mantenimiento

### Limpiar logs antiguos

El servicio incluye un método para limpiar logs antiguos:

```typescript
// En código TypeScript
import { DatabaseService } from './services/DatabaseService'

const db = new DatabaseService()

// Eliminar logs de más de 90 días
const deletedCount = db.cleanOldLogs(90)
console.log(`Eliminados ${deletedCount} logs antiguos`)
```

### Ubicación de la base de datos

La base de datos se crea automáticamente en:

```
/tu-proyecto/data/whatsapp.db
```

**Nota:** Este directorio está en `.gitignore` para no commitear datos sensibles.

## 🔐 Seguridad

- ✅ Los logs se almacenan localmente en SQLite
- ✅ El directorio `data/` está excluido de git
- ✅ Los mensajes se guardan tal como se envían (sin modificación)
- ✅ Los errores se registran para debugging

## 📈 Optimización

El sistema está optimizado para:

- **Inserciones rápidas**: índices en campos clave
- **Consultas eficientes**: prepared statements
- **Escalabilidad**: soporte para millones de registros
- **Bajo overhead**: logging no bloquea el envío de mensajes

## 🐛 Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"

```bash
# Solución
npm install better-sqlite3 @types/better-sqlite3
```

### Error: "python not found" (en macOS)

```bash
# Instalar herramientas de compilación
xcode-select --install
```

### Base de datos bloqueada

```bash
# Si la base de datos está bloqueada, reinicia el servidor
# La conexión se cerrará automáticamente al cerrar el proceso
```

## 📚 Recursos adicionales

- [Documentación de better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- Ver la documentación completa en: `http://localhost:3000/docs.html`

## ✨ Próximas mejoras

- [ ] Dashboard visual para logs
- [ ] Exportación de logs a CSV/Excel
- [ ] Alertas por correo en mensajes fallidos
- [ ] Gráficas de estadísticas
- [ ] Filtros avanzados en el frontend
