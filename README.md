# 🛠️ HomeTech SAT — Plataforma de Gestión de Servicios Técnicos

> Aplicación web completa para la gestión de un servicio de asistencia técnica (SAT), con panel de administración, portal de técnicos y portal de clientes. Sin backend — todo persiste en `localStorage`.

---

## 📸 Vistas de la aplicación

| Panel Admin | Portal Cliente | Panel Técnico |
|:-----------:|:--------------:|:-------------:|
| Dashboard con agenda, KPIs y mapa | Citas, facturas y mensajes | Trabajos del día y ruta |

---

## 🗂️ Estructura del proyecto

```
hometech/
│
├── index.html                  # Login / Registro
│
├── pages/
│   ├── admin.html              # Panel administrativo
│   ├── portal-cliente.html     # Portal del cliente
│   ├── trabajador.html         # Panel del técnico
│   └── cliente.html            # Formulario público de solicitud (sin login)
│
├── js/
│   ├── store.js                # Base de datos en localStorage
│   ├── auth.js                 # Gestión de sesión y rutas protegidas
│   ├── admin.js                # Lógica del panel admin
│   ├── portal-cliente.js       # Lógica del portal cliente
│   ├── trabajador.js           # Lógica del panel técnico
│   └── avatar-picker.js        # Componente de selección de avatar
│
├── css/
│   ├── main.css                # Estilos admin y técnico
│   ├── portal.css              # Estilos portal cliente
│   └── avatar-picker.css       # Estilos selector de avatar
│
└── assets/
    ├── hometech-logo.ico
    └── avatars/                # Fotos de perfil demo
```

---

## 🚀 Funcionalidades por rol

### 🔑 Acceso rápido demo (en pantalla de login)

| Usuario | Email | Contraseña | Acceso |
|---------|-------|------------|--------|
| 🛠️ Admin | `admin@hometech.es` | `admin123` | Panel completo |
| 👷 Técnico | `pedro@hometech.es` | `pedro123` | Panel técnico |
| 👤 Cliente | `juan@email.com` | `juan123` | Portal cliente |

---

### 🧑‍💼 Panel de Administración (`admin.html`)

- **Dashboard** — KPIs en tiempo real, agenda del día con slider de horas, calendario semanal y lista de técnicos activos
- **Solicitudes** — Gestión de solicitudes de servicio (asignar técnico, rechazar) y solicitudes de alta de trabajadores
- **Servicios** — CRUD completo con filtros por estado; genera facturas desde servicios completados
- **Clientes** — CRUD con buscador; acceso rápido a crear servicio para ese cliente
- **Técnicos** — Gestión del equipo, cambio de disponibilidad, estadísticas individuales
- **Facturas** — CRUD, filtro por estado, imprimir PDF en ventana nueva
- **Mapa / Rutas** — Mapa Leaflet con marcadores de servicios del día y ruta sugerida por técnico
- **Mensajes** — Bandeja de mensajes de clientes con respuesta directa

---

### 👤 Portal del Cliente (`portal-cliente.html`)

- Bienvenida personalizada con KPIs propios (servicios, facturas pendientes, próxima cita, importe total)
- **Próximas citas** — Visualización de servicios futuros y solicitudes pendientes
- **Historial de servicios** — Tabla completa con técnico asignado y estado
- **Facturas** — Lista con descarga en PDF
- **Contactar** — Llamada, WhatsApp y formulario de mensaje directo; historial de conversación con el equipo
- **Mi perfil** — Editar nombre, dirección y foto de perfil

---

### 👷 Panel del Técnico (`trabajador.html`)

- **Mis trabajos** — Trabajos asignados para hoy, con acciones de iniciar / completar y área de notas
- **Historial** — Todos los servicios del técnico con estado y notas
- **Mi ruta** — Mapa Leaflet con los puntos pendientes del día y distancia estimada
- **Mi perfil** — Foto y nombre visual de sesión
- Botón de toggle de disponibilidad en tiempo real
- Envío de mensajes directos al cliente desde el panel

---

### 🌐 Formulario público (`cliente.html`)

- Solicitud de servicio sin necesidad de cuenta (nombre, teléfono, tipo, urgencia, descripción)
- Genera un número de ticket para seguimiento posterior
- Consulta de estado de ticket por número

---

## 🏗️ Arquitectura técnica

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vanilla JS)              │
│                                                     │
│  index.html   →   auth.js   →   store.js            │
│      │                              │               │
│      ▼                              ▼               │
│  Login/Reg          localStorage (persistencia)     │
│      │                                              │
│      ├── admin.html     →  admin.js                 │
│      ├── trabajador.html→  trabajador.js            │
│      └── portal-cliente.html → portal-cliente.js   │
└─────────────────────────────────────────────────────┘
```

### Tecnologías utilizadas

| Tecnología | Uso |
|-----------|-----|
| **HTML5 / CSS3** | Estructura y estilos |
| **JavaScript ES6+** | Lógica de negocio completa |
| **localStorage** | Persistencia de datos (sin backend) |
| **Leaflet.js** | Mapas interactivos y rutas |
| **Flaticon Uicons** | Iconografía |
| **Canvas API** | Compresión de imágenes (avatares) |

---

## 💾 Modelo de datos (`store.js`)

```js
{
  usuarios:           [...],   // login, rol, relación con cliente/técnico
  clientes:           [...],   // datos de contacto y coordenadas
  tecnicos:           [...],   // especialidad, disponibilidad, avatar
  servicios:          [...],   // citas con estado, técnico y cliente
  facturas:           [...],   // vinculadas a servicio y cliente
  solicitudes:        [...],   // solicitudes públicas sin cuenta
  solicitudesTecnico: [...],   // solicitudes de alta de trabajadores
  mensajes:           [...],   // chat cliente ↔ staff con origen y leído
  avatarHistorial:    {...},   // últimas 6 fotos por entidad
  nextIds:            {...}    // autoincrement por entidad
}
```

Todas las operaciones se realizan a través del objeto `Store`, que encapsula `localStorage` con métodos tipo repositorio (`getClientes`, `addServicio`, `updateFactura`, etc.).

---

## 🔐 Sistema de autenticación

- Sesión basada en `sessionStorage` (se cierra al cerrar pestaña)
- `Auth.requireRole(rol)` protege cada página y redirige si el rol no coincide
- Flujo de registro diferenciado: cliente tiene acceso inmediato; técnico pasa por aprobación del admin
- Detección automática de solicitudes pendientes en el login

---

## 🗺️ Flujo de una solicitud de servicio

```
Cliente rellena formulario público
        │
        ▼
  Se crea solicitud en Store (estado: "nueva")
        │
        ▼
  Admin recibe badge de notificación
        │
        ▼
  Admin asigna técnico + fecha/hora
        │
        ├── Se crea automáticamente el Servicio
        ├── Se crea o reutiliza el Cliente
        └── Solicitud pasa a estado "asignada"
              │
              ▼
        Técnico ve el trabajo en su panel
              │
              ▼
        Técnico marca "En curso" → "Completado"
              │
              ▼
        Admin genera Factura desde el servicio
```

---

## ⚙️ Cómo ejecutar el proyecto

No requiere instalación ni servidor de Node. Basta con abrir el proyecto en un servidor local (por CORS con Leaflet):

```bash
# Opción 1 — VS Code Live Server
# Instala la extensión Live Server y haz clic en "Go Live"

# Opción 2 — Python
python -m http.server 8080

# Opción 3 — Node
npx serve .
```

Luego abre `http://localhost:8080` en tu navegador.

> ⚠️ **Nota:** Los datos de demo se cargan automáticamente en el primer acceso. Si algo falla, usa el botón **"Resetear datos de demo"** en la pantalla de login.

---

## 📁 Datos de demo incluidos

- **3 técnicos** con especialidades distintas y servicios asignados
- **3 clientes** con coordenadas reales en Madrid
- **7 servicios** distribuidos entre ayer, hoy y mañana
- **3 facturas** (una pagada, dos pendientes)
- **2 solicitudes** de servicio pendientes de asignación
- **1 mensaje** de cliente sin leer en el panel admin

---

## 🧩 Posibles mejoras futuras

- [ ] Backend real con Node.js + Express y base de datos
- [ ] Notificaciones push con Service Workers
- [ ] Firma digital del cliente al finalizar el servicio
- [ ] Exportación de informes en PDF / Excel
- [ ] Autenticación con JWT y recuperación de contraseña
- [ ] Integración con Google Maps API para cálculo de rutas reales

---

## 👨‍💻 Autor

Desarrollado como proyecto de TFG — DAW 2026  
**Tecnologías:** HTML · CSS · JavaScript · Leaflet.js · localStorage

---

*© 2026 HomeTech — Servicio de Asistencia Técnica*
