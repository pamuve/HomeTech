// ================================================
// ADMIN.JS — Lógica completa del panel administrativo
// ================================================

let timelineFiltroEstado = '';
const AGENDA_MIN = 8 * 60;
const AGENDA_MAX = 18 * 60;

// ---------- NAVEGACIÓN ----------
function navegarA(seccion) {
    document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('section-' + seccion).classList.remove('hidden');
    document.querySelector(`[data-section="${seccion}"]`).classList.add('active');
    renderSeccion(seccion);
}

function renderSeccion(s) {
    const mapa = {
        dashboard:   renderDashboard,
        solicitudes: renderSolicitudes,
        servicios:   renderServicios,
        clientes:    renderClientes,
        tecnicos:    renderTecnicos,
        facturas:    renderFacturas,
        mapa:        renderMapa,
        mensajes:    renderMensajesAdmin
    };
    if (mapa[s]) mapa[s]();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        navegarA(item.dataset.section);
    });
});

// ---------- DASHBOARD ----------
function renderDashboard() {
    const hoy = new Date().toISOString().split('T')[0];
    const servicios = Store.getServicios();
    const solicitudes = Store.getSolicitudes().filter(s => s.estado === 'nueva');
    const solicitudesTecnico = Store.getSolicitudesTecnico().filter(s => s.estado === 'nueva');
    const facturas = Store.getFacturas();

    document.getElementById('fecha-actual').textContent =
        new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
    document.getElementById('fecha-agenda').textContent = new Date().toLocaleDateString('es-ES');

    document.getElementById('kpi-hoy').textContent = servicios.filter(s => s.fecha === hoy).length;
    document.getElementById('kpi-solicitudes').textContent = solicitudes.length + solicitudesTecnico.length;
    document.getElementById('kpi-pendientes').textContent = facturas.filter(f => f.estado === 'pendiente').length;
    const ingresos = facturas.reduce((a, f) => a + f.importe, 0);
    document.getElementById('kpi-ingresos').textContent = '€' + ingresos.toFixed(2);

    actualizarBadgeSolicitudes();
    renderTimeline();
    renderKpiResumen();
    renderTecnicosActivos();
    renderWeekCalendar();
}

function horaAMinutos(hora) {
    if (!hora) return AGENDA_MIN;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
}

function minutosAHora(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function initAgendaSlider() {
    const slider = document.getElementById('agenda-slider');
    if (!slider || slider.dataset.bound) return;
    slider.dataset.bound = '1';
    const ahora = new Date();
    const minActual = Math.min(AGENDA_MAX, Math.max(AGENDA_MIN, ahora.getHours() * 60 + ahora.getMinutes()));
    slider.value = Math.round(minActual / 15) * 15;
    slider.addEventListener('input', () => actualizarAgendaSlider());
    slider.addEventListener('change', () => actualizarAgendaSlider());
    actualizarAgendaSlider();
}

function actualizarAgendaSlider() {
    const slider = document.getElementById('agenda-slider');
    if (!slider) return;
    const min = parseInt(slider.value, 10);
    const pct = ((min - AGENDA_MIN) / (AGENDA_MAX - AGENDA_MIN)) * 100;
    const fill = document.getElementById('timeline-fill');
    const thumb = document.getElementById('timeline-thumb');
    const label = document.getElementById('agenda-hora-label');
    if (fill) fill.style.width = pct + '%';
    if (thumb) thumb.style.left = pct + '%';
    if (label) label.textContent = minutosAHora(min);
    resaltarTrabajosAgenda(min);
}

function resaltarTrabajosAgenda(minSeleccionado) {
    const ventana = 45;
    document.querySelectorAll('#timeline .service-block').forEach(el => {
        const minServ = parseInt(el.dataset.minutos, 10);
        const diff = Math.abs(minServ - minSeleccionado);
        el.classList.toggle('service-block-active', diff <= ventana);
        el.classList.toggle('service-block-near', diff > ventana && diff <= ventana * 2);
    });
}

function renderTimeline(filtro = '') {
    timelineFiltroEstado = filtro;
    const hoy = new Date().toISOString().split('T')[0];
    let servicios = Store.getServicios().filter(s => s.fecha === hoy);
    if (filtro) servicios = servicios.filter(s => s.estado === filtro);
    servicios.sort((a, b) => a.hora.localeCompare(b.hora));

    const labels = { pendiente: 'Pendiente', en_curso: 'En curso', completado: 'Completado' };
    const clases = { pendiente: 'status-pending', en_curso: 'status-progress', completado: 'status-completed' };
    const iconos = { 'Reparación de ordenadores': 'fi-rr-laptop', 'Reparación urgente': 'fi-rr-tool-box', 'Mantenimiento de equipos': 'fi-rr-settings', 'Montaje de equipos': 'fi-rr-briefcase', 'Instalación de red': 'fi-rr-bolt', default: 'fi-rr-briefcase' };

    document.getElementById('timeline').innerHTML = servicios.length ? servicios.map(s => {
        const cliente = Store.getCliente(s.clienteId);
        const tecnico = s.tecnicoId ? Store.getTecnico(s.tecnicoId) : null;
        const icon = iconos[s.tipo] || iconos.default;
        const min = horaAMinutos(s.hora);
        return `
        <div class="service-block" data-minutos="${min}" onclick="editarServicio(${s.id})">
            <div class="service-icon"><i class="fi ${icon}"></i></div>
            <div class="service-type-label">${s.hora}</div>
            <div class="service-info">
                <div class="service-client">${cliente ? cliente.nombre : 'Sin cliente'}</div>
                <div class="service-duration">${s.tipo} · ${s.duracion}
                    ${tecnico ? `· <strong>${tecnico.nombre}</strong>` : ''}
                </div>
            </div>
            <div class="service-status ${clases[s.estado]}">${labels[s.estado]}</div>
        </div>`;
    }).join('') : '<p style="color:var(--text-secondary);text-align:center;padding:2rem">No hay servicios para hoy</p>';

    initAgendaSlider();
    actualizarAgendaSlider();
}

function filtrarTimeline(estado) {
    renderTimeline(estado);
}

function renderKpiResumen() {
    const servicios = Store.getServicios();
    const hoy = new Date().toISOString().split('T')[0];
    const items = [
        { label: 'Servicios pendientes', val: servicios.filter(s => s.estado === 'pendiente').length },
        { label: 'En curso hoy',         val: servicios.filter(s => s.fecha === hoy && s.estado === 'en_curso').length },
        { label: 'Completados hoy',      val: servicios.filter(s => s.fecha === hoy && s.estado === 'completado').length },
        { label: 'Total clientes',       val: Store.getClientes().length, highlight: true,
          extra: '€' + Store.getFacturas().reduce((a,f) => a+f.importe, 0).toFixed(2) + ' facturado' }
    ];
    document.getElementById('kpi-resumen').innerHTML = items.map(i =>
        i.highlight
        ? `<div class="kpi-item kpi-highlight"><span class="kpi-label">Ingresos totales</span><span class="kpi-value">${i.extra}</span></div>`
        : `<div class="kpi-item"><span>${i.label}</span><strong>${i.val}</strong></div>`
    ).join('');
}

function renderTecnicosActivos() {
    const tecnicos = Store.getTecnicos();
    const hoy = new Date().toISOString().split('T')[0];
    const serviciosHoy = Store.getServicios().filter(s => s.fecha === hoy);

    document.getElementById('tecnicos-activos-list').innerHTML = tecnicos.map(t => {
        const asignados = serviciosHoy.filter(s => s.tecnicoId === t.id).length;
        return `
        <div class="tecnico-mini">
            <img src="${t.avatar || 'https://i.pravatar.cc/40?u='+t.id}" class="avatar-sm">
            <div>
                <div class="font-bold">${t.nombre}</div>
                <div class="text-sm text-secondary">${t.especialidad} · ${asignados} servicio(s) hoy</div>
            </div>
            <span class="dot-estado ${t.disponible ? 'disponible' : 'ocupado'}"></span>
        </div>`;
    }).join('');
}

function renderWeekCalendar() {
    const servicios = Store.getServicios();
    const dias = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const hoy = new Date();
    document.getElementById('week-calendar').innerHTML = dias.map((dia, i) => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        const key = fecha.toISOString().split('T')[0];
        const count = servicios.filter(s => s.fecha === key).length;
        const esHoy = i === 0;
        return `
        <div class="day-block ${esHoy ? 'day-today' : ''}" onclick="navegarA('servicios')">
            <span class="day-name">${dia}</span>
            <div class="day-number">${fecha.getDate()}</div>
            ${count ? `<div class="day-count">${count} serv.</div>` : ''}
        </div>`;
    }).join('');
}

// ---------- SOLICITUDES ----------
function renderSolicitudes() {
    actualizarBadgeSolicitudes();
    renderSolicitudesTecnico();
    const solicitudes = Store.getSolicitudes();
    const urgencia = { alta: 'badge-danger', media: 'badge-warning', baja: 'badge-info' };
    const estadoLabel = { nueva: 'Nueva', asignada: 'Asignada', rechazada: 'Rechazada' };
    const estadoClass = { nueva: 'status-pending', asignada: 'status-completed', rechazada: 'status-danger' };

    document.getElementById('solicitudes-count').textContent = solicitudes.filter(s => s.estado === 'nueva').length + ' nuevas';

    document.getElementById('lista-solicitudes').innerHTML = solicitudes.length ? solicitudes.map(s => {
        const fechaPreferida = s.fechaPreferida ? `${s.fechaPreferida} a las ${s.horaPreferida || '—'}` : (s.disponibilidad || '');
        return `
        <div class="solicitud-card">
            <div class="sol-header">
                <span class="font-bold">${s.nombre}</span>
                <span class="service-status ${estadoClass[s.estado]}">${estadoLabel[s.estado]}</span>
            </div>
            <div class="sol-body">
                <p><i class="fi fi-rr-tool-box"></i> <strong>${s.tipo}</strong></p>
                <p><i class="fi fi-rr-comment"></i> ${s.descripcion}</p>
                <p><i class="fi fi-rr-marker"></i> ${s.direccion}</p>
                <p><i class="fi fi-rr-phone-call"></i> ${s.telefono}</p>
                ${fechaPreferida ? `<p><i class="fi fi-rr-calendar"></i> <strong>Preferencia:</strong> ${fechaPreferida}</p>` : ''}
                <p class="text-sm text-secondary"><i class="fi fi-rr-clock"></i> Enviada: ${new Date(s.fecha).toLocaleString('es-ES')}</p>
                <span class="badge-urgencia ${urgencia[s.urgencia] || ''}">Urgencia: ${s.urgencia}</span>
            </div>
            <div class="sol-footer">
                ${s.estado === 'nueva' ? `
                    <button class="btn-primary btn-sm" onclick="abrirAsignar(${s.id})">
                        <i class="fi fi-rr-user-add"></i> Asignar técnico
                    </button>
                    <button class="btn-secondary btn-sm" onclick="rechazarSolicitud(${s.id})">
                        <i class="fi fi-rr-cross"></i> Rechazar
                    </button>
                ` : s.estado === 'asignada' && s.tecnicoId ? `
                    <span class="text-sm">Técnico: <strong>${Store.getTecnico(s.tecnicoId)?.nombre}</strong></span>
                ` : ''}
            </div>
        </div>
    `;
    }).join('') : '<p style="text-align:center;color:var(--text-secondary);padding:3rem">No hay solicitudes</p>';
}

function actualizarBadgeSolicitudes() {
    const nServicio = Store.getSolicitudes().filter(s => s.estado === 'nueva').length;
    const nTecnico = Store.getSolicitudesTecnico().filter(s => s.estado === 'nueva').length;
    const n = nServicio + nTecnico;
    document.getElementById('badge-solicitudes').textContent = n;
    document.getElementById('badge-solicitudes').style.display = n ? '' : 'none';
    const navBadge = document.getElementById('nav-badge-solicitudes');
    if (navBadge) { navBadge.textContent = n || ''; navBadge.style.display = n ? '' : 'none'; }
}

function renderSolicitudesTecnico() {
    const solicitudes = Store.getSolicitudesTecnico();
    const estadoLabel = { nueva: 'Nueva', aprobada: 'Aprobada', rechazada: 'Rechazada' };
    const estadoClass = { nueva: 'status-pending', aprobada: 'status-completed', rechazada: 'status-danger' };

    document.getElementById('solicitudes-tecnico-count').textContent =
        solicitudes.filter(s => s.estado === 'nueva').length + ' nuevas';

    document.getElementById('lista-solicitudes-tecnico').innerHTML = solicitudes.length ? solicitudes.map(s => `
        <div class="solicitud-card">
            <div class="sol-header">
                <span class="font-bold">${s.nombre}</span>
                <span class="service-status ${estadoClass[s.estado]}">${estadoLabel[s.estado]}</span>
            </div>
            <div class="sol-body">
                <p><i class="fi fi-rr-envelope"></i> ${s.email}</p>
                <p><i class="fi fi-rr-phone-call"></i> ${s.telefono}</p>
                <p><i class="fi fi-rr-tool-box"></i> <strong>Especialidad:</strong> ${s.especialidad}</p>
                <p><i class="fi fi-rr-document-signed"></i> Solicitud de alta como trabajador (contrato)</p>
                <p class="text-sm text-secondary"><i class="fi fi-rr-clock"></i> Enviada: ${new Date(s.fecha).toLocaleString('es-ES')}</p>
            </div>
            <div class="sol-footer">
                ${s.estado === 'nueva' ? `
                    <button class="btn-primary btn-sm" onclick="aprobarSolicitudTecnico(${s.id})">
                        <i class="fi fi-rr-check"></i> Aprobar alta
                    </button>
                    <button class="btn-secondary btn-sm" onclick="rechazarSolicitudTecnico(${s.id})">
                        <i class="fi fi-rr-cross"></i> Rechazar
                    </button>
                ` : s.estado === 'aprobada' ? `
                    <span class="text-sm">Cuenta activada correctamente</span>
                ` : ''}
            </div>
        </div>
    `).join('') : '<p style="text-align:center;color:var(--text-secondary);padding:3rem">No hay solicitudes de trabajadores</p>';
}

function aprobarSolicitudTecnico(id) {
    const sol = Store.getSolicitudTecnico(id);
    if (!sol || sol.estado !== 'nueva') return;
    if (Store.getUsuarios().some(u => u.email.toLowerCase() === sol.email.toLowerCase())) {
        mostrarToast('❌ Ya existe una cuenta con ese email');
        return;
    }
    if (!confirm(`¿Aprobar la alta de ${sol.nombre} como trabajador?`)) return;

    const nuevoTecnico = Store.addTecnico({
        nombre: sol.nombre,
        telefono: sol.telefono,
        especialidad: sol.especialidad,
        disponible: true,
        avatar: 'https://i.pravatar.cc/80?u=' + sol.email
    });

    Store.addUsuario({
        nombre: sol.nombre,
        email: sol.email,
        password: sol.password,
        rol: 'tecnico',
        tecnicoId: nuevoTecnico.id,
        clienteId: null,
        avatar: 'https://i.pravatar.cc/80?u=' + sol.email
    });

    sol.estado = 'aprobada';
    Store.updateSolicitudTecnico(sol);
    renderSolicitudes();
    renderTecnicos();
    mostrarToast('✅ Trabajador aprobado y cuenta creada');
}

function rechazarSolicitudTecnico(id) {
    if (!confirm('¿Rechazar esta solicitud de alta?')) return;
    const sol = Store.getSolicitudTecnico(id);
    if (!sol) { mostrarToast('❌ Solicitud no encontrada'); return; }
    sol.estado = 'rechazada';
    Store.updateSolicitudTecnico(sol);
    renderSolicitudes();
    mostrarToast('❌ Solicitud de alta rechazada');
}

function abrirAsignar(solId) {
    const sol = Store.getSolicitudes().find(s => s.id === solId);
    document.getElementById('asig-sol-id').value = solId;
    document.getElementById('detalle-solicitud').innerHTML = `
        <div class="info-box">
            <strong>${sol.nombre}</strong> — ${sol.tipo}<br>
            <small>${sol.descripcion}</small>
        </div>`;
    const sel = document.getElementById('asig-tecnico');
    sel.innerHTML = Store.getTecnicos().map(t => `<option value="${t.id}">${t.nombre} (${t.especialidad})</option>`).join('');
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('asig-fecha').value = hoy;
    document.getElementById('asig-hora').value = '09:00';
    abrirModal('modal-asignar');
}

document.getElementById('form-asignar').addEventListener('submit', e => {
    e.preventDefault();
    const solId = parseInt(document.getElementById('asig-sol-id').value);
    const tecnicoId = parseInt(document.getElementById('asig-tecnico').value);
    const fecha = document.getElementById('asig-fecha').value;
    const hora = document.getElementById('asig-hora').value;
    const sol = Store.getSolicitudes().find(s => s.id === solId);

    // Crear cliente si no existe
    let clienteId;
    const clienteExistente = Store.getClientes().find(c => c.telefono === sol.telefono);
    if (clienteExistente) {
        clienteId = clienteExistente.id;
    } else {
        const nuevoCliente = Store.addCliente({ nombre: sol.nombre, telefono: sol.telefono, email: sol.email, direccion: sol.direccion, activo: true });
        clienteId = nuevoCliente.id;
    }

    // Crear servicio
    const nuevoServicio = Store.addServicio({
        clienteId, tecnicoId, tipo: sol.tipo, descripcion: sol.descripcion,
        fecha, hora, duracion: '2h', estado: 'pendiente', facturaId: null
    });

    // Actualizar solicitud
    sol.estado = 'asignada'; sol.tecnicoId = tecnicoId; sol.servicioId = nuevoServicio.id;
    Store.updateSolicitud(sol);

    cerrarModal('modal-asignar');
    mostrarToast('✅ Solicitud asignada y servicio creado correctamente');
    renderSolicitudes();
});

function rechazarSolicitud(id) {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    const sols = Store.getSolicitudes();
    const sol = sols.find(s => s.id === id);
    if (!sol) { mostrarToast('❌ Solicitud no encontrada'); return; }
    sol.estado = 'rechazada';
    Store.updateSolicitud(sol);
    renderSolicitudes();
    mostrarToast('❌ Solicitud rechazada');
}

// ---------- SERVICIOS ----------
function renderServicios() {
    let servicios = Store.getServicios();
    const filtro = document.getElementById('filtro-estado-servicio')?.value;
    if (filtro) servicios = servicios.filter(s => s.estado === filtro);
    servicios.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    const labels = { pendiente: 'status-pending', en_curso: 'status-progress', completado: 'status-completed' };
    const textos = { pendiente: 'Pendiente', en_curso: 'En curso', completado: 'Completado' };

    document.getElementById('tbody-servicios').innerHTML = servicios.map(s => {
        const cliente = Store.getCliente(s.clienteId);
        const tecnico = s.tecnicoId ? Store.getTecnico(s.tecnicoId) : null;
        return `<tr>
            <td>${cliente ? cliente.nombre : '—'}</td>
            <td>${s.tipo}</td>
            <td>${tecnico ? tecnico.nombre : '<span class="text-secondary">Sin asignar</span>'}</td>
            <td>${s.fecha}</td>
            <td>${s.hora}</td>
            <td><span class="service-status ${labels[s.estado]}">${textos[s.estado]}</span></td>
            <td class="acciones">
                <button class="btn-icon" onclick="editarServicio(${s.id})" title="Editar"><i class="fi fi-rr-pencil"></i></button>
                ${s.estado === 'completado' && !s.facturaId
                    ? `<button class="btn-icon green" onclick="generarFactura(${s.id})" title="Generar factura"><i class="fi fi-rr-receipt"></i></button>`
                    : ''}
                <button class="btn-icon red" onclick="eliminarServicio(${s.id})" title="Eliminar"><i class="fi fi-rr-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function editarServicio(id) {
    const s = id ? Store.getServicio(id) : null;
    const titulo = id ? 'Editar servicio' : 'Nuevo servicio';
    document.getElementById('modal-servicio-titulo').textContent = titulo;

    const selCliente = document.getElementById('sv-cliente');
    selCliente.innerHTML = Store.getClientes().map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const selTecnico = document.getElementById('sv-tecnico');
    selTecnico.innerHTML = '<option value="">Sin asignar</option>' +
        Store.getTecnicos().map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');

    document.getElementById('sv-id').value = s?.id || '';
    document.getElementById('sv-cliente').value = s?.clienteId || '';
    document.getElementById('sv-tecnico').value = s?.tecnicoId || '';
    document.getElementById('sv-tipo').value = s?.tipo || '';
    document.getElementById('sv-duracion').value = s?.duracion || '1h';
    document.getElementById('sv-fecha').value = s?.fecha || new Date().toISOString().split('T')[0];
    document.getElementById('sv-hora').value = s?.hora || '09:00';
    document.getElementById('sv-descripcion').value = s?.descripcion || '';
    document.getElementById('sv-estado').value = s?.estado || 'pendiente';
    abrirModal('modal-servicio');
}

document.getElementById('form-servicio').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('sv-id').value) || null;
    const data = {
        clienteId:   parseInt(document.getElementById('sv-cliente').value),
        tecnicoId:   parseInt(document.getElementById('sv-tecnico').value) || null,
        tipo:        document.getElementById('sv-tipo').value,
        duracion:    document.getElementById('sv-duracion').value,
        fecha:       document.getElementById('sv-fecha').value,
        hora:        document.getElementById('sv-hora').value,
        descripcion: document.getElementById('sv-descripcion').value,
        estado:      document.getElementById('sv-estado').value,
        facturaId:   null
    };
    if (id) { data.id = id; Store.updateServicio(data); }
    else    { Store.addServicio(data); }
    cerrarModal('modal-servicio');
    mostrarToast(id ? '✅ Servicio actualizado' : '✅ Servicio creado');
    renderServicios();
    renderDashboard();
});

function eliminarServicio(id) {
    if (!confirm('¿Eliminar este servicio?')) return;
    Store.deleteServicio(id);
    renderServicios();
    renderDashboard();
    mostrarToast('🗑️ Servicio eliminado');
}

function generarFactura(servicioId) {
    const s = Store.getServicio(servicioId);
    const cliente = Store.getCliente(s.clienteId);
    // Abrir modal de factura pre-rellenado en vez de crear con 0€
    abrirModalFactura();
    setTimeout(() => {
        document.getElementById('fac-id').value = '';
        document.getElementById('fac-cliente').value = s.clienteId;
        document.getElementById('fac-servicio').value = s.id;
        document.getElementById('fac-concepto').value = s.tipo + (cliente ? ` — ${cliente.nombre}` : '');
        document.getElementById('fac-importe').value = '';
        document.getElementById('fac-importe').focus();
    }, 50);
}

// ---------- CLIENTES ----------
function renderClientes() {
    const busq = (document.getElementById('buscar-cliente')?.value || '').toLowerCase();
    let clientes = Store.getClientes();
    if (busq) clientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busq) || c.email?.toLowerCase().includes(busq) || c.telefono.includes(busq)
    );
    document.getElementById('tbody-clientes').innerHTML = clientes.map(c => {
        const numServicios = Store.getServicios().filter(s => s.clienteId === c.id).length;
        return `<tr>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.telefono}</td>
            <td>${c.email || '—'}</td>
            <td>${c.direccion || '—'}</td>
            <td><span class="service-status ${c.activo ? 'status-completed' : 'status-pending'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="acciones">
                <span class="text-secondary text-sm">${numServicios} servicios</span>
                <button class="btn-icon" onclick="abrirModalCliente(${c.id})" title="Editar"><i class="fi fi-rr-pencil"></i></button>
                <button class="btn-icon" onclick="nuevoServicioParaCliente(${c.id})" title="Nuevo servicio"><i class="fi fi-rr-plus"></i></button>
                <button class="btn-icon red" onclick="eliminarCliente(${c.id})" title="Eliminar"><i class="fi fi-rr-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function abrirModalCliente(id) {
    const c = id ? Store.getCliente(id) : null;
    document.getElementById('modal-cliente-titulo').textContent = id ? 'Editar cliente' : 'Nuevo cliente';
    document.getElementById('cl-id').value = c?.id || '';
    document.getElementById('cl-nombre').value = c?.nombre || '';
    document.getElementById('cl-telefono').value = c?.telefono || '';
    document.getElementById('cl-email').value = c?.email || '';
    document.getElementById('cl-direccion').value = c?.direccion || '';
    abrirModal('modal-cliente');
}

document.getElementById('form-cliente').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('cl-id').value) || null;
    const data = {
        nombre: document.getElementById('cl-nombre').value,
        telefono: document.getElementById('cl-telefono').value,
        email: document.getElementById('cl-email').value,
        direccion: document.getElementById('cl-direccion').value,
        activo: true
    };
    if (id) { data.id = id; Store.updateCliente(data); }
    else    { Store.addCliente(data); }
    cerrarModal('modal-cliente');
    mostrarToast(id ? '✅ Cliente actualizado' : '✅ Cliente añadido');
    renderClientes();
});

function eliminarCliente(id) {
    if (!confirm('¿Eliminar este cliente? Se perderán sus servicios asociados.')) return;
    Store.deleteCliente(id);
    renderClientes();
    mostrarToast('🗑️ Cliente eliminado');
}

function nuevoServicioParaCliente(clienteId) {
    editarServicio(null);
    setTimeout(() => document.getElementById('sv-cliente').value = clienteId, 50);
}

// ---------- TÉCNICOS ----------
function renderTecnicos() {
    const tecnicos = Store.getTecnicos();
    const hoy = new Date().toISOString().split('T')[0];
    const serviciosHoy = Store.getServicios().filter(s => s.fecha === hoy);

    document.getElementById('tecnicos-grid').innerHTML = tecnicos.map(t => {
        const asignados = serviciosHoy.filter(s => s.tecnicoId === t.id);
        return `
        <div class="card tecnico-card">
            <div class="tecnico-top">
                <img src="${t.avatar || 'https://i.pravatar.cc/80?u=t'+t.id}" class="avatar-lg">
                <span class="dot-estado lg ${t.disponible ? 'disponible' : 'ocupado'}"></span>
                <div>
                    <div class="font-bold font-lg">${t.nombre}</div>
                    <div class="text-secondary">${t.especialidad}</div>
                    <div class="text-sm">${t.telefono}</div>
                </div>
            </div>
            <div class="tecnico-stats">
                <div class="stat"><span>${asignados.length}</span><small>Hoy</small></div>
                <div class="stat"><span>${Store.getServicios().filter(s => s.tecnicoId === t.id && s.estado === 'completado').length}</span><small>Completados</small></div>
            </div>
            <div class="tecnico-acciones">
                <button class="btn-secondary btn-sm" onclick="abrirModalTecnico(${t.id})">
                    <i class="fi fi-rr-pencil"></i> Editar
                </button>
                <button class="btn-secondary btn-sm" onclick="toggleDisponible(${t.id})">
                    <i class="fi fi-rr-refresh"></i> ${t.disponible ? 'Marcar ocupado' : 'Marcar libre'}
                </button>
                <button class="btn-icon red" onclick="eliminarTecnico(${t.id})"><i class="fi fi-rr-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

function abrirModalTecnico(id) {
    const t = id ? Store.getTecnico(id) : null;
    document.getElementById('modal-tecnico-titulo').textContent = id ? 'Editar técnico' : 'Nuevo técnico';
    document.getElementById('tc-id').value = t?.id || '';
    document.getElementById('tc-nombre').value = t?.nombre || '';
    document.getElementById('tc-telefono').value = t?.telefono || '';
    document.getElementById('tc-especialidad').value = t?.especialidad || 'Reparaci\u00f3n de ordenadores';
    abrirModal('modal-tecnico');
}

document.getElementById('form-tecnico').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('tc-id').value) || null;
    const data = {
        nombre: document.getElementById('tc-nombre').value,
        telefono: document.getElementById('tc-telefono').value,
        especialidad: document.getElementById('tc-especialidad').value,
        disponible: true,
        avatar: `https://i.pravatar.cc/80?u=${document.getElementById('tc-nombre').value}`
    };
    if (id) { data.id = id; Store.updateTecnico(data); }
    else    { Store.addTecnico(data); }
    cerrarModal('modal-tecnico');
    mostrarToast(id ? '✅ Técnico actualizado' : '✅ Técnico añadido');
    renderTecnicos();
});

function eliminarTecnico(id) {
    if (!confirm('¿Eliminar este técnico?')) return;
    Store.deleteTecnico(id);
    renderTecnicos();
}

function toggleDisponible(id) {
    const t = Store.getTecnico(id);
    t.disponible = !t.disponible;
    Store.updateTecnico(t);
    renderTecnicos();
}

// ---------- FACTURAS ----------
function renderFacturas() {
    let facturas = Store.getFacturas();
    const filtro = document.getElementById('filtro-estado-factura')?.value;
    if (filtro) facturas = facturas.filter(f => f.estado === filtro);

    const sel = document.getElementById('fac-cliente');
    if (sel) sel.innerHTML = Store.getClientes().map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    document.getElementById('tbody-facturas').innerHTML = facturas.map(f => {
        const cliente = Store.getCliente(f.clienteId);
        return `<tr>
            <td><strong>${f.numero}</strong></td>
            <td>${cliente ? cliente.nombre : '—'}</td>
            <td>${f.concepto}</td>
            <td>${f.fecha}</td>
            <td><strong>€${parseFloat(f.importe).toFixed(2)}</strong></td>
            <td><span class="service-status ${f.estado === 'pagada' ? 'status-completed' : 'status-pending'}">${f.estado === 'pagada' ? 'Pagada' : 'Pendiente'}</span></td>
            <td class="acciones">
                <button class="btn-icon" onclick="editarFactura(${f.id})" title="Editar"><i class="fi fi-rr-pencil"></i></button>
                ${f.estado === 'pendiente'
                    ? `<button class="btn-icon green" onclick="marcarPagada(${f.id})" title="Marcar pagada"><i class="fi fi-rr-check"></i></button>`
                    : ''}
                <button class="btn-icon" onclick="imprimirFactura(${f.id})" title="PDF"><i class="fi fi-rr-print"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function abrirModalFactura(id) {
    const f = id ? Store.getFactura(id) : null;
    document.getElementById('modal-factura-titulo').textContent = f ? 'Editar factura' : 'Nueva factura';
    document.getElementById('fac-id').value = f?.id || '';
    const sel = document.getElementById('fac-cliente');
    sel.innerHTML = Store.getClientes().map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const selSv = document.getElementById('fac-servicio');
    selSv.innerHTML = '<option value="">Sin vincular</option>' +
        Store.getServicios().filter(s => !s.facturaId || (f && s.facturaId === f.id)).map(s => {
            const c = Store.getCliente(s.clienteId);
            return `<option value="${s.id}">${s.tipo} — ${c ? c.nombre : ''} (${s.fecha})</option>`;
        }).join('');
    document.getElementById('fac-cliente').value = f?.clienteId || '';
    document.getElementById('fac-servicio').value = f?.servicioId || '';
    document.getElementById('fac-concepto').value = f?.concepto || '';
    document.getElementById('fac-importe').value = f ? f.importe : '';
    document.getElementById('fac-fecha').value = f?.fecha || new Date().toISOString().split('T')[0];
    document.getElementById('fac-estado').value = f?.estado || 'pendiente';
    abrirModal('modal-factura');
}

function editarFactura(id) {
    abrirModalFactura(id);
}

document.getElementById('form-factura').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt(document.getElementById('fac-id').value) || null;
    const servicioId = parseInt(document.getElementById('fac-servicio').value) || null;
    const data = {
        clienteId:  parseInt(document.getElementById('fac-cliente').value),
        servicioId,
        concepto:   document.getElementById('fac-concepto').value,
        importe:    parseFloat(document.getElementById('fac-importe').value),
        fecha:      document.getElementById('fac-fecha').value,
        estado:     document.getElementById('fac-estado').value
    };
    if (id) {
        data.id = id;
        const existing = Store.getFactura(id);
        data.numero = existing.numero;
        Store.updateFactura(data);
        cerrarModal('modal-factura');
        mostrarToast('✅ Factura actualizada');
    } else {
        const f = Store.addFactura(data);
        if (servicioId) {
            const s = Store.getServicio(servicioId);
            if (s) { s.facturaId = f.id; Store.updateServicio(s); }
        }
        cerrarModal('modal-factura');
        mostrarToast('🧾 Factura ' + f.numero + ' creada');
    }
    renderFacturas();
    renderDashboard();
});

function marcarPagada(id) {
    const f = Store.getFacturas().find(x => x.id === id);
    f.estado = 'pagada'; Store.updateFactura(f);
    renderFacturas();
    mostrarToast('✅ Factura marcada como pagada');
}

function imprimirFactura(id) {
    const f = Store.getFacturas().find(x => x.id === id);
    const c = Store.getCliente(f.clienteId);
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${f.numero}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}
    h1{color:#111}.header{display:flex;justify-content:space-between}
    .linea{border-top:2px solid #111;margin:20px 0}
    .total{font-size:1.5rem;font-weight:bold;text-align:right}</style>
    </head><body>
    <div class="header"><div><h1>FACTURA</h1><p>${f.numero}</p></div>
    <div><strong>HomeTech</strong><br>TFG DAW 2026</div></div>
    <div class="linea"></div>
    <p><strong>Cliente:</strong> ${c ? c.nombre : '—'}</p>
    <p><strong>Dirección:</strong> ${c ? c.direccion : '—'}</p>
    <p><strong>Fecha:</strong> ${f.fecha}</p>
    <div class="linea"></div>
    <p><strong>Concepto:</strong> ${f.concepto}</p>
    <div class="linea"></div>
    <p class="total">TOTAL: €${parseFloat(f.importe).toFixed(2)}</p>
    <p><small>Estado: ${f.estado}</small></p>
    </body></html>`);
    w.print();
}

// ---------- MAPA LEAFLET ----------
let mapaAdmin = null;

function renderMapa() {
    const hoy = new Date().toISOString().split('T')[0];
    const filtroTec = document.getElementById('filtro-tecnico-mapa')?.value;
    let servicios = Store.getServicios().filter(s => s.fecha === hoy);
    if (filtroTec) servicios = servicios.filter(s => s.tecnicoId === parseInt(filtroTec));
    servicios.sort((a, b) => a.hora.localeCompare(b.hora));

    // Poblar selector de técnicos
    const selTec = document.getElementById('filtro-tecnico-mapa');
    if (selTec && selTec.options.length <= 1) {
        Store.getTecnicos().forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id; opt.textContent = t.nombre;
            selTec.appendChild(opt);
        });
    }

    // Inicializar mapa Leaflet
    const mapEl = document.getElementById('mapa-admin');
    if (!mapEl) return;
    if (mapaAdmin) { mapaAdmin.remove(); mapaAdmin = null; }
    mapaAdmin = L.map('mapa-admin').setView([40.4168, -3.7038], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapaAdmin);

    const labels = { pendiente:'Pendiente', en_curso:'En curso', completado:'Completado' };
    const colores = { pendiente:'#f59e0b', en_curso:'#3b82f6', completado:'#10b981' };
    const puntos = [];

    servicios.forEach((s, i) => {
        const c = Store.getCliente(s.clienteId);
        if (!c || !c.lat) return;
        const tec = s.tecnicoId ? Store.getTecnico(s.tecnicoId) : null;
        const color = colores[s.estado] || '#6366f1';
        const icon = L.divIcon({
            className: 'mapa-pin-custom',
            html: `<div style="background:${color};color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i+1}</div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
        });
        const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapaAdmin);
        marker.bindPopup(`<strong>${s.hora} — ${c.nombre}</strong><br>${s.tipo}<br><small>${c.direccion}</small><br><span style="color:${color};font-weight:600">${labels[s.estado]}</span>${tec ? '<br>Técnico: ' + tec.nombre : ''}`);
        puntos.push([c.lat, c.lng]);
    });

    // Dibujar línea de ruta
    if (puntos.length > 1) {
        L.polyline(puntos, { color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '8,8' }).addTo(mapaAdmin);
    }
    if (puntos.length > 0) {
        mapaAdmin.fitBounds(puntos, { padding: [40, 40] });
    }

    // Lista lateral
    document.getElementById('mapa-servicios-hoy').innerHTML = servicios.length ? servicios.map((s, i) => {
        const c = Store.getCliente(s.clienteId);
        const color = colores[s.estado] || '#6366f1';
        return `<div class="service-block" style="margin-bottom:0.75rem;cursor:pointer" onclick="mapaAdmin&&mapaAdmin.setView([${c?.lat||0},${c?.lng||0}],15)">
            <div class="service-icon" style="background:${color};color:#fff;border-color:${color}"><strong>${i+1}</strong></div>
            <div class="service-info">
                <div class="service-client">${c ? c.nombre : '—'} — ${s.hora}</div>
                <div class="service-duration">${s.tipo} · ${c ? c.direccion : ''}</div>
            </div>
        </div>`;
    }).join('') : '<p style="color:var(--text-secondary);padding:2rem;text-align:center">No hay servicios hoy</p>';

    document.getElementById('ruta-sugerida').innerHTML = servicios.map((s, i) => {
        const c = Store.getCliente(s.clienteId);
        return `<li style="padding:0.5rem 0;border-bottom:1px solid var(--border-color)">
            <strong>${i+1}.</strong> ${s.hora} — ${c ? c.nombre : '—'}<br>
            <small style="color:var(--text-secondary)">${c ? c.direccion : ''}</small>
        </li>`;
    }).join('') || '<li style="color:var(--text-secondary)">Sin servicios</li>';
}

// ---------- BUSCADOR GLOBAL ----------
document.getElementById('buscador-global').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    if (!q) return;
    const cliente = Store.getClientes().find(c => c.nombre.toLowerCase().includes(q));
    if (cliente) { navegarA('clientes'); setTimeout(() => { document.getElementById('buscar-cliente').value = q; renderClientes(); }, 100); }
});

// ---------- MODALES (helpers) ----------
function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
}
function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}
function cerrarTodosModales() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('overlay').classList.add('hidden');
}

// ---------- TOAST ----------
function mostrarToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div'); toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#111827;color:white;padding:1rem 1.5rem;border-radius:10px;z-index:999;font-size:0.95rem;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        document.body.appendChild(toast);
    }
    toast.textContent = msg; toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    actualizarBadgeSolicitudes();
    actualizarBadgeMensajes();

    // Botón notificaciones → ir a solicitudes
    document.getElementById('btn-notif').addEventListener('click', () => navegarA('solicitudes'));
    // Botón mensajes → ir a mensajes
    document.getElementById('btn-mensajes').addEventListener('click', () => navegarA('mensajes'));

    const formResp = document.getElementById('form-responder-mensaje');
    if (formResp) {
        formResp.addEventListener('submit', e => {
            e.preventDefault();
            const msgId = parseInt(document.getElementById('resp-mensaje-id').value, 10);
            const texto = document.getElementById('resp-mensaje-texto').value.trim();
            if (!texto) return;
            const original = Store.getMensajes().find(x => x.id === msgId);
            if (!original) return;
            Store.marcarLeido(msgId);
            Store.addRespuestaStaff({
                clienteId: original.clienteId,
                texto,
                autorRol: 'admin',
                autorNombre: 'Administrador HomeTech',
                parentId: msgId
            });
            cerrarModal('modal-responder-mensaje');
            renderMensajesAdmin();
            mostrarToast('✅ Respuesta enviada al cliente');
        });
    }
});

// ---------- MENSAJES ADMIN ----------
function renderMensajesAdmin() {
    actualizarBadgeMensajes();
    const mensajes = Store.getMensajes()
        .filter(m => (m.origen || 'cliente') === 'cliente')
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const sinLeer = mensajes.filter(m => !m.leido).length;
    document.getElementById('mensajes-count').textContent = sinLeer + ' sin leer';

    document.getElementById('lista-mensajes-admin').innerHTML = mensajes.length ? mensajes.map(m => {
        const cliente = Store.getCliente(m.clienteId);
        return `
        <div class="solicitud-card" style="${!m.leido ? 'border-left:4px solid var(--color-primary)' : ''}">
            <div class="sol-header">
                <span class="font-bold">${cliente ? cliente.nombre : 'Cliente #' + m.clienteId}</span>
                <span class="text-sm text-secondary">${new Date(m.fecha).toLocaleString('es-ES')}</span>
            </div>
            <div class="sol-body">
                <p style="font-size:0.95rem">${m.texto}</p>
                ${cliente ? `<p class="text-sm text-secondary"><i class="fi fi-rr-phone-call"></i> ${cliente.telefono} · <i class="fi fi-rr-envelope"></i> ${cliente.email || '—'}</p>` : ''}
            </div>
            <div class="sol-footer">
                ${!m.leido ? `<button class="btn-primary btn-sm" onclick="marcarMensajeLeido(${m.id})"><i class="fi fi-rr-check"></i> Marcar leído</button>` : '<span class="text-sm text-secondary">✓ Leído</span>'}
                <button class="btn-secondary btn-sm" onclick="abrirResponderMensaje(${m.id})"><i class="fi fi-rr-reply"></i> Responder</button>
                <button class="btn-dev-delete" onclick="eliminarMensajeDev(${m.id})" title="Eliminar (solo pruebas)">×</button>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;color:var(--text-secondary);padding:3rem">No hay mensajes</p>';
}

function abrirResponderMensaje(id) {
    const m = Store.getMensajes().find(x => x.id === id);
    if (!m) return;
    const cliente = Store.getCliente(m.clienteId);
    document.getElementById('resp-mensaje-id').value = id;
    document.getElementById('resp-mensaje-texto').value = '';
    document.getElementById('resp-mensaje-cliente').innerHTML = `
        <strong>${cliente ? cliente.nombre : 'Cliente'}</strong>
        <p style="margin-top:0.5rem;font-size:0.9rem">${m.texto}</p>
        <p class="text-sm text-secondary" style="margin-top:0.35rem">${new Date(m.fecha).toLocaleString('es-ES')}</p>`;
    abrirModal('modal-responder-mensaje');
}

function marcarMensajeLeido(id) {
    Store.marcarLeido(id);
    renderMensajesAdmin();
    mostrarToast('✓ Mensaje marcado como leído');
}

function eliminarMensajeDev(id) {
    if (!confirm('¿Eliminar este mensaje? (solo entorno de pruebas)')) return;
    Store.deleteMensaje(id);
    renderMensajesAdmin();
    mostrarToast('Mensaje eliminado');
}

function actualizarBadgeMensajes() {
    const n = Store.getMensajesSinLeerAdmin().length;
    const badge = document.getElementById('badge-mensajes');
    if (badge) { badge.textContent = n; badge.style.display = n ? '' : 'none'; }
    const navBadge = document.getElementById('nav-badge-mensajes');
    if (navBadge) { navBadge.textContent = n || ''; navBadge.style.display = n ? '' : 'none'; }
}
