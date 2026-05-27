// ================================================
// PORTAL-CLIENTE.JS — Portal dinámico del cliente
// Lee TODO desde Store según el usuario logueado
// ================================================

let clienteActual = null;
let usuarioActual = null;

// ================================================
// INICIALIZACIÓN
// ================================================
function initPortal() {
    usuarioActual = Auth.getUser();
    if (!usuarioActual || !usuarioActual.clienteId) return;

    clienteActual = Store.getCliente(usuarioActual.clienteId);
    if (!clienteActual) return;

    renderDatosCliente();
    renderKpis();
    renderCitas();
    renderHistorial();
    renderFacturas();
    renderMensajes();
    actualizarBadgeNotificaciones();
    setupPerfilCliente();
    setupNotificacionesCliente();
    console.log('✅ Portal del cliente iniciado — datos dinámicos desde Store');
}

// ================================================
// DATOS DEL CLIENTE
// ================================================
function renderDatosCliente() {
    const partes = clienteActual.nombre.split(' ');
    const nombre = partes[0];
    const completo = clienteActual.nombre;

    const elNombre = document.getElementById('nombre-cliente');
    const elCompleto = document.getElementById('nombre-completo');
    const elEmpresa = document.getElementById('nombre-empresa');
    const elPie = document.getElementById('pie-empresa');

    if (elNombre)   elNombre.textContent = nombre;
    if (elCompleto) elCompleto.textContent = completo;
    if (elEmpresa)  elEmpresa.textContent = 'HomeTech';
    if (elPie)      elPie.textContent = 'HomeTech';

    const avatar = document.getElementById('user-avatar');
    if (avatar && usuarioActual?.avatar) avatar.src = usuarioActual.avatar;
    const preview = document.getElementById('perfil-cli-preview');
    if (preview && usuarioActual?.avatar) preview.src = usuarioActual.avatar;
}

// ================================================
// KPIs DINÁMICOS
// ================================================
function renderKpis() {
    const servicios = Store.getServicios().filter(s => s.clienteId === clienteActual.id);
    const facturas = Store.getFacturas().filter(f => f.clienteId === clienteActual.id);
    const hoy = new Date().toISOString().split('T')[0];

    // Servicios realizados (completados)
    const completados = servicios.filter(s => s.estado === 'completado').length;
    document.getElementById('kpi-servicios').textContent = completados;

    // Facturas pendientes
    const factPendientes = facturas.filter(f => f.estado === 'pendiente').length;
    document.getElementById('kpi-facturas').textContent = factPendientes;

    // Próxima cita — servicio futuro más cercano
    const proximos = servicios
        .filter(s => s.fecha >= hoy && s.estado !== 'completado')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    if (proximos.length > 0) {
        const fecha = new Date(proximos[0].fecha + 'T00:00:00');
        const dia = fecha.getDate();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        document.getElementById('kpi-proxima-cita').textContent = `${dia} ${meses[fecha.getMonth()]}`;
    } else {
        document.getElementById('kpi-proxima-cita').textContent = '—';
    }

    // Importe total facturado
    const importeTotal = facturas.reduce((acc, f) => acc + parseFloat(f.importe || 0), 0);
    document.getElementById('kpi-importe').textContent = '€' + importeTotal.toFixed(0);
}

// ================================================
// PRÓXIMAS CITAS (servicios futuros pendientes)
// ================================================
function renderCitas() {
    const hoy = new Date().toISOString().split('T')[0];
    const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Servicios futuros o de hoy, no completados
    const proximas = Store.getServicios()
        .filter(s => s.clienteId === clienteActual.id && s.fecha >= hoy && s.estado !== 'completado')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    // También incluir solicitudes pendientes del cliente
    const solicitudes = Store.getSolicitudes()
        .filter(s => s.clienteId === clienteActual.id && s.estado === 'nueva');

    const listaCitas = document.getElementById('lista-citas');

    if (proximas.length === 0 && solicitudes.length === 0) {
        listaCitas.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-secondary)">
                <i class="fi fi-rr-calendar" style="font-size:2.5rem;display:block;margin-bottom:0.5rem;opacity:0.4"></i>
                No tienes citas próximas
            </div>`;
        return;
    }

    let html = '';

    // Servicios confirmados (con técnico asignado)
    html += proximas.map(s => {
        const fecha = new Date(s.fecha + 'T00:00:00');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = mesesCortos[fecha.getMonth()];
        const tecnico = s.tecnicoId ? Store.getTecnico(s.tecnicoId) : null;
        const estadoBadge = s.tecnicoId
            ? '<span class="badge-estado badge-confirmada">Confirmada</span>'
            : '<span class="badge-estado badge-pendiente">Pendiente</span>';

        return `
        <div class="cita-item">
            <div class="cita-fecha-box">
                <div class="cita-dia">${dia}</div>
                <div class="cita-mes">${mes}</div>
            </div>
            <div class="cita-info">
                <div class="cita-titulo">${s.tipo}</div>
                <div class="cita-hora">
                    <i class="fi fi-rr-clock"></i> ${s.hora}
                    ${tecnico ? ` · <strong>${tecnico.nombre}</strong>` : ''}
                </div>
                ${s.descripcion ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.2rem">${s.descripcion}</div>` : ''}
            </div>
            ${estadoBadge}
        </div>`;
    }).join('');

    // Solicitudes pendientes (aún no asignadas como servicio)
    html += solicitudes.map(s => {
        const fecha = new Date(s.fecha);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = mesesCortos[fecha.getMonth()];

        return `
        <div class="cita-item" style="border-left-color:var(--color-warning)">
            <div class="cita-fecha-box" style="background:var(--color-warning)">
                <div class="cita-dia">${dia}</div>
                <div class="cita-mes">${mes}</div>
            </div>
            <div class="cita-info">
                <div class="cita-titulo">${s.tipo}</div>
                <div class="cita-hora">
                    <i class="fi fi-rr-comment"></i> ${s.descripcion}
                </div>
            </div>
            <span class="badge-estado badge-pendiente">Solicitud enviada</span>
        </div>`;
    }).join('');

    listaCitas.innerHTML = html;
}

// ================================================
// HISTORIAL DE SERVICIOS (completados)
// ================================================
function renderHistorial() {
    const servicios = Store.getServicios()
        .filter(s => s.clienteId === clienteActual.id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const estados = {
        completado: '<span class="badge-estado badge-completado">Completado</span>',
        en_curso:   '<span class="badge-estado badge-pendiente">En curso</span>',
        pendiente:  '<span class="badge-estado badge-pendiente">Pendiente</span>'
    };

    const tbody = document.getElementById('tabla-servicios-body');

    if (servicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem">Sin servicios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = servicios.map(s => {
        const tecnico = s.tecnicoId ? Store.getTecnico(s.tecnicoId) : null;
        const fechaFormateada = formatFecha(s.fecha);
        return `
        <tr>
            <td>${fechaFormateada}</td>
            <td>${s.tipo}${s.descripcion ? '<br><small style="color:var(--text-secondary)">' + s.descripcion + '</small>' : ''}</td>
            <td>${tecnico ? tecnico.nombre : '<span style="color:var(--text-secondary)">Sin asignar</span>'}</td>
            <td>${estados[s.estado] || s.estado}</td>
        </tr>`;
    }).join('');
}

// ================================================
// FACTURAS (desde Store)
// ================================================
function renderFacturas() {
    const facturas = Store.getFacturas()
        .filter(f => f.clienteId === clienteActual.id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const estados = {
        pagada:    '<span class="badge-estado badge-pagada">Pagada</span>',
        pendiente: '<span class="badge-estado badge-pendiente">Pendiente</span>'
    };

    const lista = document.getElementById('lista-facturas');

    if (facturas.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-secondary)">
                <i class="fi fi-rr-receipt" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.4"></i>
                No tienes facturas
            </div>`;
        return;
    }

    lista.innerHTML = facturas.map(f => `
        <div class="factura-item">
            <div class="factura-info">
                <div class="factura-numero">${f.numero}</div>
                <div class="factura-fecha">${formatFecha(f.fecha)}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.15rem">${f.concepto}</div>
            </div>
            <div class="factura-right">
                <span class="factura-importe">€${parseFloat(f.importe).toFixed(2)}</span>
                ${estados[f.estado] || ''}
                <button class="btn-pdf" onclick="descargarFacturaPDF(${f.id})">
                    <i class="fi fi-rr-download"></i> PDF
                </button>
            </div>
        </div>
    `).join('');
}

// ================================================
// DESCARGAR PDF DE FACTURA
// ================================================
function descargarFacturaPDF(id) {
    const f = Store.getFactura(id);
    if (!f) return;
    const c = Store.getCliente(f.clienteId);
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${f.numero}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}
    h1{color:#111}.header{display:flex;justify-content:space-between}
    .linea{border-top:2px solid #111;margin:20px 0}
    .total{font-size:1.5rem;font-weight:bold;text-align:right}
    .logo{font-size:1.5rem;font-weight:bold;color:#6366f1}
    </style>
    </head><body>
    <div class="header"><div><h1>FACTURA</h1><p>${f.numero}</p></div>
    <div><span class="logo">HomeTech</span><br>Servicio de asistencia técnica<br>CIF: B12345678</div></div>
    <div class="linea"></div>
    <p><strong>Cliente:</strong> ${c ? c.nombre : '—'}</p>
    <p><strong>Dirección:</strong> ${c ? c.direccion : '—'}</p>
    <p><strong>Email:</strong> ${c ? c.email : '—'}</p>
    <p><strong>Fecha:</strong> ${f.fecha}</p>
    <div class="linea"></div>
    <p><strong>Concepto:</strong> ${f.concepto}</p>
    <table style="width:100%;margin:20px 0;border-collapse:collapse">
        <tr style="background:#f3f4f6"><th style="text-align:left;padding:8px">Concepto</th><th style="text-align:right;padding:8px">Importe</th></tr>
        <tr><td style="padding:8px">${f.concepto}</td><td style="text-align:right;padding:8px">€${parseFloat(f.importe).toFixed(2)}</td></tr>
        <tr><td style="padding:8px"><strong>IVA (21%)</strong></td><td style="text-align:right;padding:8px">€${(parseFloat(f.importe) * 0.21).toFixed(2)}</td></tr>
    </table>
    <div class="linea"></div>
    <p class="total">TOTAL: €${(parseFloat(f.importe) * 1.21).toFixed(2)}</p>
    <p><small>Estado: ${f.estado === 'pagada' ? '✅ Pagada' : '⏳ Pendiente de pago'}</small></p>
    <div class="linea"></div>
    <p style="text-align:center;color:#999;font-size:0.85rem">HomeTech — Servicio de asistencia técnica<br>www.hometech.es — info@hometech.es</p>
    </body></html>`);
    w.document.close();
    w.print();
}

// ================================================
// MENSAJES ENVIADOS
// ================================================
function renderMensajes() {
    const mensajes = Store.getMensajesCliente(clienteActual.id);
    const el = document.getElementById('lista-mensajes-enviados');
    if (!el) return;

    if (mensajes.length === 0) {
        el.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:0.5rem">Sin mensajes aún</p>';
        return;
    }

    el.innerHTML = mensajes.map(m => {
        const esCliente = (m.origen || 'cliente') === 'cliente';
        const clase = esCliente ? 'mensaje-burbuja-cliente' : 'mensaje-burbuja-staff';
        const autorHtml = esCliente ? '' : `<div class="mensaje-burbuja-autor">${m.autorNombre || (m.autorRol === 'tecnico' ? 'Tu técnico' : 'HomeTech')}</div>`;
        return `
        <div class="mensaje-burbuja ${clase}">
            <div class="mensaje-burbuja-meta">${formatFechaHora(m.fecha)}</div>
            ${autorHtml}
            <div>${m.texto}</div>
        </div>`;
    }).join('');
    const wrap = el.closest('.mensajes-historial-wrap');
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
    actualizarBadgeNotificaciones();
}

function actualizarBadgeNotificaciones() {
    const n = Store.getMensajesSinLeerCliente(clienteActual.id).length;
    const badge = document.getElementById('badge-notif');
    if (badge) {
        badge.textContent = n;
        badge.style.display = n ? '' : 'none';
    }
}

function setupNotificacionesCliente() {
    const btn = document.getElementById('btn-notificaciones');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const antes = Store.getMensajesSinLeerCliente(clienteActual.id).length;
        Store.marcarLeidosCliente(clienteActual.id);
        actualizarBadgeNotificaciones();
        const card = document.querySelector('.card-contacto');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.outline = '2px solid var(--color-primary)';
            setTimeout(() => { card.style.outline = ''; }, 2000);
        }
        const wrap = document.querySelector('.mensajes-historial-wrap');
        if (wrap) wrap.scrollTop = wrap.scrollHeight;
        if (antes === 0) mostrarToastPortal('No tienes respuestas nuevas', 'warning');
        else mostrarToastPortal('Tienes respuestas del equipo en Contactar');
    });
}

function aplicarAvatarCliente(dataUrl) {
    if (!dataUrl) return;
    Store.setAvatarCliente(clienteActual.id, usuarioActual.id, dataUrl);
    usuarioActual.avatar = dataUrl;
    usuarioActual.nombre = clienteActual.nombre;
    sessionStorage.setItem('hometech_session', JSON.stringify(usuarioActual));
    const preview = document.getElementById('perfil-cli-preview');
    const topAvatar = document.getElementById('user-avatar');
    if (preview) preview.src = dataUrl;
    if (topAvatar) topAvatar.src = dataUrl;
}

function setupPerfilCliente() {
    const btnIr = document.getElementById('btn-ir-perfil');
    const modal = document.getElementById('modal-perfil');
    const overlay = document.getElementById('overlay');
    const cerrar = document.getElementById('cerrar-perfil');
    if (!btnIr || !modal) return;

    AvatarPicker.init({
        modalId: 'modal-avatar-picker',
        inputId: 'avatar-file-input',
        uploadBtnId: 'avatar-picker-upload',
        closeBtnId: 'avatar-picker-close',
        historyId: 'avatar-historial-grid',
        overlayId: 'overlay',
        parentModalId: 'modal-perfil',
        tipo: 'cliente',
        entityId: () => clienteActual.id,
        getCurrentAvatar: () => usuarioActual?.avatar || '',
        onSelect: dataUrl => aplicarAvatarCliente(dataUrl)
    });

    const abrirPerfil = () => {
        document.getElementById('perfil-cli-nombre').value = clienteActual.nombre;
        document.getElementById('perfil-cli-direccion').value = clienteActual.direccion || '';
        const preview = document.getElementById('perfil-cli-preview');
        if (preview && usuarioActual?.avatar) preview.src = usuarioActual.avatar;
        modal.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };
    const cerrarPerfil = () => {
        modal.classList.add('hidden');
        document.getElementById('modal-avatar-picker')?.classList.add('hidden');
        if (!document.getElementById('modal-cita').classList.contains('hidden')) return;
        overlay.classList.add('hidden');
    };

    btnIr.addEventListener('click', abrirPerfil);
    if (cerrar) cerrar.addEventListener('click', cerrarPerfil);

    document.getElementById('btn-abrir-avatar-picker')?.addEventListener('click', () => AvatarPicker.abrir());

    document.getElementById('form-perfil-cliente').addEventListener('submit', e => {
        e.preventDefault();
        clienteActual.nombre = document.getElementById('perfil-cli-nombre').value.trim();
        clienteActual.direccion = document.getElementById('perfil-cli-direccion').value.trim();
        Store.updateCliente(clienteActual);
        usuarioActual.nombre = clienteActual.nombre;
        const usuarios = Store.getUsuarios();
        const u = usuarios.find(x => x.id === usuarioActual.id);
        if (u) { u.nombre = clienteActual.nombre; Store._set('usuarios', usuarios); }
        sessionStorage.setItem('hometech_session', JSON.stringify(usuarioActual));
        renderDatosCliente();
        cerrarPerfil();
        mostrarToastPortal('✅ Perfil actualizado');
    });
}

// ================================================
// MODAL NUEVA CITA / SOLICITUD
// ================================================
document.getElementById('btn-nueva-cita').addEventListener('click', () => {
    document.getElementById('modal-cita').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    // Pre-rellenar fecha mínima = mañana
    const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    document.getElementById('fecha-cita').min = manana;
    document.getElementById('fecha-cita').value = manana;
});

document.getElementById('cerrar-modal').addEventListener('click', cerrarModalCita);
document.getElementById('overlay').addEventListener('click', () => {
    const modalPerfil = document.getElementById('modal-perfil');
    if (modalPerfil && !modalPerfil.classList.contains('hidden')) {
        modalPerfil.classList.add('hidden');
        document.getElementById('overlay').classList.add('hidden');
        return;
    }
    cerrarModalCita();
});

function cerrarModalCita() {
    document.getElementById('modal-cita').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}

document.getElementById('form-cita').addEventListener('submit', (e) => {
    e.preventDefault();
    const tipo  = document.getElementById('tipo-servicio').value;
    const fecha = document.getElementById('fecha-cita').value;
    const hora  = document.getElementById('hora-cita').value;
    const notas = document.getElementById('notas-cita').value;

    if (!tipo || !fecha || !hora) {
        mostrarToastPortal('⚠️ Rellena todos los campos obligatorios', 'warning');
        return;
    }

    // Crear solicitud real en el Store
    const tipoLabels = {
        'instalacion': 'Instalación',
        'reparacion': 'Reparación',
        'mantenimiento': 'Mantenimiento',
        'revision': 'Revisión',
        'urgencia': 'Reparación urgente'
    };

    Store.addSolicitud({
        nombre: clienteActual.nombre,
        telefono: clienteActual.telefono,
        email: clienteActual.email,
        direccion: clienteActual.direccion,
        tipo: tipoLabels[tipo] || tipo,
        descripcion: notas || 'Solicitud desde portal del cliente',
        urgencia: tipo === 'urgencia' ? 'alta' : 'media',
        clienteId: clienteActual.id,
        fechaPreferida: fecha,
        horaPreferida: hora
    });

    cerrarModalCita();
    e.target.reset();
    mostrarToastPortal('✅ Solicitud enviada correctamente. Te contactaremos pronto.');
    renderCitas();
    renderKpis();
});

// ================================================
// FORMULARIO DE MENSAJE
// ================================================
document.getElementById('form-mensaje').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = document.getElementById('mensaje-texto').value.trim();
    if (!texto) return;

    Store.addMensaje({
        clienteId: clienteActual.id,
        texto: texto,
        origen: 'cliente'
    });

    document.getElementById('mensaje-texto').value = '';
    mostrarToastPortal('✅ Mensaje enviado. Te responderemos pronto.');
    renderMensajes();
});

// ================================================
// TOAST NOTIFICATION
// ================================================
function mostrarToastPortal(msg, type = 'success') {
    let toast = document.getElementById('toast-portal');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-portal';
        toast.style.cssText = `
            position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
            background:#111827;color:white;padding:1rem 1.5rem;border-radius:12px;
            z-index:999;font-size:0.95rem;box-shadow:0 8px 24px rgba(0,0,0,0.3);
            max-width:400px;text-align:center;
            animation:slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);

        // Añadir animación
        if (!document.getElementById('toast-anim-style')) {
            const style = document.createElement('style');
            style.id = 'toast-anim-style';
            style.textContent = '@keyframes slideUp{from{transform:translate(-50%,20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}';
            document.head.appendChild(style);
        }
    }
    if (type === 'warning') toast.style.background = '#92400e';
    else toast.style.background = '#111827';
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    toast.offsetHeight; // trigger reflow
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => toast.style.display = 'none', 3500);
}

// ================================================
// UTILIDADES
// ================================================
function formatFecha(fechaStr) {
    try {
        const d = new Date(fechaStr + 'T00:00:00');
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return fechaStr;
    }
}

function formatFechaHora(isoStr) {
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' +
               d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return isoStr;
    }
}

// ================================================
// INICIALIZAR AL CARGAR
// ================================================
document.addEventListener('DOMContentLoaded', initPortal);
