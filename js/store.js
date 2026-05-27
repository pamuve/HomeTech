// ================================================
// STORE.JS — Base de datos + Usuarios
// ================================================

// Genera fecha de hoy y ayer en formato YYYY-MM-DD para datos de demo
const _hoy = new Date().toISOString().split('T')[0];
const _ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const _manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const _pasado = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

const INITIAL_DATA = {
    usuarios: [
        { id: 1, nombre: 'Admin HomeTech',  email: 'admin@hometech.es',  password: 'admin123',  rol: 'admin',   avatar: '../assets/avatars/admin.jpg' },
        { id: 2, nombre: 'Pedro Sánchez',   email: 'pedro@hometech.es',  password: 'pedro123',  rol: 'tecnico', tecnicoId: 1, avatar: '../assets/avatars/pedro.webp' },
        { id: 3, nombre: 'Ana Rodríguez',   email: 'ana@hometech.es',    password: 'ana123',    rol: 'tecnico', tecnicoId: 2, avatar: '../assets/avatars/ana.jpg'   },
        { id: 4, nombre: 'Luis Martínez',   email: 'luis@hometech.es',   password: 'luis123',   rol: 'tecnico', tecnicoId: 3, avatar: '../assets/avatars/luis.jpg'  },
        { id: 5, nombre: 'Juan Pérez',      email: 'juan@email.com',     password: 'juan123',   rol: 'cliente', clienteId: 1, avatar: '../assets/avatars/juan.jpg'  },
        { id: 6, nombre: 'María López',     email: 'maria@email.com',    password: 'maria123',  rol: 'cliente', clienteId: 2, avatar: '../assets/avatars/maria.jpg' },
        { id: 7, nombre: 'Carlos García',   email: 'carlos@email.com',   password: 'carlos123', rol: 'cliente', clienteId: 3, avatar: '../assets/avatars/carlos.jpg'}
    ],
    tecnicos: [
        { id: 1, nombre: 'Pedro Sánchez', telefono: '611000001', especialidad: 'Instalación de red',        disponible: false, avatar: '../assets/avatars/pedro.webp' },
        { id: 2, nombre: 'Ana Rodríguez', telefono: '611000002', especialidad: 'Reparación de ordenadores', disponible: true,  avatar: '../assets/avatars/ana.jpg'   },
        { id: 3, nombre: 'Luis Martínez', telefono: '611000003', especialidad: 'General',                   disponible: true,  avatar: '../assets/avatars/luis.jpg'  }
    ],
    clientes: [
        { id: 1, nombre: 'Juan Pérez',    telefono: '600111222', email: 'juan@email.com',   direccion: 'Calle Mayor 12, Madrid',            activo: true, lat: 40.4168, lng: -3.7038 },
        { id: 2, nombre: 'María López',   telefono: '600333444', email: 'maria@email.com',  direccion: 'Gran Vía 45, Madrid',               activo: true, lat: 40.4203, lng: -3.7065 },
        { id: 3, nombre: 'Carlos García', telefono: '600555666', email: 'carlos@email.com', direccion: 'Paseo de la Castellana 89, Madrid', activo: true, lat: 40.4514, lng: -3.6927 }
    ],
    servicios: [
        { id: 1, clienteId: 1, tecnicoId: 1, tipo: 'Instalación de red',        descripcion: 'Instalar 3 cables de red en salón',     fecha: _hoy,    hora: '09:00', duracion: '2h',   estado: 'completado', facturaId: 1,    notas: '' },
        { id: 2, clienteId: 2, tecnicoId: 2, tipo: 'Reparación urgente',        descripcion: 'PC quemado',                            fecha: _hoy,    hora: '11:00', duracion: '1.5h', estado: 'en_curso',   facturaId: null, notas: '' },
        { id: 3, clienteId: 3, tecnicoId: 1, tipo: 'Mantenimiento de equipos',  descripcion: 'Revisión de PC anual',                  fecha: _hoy,    hora: '16:00', duracion: '2h',   estado: 'pendiente',  facturaId: null, notas: '' },
        { id: 4, clienteId: 1, tecnicoId: 2, tipo: 'Reparación de ordenadores', descripcion: 'Cambiar procesador defectuoso',         fecha: _manana, hora: '10:00', duracion: '1h',   estado: 'pendiente',  facturaId: null, notas: '' },
        { id: 5, clienteId: 2, tecnicoId: 3, tipo: 'Instalación de red',        descripcion: 'Instalación de un router y un switch',  fecha: _pasado, hora: '09:30', duracion: '3h',   estado: 'pendiente',  facturaId: null, notas: '' },
        { id: 6, clienteId: 1, tecnicoId: 1, tipo: 'Revisión',                  descripcion: 'Revisión red eléctrica',                fecha: _ayer,   hora: '10:00', duracion: '1h',   estado: 'completado', facturaId: null, notas: '' },
        { id: 7, clienteId: 3, tecnicoId: 2, tipo: 'Montaje de equipos',        descripcion: 'Reparar pc gaming',                     fecha: _ayer,   hora: '14:00', duracion: '1.5h', estado: 'completado', facturaId: null, notas: '' }
    ],
    facturas: [
        { id: 1, clienteId: 1, servicioId: 1, numero: 'FAC-2026-001', fecha: _hoy,  importe: 120.00, estado: 'pagada',    concepto: 'Instalación eléctrica' },
        { id: 2, clienteId: 1, servicioId: 6, numero: 'FAC-2026-002', fecha: _ayer,  importe: 65.00,  estado: 'pendiente', concepto: 'Revisión' },
        { id: 3, clienteId: 2, servicioId: 2, numero: 'FAC-2026-003', fecha: _ayer,  importe: 85.50,  estado: 'pendiente', concepto: 'Reparación urgente' }
    ],
    solicitudes: [
        { id: 1, nombre: 'Roberto Díaz', telefono: '622000001', email: 'roberto@email.com', direccion: 'Calle Luna 8, Madrid',   tipo: 'Reparación urgente', descripcion: 'Se me ha fundido el cuadro eléctrico',  urgencia: 'alta', estado: 'nueva', fecha: new Date().toISOString(), tecnicoId: null, servicioId: null, clienteId: null },
        { id: 2, nombre: 'Juan Pérez',   telefono: '600111222', email: 'juan@email.com',    direccion: 'Calle Mayor 12, Madrid', tipo: 'Mantenimiento',      descripcion: 'Revisión anual de la caldera',           urgencia: 'baja', estado: 'nueva', fecha: new Date().toISOString(), tecnicoId: null, servicioId: null, clienteId: 1 }
    ],
    mensajes: [
        { id: 1, clienteId: 1, texto: '¿A qué hora vendrá el técnico mañana?', fecha: new Date().toISOString(), leido: false, origen: 'cliente' }
    ],
    solicitudesTecnico: [],
    avatarHistorial: {
        tecnico_1: ['../assets/avatars/pedro.webp'],
        tecnico_2: ['../assets/avatars/ana.jpg'],
        tecnico_3: ['../assets/avatars/luis.jpg'],
        cliente_1: ['../assets/avatars/juan.jpg'],
        cliente_2: ['../assets/avatars/maria.jpg'],
        cliente_3: ['../assets/avatars/carlos.jpg']
    },
    nextIds: { cliente: 4, tecnico: 4, servicio: 8, factura: 4, solicitud: 3, solicitudTecnico: 1, usuario: 8, mensaje: 2 }
};

const Store = {
    _get(key)        { const d = localStorage.getItem('hometech_' + key); return d ? JSON.parse(d) : null; },
    _set(key, value) { localStorage.setItem('hometech_' + key, JSON.stringify(value)); },

    init() {
        // Si no existe o le faltan los usuarios, reinicializar todo
        if (!this._get('initialized') || !this._get('usuarios') || !this._get('usuarios').length) {
            Object.keys(INITIAL_DATA).forEach(k => this._set(k, INITIAL_DATA[k]));
            this._set('initialized', true);
        }
        // Migración: si faltan tablas nuevas, añadirlas
        if (!this._get('mensajes')) this._set('mensajes', INITIAL_DATA.mensajes);
        if (!this._get('solicitudesTecnico')) this._set('solicitudesTecnico', INITIAL_DATA.solicitudesTecnico);
        const ids = this._get('nextIds');
        if (!ids.mensaje) { ids.mensaje = 2; this._set('nextIds', ids); }
        if (!ids.solicitudTecnico) { ids.solicitudTecnico = 1; this._set('nextIds', ids); }
        const msgs = this.getMensajes();
        if (msgs.some(m => !m.origen)) {
            this._set('mensajes', msgs.map(m => ({ ...m, origen: m.origen || 'cliente' })));
        }
        if (!this._get('avatarHistorial')) this._set('avatarHistorial', INITIAL_DATA.avatarHistorial);
        this._seedAvatarHistorial();
    },

    _avatarKey(tipo, id) { return `${tipo}_${id}`; },

    _seedAvatarHistorial() {
        const hist = this._get('avatarHistorial') || {};
        let changed = false;
        this.getUsuarios().forEach(u => {
            const tipo = u.rol === 'tecnico' ? 'tecnico' : u.rol === 'cliente' ? 'cliente' : null;
            const entityId = u.rol === 'tecnico' ? u.tecnicoId : u.rol === 'cliente' ? u.clienteId : null;
            if (!tipo || !entityId || !u.avatar) return;
            const key = this._avatarKey(tipo, entityId);
            if (!hist[key] || !hist[key].length) {
                hist[key] = [u.avatar];
                changed = true;
            } else if (!hist[key].includes(u.avatar)) {
                hist[key] = [u.avatar, ...hist[key]].slice(0, 6);
                changed = true;
            }
        });
        if (changed) this._set('avatarHistorial', hist);
    },

    getAvatarHistorial(tipo, id) {
        const hist = this._get('avatarHistorial') || {};
        return hist[this._avatarKey(tipo, id)] || [];
    },

    addAvatarHistorial(tipo, id, dataUrl) {
        if (!dataUrl) return;
        const hist = this._get('avatarHistorial') || {};
        const key = this._avatarKey(tipo, id);
        let list = (hist[key] || []).filter(u => u !== dataUrl);
        list.unshift(dataUrl);
        hist[key] = list.slice(0, 6);
        this._set('avatarHistorial', hist);
    },

    setAvatarCliente(clienteId, usuarioId, dataUrl) {
        if (!dataUrl) return;
        this.addAvatarHistorial('cliente', clienteId, dataUrl);
        const clientes = this.getClientes();
        const c = clientes.find(x => x.id === clienteId);
        if (c) { /* cliente no tiene avatar field, solo usuario */ }
        const usuarios = this.getUsuarios();
        const u = usuarios.find(x => x.id === usuarioId);
        if (u) { u.avatar = dataUrl; this._set('usuarios', usuarios); }
    },

    setAvatarTecnico(tecnicoId, dataUrl) {
        if (!dataUrl) return;
        this.addAvatarHistorial('tecnico', tecnicoId, dataUrl);
        const t = this.getTecnico(tecnicoId);
        if (t) { t.avatar = dataUrl; this.updateTecnico(t); }
        const usuarios = this.getUsuarios();
        const u = usuarios.find(x => x.tecnicoId === tecnicoId);
        if (u) { u.avatar = dataUrl; this._set('usuarios', usuarios); }
    },

    reset() { localStorage.clear(); this.init(); },

    // --- Usuarios ---
    getUsuarios()    { return this._get('usuarios') || []; },
    getUsuario(id)   { return this.getUsuarios().find(u => u.id === id); },
    findUsuario(email, password) {
        return this.getUsuarios().find(u => u.email === email && u.password === password) || null;
    },
    addUsuario(u)    { const ids = this._get('nextIds'); const all = this.getUsuarios(); u.id = ids.usuario++; all.push(u); this._set('usuarios', all); this._set('nextIds', ids); return u; },

    // --- Clientes ---
    getClientes()    { return this._get('clientes') || []; },
    getCliente(id)   { return this.getClientes().find(c => c.id === id); },
    addCliente(c)    { const ids = this._get('nextIds'); const all = this.getClientes(); c.id = ids.cliente++; all.push(c); this._set('clientes', all); this._set('nextIds', ids); return c; },
    updateCliente(c) { this._set('clientes', this.getClientes().map(x => x.id === c.id ? c : x)); },
    deleteCliente(id){ this._set('clientes', this.getClientes().filter(c => c.id !== id)); },

    // --- Técnicos ---
    getTecnicos()    { return this._get('tecnicos') || []; },
    getTecnico(id)   { return this.getTecnicos().find(t => t.id === id); },
    addTecnico(t)    { const ids = this._get('nextIds'); const all = this.getTecnicos(); t.id = ids.tecnico++; all.push(t); this._set('tecnicos', all); this._set('nextIds', ids); return t; },
    updateTecnico(t) { this._set('tecnicos', this.getTecnicos().map(x => x.id === t.id ? t : x)); },
    deleteTecnico(id){ this._set('tecnicos', this.getTecnicos().filter(t => t.id !== id)); },

    // --- Servicios ---
    getServicios()    { return this._get('servicios') || []; },
    getServicio(id)   { return this.getServicios().find(s => s.id === id); },
    addServicio(s)    { const ids = this._get('nextIds'); const all = this.getServicios(); s.id = ids.servicio++; all.push(s); this._set('servicios', all); this._set('nextIds', ids); return s; },
    updateServicio(s) { this._set('servicios', this.getServicios().map(x => x.id === s.id ? s : x)); },
    deleteServicio(id){ this._set('servicios', this.getServicios().filter(s => s.id !== id)); },

    // --- Facturas ---
    getFacturas()    { return this._get('facturas') || []; },
    getFactura(id)   { return this.getFacturas().find(f => f.id === id); },
    addFactura(f)    { const ids = this._get('nextIds'); const all = this.getFacturas(); f.id = ids.factura++; f.numero = 'FAC-2026-' + String(f.id).padStart(3,'0'); all.push(f); this._set('facturas', all); this._set('nextIds', ids); return f; },
    updateFactura(f) { this._set('facturas', this.getFacturas().map(x => x.id === f.id ? f : x)); },

    // --- Solicitudes ---
    getSolicitudes()    { return this._get('solicitudes') || []; },
    getSolicitud(id)    { return this.getSolicitudes().find(s => s.id === id); },
    addSolicitud(s)     { const ids = this._get('nextIds'); const all = this.getSolicitudes(); s.id = ids.solicitud++; s.fecha = new Date().toISOString(); s.estado = s.estado || 'nueva'; all.push(s); this._set('solicitudes', all); this._set('nextIds', ids); return s; },
    updateSolicitud(s)  { this._set('solicitudes', this.getSolicitudes().map(x => x.id === s.id ? s : x)); },
    deleteSolicitud(id) { this._set('solicitudes', this.getSolicitudes().filter(s => s.id !== id)); },

    // --- Solicitudes de alta de técnicos ---
    getSolicitudesTecnico() { return this._get('solicitudesTecnico') || []; },
    getSolicitudTecnico(id) { return this.getSolicitudesTecnico().find(s => s.id === id); },
    findSolicitudTecnicoByEmail(email) {
        return this.getSolicitudesTecnico().find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
    },
    addSolicitudTecnico(s) {
        const ids = this._get('nextIds');
        const all = this.getSolicitudesTecnico();
        s.id = ids.solicitudTecnico++;
        s.fecha = new Date().toISOString();
        s.estado = s.estado || 'nueva';
        all.push(s);
        this._set('solicitudesTecnico', all);
        this._set('nextIds', ids);
        return s;
    },
    updateSolicitudTecnico(s) {
        this._set('solicitudesTecnico', this.getSolicitudesTecnico().map(x => x.id === s.id ? s : x));
    },

    // --- Mensajes ---
    getMensajes()    { return this._get('mensajes') || []; },
    _normalizarMensaje(m) {
        if (!m.origen) m.origen = 'cliente';
        if (m.origen !== 'cliente' && m.leidoCliente === undefined) m.leidoCliente = false;
        return m;
    },
    addMensaje(m) {
        const ids = this._get('nextIds');
        const all = this.getMensajes();
        m.id = ids.mensaje++;
        m.fecha = new Date().toISOString();
        m.origen = m.origen || 'cliente';
        if (m.origen === 'cliente') m.leido = false;
        else { m.leido = true; m.leidoCliente = false; }
        all.push(m);
        this._set('mensajes', all);
        this._set('nextIds', ids);
        return m;
    },
    addRespuestaStaff({ clienteId, texto, autorRol, autorNombre, tecnicoId, parentId }) {
        return this.addMensaje({
            clienteId, texto, origen: 'staff',
            autorRol: autorRol || 'admin',
            autorNombre: autorNombre || 'HomeTech',
            tecnicoId: tecnicoId || null,
            parentId: parentId || null
        });
    },
    getMensajesCliente(clienteId) {
        return this.getMensajes()
            .filter(m => m.clienteId === clienteId)
            .map(m => this._normalizarMensaje({ ...m }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    },
    getMensajesSinLeerAdmin() {
        return this.getMensajes().filter(m => (m.origen || 'cliente') === 'cliente' && !m.leido);
    },
    getMensajesSinLeerCliente(clienteId) {
        return this.getMensajesCliente(clienteId).filter(m => m.origen !== 'cliente' && !m.leidoCliente);
    },
    marcarLeido(id)  { this._set('mensajes', this.getMensajes().map(m => m.id === id ? { ...m, leido: true } : m)); },
    marcarLeidosCliente(clienteId) {
        this._set('mensajes', this.getMensajes().map(m =>
            m.clienteId === clienteId && m.origen !== 'cliente' ? { ...m, leidoCliente: true } : m
        ));
    },
    deleteMensaje(id) { this._set('mensajes', this.getMensajes().filter(m => m.id !== id && m.parentId !== id)); },
    clienteTieneTecnicoAsignado(clienteId, tecnicoId) {
        return this.getServicios().some(s => s.clienteId === clienteId && s.tecnicoId === tecnicoId);
    }
};

Store.init();
