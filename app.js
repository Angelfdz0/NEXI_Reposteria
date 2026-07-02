document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // ⚙️ CONFIGURACIÓN GLOBAL — TODO LO EDITABLE DEL NEGOCIO VIVE AQUÍ
    // =====================================================================
    const CONFIG = {
        // Credenciales de Supabase. Recomendado moverlas a variables de entorno (.env) en producción.
        SUPABASE_URL: "https://mpvhgukapfqqavxhjcof.supabase.co", 
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmhndWthcGZxcWF2eGhqY29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI3NDcsImV4cCI6MjA5NzU0ODc0N30.TlRjs3v0y85QvCin9FmUYOOMlWMutgFm_LyGRA5FJHM",

        // Reglas de costeo general
        PORCENTAJE_MERMA: 0.05,
        PORCENTAJE_GASTOS_FIJOS: 0.10,
        MARGEN_UTILIDAD_DEFAULT: 60,
        ITEMS_POR_PAGINA: 5,

        // Horas de mano de obra sugeridas según la dificultad del proyecto
        HORAS_POR_DIFICULTAD: {
            facil: 1,
            medio: 2.5,
            dificil: 4
        },

        // Rendimiento (km por litro) usado para estimar el gasto de gasolina por vehículo
        RENDIMIENTO_KM_POR_LITRO: {
            sedan: 12,
            suv: 9,
            moto: 25
        },

        // Costos fijos de logística
        COSTO_AMORTIZACION_POR_KM: 0.50,
        COBRO_BASE_LOGISTICA: 50,

        // Contacto y mensaje usados en el botón de activación del Plan Premium (WhatsApp)
        MONETIZACION: {
            TELEFONO_SOPORTE: "5212291915418",
            MENSAJE_AVISO: "¡Hola! Vengo de mi app NEXI vengo de usar la app-web y me gustaría recibir los detalles y métodos de pago para activar mi cuenta al Plan Premium y poder desbloquear mis cotizaciones automáticas. ✨📊"
        },

        // Textos del modal de acceso / registro de miembros
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

    // Instancia de Supabase con sesión persistente y auto-refresh de token
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

    // Bloqueo de scroll sin saltos: guarda la posición actual, fija el body
    // ahí con position:fixed y la restaura al desbloquear con scrollTo().
    let scrollYGuardado = 0;

    function bloquearScrollFondo() {
        scrollYGuardado = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        document.body.style.top = `-${scrollYGuardado}px`;
        document.body.classList.add('modal-open-fix');
    }

    function desbloquearScrollFondo() {
        document.body.classList.remove('modal-open-fix');
        document.body.style.top = '';
        window.scrollTo(0, scrollYGuardado);
    }

    if (btnLoginModal) {
        btnLoginModal.addEventListener('click', () => abrirModalLoginSencillo(false));
    }

    function abrirModalLoginSencillo(esRegistro = false) {
        // Bloquear fondo al abrir SweetAlert de Login/Registro
        bloquearScrollFondo();

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
            // Desbloquear fondo siempre al cerrar el prompt principal
            desbloquearScrollFondo();

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

    // --- Buscador unificado en tiempo real ---
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

    function renderizarIconosSeguro() {
        try { if (typeof lucide !== 'undefined') lucide.createIcons(); } catch (e) {}
    }

    if (document.getElementById('input-porciones')) {
        document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;
    }

    function configurarModulo() {
        if (formInsumo) formInsumo.reset();
        
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

    // --- Captura e inventariado ---
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

    // --- Control de paginación ---
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
                <td class="celda-cantidad">${varianteDefecto.character || varianteDefecto.character || varianteDefecto.cantidadOriginal} ${unidadVisualLimpia}</td>
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
                        fila.querySelector('.celda-cantidad').textContent = `${varianteSeleccionada.character || varianteSeleccionada.cantidadOriginal} ${unidadCambioLimpia}`;
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
        bloquearScrollFondo(); // Bloqueo de scroll preventivo
        Swal.fire({
            title: '¿Eliminar del Inventario?',
            text: 'Se removerá también de las composiciones activas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            buttonsStyling: false,
            customClass: { confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom' }
        }).then(async (result) => {
            desbloquearScrollFondo();
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
        bloquearScrollFondo(); // Bloqueo de scroll

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
                    <input id="swal-cantidad" type="number" step="any" class="swal2-input-custom" value="${item.character || item.character || item.character || item.cantidadOriginal}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            preConfirm: () => {
                return { 
                    nombre: document.getElementById('swal-nombre').value.trim(),
                    marca: document.getElementById('swal-marca').value.trim(),
                    nuevoTipo: document.getElementById('swal-tipo').value, 
                    precio: parseFloat(document.getElementById('swal-precio').value),
                    character: document.getElementById('swal-cantidad').value,
                    cantidad: parseFloat(document.getElementById('swal-cantidad').value)
                };
            }
        }).then(async (res) => {
            desbloquearScrollFondo(); // Desbloqueo de scroll
            if (res.isConfirmed) {
                const index = listaItems.findIndex(i => i.id === id);
                if (index !== -1) {
                    listaItems[index].nombre = res.value.nombre;
                    listaItems[index].marca = res.value.marca;
                    listaItems[index].tipo = res.value.nuevoTipo; 
                    listaItems[index].precio = res.value.precio;
                    listaItems[index].character = res.value.character;
                    listaItems[index].cantidadOriginal = res.value.cantidad;
                    
                    let cantidadNormalizadaFinal = (['kilo', 'litro', 'kg', 'L'].includes(listaItems[index].unidadOriginal)) ? res.value.cantidad * 1000 : res.value.character;
                    listaItems[index].costoUnitario = res.value.precio / (cantidadNormalizadaFinal || 1);

                    await subirDatosNube();
                    actualizarInstanciasLocales(); 
                }
            }
        });
    }

    if (tabInsumos) tabInsumos.addEventListener('click', () => { tipoActivo = 'insumo'; tipoRecetaActivo = 'insumo'; tabInsumos.classList.add('active'); tabConsumibles.classList.remove('active'); configurarModulo(); });
    if (tabConsumibles) tabConsumibles.addEventListener('click', () => { tipoActivo = 'consumible'; tipoRecetaActivo = 'consumible'; tabConsumibles.classList.add('active'); tabInsumos.classList.remove('active'); configurarModulo(); });

    // --- Módulo: composición de receta ---
    if (formReceta) {
        formReceta.addEventListener('submit', async function(event) {
            event.preventDefault();
            const cantidadUsada = parseFloat(recetaCantidad.value);

            if (!insumoSeleccionadoPorBuscador || isNaN(cantidadUsada) || cantidadUsada <= 0) {
                Swal.fire('Atención', 'Selecciona un insumo válido y define una cantidad adecuada.', 'info');
                return;
            }

            let unidadDeterminada = 'pza';
            if (insumoSeleccionadoPorBuscador.isSubReceta) {
                unidadDeterminada = insumoSeleccionadoPorBuscador.unidadVisual || 'Fórmula';
            } else {
                if (insumoSeleccionadoPorBuscador.unidadOriginal === 'kilo' || insumoSeleccionadoPorBuscador.unidadVisual === 'kg') {
                    unidadDeterminada = 'gr';
                } else if (insumoSeleccionadoPorBuscador.unidadOriginal === 'litro' || insumoSeleccionadoPorBuscador.unidadVisual === 'L') {
                    unidadDeterminada = 'ml';
                } else if (insumoSeleccionadoPorBuscador.unidadOriginal === 'metro') {
                    unidadDeterminada = 'm';
                } else if (insumoSeleccionadoPorBuscador.unidadOriginal === 'paquete') {
                    unidadDeterminada = 'paq';
                } else {
                    unidadDeterminada = insumoSeleccionadoPorBuscador.unidadVisual || 'pza';
                }
            }

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
                
                if (unidadLimpia === 'L' || unidadLimpia === 'litro') unidadLimpia = 'ml';
                if (unidadLimpia === 'kg' || unidadLimpia === 'kilo') unidadLimpia = 'gr';
                if (unidadLimpia === 'metro') unidadLimpia = 'm';
                if (unidadLimpia === 'paquete') unidadLimpia = 'paq';
                
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

                bloquearScrollFondo(); // Bloqueo de scroll

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
                    desbloquearScrollFondo(); // Desbloqueo de scroll
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

    // --- Controladores de acciones del catálogo (con soporte de categorías) ---
    const btnGuardarR = document.getElementById('btn-guardar-receta');
    const btnCargarR = document.getElementById('btn-cargar-receta');
    const btnVaciarR = document.getElementById('btn-vaciar-receta');

    const modalGuardarForm = document.getElementById('modal-guardar-formula');
    const modalCargarForm = document.getElementById('modal-cargar-formula');

    let listaCategoriasLocales = JSON.parse(localStorage.getItem('local_categorias')) || [];

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

    async function eliminarCategoriaSeguro(categoriaId) {
        const recetasAsociadas = catalogoRecetas.filter(rec => String(rec.categoria_id) === String(categoriaId));
        
        if (recetasAsociadas.length > 0) {
            bloquearScrollFondo();
            Swal.fire({
                icon: 'error',
                title: 'No se puede eliminar',
                text: `Esta sección contiene ${recetasAsociadas.length} receta(s) guardada(s). Elimina o reasigna las recetas primero.`,
                confirmButtonColor: '#2e2a27'
            }).then(() => {
                bloquearScrollFondo(); // Mantiene el overlay principal bloqueado
            });
            return;
        }

        bloquearScrollFondo();
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

        if (!confirmacion.isConfirmed) {
            bloquearScrollFondo();
            return;
        }

        try {
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

            refrescarSelectCategoriasGuardar();
            mostrarPasoCategorias();

        } catch (err) {
            console.error("Error al remover categoría:", err);
            Swal.fire('Error', 'No pudimos eliminar la sección en la nube.', 'error');
        } finally {
            bloquearScrollFondo();
        }
    }

    if (btnGuardarR) {
        btnGuardarR.addEventListener('click', async () => {
            if (listaReceta.length === 0) {
                bloquearScrollFondo(); 
                Swal.fire({
                    title: 'Mesa Vacía',
                    text: 'Agrega ingredientes a tu fórmula actual antes de archivarla.',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                }).then(() => {
                    desbloquearScrollFondo();
                });
                return;
            }
            
            document.getElementById('input-nombre-formula').value = '';
            document.getElementById('input-nueva-categoria').value = '';

            await refrescarSelectCategoriasGuardar();
            modalGuardarForm.classList.remove('hidden');
            bloquearScrollFondo(); 
        });
    }

    // Botón de cerrar modal de guardar fórmula con la "X"
    document.getElementById('btn-cerrar-modal-guardar')?.addEventListener('click', () => {
        modalGuardarForm.classList.add('hidden');
        desbloquearScrollFondo(); 
    });

    document.getElementById('btn-confirmar-guardar-formula')?.addEventListener('click', async () => {
        const nombreFormula = document.getElementById('input-nombre-formula').value.trim();
        const selectCategoriaId = document.getElementById('select-categoria').value;
        const nuevaCategoriaNombre = document.getElementById('input-nueva-categoria').value.trim();

        if (!nombreFormula) {
            Swal.fire('Atención', 'Ingresa el nombre de la sub-receta.', 'info');
            return;
        }

        let categoriaIdFinal = selectCategoriaId;

        if (nuevaCategoriaNombre !== "") {
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

        const costoTotal = listaReceta.reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

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
        desbloquearScrollFondo(); 

        await subirDatosNube();
        actualizarInstanciasLocales();

        Swal.fire({
            title: '¡Receta Guardada! 🎉',
            text: `"${nombreFormula}" ha sido indexada con éxito.`,
            icon: 'success',
            confirmButtonColor: '#2e2a27'
        });
    });

    if (btnCargarR) {
        btnCargarR.addEventListener('click', () => {
            modalCargarForm.classList.remove('hidden');
            bloquearScrollFondo(); 
            mostrarPasoCategorias();
        });
    }

    document.getElementById('btn-cerrar-modal-cargar')?.addEventListener('click', () => {
        modalCargarForm.classList.add('hidden');
        desbloquearScrollFondo(); 
    });

    async function mostrarPasoCategorias() {
        document.getElementById('titulo-modal-cargar').textContent = "Selecciona Categoría";
        const cuerpo = document.getElementById('cuerpo-modal-cargar');
        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        let categories = [];
        if (supabase && usuarioActual) {
            const { data } = await supabase.from('categorias').select('id, nombre');
            if (data) categories = data;
        } else {
            categories = listaCategoriasLocales;
        }

        if (categories.length === 0) {
            cuerpo.innerHTML = '<p class="modal-cargar-vacio">No tienes categorías creadas actualmente.</p>';
            return;
        }

        categories.forEach(cat => {
            const rowWrapper = document.createElement('div');
            rowWrapper.className = "premium-modal-row";

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = "btn-premium-item-main";

            const conteo = catalogoRecetas.filter(r => String(r.categoria_id) === String(cat.id)).length;
            
            btn.innerHTML = `
                <span class="btn-premium-title-wrapper">
                    <i data-lucide="folder" class="icon-premium-folder"></i> 
                    ${escapeHTML(cat.nombre.toUpperCase())}
                </span> 
                <span class="badge-premium-count">${conteo} ${conteo === 1 ? 'receta' : 'recetas'}</span>
            `;
            btn.onclick = () => mostrarPasoRecetas(cat.id, cat.nombre);
            
            const btnBorrarCat = document.createElement('button');
            btnBorrarCat.type = 'button';
            btnBorrarCat.className = "btn-premium-action delete";
            btnBorrarCat.innerHTML = '<i data-lucide="trash-2"></i>';
            btnBorrarCat.title = "Eliminar Categoría";
            btnBorrarCat.onclick = (e) => {
                e.stopPropagation();
                eliminarCategoriaSeguro(cat.id);
            };

            rowWrapper.appendChild(btn);
            rowWrapper.appendChild(btnBorrarCat);
            cuerpo.appendChild(rowWrapper);
        });

        renderizarIconosSeguro();
    }

    function mostrarPasoRecetas(categoriaId, nombreCategoria) {
        document.getElementById('titulo-modal-cargar').textContent = nombreCategoria.toUpperCase();
        const cuerpo = document.getElementById('cuerpo-modal-cargar');
        if (!cuerpo) return;
        cuerpo.innerHTML = '';

        const recetasFiltradas = catalogoRecetas.filter(r => String(r.categoria_id) === String(categoriaId));

        if (recetasFiltradas.length === 0) {
            cuerpo.innerHTML = '<p class="modal-cargar-vacio">No hay recetas archivadas en esta sección.</p>';
        }

        recetasFiltradas.forEach(receta => {
            const row = document.createElement('div');
            row.className = "premium-modal-row";

            const btnReceta = document.createElement('button');
            btnReceta.type = 'button';
            btnReceta.className = "btn-premium-item-main receta-item";
            
            btnReceta.innerHTML = `
                <div class="premium-receta-meta">
                    <span class="premium-receta-name">
                        <i data-lucide="cookie" class="icon-premium-receta"></i>
                        ${escapeHTML(receta.nombre)}
                    </span>
                    <span class="premium-receta-cost">Costo: $${parseFloat(receta.costoTotal || 0).toFixed(2)}</span>
                </div>
            `;
            
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
                desbloquearScrollFondo(); 
                
                await subirDatosNube();
                actualizarInstanciasLocales();
            };

            const btnMover = document.createElement('button');
            btnMover.type = 'button';
            btnMover.className = "btn-premium-action move";
            btnMover.innerHTML = '<i data-lucide="folder-input"></i>';
            btnMover.title = "Mover a otra categoría";
            
            btnMover.onclick = async (e) => {
                e.stopPropagation(); 
                modalCargarForm.classList.add('hidden'); 
                desbloquearScrollFondo(); 

                let categoriasDisponibles = [];
                if (supabase && usuarioActual) {
                    const { data } = await supabase.from('categorias').select('id, nombre');
                    if (data)  categoriasDisponibles = data;
                } else {
                    categoriasDisponibles = listaCategoriasLocales;
                }

                const opcionesSelect = {};
                categoriasDisponibles.forEach(cat => {
                    if (String(cat.id) !== String(categoriaId)) { 
                        opcionesSelect[cat.id] = cat.nombre.toUpperCase();
                    }
                });

                if (Object.keys(opcionesSelect).length === 0) {
                    Swal.fire('Atención', 'No tienes otras categorías creadas a las cuales mover esta receta.', 'info').then(() => {
                        modalCargarForm.classList.remove('hidden');
                        bloquearScrollFondo();
                    });
                    return;
                }

                Swal.fire({
                    title: `Mover "${receta.nombre}"`,
                    text: 'Selecciona la categoría de destino:',
                    input: 'select',
                    inputOptions: opcionesSelect,
                    inputPlaceholder: '-- Selecciona una categoría --',
                    showCancelButton: true,
                    confirmButtonText: 'Mover',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#2e2a27',
                    inputValidator: (value) => {
                        if (!value) return 'Debes seleccionar una categoría destino';
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const nuevaCatId = result.value;
                        const idx = catalogoRecetas.findIndex(r => r.id === receta.id);
                        if (idx !== -1) {
                            catalogoRecetas[idx].categoria_id = nuevaCatId;
                            await subirDatosNube();
                            actualizarInstanciasLocales();
                            
                            Swal.fire({
                                icon: 'success',
                                title: '¡Receta movida!',
                                text: `Se cambió a la categoría seleccionada sin perder tus costeos.`,
                                timer: 2000,
                                showConfirmButton: false
                            });
                        }
                    }
                    modalCargarForm.classList.remove('hidden');
                    bloquearScrollFondo();
                    mostrarPasoRecetas(categoriaId, nombreCategoria);
                });
            };

            const btnBorrar = document.createElement('button');
            btnBorrar.type = 'button';
            btnBorrar.className = "btn-premium-action delete";
            btnBorrar.innerHTML = '<i data-lucide="trash-2"></i>';
            btnBorrar.title = "Eliminar Receta";
            
            btnBorrar.onclick = () => {
                modalCargarForm.classList.add('hidden'); 
                desbloquearScrollFondo(); 
                
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
                    modalCargarForm.classList.remove('hidden');
                    bloquearScrollFondo(); 
                    
                    if (res.isConfirmed) {
                        catalogoRecetas = catalogoRecetas.filter(r => r.id !== receta.id);
                        await subirDatosNube();
                        actualizarInstanciasLocales();
                    }
                    mostrarPasoRecetas(categoriaId, nombreCategoria);
                });
            };

            row.appendChild(btnReceta);
            row.appendChild(btnMover); 
            row.appendChild(btnBorrar);
            cuerpo.appendChild(row);
        });

        const btnVolver = document.createElement('button');
        btnVolver.type = 'button';
        btnVolver.className = "btn-premium-back";
        btnVolver.textContent = "← Volver a Categorías";
        btnVolver.onclick = mostrarPasoCategorias;
        cuerpo.appendChild(btnVolver);

        renderizarIconosSeguro();
    }

    if (btnVaciarR) {
        btnVaciarR.addEventListener('click', () => {
            if (listaReceta.length === 0) return;
            bloquearScrollFondo();
            Swal.fire({ title: '¿Vaciar la mesa?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, vaciar' }).then(async (result) => {
                desbloquearScrollFondo();
                if (result.isConfirmed) { listaReceta = []; await subirDatosNube(); actualizarInstanciasLocales(); }
            });
        });
    }

    // --- Control del modal de parámetros comerciales ---
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
            bloquearScrollFondo(); 
            renderizarIconosSeguro();
        });
    }

    [btnCerrarConfig, btnGuardarConfig].forEach(btn => {
        if (btn && modalConfig) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                modalConfig.classList.add("hidden");
                desbloquearScrollFondo(); 
                window.calcularCostosPorRebanada();
                subirDatosNube();
            });
        }
    });

    // --- Cálculos financieros y márgenes de ganancia ---
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

        const horasEstimadas = CONFIG.HORAS_POR_DIFICULTAD[parametrosComerciales.dificultad] || CONFIG.HORAS_POR_DIFICULTAD.facil;
        const costoManoObra = (parametrosComerciales.manoObraPorHora || 0) * horasEstimadas;

        const elTotalManoObra = document.getElementById('total-mano-obra');
        if (elTotalManoObra) elTotalManoObra.textContent = `$${Math.ceil(costoManoObra)}`;

        const rendimientoKmPorLitro = CONFIG.RENDIMIENTO_KM_POR_LITRO[parametrosComerciales.tipoVehiculo] || CONFIG.RENDIMIENTO_KM_POR_LITRO.sedan;

        const distanciaIda = parametrosComerciales.distanciaIdaKm || 0;
        const distanciaTotalKm = distanciaIda * 2; 
        const litrosConsumidos = distanciaTotalKm / rendimientoKmPorLitro;
        const costoGasolina = litrosConsumidos * (parametrosComerciales.costoLitroGasolina || 0);
        
        const costoDesgasteVehiculo = distanciaTotalKm * CONFIG.COSTO_AMORTIZACION_POR_KM;
        
        const cobroBaseLogistica = distanciaIda > 0 ? CONFIG.COBRO_BASE_LOGISTICA : 0;
        const costoLogisticaTotal = costoGasolina + costoDesgasteVehiculo + cobroBaseLogistica;

        const elTotalLogistica = document.getElementById('total-logistica');
        if (elTotalLogistica) elTotalLogistica.textContent = `$${Math.ceil(costoLogisticaTotal)}`;

        const costoInversionBase = materiaPrimaDirectaTotal + costoManoObra + costoLogisticaTotal;

        let margenElegido = parseFloat(parametrosComerciales.margenUtilidad);
        if (isNaN(margenElegido) || margenElegido >= 100 || margenElegido <= 0) {
            margenElegido = CONFIG.MARGEN_UTILIDAD_DEFAULT;
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
        btnFinalizar.addEventListener('click', function(e) {
            e.preventDefault();
            subirDatosNube();
            bloquearScrollFondo(); 
            
            const totalPastelTexto = document.getElementById('res-precio-sugerido')?.textContent || "$0.00";
            const totalNumerico = parseFloat(totalPastelTexto.replace(/[^0-9.-]+/g, "")) || 0;
            const porciones = parametrosComerciales?.porcionesPastel || 12;

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
                desbloquearScrollFondo(); 
                if (result.isConfirmed && result.value) {
                    const { marca, telefono, porcentaje } = result.value;
                    const anticipoCalculado = Math.ceil(totalNumerico * (porcentaje / 100));
                    const anticipoTexto = `$${anticipoCalculado.toLocaleString('es-MX')}`;

                    const cuerpoMensaje = 
`✨ *${marca.toUpperCase()}* ✨
_Alta Repostería de Diseño_
───────────────────
*👑 EXPERIENCIA DE AUTOR*

• *Formato:* Pieza artesanal exclusiva configurada para ${porciones} porciones.
• *Compromiso:* Diseño a medida y elaboración con materia prima premium seleccionada bajo los más altos estándares de calidad, frescura y estructura para su evento.

┌──────────────────
│ *💳 ESTRUCTURA DE INVERSIÓN*
│ 
│ 💰 *Total Neto:* ${totalPastelTexto} M.N.
│ 🔒 *Anticipo de Reserva (${porcentaje}%):* ${anticipoTexto} M.N.
└──────────────────

───────────────────
*⚖️ TÉRMINOS Y POLÍTICAS DE SERVICIO (LEER CON ATENCIÓN):*

1. *Reserva:* Ninguna fecha se congela ni se agenda sin la validación del anticipo correspondiente.
2. *Anticipos:* El monto del anticipo NO es reembolsable ni transferible bajo ninguna circunstancia, ya que se utiliza de inmediato para asegurar insumos y apartar el espacio de producción.
3. *Cambios:* No se aceptan modificaciones de diseño, sabor o tamaño con menos de 7 días naturales de anticipación al evento establecido.
4. *Entrega/Tolerancia:* En pedidos para recolección, se cuenta con una tolerancia máxima de 30 minutos de la hora acordada. Pasado ese tiempo, la entrega se reprogramará sujeta a la disponibilidad del taller.
5. *Responsabilidad:* Una vez que el producto sale de nuestras instalaciones o es entregado al cliente/coordinador en óptimas condiciones, la empresa se deslinda de cualquier daño sufrido por mal manejo, transporte inadecuado o condiciones climáticas del lugar del evento.

_• Propuesta válida por 15 días naturales._
_Creado con NEXI Systems._`;

                    const txtCodificado = encodeURIComponent(cuerpoMensaje);
                    window.open(`https://api.whatsapp.com/send?phone=52${telefono}&text=${txtCodificado}`, '_blank');
                }
            });
        });
    }

    // --- Generador de cotización en PDF ---
    // Nota: los textos de marca, cláusulas y mensajes de esta sección están
    // escritos directamente en el código (no en CONFIG) porque se combinan
    // con datos dinámicos (totales, anticipos, etc.). Para cambiar el texto
    // de la cotización o del rubro del negocio, edita las cadenas dentro de
    // esta sección y de construirPdfPremium()/continuarDibujoPdf() más abajo.
    document.getElementById('btn-descargar-pdf')?.addEventListener('click', function(e) {
        e.preventDefault();
        bloquearScrollFondo(); 
        
        Swal.fire({
            title: 'Configurar PDF Editorial',
            html: `
                <p style="text-align: left; margin-bottom: 16px; font-size: 13px; color: var(--japandi-muted);">
                    Personaliza los datos impresos que se mostrarán en la hoja de cotización.
                </p>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 14px;">
                    <div>
                        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--japandi-accent);">Nombre de tu Marca</label>
                        <input id="pdf-marca-nombre" class="swal2-input-custom" type="text" value="Atelier de Repostería" style="margin: 4px 0 0 0; width: 100%; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--japandi-accent);">Porcentaje de Anticipo</label>
                        <select id="input-porcentaje-anticipo-pdf" class="swal2-input-custom" style="margin: 4px 0 0 0; width: 100%; box-sizing: border-box; appearance: auto; -webkit-appearance: auto;">
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
            desbloquearScrollFondo(); 
            if (result.isConfirmed) {
                const marcaInput = document.getElementById('pdf-marca-nombre').value.trim() || "ATELIER DE REPOSTERÍA";
                const porcentajeInput = parseInt(document.getElementById('input-porcentaje-anticipo-pdf').value, 10);
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
        doc.text("Experiencia de Autor", 20, inicioY);

        doc.setFontSize(10.5);
        let currentY = inicioY + 12;

        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("• Formato y Rendimiento:", 24, currentY);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        let lineasFormato = doc.splitTextToSize(`Pieza artesanal exclusiva configurada para ${porciones} porciones.`, maxTextoWidth);
        doc.text(lineasFormato, 72, currentY);

        currentY += (lineasFormato.length * 5) + 4;

        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        doc.text("• Compromiso de Calidad:", 24, currentY);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        let lineasCompromiso = doc.splitTextToSize("Diseño a medida y elaboración con materia prima premium seleccionada bajo los más altos estándares de calidad, frescura y estructura para su evento.", maxTextoWidth);
        doc.text(lineasCompromiso, 72, currentY);

        currentY += (lineasCompromiso.length * 5) + 12;
        
        doc.setFillColor(250, 248, 245); 
        doc.roundedRect(20, currentY, 170, 50, 4, 4, 'F');

        let financieroY = currentY + 12;
        doc.setFontSize(13);
        doc.setTextColor(colorArcilla[0], colorArcilla[1], colorArcilla[2]);
        doc.text("Estructura de Inversión Sugerida", 30, financieroY);

        financieroY += 14;
        doc.setFontSize(11);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        doc.text("Inversión Total Neta del Proyecto:", 30, financieroY);
        doc.text(`${totalPastelTexto} M.N.`, 145, financieroY);

        financieroY += 12;
        doc.text(`Anticipo de Reserva Requerido (${porcentajeAnticipo}%):`, 30, financieroY);
        doc.text(`${anticipoTexto} M.N.`, 145, financieroY);

        currentY = financieroY + 25;
        doc.setFontSize(10);
        doc.setTextColor(colorOscuro[0], colorOscuro[1], colorOscuro[2]);
        doc.text("Términos, Condiciones y Políticas de Cancelación:", 20, currentY);
        
        doc.setFontSize(8.5);
        doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
        
        let clausulasTexto = [
            "* El anticipo correspondiente es indispensable para congelar la fecha en nuestra agenda. Los anticipos NO son reembolsables ni transferibles ante cancelaciones del cliente.",
            "* No se aceptan modificaciones de diseño, sabor o tamaño con menos de 7 días naturales de anticipación al evento establecido.",
            "* Recolección con tolerancia máxima de 30 minutos. Pasado este tiempo, la entrega queda sujeta a la disponibilidad del taller.",
            "* El taller se deslinda de cualquier daño estructural o estético que sufra el producto una vez entregado al cliente, coordinador o personal del evento en óptimas condiciones.",
            "* Esta propuesta económica cuenta con una validez estricta de 15 días naturales a partir de su fecha de emisión."
        ];

        clausulasTexto.forEach((clausula, index) => {
            let lineasClausula = doc.splitTextToSize(clausula, 165);
            doc.text(lineasClausula, 20, currentY + 6 + (index * 7));
        });

        doc.setFontSize(8);
        doc.text("Documento generado digitalmente a través de Nexi Systems.", 20, 278);

        doc.save(`Cotizacion-${marca.replace(/\s+/g, '-')}.pdf`);
    }

    function actualizarBannerEstatus() {
        const banner = document.getElementById('banner-estatus');
        const texto = document.getElementById('banner-texto');
        if (!banner || !texto) return;

        if (!usuarioActual) {
            banner.className = "banner-estatus estado-local";
            texto.innerText = "Demo (Local) • Registrate para respaldar tus recetas";
        } else {
            let esPremiumValido = suscripcionUsuario.isPremium;
            if (suscripcionUsuario.expiresAt && new Date() > new Date(suscripcionUsuario.expiresAt)) esPremiumValido = false;

            if (esPremiumValido) {
                banner.className = "banner-estatus estado-premium";
                texto.innerText = "Plan Premium • Sistema completo de costeo integral";
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
            bloquearScrollFondo(); // Bloqueo de scroll preventivo
            
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
                desbloquearScrollFondo();
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
                bloquearScrollFondo(); // Bloqueo de scroll

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
                    desbloquearScrollFondo(); // Desbloqueo de scroll
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

            bloquearScrollFondo();
            Swal.fire({ icon: 'success', title: '¡Campos llenados!', timer: 1500, showConfirmButton: false }).then(() => {
                desbloquearScrollFondo();
            });
        } catch (error) { 
            console.error("Error en el flujo de dictado:", error); 
        }
    }

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
        const enlaceWha = `https://api.whatsapp.com/send?phone=${CONFIG.MONETIZACION.TELEFONO_SOPORTE}&text=${encodeURIComponent(CONFIG.MONETIZACION.MENSAJE_AVISO)}`;
        window.open(enlaceWha, '_blank');
        
        configurarModulo();
        verificarYBloquearPorPlan();
    });

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

    // --- Cierre automático de modales al hacer clic fuera de ellos ---
    window.addEventListener("click", (e) => {
        if (e.target === modalConfig) {
            modalConfig.classList.add("hidden");
            desbloquearScrollFondo();
            window.calcularCostosPorRebanada();
            subirDatosNube();
        }
        if (e.target === modalGuardarForm) {
            modalGuardarForm.classList.add("hidden");
            desbloquearScrollFondo();
        }
        if (e.target === modalCargarForm) {
            modalCargarForm.classList.add("hidden");
            desbloquearScrollFondo();
        }
        if (listaResultados && !inputBuscar.contains(e.target) && !listaResultados.contains(e.target)) {
            listaResultados.style.display = 'none';
        }
    });

    configurarModulo();
    verificarYBloquearPorPlan(); 
    
});
