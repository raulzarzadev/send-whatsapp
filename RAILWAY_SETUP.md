# Configuración de Railway para Persistencia de Datos

## Problema

Cada vez que se redespliega la aplicación en Railway, la base de datos SQLite se borra porque los contenedores son efímeros.

## Solución: Volumen Persistente

### Paso 1: Crear Volumen en Railway

1. Ve a tu proyecto en Railway
2. Click en tu servicio (el contenedor de tu app)
3. Ve a la pestaña **"Settings"**
4. Busca la sección **"Volumes"**
5. Click en **"+ Add Volume"**
6. Configura el volumen:
   - **Mount Path**: `/data`
   - **Size**: 1 GB (ajustar según necesidades)
7. Click en **"Add"**

### Paso 2: Configurar Variable de Entorno

En la sección de **Variables** de Railway, agrega:

```
DB_PATH=/data/whatsapp.db
```

Esto le dice a la aplicación que guarde la base de datos en el volumen persistente.

### Paso 3: Redesplegar

1. Haz un nuevo despliegue (push a main o redeploy manual)
2. La aplicación creará automáticamente el directorio `/data` si no existe
3. La base de datos se guardará en el volumen persistente

## Verificación

Después del despliegue, verifica en los logs que veas:

```
📁 Directorio de base de datos creado: /data
💾 Base de datos inicializada: /data/whatsapp.db
```

## Backups Automáticos (Opcional)

Para mayor seguridad, considera:

### Opción 1: Backups Locales en el Volumen

Los backups se guardarán en `/data/backups/` dentro del mismo volumen.

### Opción 2: Backups en S3 o Cloud Storage

Para backups externos, necesitarás:

1. Configurar un bucket de S3 (o Google Cloud Storage)
2. Agregar credenciales como variables de entorno
3. Implementar script de backup que suba archivos al cloud

## Restauración Manual

Si necesitas restaurar la base de datos:

1. Descarga el backup desde el volumen o desde S3
2. Usa Railway CLI para copiar el archivo:
   ```bash
   railway volumes cp backup-file.db /data/whatsapp.db
   ```
3. Reinicia el servicio

## Monitoreo

Puedes verificar el espacio usado del volumen en:

- Railway Dashboard > Service > Settings > Volumes

## Notas Importantes

- ✅ El volumen persiste entre despliegues
- ✅ El volumen se mantiene aunque el código cambie
- ⚠️ Si eliminas el servicio, el volumen también se elimina
- ⚠️ Los volúmenes no se replican automáticamente
- 💡 Considera backups externos para producción crítica

## Alternativa: Base de Datos Gestionada

Para aplicaciones de producción, considera usar:

- **Railway PostgreSQL** (plugin nativo)
- **Supabase** (PostgreSQL gratuito)
- **PlanetScale** (MySQL serverless)

Estas opciones ofrecen:

- Backups automáticos
- Replicación
- Mejor escalabilidad
- Cero configuración de persistencia
