// ================================================
// TRABAJADOR.JS — Panel del técnico con mapa Leaflet
// ================================================

let tecnicoActualId = null;
let mapaTecnico = null;

// ---------- INICIALIZACIÓN ----------
function init() {
    const tecnicos = Store.getTecnicos();
    if (!tecnicos.length) {
        document.body.innerHTML = '<div style="padding:3rem;text-align:center"><h2>No hay técnicos registrados</h2><a href="admin.html">Ir al panel admin</a></div>';
        return;
    }
    const sel = document.getElementById('select-tecnico-activo');
    sel.innerHTML = tecnicos.map(t =>
        `<option value="${t.id}">${t.nombre} — ${t.especialidad}</option>`
    ).join('');
    tecnicoActualId = tecnicos[0].id;
    cargarCamposPerfil();
    initAvatarPickerTecnico();
    renderTrabajador();
}

function cambiarTecnico() {
    tecnicoActualId = parseInt(document.getElementById('select-tecnico-activo').value);
    cargarCamposPerfil();
    renderTrabajador();
}

function cargarCamposPerfil() {
    const t = Store.getTecnico(tecnicoActualId);
    if (!t) return;
    const nom = document.getElementById('perfil-nombre');
    const preview = document.getElementById('perfil-tecnico-preview');
    if (nom) nom.value = t.nombre || '';
    if (preview) preview.src = t.avatar || `https://i.pravatar.cc/80?u=${t.id}`;
}

function aplicarAvatarTecnico(dataUrl) {
    if (!dataUrl) return;
    Store.setAvatarTecnico(tecnicoActualId, dataUrl);
    const preview = document.getElementById('perfil-tecnico-preview');
    const top = document.getElementById('avatar-trabajador');
    if (preview) preview.src = dataUrl;
    if (top) top.src = dataUrl;
}

function aplicarPerfilVisual() {
    const t = Store.getTecnico(tecnicoActualId);
    if (!t) return;
    const nom = document.getElementById('perfil-nombre')?.value.trim();
    if (nom) {
        t.nombre = nom;
        document.getElementById('saludo-tecnico').textContent = 'Hola, ' + nom;
        Store.updateTecnico(t);
    }
    mostrarToastTrabajador('Vista previa de perfil aplicada');
}

function initAvatarPickerTecnico() {
    AvatarPicker.init({
        modalId: 'modal-avatar-picker-tecnico',
        inputId: 'avatar-tecnico-input',
        uploadBtnId: 'avatar-tecnico-upload',
        closeBtnId: 'avatar-tecnico-close',
        historyId: 'avatar-tecnico-historial',
        overlayId: null,
        parentModalId: null,
        tipo: 'tecnico',
        entityId: () => tecnicoActualId,
        getCurrentAvatar: () => Store.getTecnico(tecnicoActualId)?.avatar || '',
        onSelect: dataUrl => aplicarAvatarTecnico(dataUrl)
    });
    document.getElementById('btn-abrir-avatar-tecnico')?.addEventListener('click', () => AvatarPicker.abrir());
}

function enviarMensajeCliente(clienteId, servicioId) {
    if (!Store.clienteTieneTecnicoAsignado(clienteId, tecnicoActualId)) {
        mostrarToastTrabajador('Este cliente no está asignado a ti');
        return;
    }
    const texto = prompt('Mensaje para el cliente:');
    if (!texto || !texto.trim()) return;
    const t = Store.getTecnico(tecnicoActualId);
    Store.addRespuestaStaff({
        clienteId,
        texto: texto.trim(),
        autorRol: 'tecnico',
        autorNombre: t?.nombre || 'Técnico',
        tecnicoId: tecnicoActualId
    });
    mostrarToastTrabajador('✅ Mensaje enviado al cliente');
}

// ---------- RENDER PRINCIPAL ----------
function renderTrabajador() {
    const t = Store.getTecnico(tecnicoActualId);
    if (!t) return;

    document.getElementById('saludo-tecnico').textContent = 'Hola, ' + t.nombre;
    document.getElementById('avatar-trabajador').src = t.avatar || `https://i.pravatar.cc/80?u=${t.id}`;

    const estadoEl = document.getElementById('estado-disponible');
    estadoEl.textContent = t.disponible ? 'Disponible' : 'Ocupado';
    estadoEl.className = 'service-status ' + (t.disponible ? 'status-completed' : 'status-pending');

    renderMisTrabajos();
    renderHistorialTecnico();
    renderRutaTecnico();
}

// ---------- MIS TRABAJOS ----------
function renderMisTrabajos() {
    const hoy = new Date().toISOString().split('T')[0];
    const servicios = Store.getServicios()
        .filter(s => s.tecnicoId === tecnicoActualId && s.fecha === hoy)
        .sort((a, b) => a.hora.localeCompare(b.hora));

    document.getElementById('stat-hoy').textContent        = servicios.length;
    document.getElementById('stat-encurso').textContent    = servicios.filter(s => s.estado === 'en_curso').length;
    document.getElementById('stat-completados').textContent = servicios.filter(s => s.estado === 'completado').length;

    const labels = { pendiente: 'Pendiente', en_curso: 'En curso', completado: 'Completado' };
    const clases = { pendiente: 'status-pending', en_curso: 'status-progress', completado: 'status-completed' };

    if (!servicios.length) {
        document.getElementById('lista-trabajos').innerHTML = `
            <div class="card" style="text-align:center;padding:3rem;color:var(--text-secondary)">
                <i class="fi fi-sr-check-circle" style="font-size:3rem;display:block;margin-bottom:1rem;color:var(--color-success)"></i>
                No tienes servicios asignados para hoy
            </div>`;
        return;
    }

    document.getElementById('lista-trabajos').innerHTML = servicios.map(s => {
        const c = Store.getCliente(s.clienteId);
        const gmapsUrl = c ? `https://maps.google.com/?q=${encodeURIComponent(c.direccion)}` : '#';
        const waUrl    = c ? `https://wa.me/${c.telefono?.replace(/\D/g,'')}` : '#';

        return `
        <div class="trabajo-card ${s.estado}">
            <div class="trabajo-header">
                <div>
                    <div class="trabajo-hora">${s.hora}</div>
                    <div style="font-weight:600;font-size:1.05rem">${s.tipo}</div>
                </div>
                <span class="service-status ${clases[s.estado]}">${labels[s.estado]}</span>
            </div>
            <div class="trabajo-body">
                <p><i class="fi fi-rr-user"></i>
                    <strong>${c ? c.nombre : '—'}</strong>
                    ${c?.telefono ? `· <a href="tel:${c.telefono}" style="color:var(--color-primary)">${c.telefono}</a>` : ''}
                </p>
                <p><i class="fi fi-rr-marker"></i> ${c ? c.direccion : '—'}</p>
                <p><i class="fi fi-rr-clock"></i> Duración estimada: <strong>${s.duracion}</strong></p>
                ${s.descripcion ? `<p><i class="fi fi-rr-comment"></i> ${s.descripcion}</p>` : ''}
            </div>
            <div class="trabajo-acciones">
                ${s.estado === 'pendiente' ? `
                    <button class="btn-primary btn-sm" onclick="cambiarEstado(${s.id}, 'en_curso')">
                        <i class="fi fi-rr-road"></i> Iniciar trabajo
                    </button>` : ''}
                ${s.estado === 'en_curso' ? `
                    <button class="btn-primary btn-sm" style="background:var(--color-success)"
                        onclick="cambiarEstado(${s.id}, 'completado')">
                        <i class="fi fi-rr-check"></i> Marcar completado
                    </button>` : ''}
                ${s.estado === 'completado' ? `
                    <span style="color:var(--color-success);font-weight:600">
                        <i class="fi fi-sr-check-circle"></i> Completado ✓
                    </span>` : ''}
                <a href="${waUrl}" target="_blank" class="btn-secondary btn-sm">
                    <i class="fi fi-rr-comment"></i> WhatsApp
                </a>
                <a href="${gmapsUrl}" target="_blank" class="btn-secondary btn-sm">
                    <i class="fi fi-rr-marker"></i> Navegar
                </a>
                ${c ? `<button type="button" class="btn-secondary btn-sm" onclick="enviarMensajeCliente(${c.id}, ${s.id})">
                    <i class="fi fi-rr-comment"></i> Mensaje al cliente
                </button>` : ''}
            </div>
            ${s.estado === 'en_curso' ? `
            <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color)">
                <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.4rem">
                    Notas del trabajo (opcional)
                </label>
                <textarea id="nota-${s.id}" rows="2" placeholder="Anota incidencias o materiales usados..."
                    style="width:100%;padding:0.625rem;border:1px solid var(--border-color);border-radius:8px;font-size:0.85rem;font-family:inherit;resize:vertical"
                    onchange="guardarNota(${s.id}, this.value)">${s.notas || ''}</textarea>
            </div>` : ''}
        </div>`;
    }).join('');
}

function cambiarEstado(servicioId, nuevoEstado) {
    const confirmMsg = nuevoEstado === 'completado'
        ? '¿Marcar este trabajo como completado?'
        : '¿Iniciar este trabajo ahora?';
    if (!confirm(confirmMsg)) return;
    const s = Store.getServicio(servicioId);
    s.estado = nuevoEstado;
    if (nuevoEstado === 'en_curso') s.horaInicio = new Date().toTimeString().slice(0,5);
    if (nuevoEstado === 'completado') s.horaFin   = new Date().toTimeString().slice(0,5);
    Store.updateServicio(s);
    renderMisTrabajos();
    renderRutaTecnico();
    mostrarToastTrabajador(nuevoEstado === 'completado' ? '✅ Trabajo completado' : '🔧 Trabajo iniciado');
}

function guardarNota(servicioId, nota) {
    const s = Store.getServicio(servicioId);
    s.notas = nota;
    Store.updateServicio(s);
}

// ---------- HISTORIAL ----------
function renderHistorialTecnico() {
    const servicios = Store.getServicios()
        .filter(s => s.tecnicoId === tecnicoActualId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const clases = { completado: 'status-completed', pendiente: 'status-pending', en_curso: 'status-progress' };
    const labels = { completado: 'Completado', pendiente: 'Pendiente', en_curso: 'En curso' };

    document.getElementById('tbody-historial').innerHTML = servicios.length
        ? servicios.map(s => {
            const c = Store.getCliente(s.clienteId);
            return `<tr>
                <td>${s.fecha}</td>
                <td>${c ? c.nombre : '—'}</td>
                <td>${s.tipo}</td>
                <td><span class="service-status ${clases[s.estado]}">${labels[s.estado]}</span></td>
                <td style="color:var(--text-secondary);font-size:0.85rem">${s.notas || '—'}</td>
            </tr>`;
          }).join('')
        : '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem">Sin historial</td></tr>';
}

// ---------- RUTA CON MAPA LEAFLET ----------
function renderRutaTecnico() {
    const hoy = new Date().toISOString().split('T')[0];
    const servicios = Store.getServicios()
        .filter(s => s.tecnicoId === tecnicoActualId && s.fecha === hoy && s.estado !== 'completado')
        .sort((a, b) => a.hora.localeCompare(b.hora));

    // Solo crear mapa si el tab es visible
    const tabRuta = document.getElementById('tab-ruta');
    const mapEl = document.getElementById('mapa-tecnico');
    if (mapEl && tabRuta && !tabRuta.classList.contains('hidden')) {
        if (mapaTecnico) { mapaTecnico.remove(); mapaTecnico = null; }
        mapaTecnico = L.map('mapa-tecnico').setView([40.4168, -3.7038], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapaTecnico);

        const puntos = [];
        const colores = { pendiente: '#f59e0b', en_curso: '#3b82f6' };

        servicios.forEach((s, i) => {
            const c = Store.getCliente(s.clienteId);
            if (!c || !c.lat) return;
            const color = colores[s.estado] || '#6366f1';
            const icon = L.divIcon({
                className: 'mapa-pin-custom',
                html: `<div style="background:${color};color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i+1}</div>`,
                iconSize: [36, 36], iconAnchor: [18, 18]
            });
            const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapaTecnico);
            marker.bindPopup(`<strong>${s.hora} — ${c.nombre}</strong><br>${s.tipo}<br><small>${c.direccion}</small><br><a href="https://maps.google.com/?q=${encodeURIComponent(c.direccion)}" target="_blank">Abrir en Google Maps →</a>`);
            puntos.push([c.lat, c.lng]);
        });

        if (puntos.length > 1) {
            L.polyline(puntos, { color: '#6366f1', weight: 3, opacity: 0.7, dashArray: '8,8' }).addTo(mapaTecnico);
        }
        if (puntos.length > 0) {
            mapaTecnico.fitBounds(puntos, { padding: [40, 40] });
        }
    }

    // Lista de paradas
    document.getElementById('ruta-tecnico').innerHTML = servicios.length
        ? servicios.map((s, i) => {
            const c = Store.getCliente(s.clienteId);
            const gmaps = c ? `https://maps.google.com/?q=${encodeURIComponent(c.direccion)}` : '#';
            return `
            <li style="padding:0.875rem 0;border-bottom:1px solid var(--border-color)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <strong>${i + 1}. ${s.hora}</strong> — ${c ? c.nombre : '—'}<br>
                        <small style="color:var(--text-secondary)">${c ? c.direccion : ''}</small>
                    </div>
                    <a href="${gmaps}" target="_blank" class="btn-secondary btn-sm" style="white-space:nowrap">
                        <i class="fi fi-rr-marker"></i> Ir
                    </a>
                </div>
            </li>`;
          }).join('')
        : '<li style="color:var(--text-secondary);padding:1rem 0">No quedan paradas pendientes 🎉</li>';

    // Distancia estimada
    const distEl = document.getElementById('distancia-total');
    if (distEl) {
        distEl.textContent = servicios.length ? `~${servicios.length * 4} km estimados` : '—';
    }
}

// ---------- TOGGLE DISPONIBILIDAD ----------
document.getElementById('btn-toggle-disponible').addEventListener('click', () => {
    const t = Store.getTecnico(tecnicoActualId);
    t.disponible = !t.disponible;
    Store.updateTecnico(t);
    renderTrabajador();
    mostrarToastTrabajador(t.disponible ? '🟢 Ahora estás disponible' : '🟡 Ahora estás ocupado');
});

// ---------- TABS ----------
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('hidden'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('tab-' + item.dataset.tab).classList.remove('hidden');
        item.classList.add('active');
        // Re-render mapa cuando se abre la pestaña ruta
        if (item.dataset.tab === 'ruta') {
            setTimeout(() => {
                if (mapaTecnico) mapaTecnico.invalidateSize();
                renderRutaTecnico();
            }, 100);
        }
    });
});

// ---------- TOAST ----------
function mostrarToastTrabajador(msg) {
    let toast = document.getElementById('toast-w');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-w';
        toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#111827;color:white;padding:1rem 1.5rem;border-radius:10px;z-index:999;font-size:0.95rem;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ---------- INIT ----------
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
