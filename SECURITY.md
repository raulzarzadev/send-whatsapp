# 🔐 Guía de Seguridad - WhatsApp Multi-Instance API

## ✅ Mejoras de Seguridad Implementadas

### 1. **Rate Limiting**

- ✅ Límite de 100 requests por minuto por IP
- ✅ Protección contra ataques de fuerza bruta
- ✅ Respuesta HTTP 429 cuando se excede el límite

### 2. **Autenticación Mejorada**

- ✅ API Key requerida en todos los endpoints
- ✅ Validación en cada request
- ✅ Mensajes de error sin información sensible

### 3. **Almacenamiento Seguro**

- ✅ **sessionStorage** en lugar de localStorage
- ✅ La API Key se borra al cerrar el navegador
- ✅ No persiste en el disco del cliente

### 4. **Trust Proxy**

- ✅ Detecta IP real detrás de proxies/load balancers
- ✅ Rate limiting por IP real del cliente

---

## 🚀 Configuración Recomendada en Producción

### 1. **Usar HTTPS Siempre**

Con Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. **Generar API Key Fuerte**

```bash
# Opción 1: 32 bytes en base64
openssl rand -base64 32

# Opción 2: 32 bytes en hexadecimal
openssl rand -hex 32

# Opción 3: Con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Ejemplo de key fuerte:**

```
a7f3c9d2e8b1f6a4c5e9d8b2f1a3c6e9d4b7f2a5c8e1d9b6f3a7c2e5d8b1f4a6
```

### 3. **Variables de Entorno Seguras**

En `.env`:

```env
# Nunca usar valores por defecto en producción
API_SECRET_KEY=tu-key-generada-con-openssl
PORT=3000
LOG_LEVEL=info
SESSIONS_DIR=/app/sessions

# Opcional: Configurar IPs permitidas
ALLOWED_IPS=203.0.113.0/24,198.51.100.0/24
```

### 4. **Limitar Acceso por IP (Opcional pero Recomendado)**

En Nginx:

```nginx
location /api/ {
    # Solo permitir IPs específicas
    allow 203.0.113.0/24;
    allow 198.51.100.0/24;
    deny all;

    proxy_pass http://localhost:3000;
}
```

O con firewall:

```bash
# Permitir solo IPs específicas en el puerto 3000
sudo ufw deny 3000
sudo ufw allow from 203.0.113.50 to any port 3000
sudo ufw allow from 198.51.100.75 to any port 3000
```

### 5. **Configurar Fail2Ban**

Crear `/etc/fail2ban/filter.d/whatsapp-api.conf`:

```ini
[Definition]
failregex = ^.*"error":"Unauthorized: Invalid or missing API key".*"ip":"<HOST>".*$
ignoreregex =
```

Agregar a `/etc/fail2ban/jail.local`:

```ini
[whatsapp-api]
enabled = true
port = 3000
filter = whatsapp-api
logpath = /var/log/whatsapp-api/access.log
maxretry = 5
findtime = 600
bantime = 3600
```

---

## 🛡️ Mejoras Adicionales Recomendadas

### 1. **Implementar JWT para la Interfaz Web**

En lugar de sessionStorage, usar JWT:

```typescript
// src/middleware/jwt.ts
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
```

### 2. **Agregar Autenticación de Usuarios**

Base de datos para usuarios:

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  apiKey: string;
  createdAt: Date;
}
```

### 3. **Logs de Auditoría**

```typescript
// src/middleware/audit.ts
export const auditLog = (req: Request, res: Response, next: NextFunction) => {
  console.log({
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    apiKey: req.headers['x-api-key']?.slice(0, 8) + '...',
    userAgent: req.headers['user-agent']
  });
  next();
};
```

### 4. **Webhooks para Notificaciones**

```typescript
// Notificar intentos de acceso no autorizados
const notifySecurityEvent = async (event: SecurityEvent) => {
  await fetch(process.env.SECURITY_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
};
```

### 5. **Encriptar Sesiones en Disco**

```typescript
import crypto from 'crypto';

const encryptSession = (data: string, key: string) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

const decryptSession = (encrypted: string, key: string) => {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};
```

---

## 📊 Monitoreo de Seguridad

### Logs a Monitorear:

1. **Intentos de autenticación fallidos**
2. **Rate limiting triggers**
3. **Accesos desde IPs inusuales**
4. **Cambios en sesiones**
5. **Errores de servidor**

### Herramientas Recomendadas:

- **Grafana + Loki** para visualizar logs
- **Prometheus** para métricas
- **Sentry** para errores
- **Uptime Robot** para monitoreo de disponibilidad

---

## ✅ Checklist de Seguridad

### Antes de Producción:

- [ ] API_SECRET_KEY cambiada (mínimo 32 caracteres)
- [ ] HTTPS configurado y forzado
- [ ] Rate limiting habilitado
- [ ] Firewall configurado
- [ ] Fail2Ban instalado y configurado
- [ ] Logs de auditoría activados
- [ ] Backups automáticos de sesiones
- [ ] Monitoreo de seguridad activo
- [ ] Headers de seguridad configurados
- [ ] IP whitelisting (si aplica)
- [ ] Variables de entorno seguras
- [ ] Sin secrets en el código
- [ ] .env en .gitignore
- [ ] Documentación de seguridad compartida con el equipo

### Mantenimiento Regular:

- [ ] Revisar logs semanalmente
- [ ] Actualizar dependencias mensualmente
- [ ] Rotar API keys cada 3-6 meses
- [ ] Auditoría de seguridad trimestral
- [ ] Backup y prueba de restauración mensual

---

## 🚨 Qué Hacer en Caso de Compromiso

1. **Inmediatamente:**

   - Rotar todas las API keys
   - Revisar logs de acceso
   - Identificar el vector de ataque

2. **Investigar:**

   - Revisar sesiones comprometidas
   - Verificar integridad de datos
   - Identificar alcance del compromiso

3. **Remediar:**

   - Parchear vulnerabilidad
   - Actualizar dependencias
   - Reforzar controles de seguridad

4. **Notificar:**
   - Informar a usuarios afectados
   - Documentar el incidente
   - Implementar mejoras

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Docker Security](https://docs.docker.com/engine/security/)

---

**🔒 La seguridad es un proceso continuo, no un estado. Mantén tu sistema actualizado y monitoreado.**
