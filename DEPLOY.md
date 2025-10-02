# 🚀 Guía de Despliegue en Producción

Esta guía te ayudará a desplegar WhatsApp Multi-Instance API en producción de forma segura.

## 📋 Pre-requisitos

- Servidor Linux (Ubuntu 20.04+ recomendado)
- Docker y Docker Compose instalados
- Dominio (opcional pero recomendado)
- Certificado SSL (Let's Encrypt recomendado)

## 🔧 Configuración Inicial

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Agregar usuario actual al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clonar el Proyecto

```bash
cd /opt
sudo git clone https://github.com/tu-usuario/send-whatsapp.git
cd send-whatsapp
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

**Configuración recomendada para producción:**

```env
PORT=3000
API_SECRET_KEY=genera-una-clave-muy-segura-aqui-min-32-caracteres
LOG_LEVEL=info
SESSIONS_DIR=/app/sessions
```

**⚠️ IMPORTANTE:** Genera una API_SECRET_KEY fuerte:

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir puerto de la aplicación (solo si no usas proxy inverso)
sudo ufw allow 3000/tcp

# Activar firewall
sudo ufw enable
```

## 🐳 Despliegue con Docker

### Opción A: Docker Compose (Recomendado)

```bash
# Build y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### Opción B: Docker sin Compose

```bash
# Build
docker build -t whatsapp-api .

# Run
docker run -d \
  --name whatsapp-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/sessions:/app/sessions \
  -e API_SECRET_KEY=tu-clave-segura \
  whatsapp-api
```

## 🔒 Configurar Nginx como Proxy Inverso (Recomendado)

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/whatsapp-api
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    client_max_body_size 50M;

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

### 3. Activar Configuración

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo certbot renew --dry-run
```

## 📊 Monitoreo y Mantenimiento

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver últimas 100 líneas
docker-compose logs --tail=100

# Logs de un contenedor específico
docker logs whatsapp-multi-instance
```

### Backups

Crea un script de backup para las sesiones:

```bash
sudo nano /opt/backup-sessions.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/whatsapp-sessions"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/sessions_$DATE.tar.gz /opt/send-whatsapp/sessions
# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "sessions_*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /opt/backup-sessions.sh

# Agregar a crontab (backup diario a las 2 AM)
sudo crontab -e
# Agregar: 0 2 * * * /opt/backup-sessions.sh
```

### Actualizar la Aplicación

```bash
cd /opt/send-whatsapp

# Pull últimos cambios
git pull

# Rebuild y restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reiniciar Servicios

```bash
# Reiniciar aplicación
docker-compose restart

# Reiniciar solo el servicio
docker-compose restart whatsapp-api

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔐 Seguridad Adicional

### 1. Limitar Acceso por IP (Opcional)

En Nginx, agrega:

```nginx
location / {
    # Solo permitir IPs específicas
    allow 203.0.113.0/24;
    deny all;

    proxy_pass http://localhost:3000;
    # ... resto de la configuración
}
```

### 2. Rate Limiting en Nginx

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api_limit burst=20;
            # ... resto de la configuración
        }
    }
}
```

### 3. Fail2Ban

```bash
sudo apt install fail2ban -y

# Crear configuración personalizada
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
```

## 📈 Escalabilidad

### Múltiples Instancias con Load Balancer

Para alta disponibilidad, puedes ejecutar múltiples instancias:

```nginx
upstream whatsapp_backend {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://whatsapp_backend;
        # ... resto de la configuración
    }
}
```

### Usar Redis para Estado Compartido (Futuro)

Para múltiples instancias, considera implementar Redis para compartir estado de sesiones.

## 🐛 Troubleshooting

### Problema: Contenedor no inicia

```bash
# Ver logs detallados
docker logs whatsapp-multi-instance

# Verificar configuración
docker-compose config
```

### Problema: Sesiones se pierden

```bash
# Verificar volumen
docker volume inspect send-whatsapp_sessions

# Asegurar permisos
sudo chown -R 1000:1000 ./sessions
```

### Problema: Error 502 Bad Gateway

```bash
# Verificar que la app esté corriendo
docker-compose ps

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar conexión
curl -I http://localhost:3000/api/health
```

## 📞 Checklist de Producción

- [ ] API_SECRET_KEY cambiada y segura
- [ ] Firewall configurado
- [ ] SSL/HTTPS habilitado
- [ ] Backup automático configurado
- [ ] Monitoreo de logs activo
- [ ] Rate limiting configurado
- [ ] Dominio configurado correctamente
- [ ] Variables de entorno en .env (no en código)
- [ ] Documentación actualizada para el equipo
- [ ] Plan de rollback definido

## 🆘 Comandos Rápidos

```bash
# Estado general
docker-compose ps
docker-compose logs --tail=50

# Reinicio completo
docker-compose down && docker-compose up -d

# Limpiar todo y empezar de nuevo
docker-compose down -v
docker system prune -af
docker-compose up -d --build

# Ver uso de recursos
docker stats

# Entrar al contenedor
docker exec -it whatsapp-multi-instance sh
```

## 📚 Recursos Adicionales

- [Documentación Docker](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)

---

**💡 Tip:** Mantén siempre un respaldo de tus sesiones antes de realizar actualizaciones importantes.
