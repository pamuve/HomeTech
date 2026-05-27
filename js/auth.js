// ================================================
// AUTH.JS — Gestión de sesión y rutas protegidas
// ================================================

const Auth = {

    // Guarda la sesión del usuario
    login(usuario) {
        sessionStorage.setItem('hometech_session', JSON.stringify({
            id:        usuario.id,
            nombre:    usuario.nombre,
            email:     usuario.email,
            rol:       usuario.rol,
            avatar:    usuario.avatar || 'https://i.pravatar.cc/80?u=' + usuario.id,
            tecnicoId: usuario.tecnicoId || null,
            clienteId: usuario.clienteId || null
        }));
    },

    // Cierra sesión y redirige al login
    logout() {
        sessionStorage.removeItem('hometech_session');
        window.location.href = getRutaLogin();
    },

    // Devuelve el usuario actual o null
    getUser() {
        const data = sessionStorage.getItem('hometech_session');
        return data ? JSON.parse(data) : null;
    },

    // Protege una página: si no hay sesión o el rol no coincide, redirige
    requireRole(rolRequerido) {
        const user = this.getUser();
        if (!user) {
            window.location.href = getRutaLogin();
            return null;
        }
        // Soporte para array de roles o string
        const roles = Array.isArray(rolRequerido) ? rolRequerido : [rolRequerido];
        if (!roles.includes(user.rol)) {
            // Redirige a su página correspondiente
            this.redirigirPorRol(user.rol);
            return null;
        }
        return user;
    },

    // Redirige al área correcta según el rol
    redirigirPorRol(rol) {
        const base = getBase();
        switch (rol) {
            case 'admin':   window.location.href = base + 'pages/admin.html';           break;
            case 'tecnico': window.location.href = base + 'pages/trabajador.html';      break;
            case 'cliente': window.location.href = base + 'pages/portal-cliente.html';  break;
            default:        window.location.href = base + 'index.html';
        }
    },

    // Inyecta el nombre y avatar del usuario en el topbar
    inyectarTopbar(avatarId, nombreId) {
        const user = this.getUser();
        if (!user) return;
        const avatarEl = document.getElementById(avatarId);
        const nombreEl = document.getElementById(nombreId);
        if (avatarEl) avatarEl.src = user.avatar;
        if (nombreEl) nombreEl.textContent = user.nombre;
    }
};

// Calcula la ruta relativa a index.html según dónde estemos
function getBase() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
}

function getRutaLogin() {
    return getBase() + 'index.html';
}
