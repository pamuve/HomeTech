// ================================================
// AVATAR-PICKER.JS — Subida + historial (estilo Discord)
// Guarda imágenes en localStorage como data URL
// ================================================

const AvatarPicker = {
    _ctx: null,

    _entityId() {
        const id = this._ctx?.entityId;
        return typeof id === 'function' ? id() : id;
    },

    init(ctx) {
        this._ctx = ctx;
        const modal = document.getElementById(ctx.modalId);
        if (!modal || modal.dataset.bound) return;
        modal.dataset.bound = '1';

        const input = document.getElementById(ctx.inputId);
        const uploadBtn = document.getElementById(ctx.uploadBtnId);
        const closeBtn = document.getElementById(ctx.closeBtnId);

        if (uploadBtn && input) {
            uploadBtn.addEventListener('click', () => input.click());
            input.addEventListener('change', e => this._onFile(e.target.files[0]));
        }
        if (closeBtn) closeBtn.addEventListener('click', () => this.cerrar());
        modal.addEventListener('click', e => {
            if (e.target === modal) this.cerrar();
        });
    },

    abrir() {
        if (!this._ctx) return;
        this.renderHistorial();
        document.getElementById(this._ctx.modalId)?.classList.remove('hidden');
        if (this._ctx.overlayId) {
            const overlay = document.getElementById(this._ctx.overlayId);
            if (overlay) overlay.classList.remove('hidden');
        }
    },

    cerrar() {
        if (!this._ctx) return;
        document.getElementById(this._ctx.modalId)?.classList.add('hidden');
        if (this._ctx.overlayId) {
            const overlay = document.getElementById(this._ctx.overlayId);
            if (overlay && this._ctx.closeOverlay !== false) {
                const perfil = document.getElementById(this._ctx.parentModalId || '');
                if (!perfil || perfil.classList.contains('hidden')) overlay.classList.add('hidden');
            }
        }
    },

    renderHistorial() {
        const el = document.getElementById(this._ctx.historyId);
        if (!el || !this._ctx) return;
        const historial = Store.getAvatarHistorial(this._ctx.tipo, this._entityId());
        const actual = this._ctx.getCurrentAvatar?.() || '';

        if (!historial.length) {
            el.innerHTML = '<p class="avatar-historial-empty">Aún no hay fotos anteriores</p>';
            return;
        }

        el.innerHTML = historial.map((url, i) => `
            <button type="button" class="avatar-historial-item ${url === actual ? 'activo' : ''}"
                data-idx="${i}" title="Usar esta foto">
                <img src="${url}" alt="Avatar ${i + 1}">
            </button>
        `).join('');

        el.querySelectorAll('.avatar-historial-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                if (historial[idx]) this.seleccionar(historial[idx]);
            });
        });
    },

    seleccionar(dataUrl) {
        if (!this._ctx?.onSelect) return;
        this._ctx.onSelect(dataUrl);
        Store.addAvatarHistorial(this._ctx.tipo, this._entityId(), dataUrl);
        this.renderHistorial();
        this.cerrar();
    },

    async _onFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen válido (JPG, PNG, WebP…)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5 MB.');
            return;
        }
        try {
            const dataUrl = await this._compress(file);
            Store.addAvatarHistorial(this._ctx.tipo, this._entityId(), dataUrl);
            if (this._ctx.onSelect) this._ctx.onSelect(dataUrl);
            this.renderHistorial();
            this.cerrar();
        } catch (err) {
            console.error(err);
            alert('No se pudo procesar la imagen.');
        }
    },

    _compress(file, maxSize = 256) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = e => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > h) {
                        if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
                    } else if (h > maxSize) {
                        w = Math.round(w * maxSize / h); h = maxSize;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};
