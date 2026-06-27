document.addEventListener('DOMContentLoaded', () => {

    // =================================================================********
    // ⚙️ PANEL DE CONFIGURACIÓN GLOBAL (EDITABLE)
    // =================================================================********
    const CONFIG = {
        // ⚠️ ADVERTENCIA: Se recomienda mover estas llaves a variables de entorno (.env) en producción
        SUPABASE_URL: "https://mpvhgukapfqqavxhjcof.supabase.co", 
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmhndWthcGZxcWF2eGhqY29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI3NDcsImV4cCI6MjA5NzU0ODc0N30.TlRjs3v0y85QvCin9FmUYOOMlWMutgFm_LyGRA5FJHM",

        PORCENTAJE_MERMA: 0.05,         
        PORCENTAJE_GASTOS_FIJOS: 0.10,   
        MARGEN_UTILIDAD_DEFAULT: 60, 
        ITEMS_POR_PAGINA: 5,             

        AUTH: {
            TITULO_LOGIN: "Iniciar Sesión",
            DESC_LOGIN: "Gestiona los costos de tu negocio en la nube.",
            BTN_LOGIN: "Ingresar",
            SWITCH_LOGIN: "¿No tienes una cuenta? Regístrate aquí",
            TITULO_REGISTRO: "Crear Cuenta",
            DESC_REGISTRO: "Regístrate para guardar tus recetas en la nube",
            BTN_REGISTRO: "Registrarse",
            SWITCH_REGISTRO: "¿Ya tienes cuenta? Inicia sesión aquí",
            
            MSJ_VERIFICACION_TITULO: "¡Cuenta creada con éxito! 🎉",
            MSJ_VERIFICACION_CUERPO: `
                <p class="auth-verificacion-p">
                    Hemos enviado un enlace de verificación a tu correo para proteger tus recetas.
                </p>
                <div class="auth-verificacion-box">
                    📬 Revisa tu bandeja de entrada o SPAM y confirma tu cuenta.
                </div>
            `,
            MSJ_VERIFICACION_BTN: "Entendido"
        }
    };

    // =================================================================********
    // INSTANCIA DE SUPABASE WITH AUTOREFRESH & PERSISTENCE
    // =================================================================********
    const supabase = window.supabase ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            storageKey: 'nexi-auth-token',
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }) : null;

    // ESTADO DE LA APLICACIÓN
    let usuarioActual = null;
    let suscripcionUsuario = { isPremium: false, expiresAt: null }; 
    let listaItems = JSON.parse(localStorage.getItem('local_inventario')) || [];
    let listaReceta = JSON.parse(localStorage.getItem('local_receta')) || [];
    let catalogoRecetas = JSON.parse(localStorage.getItem('local_catalogo')) || [];
    let insumoSeleccionadoPorBuscador = null;

    let tipoActivo = 'insumo';
    let tipoRecetaActivo = 'insumo'; 
    let paginaActual = 1;
    
    let parametrosComerciales = JSON.parse(localStorage.getItem('local_parametros')) || {
        dificultad: "facil",
        manoObraPorHora: 0,
        distanciaIdaKm: 0,
        costoLitroGasolina: 0,
        tipoVehiculo: "sedan",
        porcionesPastel: 12,
        margenUtilidad: CONFIG.MARGEN_UTILIDAD_DEFAULT
    };

    // ELEMENTOS DEL DOM UNIFICADOS
    const tabInsumos = document.getElementById('tab-insumos');
    const tabConsumibles = document.getElementById('tab-consumibles');
    const formInsumo = document.getElementById('form-insumo');
    const insumoNombre = document.getElementById('insumo-nombre');
    const insumoMarca = document.getElementById('insumo-marca');
    const insumoPrecio = document.getElementById('insumo-precio');
    const insumoCantidad = document.getElementById('insumo-cantidad');
    const insumoUnidad = document.getElementById('insumo-unidad');
    const wrapperMarca = document.getElementById('wrapper-marca');
    const tablaInsumosBody = document.querySelector('#tabla-insumos tbody');
    const btnPagPrev = document.getElementById('btn-pag-prev');
    const btnPagNext = document.getElementById('btn-pag-next');
    const pagInfoTexto = document.getElementById('pag-info-texto');
    const btnDictar = document.getElementById('btn-dictar-voz');

    const formReceta = document.getElementById('form-receta');
    const recetaCantidad = document.getElementById('receta-cantidad');
    const tablaRecetaBody = document.querySelector('#tabla-receta tbody');
    const totalProduccionSpan = document.getElementById('total-produccion');
    
    const btnFinalizar = document.getElementById('btn-finalizar');
    const inputBuscar = document.getElementById('inputBuscarInsumo');
    const listaResultados = document.getElementById('listaResultadosInsumos');
    const btnLoginModal = document.getElementById('btn-login-modal');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    const unidadesInsumos = `<option value="gr">Gramos (gr)</option><option value="kilo">Kilos (kg)</option><option value="litro">Litros (L)</option><option value="ml">Mililitros (ml)</option><option value="pieza">Pieza (pza)</option>`;
    const unidadesConsumibles = `<option value="pieza">Pieza (pza)</option><option value="metro">Metro (m)</option><option value="paquete">Paquete (paq)</option>`;

    const escapeHTML = (str) => String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

    if (btnLoginModal) {
        btnLoginModal.addEventListener('click', () => abrirModalLoginSencillo(false));
    }

    function abrirModalLoginSencillo(esRegistro = false) {
        Swal.fire({
            title: esRegistro ? CONFIG.AUTH.TITULO_REGISTRO : CONFIG.AUTH.TITULO_LOGIN,
            text: esRegistro ? CONFIG.AUTH.DESC_REGISTRO : CONFIG.AUTH.DESC_LOGIN,
            html: `
                <div class="auth-modal-flex">
                    ${esRegistro ? `
                    <label class="auth-modal-label">NOMBRE</label>
                    <input id="modal-auth-nombre" type="text" class="swal2-input-custom" placeholder="Tu nombre">
                    ` : ''}
                    
                    <label class="auth-modal-label">CORREO ELECTRÓNICO</label>
                    <input id="modal-auth-email" type="email" class="swal2-input-custom" placeholder="correo@ejemplo.com">
                    
                    <label class="auth-modal-label">CONTRASEÑA</label>
                    <div class="swal2-password-wrapper">
                        <input id="modal-auth-password" type="password" class="swal2-input-custom" placeholder="••••••••" style="padding-right: 44px !important;">
                        <button type="button" class="swal2-password-toggle" data-target="modal-auth-password">
                            <i data-lucide="eye"></i>
                        </button>
                    </div>

                    ${esRegistro ? `
                    <div class="password-strength-container">
                        <div class="password-strength-bar">
                            <div id="strength-fill"></div>
                        </div>
                        <span id="strength-text">Fuerza: Muy débil 🥚</span>
                    </div>

                    <label class="auth-modal-label">CONFIRMAR CONTRASEÑA</label>
                    <div class="swal2-password-wrapper">
                        <input id="modal-auth-password-confirm" type="password" class="swal2-input-custom" placeholder="••••••••" style="padding-right: 44px !important;">
                        <button type="button" class="swal2-password-toggle" data-target="modal-auth-password-confirm">
                            <i data-lucide="eye"></i>
                        </button>
                    </div>
                    ` : ''}

                    <div class="auth-modal-switch-container">
                        <a href="#" id="modal-auth-switch" class="auth-modal-switch-link">
                            ${esRegistro ? CONFIG.AUTH.SWITCH_REGISTRO : CONFIG.AUTH.SWITCH_LOGIN}
                        </a>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: esRegistro ? CONFIG.AUTH.BTN_REGISTRO : CONFIG.AUTH.BTN_LOGIN,
            cancelButtonText: "Cancelar",
            buttonsStyling: false,
            customClass: {
                popup: 'swal2-popup-custom',
                title: 'swal2-title-custom',
                actions: 'swal2-actions-auth',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
            },
            didOpen: () => {
                const popup = Swal.getPopup();
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons({ node: popup });
                }

                const botonesOjo = popup.querySelectorAll('.swal2-password-toggle');
                botonesOjo.forEach(boton => {
                    boton.addEventListener('click', (e) => {
                        e.preventDefault();
                        const idTarget = boton.getAttribute('data-target');
                        const inputPassword = document.getElementById(idTarget);
                        
                        if (inputPassword.type === 'password') {
                            inputPassword.type = 'text';
                            boton.innerHTML = '<i data-lucide="eye-off"></i>';
                        } else {
                            inputPassword.type = 'password';
                            boton.innerHTML = '<i data-lucide="eye"></i>';
                        }
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons({ node: boton });
                        }
                    });
                });

                if (esRegistro) {
                    const inputPass = document.getElementById('modal-auth-password');
                    const barraRelleno = document.getElementById('strength-fill');
                    const txtFuerza = document.getElementById('strength-text');

                    inputPass.addEventListener('input', () => {
                        const val = inputPass.value;
                        let puntuacion = 0;

                        if (val.length >= 6) puntuacion++;
                        if (val.match(/[A-Z]/)) puntuacion++;
                        if (val.match(/[0-9]/)) puntuacion++;
                        if (val.match(/[^A-Za-z0-9]/)) puntuacion++;

                        if (val.length === 0) {
                            barraRelleno.style.width = '0%';
                            barraRelleno.style.backgroundColor = 'transparent';
                            txtFuerza.innerText = 'Fuerza: Muy débil 🥚';
                            txtFuerza.style.color = '#8A857C';
                        } else if (puntuacion <= 1) {
                            barraRelleno.style.width = '33%';
                            barraRelleno.style.backgroundColor = '#A95A4D'; 
                            txtFuerza.innerText = 'Fuerza: Fácil 🍰';
                            txtFuerza.style.color = '#A95A4D';
                        } else if (puntuacion <= 3) {
                            barraRelleno.style.width = '66%';
                            barraRelleno.style.backgroundColor = '#B88E74'; 
                            txtFuerza.innerText = 'Fuerza: Intermedio ⚙️';
                            txtFuerza.style.color = '#B88E74';
                        } else {
                            barraRelleno.style.width = '100%';
                            barraRelleno.style.backgroundColor = '#6D6053'; 
                            txtFuerza.innerText = 'Fuerza: Difícil 🔥';
                            txtFuerza.style.color = '#6D6053';
                        }
                    });
                }

                const triggerSwitch = document.getElementById('modal-auth-switch');
                if (triggerSwitch) {
                    triggerSwitch.addEventListener('click', (e) => {
                        e.preventDefault();
                        abrirModalLoginSencillo(!esRegistro);
                    });
                }
            },
            preConfirm: () => {
                const email = document.getElementById('modal-auth-email').value.trim();
                const password = document.getElementById('modal-auth-password').value;
                const nombre = esRegistro ? document.getElementById('modal-auth-nombre').value.trim() : '';

                if (!email || !password || (esRegistro && !nombre)) {
                    Swal.fire.showValidationMessage('Por favor, rellena todos los campos.');
                    return false;
                }

                if (esRegistro) {
                    const confirmPassword = document.getElementById('modal-auth-password-confirm').value;
                    if (password !== confirmPassword) {
                        Swal.fire.showValidationMessage('Las contraseñas no coinciden.');
                        return false;
                    }
                    if (password.length < 6) {
                        Swal.fire.showValidationMessage('La contraseña debe tener al menos 6 caracteres.');
                        return false;
                    }
                }
                return { email, password, nombre };
            }
        }).then(async (result) => {
            if (result.isConfirmed && supabase) {
                const { email, password, nombre } = result.value;
                Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                try {
                    if (esRegistro) {
                        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: nombre } } });
                        if (error) throw error;
                        Swal.fire(CONFIG.AUTH.MSJ_VERIFICACION_TITULO, CONFIG.AUTH.MSJ_VERIFICACION_CUERPO, 'info');
                    } else {
                        const { error } = await supabase.auth.signInWithPassword({ email, password });
                        if (error) throw error;
                        Swal.fire({ title: '¡Sesión Iniciada! 👩‍🍳', text: 'Datos sincronizados.', icon: 'success', timer: 2000, showConfirmButton: false });
                    }
                } catch (err) {
                    Swal.fire('Error de Acceso', err.message || 'Credenciales incorrectas.', 'error');
                }
            }
        });
    }

    function actualizarInstanciasLocales() {
        localStorage.setItem('local_inventario', JSON.stringify(listaItems));
        localStorage.setItem('local_receta', JSON.stringify(listaReceta));
        localStorage.setItem('local_catalogo', JSON.stringify(catalogoRecetas));
        localStorage.setItem('local_parametros', JSON.stringify(parametrosComerciales));
        
        actualizarTablaInventario();
        actualizarTablaReceta();
        calcularFinanzas();
    }

    // ==========================================
    // 🔍 BUSCADOR UNIFICADO EN TIEMPO REAL
    // ==========================================
    if (inputBuscar && listaResultados) {
        inputBuscar.addEventListener('input', function() {
            const terminoBusqueda = this.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (terminoBusqueda === '') { listaResultados.style.display = 'none'; return; }

            const filtrados = listaItems.filter(item => {
                const nom = item.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return terminoBusqueda.length === 1 ? nom.startsWith(terminoBusqueda) : nom.includes(terminoBusqueda);
            });

            if (filtrados.length > 0) {
                listaResultados.innerHTML = filtrados.map(item => {
                    const tagTipo = item.tipo === 'consumible' ? '📦 ' : '📌 ';
                    return `
                        <div class="opcion-insumo-lista" data-id="${item.id}">
                            ${tagTipo}<b>${escapeHTML(item.nombre)}</b> <span>(${item.marca !== 'Genérico' ? escapeHTML(item.marca) : (item.unidadVisual || 'Fórmula')})</span>
                        </div>
                    `;
                }).join('');
                listaResultados.style.display = 'block';
            } else {
                listaResultados.innerHTML = `<div class="buscador-vacio-msj">No se encontraron elementos</div>`;
                listaResultados.style.display = 'block';
            }
        });

        listaResultados.addEventListener('click', function(e) {
            const opcionItem = e.target.closest('[data-id]');
            if (!opcionItem) return;
            const id = opcionItem.dataset.id;
            insumoSeleccionadoPorBuscador = listaItems.find(item => item.id === id);
            if (insumoSeleccionadoPorBuscador) {
                inputBuscar.value = insumoSeleccionadoPorBuscador.nombre + (insumoSeleccionadoPorBuscador.marca !== 'Genérico' ? ` (${insumoSeleccionadoPorBuscador.marca})` : '');
            }
            listaResultados.style.display = 'none';
        });
    }
    
    document.addEventListener('click', (e) => {
        if (listaResultados && !inputBuscar.contains(e.target) && !listaResultados.contains(e.target)) {
            listaResultados.style.display = 'none';
        }
    });

    function renderizarIconosSeguro() {
        try { if (typeof lucide !== 'undefined') lucide.createIcons(); } catch (e) {}
    }

    if (document.getElementById('input-porciones')) {
        document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;
    }

    function configurarModulo() {
        if (formInsumo) formInsumo.reset();
        
        // CORRECCIÓN: Evitar caídas por variables no declaradas (unitsInsumos / unitsConsumibles)
        const dUnitsInsumos = window.unitsInsumos || unidadesInsumos;
        const dUnitsConsumibles = window.unitsConsumibles || unidadesConsumibles;

        if (tipoActivo === 'insumo') {
            if (wrapperMarca) wrapperMarca.style.display = 'flex';
            if (insumoUnidad) insumoUnidad.innerHTML = dUnitsInsumos;
        } else {
            if (wrapperMarca) wrapperMarca.style.display = 'none'; 
            if (insumoUnidad) insumoUnidad.innerHTML = dUnitsConsumibles;
        }
        
        const itemsFiltrados = listaItems.filter(item => item.tipo === tipoActivo);
        const totalPaginas = Math.ceil(itemsFiltrados.length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        actualizarTablaInventario();

        if (document.getElementById('input-mano-obra')) document.getElementById('input-mano-obra').value = parametrosComerciales.manoObraPorHora || 0;
        if (document.getElementById('select-dificultad')) document.getElementById('select-dificultad').value = parametrosComerciales.dificultad || "facil";
        if (document.getElementById('input-distancia')) document.getElementById('input-distancia').value = parametrosComerciales.distanciaIdaKm || 0;
        if (document.getElementById('input-gasolina')) document.getElementById('input-gasolina').value = parametrosComerciales.costoLitroGasolina || 0;
        if (document.getElementById('select-vehiculo')) document.getElementById('select-vehiculo').value = parametrosComerciales.tipoVehiculo || "sedan";
        if (document.getElementById('input-margen-utilidad')) document.getElementById('input-margen-utilidad').value = parametrosComerciales.margenUtilidad || CONFIG.MARGEN_UTILIDAD_DEFAULT;
        if (document.getElementById('input-porciones')) document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;

        renderizarIconosSeguro();
    }

    // ==========================================
    // CAPTURA E INVENTARIADO
    // ==========================================
    if (formInsumo) {
        formInsumo.addEventListener('submit', async function(event) {
            event.preventDefault();
            const btnSubmit = event.submitter;
            
            const precio = parseFloat(insumoPrecio.value);
            const cantidad = parseFloat(insumoCantidad.value);

            if (isNaN(precio) || isNaN(cantidad) || cantidad <= 0 || precio < 0) {
                Swal.fire('Error', 'Por favor ingresa valores numéricos válidos mayores a cero.', 'error');
                return;
            }

            if (btnSubmit) btnSubmit.disabled = true;

            await ejecutarRegistroInsumo(
                insumoNombre.value.trim(),
                tipoActivo === 'insumo' ? (insumoMarca.value.trim() || 'S/M') : 'Genérico',
                precio,
                cantidad,
                insumoUnidad.value
            );

            if (btnSubmit) btnSubmit.disabled = false;
        });
    }

    async function ejecutarRegistroInsumo(nombre, marca, precio, cantidadOriginal, unidadOriginal) {
        let cantidadNormalizada = cantidadOriginal;
        let unidadVisual = unidadOriginal;

        if (['kilo', 'litro', 'kg', 'L'].includes(unidadOriginal)) {
            cantidadNormalizada = cantidadOriginal * 1000; 
            unidadVisual = ['kilo', 'kg'].includes(unidadOriginal) ? 'kg' : 'L';
        }

        const costoUnitario = precio / cantidadNormalizada;
        const nuevoItem = { id: Date.now().toString(), nombre, marca, precio, cantidadOriginal, unidadOriginal, unidadVisual, costoUnitario, tipo: tipoActivo };

        listaItems.push(nuevoItem);
        await subirDatosNube();
        actualizarInstanciasLocales();
        formInsumo.reset();
        Swal.fire({ title: '¡Registrado!', text: `"${nombre}" guardado con éxito.`, icon: 'success', timer: 1500, showConfirmButton: false });
    }

    // ==========================================
    // CONTROL DE PAGINACIÓN
    // ==========================================
    if (btnPagPrev) btnPagPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; actualizarTablaInventario(); } });
    if (btnPagNext) btnPagNext.addEventListener('click', () => {
        const itemsFiltrados = listaItems.filter(item => item.tipo === tipoActivo);
        const totalPaginas = Math.ceil(itemsFiltrados.length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActual < totalPaginas) { paginaActual++; actualizarTablaInventario(); }
    });

    function actualizarTablaInventario() {
        if (!tablaInsumosBody) return;
        tablaInsumosBody.innerHTML = '';
        let itemsFiltrados = listaItems.filter(item => item.tipo === tipoActivo);

        const productosAgrupados = {};
        
        itemsFiltrados.forEach(item => {
            const nombreClave = item.nombre.toLowerCase().trim();
            if (!productosAgrupados[nombreClave]) {
                productosAgrupados[nombreClave] = [];
            }
            productosAgrupados[nombreClave].push(item);
        });

        const listaAgrupada = Object.values(productosAgrupados);
        const totalPaginas = Math.ceil(listaAgrupada.length / CONFIG.ITEMS_POR_PAGINA) || 1;

        if (listaAgrupada.length === 0) {
            tablaInsumosBody.innerHTML = `<tr><td colspan="5" class="txt-tabla-vacia">No se encontró ningún artículo...</td></tr>`;
            if (pagInfoTexto) pagInfoTexto.textContent = "1 de 1";
            return;
        }

        const inicio = (paginaActual - 1) * CONFIG.ITEMS_POR_PAGINA;
        const itemsPagina = listaAgrupada.slice(inicio, inicio + CONFIG.ITEMS_POR_PAGINA);

        itemsPagina.forEach(grupo => {
            const varianteDefecto = grupo[0];
            const tieneVariasMarcas = grupo.length > 1;

            const fila = document.createElement('tr');
            fila.className = "fila-producto-agrupado";
            
            let marcaCeldaHTML = '';
            if (tieneVariasMarcas) {
                marcaCeldaHTML = `
                    <select class="celda-formato-marca-select" style="padding-left: 0; text-indent: 0; margin-top: 4px; border: none; background-color: transparent; background-position: right center; width: auto; min-width: 80px; font-size: 13px; color: var(--japandi-wood);">
                        ${grupo.map(v => `<option value="${v.id}">${escapeHTML(v.marca)}</option>`).join('')}
                    </select>
                `;
            } else {
                marcaCeldaHTML = `<small style="color:var(--japandi-muted); display: block; margin-top: 4px;">${escapeHTML(varianteDefecto?.marca || varianteDefecto.marca)}</small>`;
            }

            let unidadVisualLimpia = varianteDefecto.unidadVisual || 'pza';
            if (unidadVisualLimpia.toLowerCase().includes('piez')) {
                unidadVisualLimpia = 'pza';
            }

            fila.innerHTML = `
                <td>
                    <strong>${escapeHTML(varianteDefecto.nombre)}</strong> <br>
                    <div class="contenedor-marca-dinamica" style="margin-left: 0; padding-left: 0;">${marcaCeldaHTML}</div>
                </td>
                <td class="celda-precio">$${varianteDefecto.precio.toFixed(2)}</td>
                <td class="celda-cantidad">${varianteDefecto.cantidadOriginal} ${unidadVisualLimpia}</td>
                <td class="text-center celda-costo">$${varianteDefecto.costoUnitario.toFixed(2)}</td>
                <td class="text-right">
                    <div class="actions-cell">
                        <button type="button" class="btn-icon btn-edit-trigger" data-id="${varianteDefecto.id}"><i data-lucide="edit-3"></i></button>
                        <button type="button" class="btn-icon delete btn-delete-trigger" data-id="${varianteDefecto.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            `;

            if (tieneVariasMarcas) {
                const selectElement = fila.querySelector('.celda-formato-marca-select');
                selectElement.addEventListener('change', function() {
                    const idSeleccionado = this.value;
                    const varianteSeleccionada = grupo.find(v => v.id === idSeleccionado);
                    
                    if (varianteSeleccionada) {
                        let unidadCambioLimpia = varianteSeleccionada.unidadVisual || 'pza';
                        if (unidadCambioLimpia.toLowerCase().includes('piez')) {
                            unidadCambioLimpia = 'pza';
                        }

                        fila.querySelector('.celda-precio').textContent = `$${varianteSeleccionada.precio.toFixed(2)}`;
                        fila.querySelector('.celda-cantidad').textContent = `${varianteSeleccionada.cantidadOriginal} ${unidadCambioLimpia}`;
                        fila.querySelector('.celda-costo').textContent = `$${varianteSeleccionada.costoUnitario.toFixed(2)}`;
                        
                        fila.querySelector('.btn-edit-trigger').dataset.id = varianteSeleccionada.id;
                        fila.querySelector('.btn-delete-trigger').dataset.id = varianteSeleccionada.id;
                    }
                });
            }

            tablaInsumosBody.appendChild(fila);
        });

        if (pagInfoTexto) pagInfoTexto.textContent = `${paginaActual} de ${totalPaginas}`;
        renderizarIconosSeguro();
    }

    if (tablaInsumosBody) {
        tablaInsumosBody.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-edit-trigger');
            const btnDelete = e.target.closest('.btn-delete-trigger');
            if (btnEdit) abrirModalEdicion(btnEdit.dataset.id);
            if (btnDelete) solicitarConfirmacionBorrado(btnDelete.dataset.id);
        });
    }

    function solicitarConfirmacionBorrado(id) {
        Swal.fire({
            title: '¿Eliminar del Inventario?',
            text: 'Se removerá también de las composiciones activas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            buttonsStyling: false,
            customClass: { confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                listaItems = listaItems.filter(i => i.id !== id);
                listaReceta = listaReceta.filter(r => r.itemIdOriginal !== id);
                await subirDatosNube();
                actualizarInstanciasLocales();
            }
        });
    }

    function abrirModalEdicion(id) {
    const item = listaItems.find(i => i.id === id);
    if (!item) return;

    const esInsumo = item.tipo === 'insumo';

    Swal.fire({
        title: 'Editar Elemento',
        html: `
            <div style="text-align: left;">
                <label class="swal2-label-custom">Nombre del Elemento</label>
                <input id="swal-nombre" class="swal2-input-custom" value="${escapeHTML(item.nombre)}">
                
                <label class="swal2-label-custom">Tipo (Categoría de tabla)</label>
                <select id="swal-tipo" class="swal2-input-custom">
                    <option value="insumo" ${item.tipo === 'insumo' ? 'selected' : ''}>Insumo (Pestaña 1)</option>
                    <option value="consumible" ${item.tipo === 'consumible' ? 'selected' : ''}>Consumible (Pestaña 2)</option>
                </select>

                ${esInsumo ? `
                <label class="swal2-label-custom">Marca o Molino</label>
                <input id="swal-marca" class="swal2-input-custom" value="${escapeHTML(item.marca || '')}">
                ` : `<input id="swal-marca" type="hidden" value="Genérico">`}
                
                <label class="swal2-label-custom">Precio ($)</label>
                <input id="swal-precio" type="number" step="any" class="swal2-input-custom" value="${item.precio}">
                <label class="swal2-label-custom">Cantidad</label>
                <input id="swal-cantidad" type="number" step="any" class="swal2-input-custom" value="${item.cantidadOriginal}">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        preConfirm: () => {
            return { 
                nombre: document.getElementById('swal-nombre').value.trim(),
                marca: document.getElementById('swal-marca').value.trim(),
                nuevoTipo: document.getElementById('swal-tipo').value, // <-- Capturamos el cambio de tabla
                precio: parseFloat(document.getElementById('swal-precio').value),
                cantidad: parseFloat(document.getElementById('swal-cantidad').value)
            };
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            const index = listaItems.findIndex(i => i.id === id);
            if (index !== -1) {
                // Actualizamos los datos
                listaItems[index].nombre = res.value.nombre;
                listaItems[index].marca = res.value.marca;
                listaItems[index].tipo = res.value.nuevoTipo; // <--- AQUÍ OCURRE LA MAGIA
                listaItems[index].precio = res.value.precio;
                listaItems[index].cantidadOriginal = res.value.cantidad;
                
                // Recalculamos costo unitario
                let cantidadNormalizada = (['kilo', 'litro', 'kg', 'L'].includes(listaItems[index].unidadOriginal)) ? res.value.cantidad * 1000 : res.value.cantidad;
                listaItems[index].costoUnitario = res.value.precio / (cantidadNormalizada || 1);

                await subirDatosNube();
                actualizarInstanciasLocales(); // Esto llama a actualizarTablaInventario y el filtro oculta el item de la tabla actual
            }
        }
    });
}


    if (tabInsumos) tabInsumos.addEventListener('click', () => { tipoActivo = 'insumo'; tipoRecetaActivo = 'insumo'; tabInsumos.classList.add('active'); tabConsumibles.classList.remove('active'); configurarModulo(); });
    if (tabConsumibles) tabConsumibles.addEventListener('click', () => { tipoActivo = 'consumible'; tipoRecetaActivo = 'consumible'; tabConsumibles.classList.add('active'); tabInsumos.classList.remove('active'); configurarModulo(); });

    // ==========================================
    // MÓDULO: COMPOSICIÓN DE RECETA
    // ==========================================
    if (formReceta) {
        formReceta.addEventListener('submit', async function(event) {
            event.preventDefault();
            const cantidadUsada = parseFloat(recetaCantidad.value);

            if (!insumoSeleccionadoPorBuscador || isNaN(cantidadUsada) || cantidadUsada <= 0) {
                Swal.fire('Atención', 'Selecciona un insumo válido y define una cantidad adecuada.', 'info');
                return;
            }

            const unidadDeterminada = insumoSeleccionadoPorBuscador.isSubReceta 
                ? (insumoSeleccionadoPorBuscador.unidadVisual || 'Fórmula')
                : (insumoSeleccionadoPorBuscador.unidadVisual === 'kg' ? 'gr' : insumoSeleccionadoPorBuscador.unidadVisual);

            const nuevoIngrediente = {
                id: Date.now().toString(),
                itemIdOriginal: insumoSeleccionadoPorBuscador.id, 
                nombre: insumoSeleccionadoPorBuscador.nombre,
                gridCantidad: cantidadUsada,
                tipo: insumoSeleccionadoPorBuscador.tipo,
                isSubReceta: insumoSeleccionadoPorBuscador.isSubReceta || false,
                ingredientesInternos: insumoSeleccionadoPorBuscador.ingredientesInternos || null,
                unidadVisual: unidadDeterminada,
                costoProporcional: insumoSeleccionadoPorBuscador.costoUnitario * cantidadUsada
            };

            listaReceta.push(nuevoIngrediente);
            await subirDatosNube();
            actualizarInstanciasLocales();
            formReceta.reset();
            if (inputBuscar) inputBuscar.value = '';
            insumoSeleccionadoPorBuscador = null;
        });
    }

    function actualizarTablaReceta() {
        if (!tablaRecetaBody) return;
        tablaRecetaBody.innerHTML = '';

        if (listaReceta.length === 0) {
            tablaRecetaBody.innerHTML = `<tr><td colspan="4" class="txt-tabla-vacia">No hay elementos en la receta actual...</td></tr>`;
            return;
        }

        listaReceta.forEach(item => {
            const fila = document.createElement('tr');
            fila.className = "fila-receta-item";
            const prefijoSubReceta = item.isSubReceta ? `<span>🎨 <b>${escapeHTML(item.nombre)}</b></span>` : `<strong>${escapeHTML(item.nombre)}</strong>`;
            
            let unidadLimpia = '';
            if (!item.isSubReceta) {
                unidadLimpia = item.unidadVisual && item.unidadVisual !== 'undefined' ? item.unidadVisual : 'pza';
                if (unidadLimpia.toLowerCase().includes('piez')) {
                    unidadLimpia = 'pza';
                }
                unidadLimpia = ' ' + unidadLimpia;
            }

            fila.innerHTML = `
                <td>${prefijoSubReceta}</td>
                <td><span>${item.gridCantidad}${unidadLimpia}</span></td>
                <td><span class="fila-receta-item-costo">$${item.costoProporcional.toFixed(2)}</span></td>
                <td class="text-right">
                    <div class="actions-cell">
                        <button type="button" class="btn-icon btn-edit-receta" data-id="${item.id}"><i data-lucide="edit-3"></i></button>
                        <button type="button" class="btn-icon delete btn-remove-receta" data-id="${item.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            `;
            tablaRecetaBody.appendChild(fila);
        });
        renderizarIconosSeguro();
    }

    if (tablaRecetaBody) {
        tablaRecetaBody.addEventListener('click', async (e) => {
            const btnRemove = e.target.closest('.btn-remove-receta');
            const btnEdit = e.target.closest('.btn-edit-receta');

            if (btnRemove) {
                listaReceta = listaReceta.filter(r => r.id !== btnRemove.dataset.id);
                await subirDatosNube();
                actualizarInstanciasLocales();
            }

            if (btnEdit) {
                const ingrediente = listaReceta.find(r => r.id === btnEdit.dataset.id);
                if (!ingrediente) return;

                let desgloseSubrecetaHtml = '';
                if (ingrediente.isSubReceta && ingrediente.ingredientesInternos) {
                    desgloseSubrecetaHtml = `
                        <div class="editor-receta-sub-box">
                            <span class="editor-receta-sub-titulo">Editar Insumos Ligados:</span>
                            <div class="editor-receta-sub-scroll">
                                ${ingrediente.ingredientesInternos.map((insumoInterno, index) => {
                                    const unitInterno = insumoInterno.unidadVisual && insumoInterno.unidadVisual !== 'undefined' ? insumoInterno.unidadVisual : 'Fórmula';
                                    return `
                                    <div class="editor-receta-sub-item">
                                        <span class="editor-receta-sub-item-nom">🌾 ${escapeHTML(insumoInterno.nombre)}</span>
                                        <div class="editor-receta-sub-item-input-wrapper">
                                            <input type="number" step="any" class="swal-insumo-interno-input" data-index="${index}" value="${insumoInterno.gridCantidad}">
                                            <span class="editor-receta-sub-item-unit">${unitInterno}</span>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }

                Swal.fire({
                    title: 'Editor de Recetas',
                    html: `
                        <div class="editor-receta-flex">
                            <p>Ajusta los valores para: <br><b>${escapeHTML(ingrediente.nombre)}</b></p>
                            <label class="editor-receta-label-mini">DOSIFICACIÓN GENERAL (CANTIDAD)</label>
                            <input id="swal-receta-cantidad-input" type="number" step="any" value="${ingrediente.gridCantidad}" class="swal2-input-custom">
                            ${desgloseSubrecetaHtml}
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'ACTUALIZAR',
                    cancelButtonText: 'CANCELAR',
                    preConfirm: () => {
                        const nuevaCantGeneral = parseFloat(document.getElementById('swal-receta-cantidad-input').value);
                        if (isNaN(nuevaCantGeneral) || nuevaCantGeneral <= 0) {
                            Swal.fire.showValidationMessage('Por favor ingresa una dosificación general válida.');
                            return false;
                        }

                        let insumosModificados = null;
                        if (ingrediente.isSubReceta && ingrediente.ingredientesInternos) {
                            insumosModificados = [];
                            const inputsInternos = document.querySelectorAll('.swal-insumo-interno-input');
                            for (let input of inputsInternos) {
                                const idx = parseInt(input.dataset.index);
                                const valInterno = parseFloat(input.value);
                                if (isNaN(valInterno) || valInterno <= 0) {
                                    Swal.fire.showValidationMessage('Las cantidades de insumos deben ser mayores a 0.');
                                    return false;
                                }
                                insumosModificados.push({ index: idx, nuevaCantidad: valInterno });
                            }
                        }
                        return { nuevaCantGeneral, insumosModificados };
                    }
                }).then(async (res) => {
                    if (res.isConfirmed && res.value !== undefined) {
                        const { nuevaCantGeneral, insumosModificados } = res.value;

                        if (ingrediente.isSubReceta && insumosModificados) {
                            insumosModificados.forEach(mod => {
                                const insumo = ingrediente.ingredientesInternos[mod.index];
                                const costoUnitarioBaseInterno = insumo.costoProporcional / insumo.gridCantidad;
                                insumo.gridCantidad = mod.nuevaCantidad;
                                insumo.costoProporcional = costoUnitarioBaseInterno * mod.nuevaCantidad;
                            });
                            const nuevoCostoBaseSubreceta = ingrediente.ingredientesInternos.reduce((acc, i) => acc + i.costoProporcional, 0);
                            ingrediente.gridCantidad = nuevaCantGeneral;
                            ingrediente.costoProporcional = nuevoCostoBaseSubreceta * nuevaCantGeneral;
                        } else {
                            // MEJORA: Buscar costo unitario directo de la lista maestra para evitar corrupción de precio en cascada
                            const masterItem = listaItems.find(i => i.id === ingrediente.itemIdOriginal);
                            const costoUnitarioBase = masterItem ? masterItem.costoUnitario : (ingrediente.costoProporcional / ingrediente.gridCantidad);
                            ingrediente.gridCantidad = nuevaCantGeneral;
                            ingrediente.costoProporcional = costoUnitarioBase * nuevaCantGeneral;
                        }
                        await subirDatosNube();
                        actualizarInstanciasLocales();
                    }
                });
            }
        });
    }

    // =================================================================********
    // 🗂️ CONTROLADORES DE ACCIONES CATÁLOGO (CON SOPORTE DE CATEGORÍAS)
    // =================================================================********
    const btnGuardarR = document.getElementById('btn-guardar-receta');
    const btnCargarR = document.getElementById('btn-cargar-receta');
    const btnVaciarR = document.getElementById('btn-vaciar-receta');

    // Referencias a los nuevos modales HTML
    const modalGuardarForm = document.getElementById('modal-guardar-formula');
    const modalCargarForm = document.getElementById('modal-cargar-formula');

    // Estado local para persistir categorías offline si no hay sesión
    let listaCategoriasLocales = JSON.parse(localStorage.getItem('local_categorias')) || [];

    // Función global auxiliar para refrescar el selector de guardado dinámicamente
    async function refrescarSelectCategoriasGuardar() {
        const selectCat = document.getElementById('select-categoria');
        if (!selectCat) return;
        selectCat.innerHTML = '<option value="">-- Selecciona una categoría --</option>';

        let categoriasParaMostrar = [];
        if (supabase && usuarioActual) {
            const { data, error } = await supabase.from('categorias').select('id, nombre');
            if (!error && data) categoriasParaMostrar = data;
        } else {
            categoriasParaMostrar = listaCategoriasLocales;
        }

        categoriasParaMostrar.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            selectCat.appendChild(opt);
        });
    }

    // FUNCIÓN: BORRADO SEGURO DE CATEGORÍAS (CON INTEGRIDAD DE RESTRICCIÓN)
    async function eliminarCategoriaSeguro(categoriaId) {
        // 1. Validar que la categoría no tenga fórmulas ligadas en el catálogo
        const recetasAsociadas = catalogoRecetas.filter(rec => String(rec.categoria_id) === String(categoriaId));
        
        if (recetasAsociadas.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'No se puede eliminar',
                text: `Esta sección contiene ${recetasAsociadas.length} receta(s) guardada(s). Elimina o reasigna las recetas primero.`,
                confirmButtonColor: '#2e2a27'
            });
            return;
        }

        // 2. Preguntar confirmación explícita
        const confirmacion = await Swal.fire({
            title: '¿Eliminar Categoría?',
            text: "Esta acción quitará el espacio conceptual permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#bd5b4c',
            cancelButtonColor: '#8c857b',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            // 3. Borrado local/nube según corresponda
            if (supabase && usuarioActual) {
                const { error } = await supabase
                    .from('categorias')
                    .delete()
                    .eq('id', categoriaId);

                if (error) throw error;
            } else {
                listaCategoriasLocales = listaCategoriasLocales.filter(cat => String(cat.id) !== String(categoriaId));
                localStorage.setItem('local_categorias', JSON.stringify(listaCategoriasLocales));
            }

            Swal.fire({
                icon: 'success',
                title: 'Categoría Eliminada',
                timer: 1500,
                showConfirmButton: false
            });

            // 4. Repintar la UI del paso en el que se encuentre el usuario
            refrescarSelectCategoriasGuardar();
            mostrarPasoCategorias();

        } catch (err) {
            console.error("Error al remover categoría:", err);
            Swal.fire('Error', 'No pudimos eliminar la sección en la nube.', 'error');
        }
    }

    // ==========================================
    // --- ACCIÓN: GUARDAR RECETA ---
    // ==========================================
    if (btnGuardarR) {
        btnGuardarR.addEventListener('click', async () => {
            if (listaReceta.length === 0) {
                Swal.fire('Mesa Vacía', 'Agrega ingredientes a tu fórmula actual antes de archivarla.', 'warning');
                return;
            }
            
            // Limpiar campos del modal
            document.getElementById('input-nombre-formula').value = '';
            document.getElementById('input-nueva-categoria').value = '';

            await refrescarSelectCategoriasGuardar();
            modalGuardarForm.classList.remove('hidden');
        });
    }

    // Cerrar modal guardar
    document.getElementById('btn-cerrar-modal-guardar')?.addEventListener('click', () => {
        modalGuardarForm.classList.add('hidden');
    });

    // Procesar el guardado final / Creación indexada de categorías
    document.getElementById('btn-confirmar-guardar-formula')?.addEventListener('click', async () => {
        const nombreFormula = document.getElementById('input-nombre-formula').value.trim();
        const selectCategoriaId = document.getElementById('select-categoria').value;
        const nuevaCategoriaNombre = document.getElementById('input-nueva-categoria').value.trim();

        if (!nombreFormula) {
            Swal.fire('Atención', 'Ingresa el nombre de la sub-receta.', 'info');
            return;
        }

        let categoriaIdFinal = selectCategoriaId;

        // Si el usuario ingresó texto para crear una nueva categoría
        if (nuevaCategoriaNombre !== "") {
            // Validar duplicados locales antes de procesar
            let todasLasCats = [];
            if (supabase && usuarioActual) {
                const { data } = await supabase.from('categorias').select('nombre');
                if (data) todasLasCats = data;
            } else {
                todasLasCats = listaCategoriasLocales;
            }

            const existeDuplicado = todasLasCats.some(cat => cat.nombre.toLowerCase() === nuevaCategoriaNombre.toLowerCase());
            if (existeDuplicado) {
                Swal.fire('Sección Existente', `La categoría "${nuevaCategoriaNombre}" ya existe en tus índices.`, 'warning');
                return;
            }

            if (supabase && usuarioActual) {
                const { data: nuevaCat, error } = await supabase
                    .from('categorias')
                    .insert({ nombre: nuevaCategoriaNombre })
                    .select()
                    .single();

                if (error) {
                    Swal.fire('Error', 'No se pudo crear la categoría en la nube: ' + error.message, 'error');
                    return;
                }
                categoriaIdFinal = nuevaCat.id;
            } else {
                const nuevoIdCat = "cat_loc_" + Date.now();
                listaCategoriasLocales.push({ id: nuevoIdCat, nombre: nuevaCategoriaNombre });
                localStorage.setItem('local_categorias', JSON.stringify(listaCategoriasLocales));
                categoriaIdFinal = nuevoIdCat;
            }
        }

        if (!categoriaIdFinal) {
            Swal.fire('Atención', 'Por favor selecciona una categoría o escribe una nueva.', 'info');
            return;
        }

        // Calcular costo total actual de la mesa
        const costoTotal = listaReceta.reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

        // Registrar la sub-receta
        catalogoRecetas.push({
            id: "rec_" + Date.now(),
            nombre: nombreFormula,
            categoria_id: categoriaIdFinal, 
            rendimiento: 1,
            costoTotal: costoTotal,
            ingredientes: [...listaReceta]
        });

        listaReceta = []; 
        modalGuardarForm.classList.add('hidden');

        await subirDatosNube();
        actualizarInstanciasLocales();

        Swal.fire({
            title: '¡Receta Guardada! 🎉',
            text: `"${nombreFormula}" ha sido indexada con éxito.`,
            icon: 'success',
            confirmButtonColor: '#2e2a27'
        });
    });


    // ==========================================
    // --- ACCIÓN: CARGAR RECETA (POR PASOS) ---
    // ==========================================
    if (btnCargarR) {
        btnCargarR.addEventListener('click', () => {
            modalCargarForm.classList.remove('hidden');
            mostrarPasoCategorias();
        });
    }

    document.getElementById('btn-cerrar-modal-cargar')?.addEventListener('click', () => {
        modalCargarForm.classList.add('hidden');
    });

    // Paso A: Mostrar Categorías Con Soporte de Borrado Integrado Flexbox
    async function mostrarPasoCategorias() {
        document.getElementById('titulo-modal-cargar').textContent = "Selecciona Categoría";
        const cuerpo = document.getElementById('cuerpo-modal-cargar');
        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        let categorias = [];
        if (supabase && usuarioActual) {
            const { data } = await supabase.from('categorias').select('id, nombre');
            if (data) {
                categorias = data;
            }
        } else {
            categorias = listaCategoriasLocales;
        }

        if (categorias.length === 0) {
            cuerpo.innerHTML = '<p style="text-align:center; color:#8c857b; font-size:14px; margin:20px 0;">No tienes categorías creadas actualmente.</p>';
            return;
        }

        categorias.forEach(cat => {
            const rowWrapper = document.createElement('div');
            rowWrapper.style.cssText = "display: flex; gap: 8px; align-items: stretch; margin-bottom: 10px; width: 100%;";

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = `
                flex-grow: 1; 
                padding: 14px 18px; 
                text-align: left; 
                justify-content: space-between; 
                display: flex; 
                align-items: center; 
                background: #fcfbfa; 
                color: #2c2a29; 
                border: 1px solid #e6e1da; 
                border-radius: 12px; 
                font-weight: 600; 
                font-size: 14px; 
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            
            btn.onmouseenter = () => { btn.style.background = "#f5f0e6"; btn.style.borderColor = "#c5bba8"; };
            btn.onmouseleave = () => { btn.style.background = "#fcfbfa"; btn.style.borderColor = "#e6e1da"; };

            const conteo = catalogoRecetas.filter(r => String(r.categoria_id) === String(cat.id)).length;
            btn.innerHTML = `<span>📁 ${escapeHTML(cat.nombre.toUpperCase())}</span> <span style="font-weight:400; color:#8c857b; background:#f0ede6; padding:4px 10px; border-radius:20px; font-size:12px;">${conteo} ${conteo === 1 ? 'receta' : 'recetas'}</span>`;
            btn.onclick = () => mostrarPasoRecetas(cat.id, cat.nombre);
            
            // Botón de eliminación directa de categoría
            const btnBorrarCat = document.createElement('button');
            btnBorrarCat.type = 'button';
            btnBorrarCat.innerHTML = '🗑️';
            btnBorrarCat.style.cssText = "background: #fff1f0; color: #bd5b4c; border: 1px solid #ffccc7; width: 48px; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;";
            btnBorrarCat.onmouseenter = () => { btnBorrarCat.style.background = "#bd5b4c"; btnBorrarCat.style.color = "#fff"; };
            btnBorrarCat.onmouseleave = () => { btnBorrarCat.style.background = "#fff1f0"; btnBorrarCat.style.color = "#bd5b4c"; };
            btnBorrarCat.onclick = (e) => {
                e.stopPropagation();
                eliminarCategoriaSeguro(cat.id);
            };

            rowWrapper.appendChild(btn);
            rowWrapper.appendChild(btnBorrarCat);
            cuerpo.appendChild(rowWrapper);
        });
    }

    // Paso B: Mostrar recetas filtradas
    function mostrarPasoRecetas(categoriaId, nombreCategoria) {
        document.getElementById('titulo-modal-cargar').textContent = nombreCategoria.toUpperCase();
        const cuerpo = document.getElementById('cuerpo-modal-cargar');
        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        const recetasFiltradas = catalogoRecetas.filter(r => String(r.categoria_id) === String(categoriaId));

        if (recetasFiltradas.length === 0) {
            cuerpo.innerHTML = '<p style="text-align:center; color:#8c857b; font-size:14px; margin:20px 0;">No hay recetas archivadas en esta sección.</p>';
        }

        recetasFiltradas.forEach(receta => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; gap:8px; width:100%; align-items:stretch; margin-bottom: 10px;";

            const btnReceta = document.createElement('button');
            btnReceta.type = 'button';
            btnReceta.style.cssText = `
                flex-grow: 1; 
                text-align: left; 
                padding: 14px; 
                border-radius: 12px; 
                border: 1px solid #e8e5e0; 
                background: #ffffff; 
                cursor: pointer;
                transition: border-color 0.2s;
            `;
            btnReceta.onmouseenter = () => btnReceta.style.borderColor = "#bcada4";
            btnReceta.onmouseleave = () => btnReceta.style.borderColor = "#e8e5e0";
            btnReceta.innerHTML = `🎨 <span style="color:#2c2a29; font-weight:600;">${escapeHTML(receta.nombre)}</span><br><small style="color:#7c7267; font-size:12px;">Costo: $${parseFloat(receta.costoTotal || 0).toFixed(2)}</small>`;
            
            btnReceta.onclick = async () => {
                listaReceta.push({
                    id: "sub_" + Date.now(),
                    itemIdOriginal: receta.id,
                    nombre: receta.nombre,
                    gridCantidad: 1, 
                    tipo: "insumo", 
                    isSubReceta: true,               
                    ingredientesInternos: receta.ingredientes,
                    unidadVisual: "Fórmula", 
                    costoProporcional: parseFloat(receta.costoTotal) 
                });
                modalCargarForm.classList.add('hidden');
                await subirDatosNube();
                actualizarInstanciasLocales();
            };

            const btnBorrar = document.createElement('button');
            btnBorrar.type = 'button';
            btnBorrar.style.cssText = "background: #fff1f0; color: #bd5b4c; border: 1px solid #ffccc7; padding: 0 16px; border-radius: 12px; cursor: pointer; font-size: 16px; transition: all 0.2s;";
            btnBorrar.onmouseenter = () => { btnBorrar.style.background = "#bd5b4c"; btnBorrar.style.color = "#fff"; };
            btnBorrar.onmouseleave = () => { btnBorrar.style.background = "#fff1f0"; btnBorrar.style.color = "#bd5b4c"; };
            btnBorrar.innerHTML = '🗑️';
            
            btnBorrar.onclick = () => {
                modalCargarForm.classList.add('hidden'); 
                
                Swal.fire({
                    title: '¿Eliminar receta?',
                    text: `"${receta.nombre}" se borrará permanentemente.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#bd5b4c',
                    cancelButtonColor: '#2c2a29',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                }).then(async (res) => {
                    if (res.isConfirmed) {
                        catalogoRecetas = catalogoRecetas.filter(r => r.id !== receta.id);
                        await subirDatosNube();
                        actualizarInstanciasLocales();
                        
                        modalCargarForm.classList.remove('hidden');
                        mostrarPasoRecetas(categoriaId, nombreCategoria);
                    } else {
                        modalCargarForm.classList.remove('hidden');
                        mostrarPasoRecetas(categoriaId, nombreCategoria);
                    }
                });
            };

            row.appendChild(btnReceta);
            row.appendChild(btnBorrar);
            cuerpo.appendChild(row);
        });

        const btnVolver = document.createElement('button');
        btnVolver.type = 'button';
        btnVolver.style.cssText = "background:none; border:none; color:#8c857b; text-decoration:underline; margin-top:12px; cursor:pointer; font-size:13px; align-self:center;";
        btnVolver.textContent = "← Volver a Categorías";
        btnVolver.onclick = mostrarPasoCategorias;
        cuerpo.appendChild(btnVolver);
    }

    if (btnVaciarR) {
        btnVaciarR.addEventListener('click', () => {
            if (listaReceta.length === 0) return;
            Swal.fire({ title: '¿Vaciar la mesa?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, vaciar' }).then(async (result) => {
                if (result.isConfirmed) { listaReceta = []; await subirDatosNube(); actualizarInstanciasLocales(); }
            });
        });
    }

    // ==========================================
    // 🎛️ CONTROL DEL MODAL DE PARÁMETROS COMERCIALES
    // ==========================================
    const modalConfig = document.getElementById("modal-config");
    const btnAbrirConfig = document.getElementById("btn-abrir-config");
    const btnCerrarConfig = document.getElementById("btn-cerrar-config");
    const btnGuardarConfig = document.getElementById("btn-guardar-config");

    if (btnAbrirConfig && modalConfig) {
        btnAbrirConfig.addEventListener("click", () => {
            if (document.getElementById('input-mano-obra')) document.getElementById('input-mano-obra').value = parametrosComerciales.manoObraPorHora || 0;
            if (document.getElementById('select-dificultad')) document.getElementById('select-dificultad').value = parametrosComerciales.dificultad || "facil";
            if (document.getElementById('input-distancia')) document.getElementById('input-distancia').value = parametrosComerciales.distanciaIdaKm || 0;
            if (document.getElementById('input-gasolina')) document.getElementById('input-gasolina').value = parametrosComerciales.costoLitroGasolina || 0;
            if (document.getElementById('select-vehiculo')) document.getElementById('select-vehiculo').value = parametrosComerciales.tipoVehiculo || "sedan";
            if (document.getElementById('input-margen-utilidad')) document.getElementById('input-margen-utilidad').value = parametrosComerciales.margenUtilidad || CONFIG.MARGEN_UTILIDAD_DEFAULT;
            if (document.getElementById('input-porciones')) document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;

            modalConfig.classList.remove("hidden");
            renderizarIconosSeguro();
        });
    }

    [btnCerrarConfig, btnGuardarConfig].forEach(btn => {
        if (btn && modalConfig) {
            btn.addEventListener("click", () => {
                modalConfig.classList.add("hidden");
                window.calcularCostosPorRebanada();
                subirDatosNube();
            });
        }
    });

    if (modalConfig) {
        modalConfig.addEventListener("click", (e) => {
            if (e.target === modalConfig) {
                modalConfig.classList.add("hidden");
                window.calcularCostosPorRebanada();
                subirDatosNube();
            }
        });
    }

    // =========================================================================
    // 📊 CÁLCULOS FINANCIEROS Y MÁRGENES DE GANANCIA BLINDADOS
    // =========================================================================
    function calcularFinanzas() {
        const costoInsumosComestibles = listaReceta
            .filter(item => item.tipo === 'insumo')
            .reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

        const costoConsumiblesEmpaque = listaReceta
            .filter(item => item.tipo === 'consumible')
            .reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

        const costoComidaConGastosYMerma = (costoInsumosComestibles * (1 + CONFIG.PORCENTAJE_MERMA)) * (1 + CONFIG.PORCENTAJE_GASTOS_FIJOS);
        const materiaPrimaDirectaTotal = costoComidaConGastosYMerma + costoConsumiblesEmpaque;

        if (totalProduccionSpan) totalProduccionSpan.textContent = `$${Math.ceil(materiaPrimaDirectaTotal)}`;

        let horasEstimadas = 1;
        if (parametrosComerciales.dificultad === "medio") horasEstimadas = 2.5;
        if (parametrosComerciales.dificultad === "dificil") horasEstimadas = 4;
        const costoManoObra = (parametrosComerciales.manoObraPorHora || 0) * horasEstimadas;

        const elTotalManoObra = document.getElementById('total-mano-obra');
        if (elTotalManoObra) elTotalManoObra.textContent = `$${Math.ceil(costoManoObra)}`;

        let rendimientoKmPorLitro = 12; 
        if (parametrosComerciales.tipoVehiculo === "suv") rendimientoKmPorLitro = 9;
        if (parametrosComerciales.tipoVehiculo === "moto") rendimientoKmPorLitro = 25;

        const distanciaIda = parametrosComerciales.distanciaIdaKm || 0;
        const distanciaTotalKm = distanciaIda * 2; 
        const litrosConsumidos = distanciaTotalKm / rendimientoKmPorLitro;
        const costoGasolina = litrosConsumidos * (parametrosComerciales.costoLitroGasolina || 0);
        
        const COSTO_AMORTIZACION_KM = 0.50; 
        const costoDesgasteVehiculo = distanciaTotalKm * COSTO_AMORTIZACION_KM;
        
        const COBRO_BASE_LOGISTICA = distanciaIda > 0 ? 50 : 0;
        const costoLogisticaTotal = costoGasolina + costoDesgasteVehiculo + COBRO_BASE_LOGISTICA;

        const elTotalLogistica = document.getElementById('total-logistica');
        if (elTotalLogistica) elTotalLogistica.textContent = `$${Math.ceil(costoLogisticaTotal)}`;

        const costoInversionBase = materiaPrimaDirectaTotal + costoManoObra + costoLogisticaTotal;

        let margenElegido = parseFloat(parametrosComerciales.margenUtilidad);
        if (isNaN(margenElegido) || margenElegido >= 100 || margenElegido <= 0) {
            margenElegido = 60; 
        }
        
        let precioSugeridoPastel = costoInversionBase / (1 - (margenElegido / 100));
        let gananciaNetaPesos = precioSugeridoPastel - costoInversionBase;

        const elUtilidadPesos = document.getElementById('resumen-utilidad-pesos');
        if (elUtilidadPesos) elUtilidadPesos.textContent = `+$${Math.ceil(gananciaNetaPesos)}`;

        const elSugerido = document.getElementById('res-precio-sugerido');
        if (elSugerido) elSugerido.textContent = `$${Math.ceil(precioSugeridoPastel)}`;
        
        calcularCostosPorRebanadaEspecial(materiaPrimaDirectaTotal, precioSugeridoPastel);

        return costoInversionBase; 
    }

    function calcularCostosPorRebanadaEspecial(totalProduccion, totalSugerido) {
        const inputPorciones = document.getElementById("input-porciones");
        let porciones = inputPorciones ? parseInt(inputPorciones.value) : (parametrosComerciales.porcionesPastel || 12);
        
        if (isNaN(porciones) || porciones < 1) porciones = 1;

        parametrosComerciales.porcionesPastel = porciones;
        localStorage.setItem('local_parametros', JSON.stringify(parametrosComerciales));

        const costoIndividual = totalProduccion / porciones;
        const sugeridoIndividual = totalSugerido / porciones;

        const elCostoRebanada = document.getElementById("costo-por-rebanada");
        const elSugeridoRebanada = document.getElementById("sugerido-por-rebanada");

        if (elCostoRebanada) elCostoRebanada.innerText = "$" + Math.ceil(costoIndividual);
        if (elSugeridoRebanada) elSugeridoRebanada.innerText = "$" + Math.ceil(sugeridoIndividual);
    }

    window.calcularCostosPorRebanada = function() {
        const inputMargen = document.getElementById("input-margen-utilidad");
        const inputManoObra = document.getElementById("input-mano-obra");
        const selectDificultad = document.getElementById("select-dificultad");
        const inputDistancia = document.getElementById("input-distancia");
        const inputGasolina = document.getElementById("input-gasolina");
        const selectVehiculo = document.getElementById("select-vehiculo");

        if (inputMargen) parametrosComerciales.margenUtilidad = parseFloat(inputMargen.value) || CONFIG.MARGEN_UTILIDAD_DEFAULT;
        if (inputManoObra) parametrosComerciales.manoObraPorHora = parseFloat(inputManoObra.value) || 0;
        if (selectDificultad) parametrosComerciales.dificultad = selectDificultad.value;
        if (inputDistancia) parametrosComerciales.distanciaIdaKm = parseFloat(inputDistancia.value) || 0;
        if (inputGasolina) parametrosComerciales.costoLitroGasolina = parseFloat(inputGasolina.value) || 0;
        if (selectVehiculo) parametrosComerciales.tipoVehiculo = selectVehiculo.value;

        calcularFinanzas();
    };

    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', async function() {
            await subirDatosNube();
            
            const totalPastelTexto = document.getElementById('res-precio-sugerido')?.textContent || "$0.00";
            const totalNumerico = parseFloat(totalPastelTexto.replace(/[^0-9.-]+/g, "")) || 0;
            
            const porciones = parametrosComerciales?.porcionesPastel || 12;
            const rebanadaTexto = document.getElementById('resumen-sugerido-rebanada')?.textContent || 
                                  document.querySelector('.destacado-rebanada span:last-child')?.textContent || "$0.00";

            Swal.fire({
                title: 'Configurar Envío',
                html: `
                    <p class="swal2-html-container" style="text-align: left; margin-bottom: 16px; font-size: 13px;">
                        Personaliza los datos de la cotización de autor antes de enviarla por WhatsApp.
                    </p>
                    <div style="text-align: left; display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label class="swal2-label-custom">Nombre de tu Marca / Negocio</label>
                            <input id="swal-marca-nombre" class="swal2-input-custom" type="text" placeholder="Ej. D'Leite Repostería">
                        </div>
                        <div>
                            <label class="swal2-label-custom">Número de WhatsApp (10 dígitos)</label>
                            <input id="swal-whatsapp-num" class="swal2-input-custom" type="text" placeholder="Ej. 5512345678">
                        </div>
                        <div>
                            <label class="swal2-label-custom">Porcentaje de Anticipo Sugerido</label>
                            <select id="swal-anticipo-porcentaje" class="swal2-input-custom" style="appearance: auto; -webkit-appearance: auto;">
                                <option value="50">50% del total</option>
                                <option value="60">60% del total</option>
                                <option value="70" selected>70% del total (Recomendado)</option>
                                <option value="80">80% del total</option>
                                <option value="100">100% (Liquidación total)</option>
                            </select>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Enviar Vía WhatsApp',
                cancelButtonText: 'Cancelar',
                customClass: {
                    title: 'swal2-title-custom',
                    popup: 'swal2-popup-custom'
                },
                preConfirm: () => {
                    const marca = document.getElementById('swal-marca-nombre').value.trim();
                    const telefono = document.getElementById('swal-whatsapp-num').value.trim();
                    const porcentaje = parseInt(document.getElementById('swal-anticipo-porcentaje').value, 10);

                    if (!marca) {
                        Swal.fire.showValidationMessage('Por favor, ingresa el nombre de tu negocio.');
                        return false;
                    }
                    if (!telefono || !/^\d{10}$/.test(telefono)) {
                        Swal.fire.showValidationMessage('Debes ingresar un número de WhatsApp válido de 10 dígitos.');
                        return false;
                    }

                    return { marca, telefono, porcentaje };
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const { marca, telefono, porcentaje } = result.value;
                    const anticipoCalculado = Math.ceil(totalNumerico * (porcentaje / 100));
                    const anticipoTexto = `$${anticipoCalculado.toLocaleString('es-MX')}`;

                    const cuerpoMensaje = 
`✨ *${marca.toUpperCase()}* ✨
_Propuesta y Alta Repostería_
───────────────────
*🎨 PROPUESTA CREATIVA*

• *Concepto:* Pieza personalizada de diseño exclusivo.

• *Técnica:* Formulación artesanal adaptada a sus requerimientos.

• *Rendimiento:* Configurado para ${porciones} porciones sugeridas.

───────────────────
*🌾 COMPROMISO DE CALIDAD*

• *Insumos:* Materia prima premium, texturas finas y elementos seleccionados de alta gama.

• *Garantía:* Elaboración bajo rigurosos estándares artesanales para asegurar frescura y estructura óptimas en su evento.

┌──────────────────
│ *💳 ESTRUCTURA DE INVERSIÓN*

│ 💰 *Total Neto:* ${totalPastelTexto} M.N.
│ 🔒 *Anticipo de Reserva (${porcentaje}%):* ${anticipoTexto} M.N.
│ 🍰 *Valor por Porción:* ${rebanadaTexto} M.N.
└──────────────────

───────────────────
_• El anticipo garantiza la congelación de fecha en agenda._
_• Propuesta válida por 15 días naturales._
_Creado con NEXI Systems._`;

                    const txtCodificado = encodeURIComponent(cuerpoMensaje);
                    window.open(`https://api.whatsapp.com/send?phone=52${telefono}&text=${txtCodificado}`, '_blank');
                }
            });
        });
    }

    // ==========================================
    // BOX: GENERADOR DE COTIZACIÓN PDF PREMIUM
    // ==========================================
    document.getElementById('btn-descargar-pdf')?.addEventListener('click', function() {
        Swal.fire({
            title: 'Configurar PDF Editorial',
            html: `
                <p style="text-align: left; margin-bottom: 16px; font-size: 13px; color: var(--japandi-muted);">
                    Personaliza los datos impresos que se mostrarán en la hoja de cotización.
                </p>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--japandi-accent);">Nombre de tu Marca</label>
                        <input id="pdf-marca-nombre" class="swal2-input" type="text" value="Atelier de Repostería" style="margin: 4px 0 0 0; width: 100%; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--japandi-accent);">Porcentaje de Anticipo</label>
                        <select id="pdf-anticipo-porcentaje" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; box-sizing: border-box; appearance: auto; -webkit-appearance: auto;">
                            <option value="50">50% del total</option>
                            <option value="60">60% del total</option>
                            <option value="70" selected>70% del total (Recomendado)</option>
                            <option value="80">80% del total</option>
                            <option value="100">100% (Liquidación)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--japandi-accent);">Logotipo del Negocio (PNG / JPG)</label>
                        <input id="pdf-marca-logo" type="file" accept="image/*" style="margin: 8px 0 0 0; font-size: 12px; width: 100%;">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generar PDF Imprimible',
            cancelButtonText: 'Cancelar',
            customClass: { title: 'swal2-title-custom' }
        }).then((result) => {
            if (result.isConfirmed) {
                const marcaInput = document.getElementById('pdf-marca-nombre').value.trim() || "ATELIER DE REPOSTERÍA";
                const porcentajeInput = parseInt(document.getElementById('pdf-anticipo-porcentaje').value, 10);
                const logoFile = document.getElementById('pdf-marca-logo').files[0];

                if (logoFile) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        construirPdfPremium(marcaInput, porcentajeInput, e.target.result);
                    };
                    reader.readAsDataURL(logoFile);
                } else {
                    construirPdfPremium(marcaInput, porcentajeInput, null);
                }
            }
        });
    });

    function construirPdfPremium(marca, porcentajeAnticipo, logoBase64) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const totalPastelTexto = document.getElementById('res-precio-sugerido')?.textContent || "$0.00";
        const totalNumerico = parseFloat(totalPastelTexto.replace(/[^0-9.-]+/g, "")) || 0;
        const porciones = (typeof parametrosComerciales !== 'undefined' && parametrosComerciales?.porcionesPastel) || 12;
        const rebanadaTexto = document.getElementById('resumen-sugerido-rebanada')?.textContent || 
                              document.querySelector('.destacado-rebanada span:last-child')?.textContent || "$0.00";
        
        const anticipoCalculado = Math.ceil(totalNumerico * (porcentajeAnticipo / 100));
        const anticipoTexto = `$${anticipoCalculado.toLocaleString('es-MX')}`;

        const colorOscuro = [44, 42, 41];    
        const colorMuted = [115, 110, 105];  
        const colorArcilla = [184, 142, 116];
        const maxTextoWidth = 120; 

        if (logoBase64) {
            const img = new Image();
            img.src = logoBase64;
            img.onload = function() {
                const maxLogoHeight = 22; 
                const ratio = img.width / img.height;
                const logoWidth = maxLogoHeight * ratio;

                doc.addImage(logoBase64, 'PNG', 20, 20, logoWidth, maxLogoHeight);
                
                const textStartX = 20 + logoWidth + 6;
                doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(22);
                doc.text(marca.toUpperCase(), textStartX, 30);
                
                doc.setFontSize(9);
                doc.setTextColor(colorArcilla[0], colorArcilla[1], colorArcilla[2]);
                doc.text("COTIZACIÓN EXCLUSIVA DE ALTA GAMA", textStartX, 37);

                continuarDibujoPdf(doc, 58, colorOscuro, colorMuted, colorArcilla, maxTextoWidth, porciones, totalPastelTexto, porcentajeAnticipo, anticipoTexto, rebanadaTexto, marca);
            };
        } else {
            doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(24);
            doc.text(marca.toUpperCase(), 20, 32);
            
            doc.setFontSize(9);
            doc.setTextColor(colorArcilla[0], colorArcilla[1], colorArcilla[2]);
            doc.text("COTIZACIÓN EXCLUSIVA DE ALTA GAMA", 20, 39);

            continuarDibujoPdf(doc, 54, colorOscuro, colorMuted, colorArcilla, maxTextoWidth, porciones, totalPastelTexto, porcentajeAnticipo, anticipoTexto, rebanadaTexto, marca);
        }
    }

    function continuarDibujoPdf(doc, inicioY, colorOscuro, colorMuted, colorArcilla, maxTextoWidth, porciones, totalPastelTexto, porcentajeAnticipo, anticipoTexto, rebanadaTexto, marca) {
        doc.setDrawColor(colorArcilla[0], colorArcilla[1], colorArcilla[2]);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(20, 48, 190, 48);

        doc.setLineDashPattern([], 0); 
        doc.setFontSize(14);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        doc.text("Conceptualización de Autor", 20, inicioY);

        doc.setFontSize(10.5);
        let currentY = inicioY + 12;

        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("• Propuesta Creativa:", 24, currentY);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        let lineasCreativa = doc.splitTextToSize("Pieza única personalizada con diseño exclusivo y formulación artesanal.", maxTextoWidth);
        doc.text(lineasCreativa, 70, currentY);

        currentY += (lineasCreativa.length * 5) + 4;

        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("• Compromiso de Calidad:", 24, currentY);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        let lineasCalidad = doc.splitTextToSize("Materia prima premium, texturas delicadas e insumos seleccionados de alta gama.", maxTextoWidth);
        doc.text(lineasCalidad, 70, currentY);

        currentY += (lineasCalidad.length * 5) + 4;

        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("• Formato y Rendimiento:", 24, currentY);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        let lineasFormato = doc.splitTextToSize(`${porciones} porciones sugeridas calculadas a precisión métrica.`, maxTextoWidth);
        doc.text(lineasFormato, 70, currentY);

        currentY += 18;
        
        doc.setFillColor(250, 248, 245); 
        doc.roundedRect(20, currentY, 170, 72, 4, 4, 'F');

        let financieroY = currentY + 12;
        doc.setFontSize(13);
        doc.setTextColor(colorArcilla[0], colorArcilla[1], colorArcilla[2]);
        doc.text("Estructura de Inversión Sugerida", 30, financieroY);

        financieroY += 16;
        doc.setFontSize(11);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        doc.text("Inversión Total Neta del Proyecto:", 30, financieroY);
        doc.text(`${totalPastelTexto} M.N.`, 145, financieroY);

        financieroY += 13;
        doc.text(`Anticipo de Reserva Requerido (${porcentajeAnticipo}%):`, 30, financieroY);
        doc.text(`${anticipoTexto} M.N.`, 145, financieroY);

        financieroY += 13;
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("Valor Estimado Equivalente por Porción:", 30, financieroY);
        doc.text(`${rebanadaTexto} M.N.`, 145, financieroY);

        currentY = financieroY + 38;
        doc.setFontSize(9.5);
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("* El anticipo correspondiente es indispensable para congelar la fecha solicitada en agenda.", 20, currentY);
        doc.text("* Esta propuesta económica cuenta con una validez de 15 días naturales a partir de su emisión.", 20, currentY + 7);

        doc.setFontSize(8);
        doc.text("Documento generado digitalmente a través de Nexi Costos Atelier Suite.", 20, 278);

        doc.save(`Cotizacion-${marca.replace(/\s+/g, '-')}.pdf`);
    }

    function actualizarBannerEstatus() {
        const banner = document.getElementById('banner-estatus');
        const texto = document.getElementById('banner-texto');
        if (!banner || !texto) return;

        if (!usuarioActual) {
            banner.className = "banner-estatus estado-local";
            texto.innerText = "Demo (Local) • Actualiza tu plan para respaldar tus recetas";
        } else {
            let esPremiumValido = suscripcionUsuario.isPremium;
            if (suscripcionUsuario.expiresAt && new Date() > new Date(suscripcionUsuario.expiresAt)) esPremiumValido = false;

            if (esPremiumValido) {
                banner.className = "banner-estatus estado-premium";
                texto.innerText = "Suite Premium • Sistema de registro y costeo total";
            } else {
                banner.className = "banner-estatus estado-esencial";
                texto.innerText = "Plan Esencial • Sincronización a NexiCloud (Activa)";
            }
        }
    }

    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                usuarioActual = session.user;
                if (btnLoginModal) btnLoginModal.classList.add('hidden'); 
                if (btnCerrarSesion) btnCerrarSesion.classList.remove('hidden');
                actualizarBannerEstatus();
                descargarDatosNube().catch(err => console.error(err));
            } else {
                usuarioActual = null;
                suscripcionUsuario = { isPremium: false, expiresAt: null }; 
                if (btnLoginModal) btnLoginModal.classList.remove('hidden'); 
                if (btnCerrarSesion) btnCerrarSesion.classList.add('hidden');
                listaItems = []; listaReceta = []; catalogoRecetas = [];
                actualizarInstanciasLocales();
                actualizarBannerEstatus();
                verificarYBloquearPorPlan(); 
            }
        });
    }

    async function subirDatosNube() {
        if (!supabase || !usuarioActual) return;
        try {
            await supabase.from('usuarios_datos').upsert({
                id_usuario: usuarioActual.id,
                inventario: listaItems,
                composicion_activa: listaReceta,
                catalogo: catalogoRecetas,
                parametros: parametrosComerciales,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id_usuario' });
        } catch (err) { console.error(err); }
    }

    async function descargarDatosNube() {
        if (!supabase || !usuarioActual) return;
        try {
            const { data, error } = await supabase.from('usuarios_datos').select('*').eq('id_usuario', usuarioActual.id).maybeSingle();
            if (error) throw error;
            if (data) {
                listaItems = data.inventario || [];
                listaReceta = data.composicion_activa || [];
                catalogoRecetas = data.catalogo || [];
                parametrosComerciales = data.parametros || parametrosComerciales;
                suscripcionUsuario.isPremium = data.is_premium || false;
                suscripcionUsuario.expiresAt = data.premium_expires_at || null;
                if (document.getElementById('input-porciones')) {
                    document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;
                }
            }
        } catch (err) { console.error(err); }
        finally { 
            actualizarInstanciasLocales(); 
            actualizarBannerEstatus(); 
            verificarYBloquearPorPlan(); 
        }
    }

    if (btnCerrarSesion && supabase) {
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault(); 
            
            Swal.fire({
                title: '¿Cerrar Sesión?',
                text: 'Todos tus datos quedan guardados y respaldados en NEXICloud.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2e2a27',
                cancelButtonColor: '#8A857C',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try { 
                        await supabase.auth.signOut(); 
                        Swal.fire({
                            title: 'Sesión Cerrada',
                            text: '¡Vuelve pronto!',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } catch (err) { 
                        console.error(err); 
                    }
                }
            });
        });
    }

    if (btnDictar) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { 
            btnDictar.style.display = 'none'; 
        } else { 
            btnDictar.addEventListener('click', iniciarDictadoGuiado); 
        }
    }

    async function iniciarDictadoGuiado() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recon = new SpeechRecognition();
        recon.lang = 'es-MX'; 
        recon.interimResults = false; 
        recon.maxAlternatives = 1;

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const capturarDatoVoz = (instruccion) => {
            return new Promise((resolve) => {
                let finalizadoPorResultado = false;

                Swal.fire({
                    title: 'Te escucho... 🎙️',
                    html: `<div class="swal2-html-mic">${instruccion}</div>`,
                    showCancelButton: true, 
                    allowOutsideClick: false,
                    didOpen: () => { 
                        try { recon.start(); } catch(e) { console.error("Error al iniciar recon:", e); } 
                    },
                    willClose: () => { 
                        if (!finalizadoPorResultado) {
                            recon.abort(); 
                        }
                    }
                }).then((result) => {
                    if (result.isDismissed) {
                        resolve({ exito: false, texto: '' });
                    }
                });

                recon.onresult = (event) => { 
                    finalizadoPorResultado = true;
                    const textoEscuchado = event.results[0][0].transcript;
                    Swal.close(); 
                    resolve({ exito: true, texto: textoEscuchado }); 
                };

                recon.onerror = (err) => { 
                    console.error("Speech error:", err);
                    finalizadoPorResultado = true;
                    Swal.close();
                    resolve({ exito: false, texto: '' }); 
                };
            });
        };

        try {
            let pasoNombre = await capturarDatoVoz('Dí el NOMBRE del ingrediente');
            if (!pasoNombre?.exito || !pasoNombre.texto) return;
            insumoNombre.value = pasoNombre.texto;
            
            await sleep(400); 

            if (tipoActivo === 'insumo') {
                let pasoMarca = await capturarDatoVoz(`Dí la MARCA de "${pasoNombre.texto}"`);
                if (!pasoMarca?.exito) return; 
                insumoMarca.value = pasoMarca.texto;
                await sleep(400);
            }

            let pasoPrecio = await capturarDatoVoz('Dí el PRECIO total');
            if (!pasoPrecio?.exito) return;
            insumoPrecio.value = pasoPrecio.texto.replace(/[^0-9.]/g, '');
            await sleep(400);

            let pasoCantidad = await capturarDatoVoz('Dí la CANTIDAD contada');
            if (!pasoCantidad?.exito) return;
            insumoCantidad.value = pasoCantidad.texto.replace(/[^0-9.]/g, '');

            Swal.fire({ icon: 'success', title: '¡Campos llenados!', timer: 1500, showConfirmButton: false });
        } catch (error) { 
            console.error("Error en el flujo de dictado:", error); 
        }
    }

    // =========================================================================
    // 🎛️ LÓGICA DE MONETIZACIÓN: CONTROL DE CANDADO PREMIUM & REDIRECCIÓN
    // =========================================================================
    const CONFIG_MONETIZACION = {
        miTelefonoSoporte: "5212291915418", 
        mensajeAviso: "¡Hola! Vengo de mi app Nexi Costos Suite y me gustaría recibir los detalles y métodos de pago para activar mi cuenta al Plan Premium y poder desbloquear mis cotizaciones automáticas. ✨📊"
    };

    function verificarYBloquearPorPlan() {
        const esPlanPremiumNube = suscripcionUsuario && suscripcionUsuario.isPremium === true;
        const esPlanPremiumLocal = localStorage.getItem('user_plan_status') === 'premium';
        
        const capaOverlay = document.getElementById('bloqueo-premium-layer');
        const contenedorPadre = document.querySelector('.contenedor-bloque3-premium');

        if (esPlanPremiumNube || esPlanPremiumLocal) {
            contenedorPadre?.classList.add('es-premium');
            capaOverlay?.classList.add('dynamic-hide');
            if (capaOverlay) {
                capaOverlay.style.display = 'none';
            }
        } else {
            contenedorPadre?.classList.remove('es-premium');
            capaOverlay?.classList.remove('dynamic-hide');
            if (capaOverlay) {
                capaOverlay.style.display = 'flex'; 
            }
        }
    }

    document.getElementById('btn-activar-premium')?.addEventListener('click', function() {
        const enlaceWha = `https://api.whatsapp.com/send?phone=${CONFIG_MONETIZACION.miTelefonoSoporte}&text=${encodeURIComponent(CONFIG_MONETIZACION.mensajeAviso)}`;
        window.open(enlaceWha, '_blank');
        
        configurarModulo();
        verificarYBloquearPorPlan();
    });

    // ==========================================
    // 💡 UNIFICACIÓN DE LOGICA TOOLTIPS
    // ==========================================
    document.addEventListener("click", (e) => {
        const targetContainer = e.target.closest(".tooltip-container");

        if (targetContainer) {
            e.stopPropagation();
            const wasActive = targetContainer.classList.contains("active");
            const text = targetContainer.querySelector('.tooltip-text');
            
            document.querySelectorAll(".tooltip-container").forEach(el => {
                el.classList.remove("active");
                const t = el.querySelector('.tooltip-text');
                if(t) { t.style.visibility = 'hidden'; t.style.opacity = '0'; }
            });

            if (!wasActive) {
                targetContainer.classList.add("active");
                if(text) { text.style.visibility = 'visible'; text.style.opacity = '1'; }
            }
        } else {
            document.querySelectorAll(".tooltip-container").forEach(el => {
                el.classList.remove("active");
                const t = el.querySelector('.tooltip-text');
                if(t) { t.style.visibility = 'hidden'; t.style.opacity = '0'; }
            });
        }
    });

    // ==========================================
    // 🔥 EJECUCIÓN INICIAL (FIX)
    // ==========================================
    configurarModulo();
    verificarYBloquearPorPlan(); 
    
});
