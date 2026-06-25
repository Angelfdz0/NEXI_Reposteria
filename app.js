document.addEventListener('DOMContentLoaded', () => {

    // =================================================================********
    // ⚙️ PANEL DE CONFIGURACIÓN GLOBAL (EDITABLE)
    // =================================================================********
    const CONFIG = {
        SUPABASE_URL: "https://mpvhgukapfqqavxhjcof.supabase.co", 
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmhndWthcGZxcWF2eGhqY29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI3NDcsImV4cCI6MjA5NzU0ODc0N30.TlRjs3v0y85QvCin9FmUYOOMlWMutgFm_LyGRA5FJHM",

        PORCENTAJE_MERMA: 0.05,         
        PORCENTAJE_GASTOS_FIJOS: 0.10,   
        MARGEN_UTILIDAD_DEFAULT: 30, 
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
                    Swal.showValidationMessage('Por favor, rellena todos los campos.');
                    return false;
                }

                if (esRegistro) {
                    const confirmPassword = document.getElementById('modal-auth-password-confirm').value;
                    if (password !== confirmPassword) {
                        Swal.showValidationMessage('Las contraseñas no coinciden.');
                        return false;
                    }
                    if (password.length < 6) {
                        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres.');
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
    // 🔍 BUSCADOR EN TIEMPO REAL
    // ==========================================
    if (inputBuscar && listaResultados) {
        inputBuscar.addEventListener('input', function() {
            const terminoBusqueda = this.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (terminoBusqueda === '') { listaResultados.style.display = 'none'; return; }

            const itemsCompatibles = listaItems.filter(item => item.tipo === tipoRecetaActivo);
            
            const filtrados = itemsCompatibles.filter(item => {
                const nom = item.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return terminoBusqueda.length === 1 ? nom.startsWith(terminoBusqueda) : nom.includes(terminoBusqueda);
            });

            if (filtrados.length > 0) {
                listaResultados.innerHTML = filtrados.map(item => `
                    <div class="opcion-insumo-lista" data-id="${item.id}">
                        📌 <b>${escapeHTML(item.nombre)}</b> <span>(${item.marca !== 'Genérico' ? escapeHTML(item.marca) : item.unidadVisual})</span>
                    </div>
                `).join('');
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
        if (tipoActivo === 'insumo') {
            if (wrapperMarca) wrapperMarca.style.display = 'flex';
            if (insumoUnidad) insumoUnidad.innerHTML = unidadesInsumos;
        } else {
            if (wrapperMarca) wrapperMarca.style.display = 'none'; 
            if (insumoUnidad) insumoUnidad.innerHTML = unidadesConsumibles;
        }
        
        const itemsFiltrados = listaItems.filter(item => item.tipo === tipoActivo);
        const totalPaginas = Math.ceil(itemsFiltrados.length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        actualizarTablaInventario();

        // ✨ ADICIÓN: Sincronizar los campos del modal al arrancar el módulo
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

    // =========================================================================
    // 🔄 NUEVA LÓGICA: AGRUPAR VARIANTES POR NOMBRE DE PRODUCTO
    // =========================================================================
    const productosAgrupados = {};
    
    itemsFiltrados.forEach(item => {
        const nombreClave = item.nombre.toLowerCase().trim();
        if (!productosAgrupados[nombreClave]) {
            productosAgrupados[nombreClave] = [];
        }
        productosAgrupados[nombreClave].push(item);
    });

    // Convertimos el objeto agrupado en una lista para poder paginarla
    const listaAgrupada = Object.values(productosAgrupados);

    const totalPaginas = Math.ceil(listaAgrupada.length / CONFIG.ITEMS_POR_PAGINA) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas; 

    if (listaAgrupada.length === 0) {
        tablaInsumosBody.innerHTML = `<tr><td colspan="5" class="txt-tabla-vacia">No se encontró ningún artículo...</td></tr>`;
        if (pagInfoTexto) pagInfoTexto.textContent = "1 de 1";
        return;
    }

    const inicio = (paginaActual - 1) * CONFIG.ITEMS_POR_PAGINA;
    const itemsPagina = listaAgrupada.slice(inicio, inicio + CONFIG.ITEMS_POR_PAGINA);

    itemsPagina.forEach(grupo => {
        // Tomamos la primera variante por defecto para rellenar la fila inicialmente
        const varianteDefecto = grupo[0];
        const tieneVariasMarcas = grupo.length > 1;

        const fila = document.createElement('tr');
        fila.className = "fila-producto-agrupado";
        
        // Construimos el selector de marcas si tiene más de una variante, si no, texto plano
        let marcaCeldaHTML = '';
        if (tieneVariasMarcas) {
            marcaCeldaHTML = `
                <select class="celda-formato-marca-select" style="padding-left: 0; text-indent: 0; margin-top: 4px; border: none; background-color: transparent; background-position: right center; width: auto; min-width: 80px; font-size: 13px; color: var(--japandi-wood);">
                    ${grupo.map(v => `<option value="${v.id}">${escapeHTML(v.marca)}</option>`).join('')}
                </select>
            `;
        } else {
            marcaCeldaHTML = `<small style="color:var(--japandi-muted); display: block; margin-top: 4px;">${escapeHTML(varianteDefecto.marca)}</small>`;
        }

        fila.innerHTML = `
            <td>
                <strong>${escapeHTML(varianteDefecto.nombre)}</strong> <br>
                <div class="contenedor-marca-dinamica" style="margin-left: 0; padding-left: 0;">${marcaCeldaHTML}</div>
            </td>
            <td class="celda-precio">$${varianteDefecto.precio.toFixed(2)}</td>
            <td class="celda-cantidad">${varianteDefecto.cantidadOriginal} ${varianteDefecto.unidadVisual}</td>
            <td class="text-center celda-costo">$${varianteDefecto.costoUnitario.toFixed(4)}</td>
            <td class="text-right">
                <div class="actions-cell">
                    <button type="button" class="btn-icon btn-edit-trigger" data-id="${varianteDefecto.id}"><i data-lucide="edit-3"></i></button>
                    <button type="button" class="btn-icon delete btn-delete-trigger" data-id="${varianteDefecto.id}"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        `;

        // Escuchador de eventos en caso de que cambie la selección de marca en esta fila
        if (tieneVariasMarcas) {
            const selectElement = fila.querySelector('.celda-formato-marca-select');
            selectElement.addEventListener('change', function() {
                const idSeleccionado = this.value;
                const varianteSeleccionada = grupo.find(v => v.id === idSeleccionado);
                
                if (varianteSeleccionada) {
                    // Actualizamos dinámicamente los campos de la fila sin recargar
                    fila.querySelector('.celda-precio').textContent = `$${varianteSeleccionada.precio.toFixed(2)}`;
                    fila.querySelector('.celda-cantidad').textContent = `${varianteSeleccionada.cantidadOriginal} ${varianteSeleccionada.unidadVisual}`;
                    fila.querySelector('.celda-costo').textContent = `$${varianteSeleccionada.costoUnitario.toFixed(4)}`;
                    
                    // Muy importante: actualizamos el ID en los botones de acción para que alteren al elemento correcto
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
                    ${esInsumo ? `
                    <label class="swal2-label-custom">Marca o Molino</label>
                    <input id="swal-marca" class="swal2-input-custom" value="${escapeHTML(item.marca || '')}">
                    ` : `<input id="swal-marca" type="hidden" value="Genérico">`}
                    <label class="swal2-label-custom">Precio de Adquisición ($)</label>
                    <input id="swal-precio" type="number" step="any" class="swal2-input-custom" value="${item.precio}">
                    <label class="swal2-label-custom">Cantidad Contenida (${item.unidadOriginal})</label>
                    <input id="swal-cantidad" type="number" step="any" class="swal2-input-custom" value="${item.cantidadOriginal}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' },
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value.trim();
                const marca = document.getElementById('swal-marca').value.trim();
                const precio = parseFloat(document.getElementById('swal-precio').value);
                const cantidad = parseFloat(document.getElementById('swal-cantidad').value);

                if (!nombre || (esInsumo && !marca) || isNaN(precio) || precio < 0 || isNaN(cantidad) || cantidad <= 0) {
                    Swal.showValidationMessage('Por favor rellene los campos con valores correctos.');
                    return false;
                }
                return { nombre, marca, precio, cantidad };
            }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const index = listaItems.findIndex(i => i.id === id);
                if (index !== -1) {
                    listaItems[index].nombre = res.value.nombre;
                    listaItems[index].marca = res.value.marca;
                    listaItems[index].precio = res.value.precio;
                    listaItems[index].cantidadOriginal = res.value.cantidad;

                    let cantidadNormalizada = res.value.cantidad;
                    if (['kilo', 'litro', 'kg', 'L'].includes(listaItems[index].unidadOriginal)) {
                        cantidadNormalizada = res.value.cantidad * 1000;
                    }
                    
                    listaItems[index].costoUnitario = res.value.precio / (cantidadNormalizada || 1);
                    
                    listaReceta.forEach(r => {
                        if (r.itemIdOriginal === id) {
                            r.nombre = res.value.nombre;
                            r.costoProporcional = listaItems[index].costoUnitario * r.gridCantidad;
                        }
                    });

                    await subirDatosNube();
                    actualizarInstanciasLocales();
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

            const nuevoIngrediente = {
                id: Date.now().toString(),
                itemIdOriginal: insumoSeleccionadoPorBuscador.id, 
                nombre: insumoSeleccionadoPorBuscador.nombre,
                gridCantidad: cantidadUsada,
                tipo: insumoSeleccionadoPorBuscador.tipo,
                isSubReceta: insumoSeleccionadoPorBuscador.isSubReceta || false,
                ingredientesInternos: insumoSeleccionadoPorBuscador.ingredientesInternos || null,
                unidadVisual: insumoSeleccionadoPorBuscador.unidadVisual === 'kg' ? 'gr' : insumoSeleccionadoPorBuscador.unidadVisual,
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
            
            fila.innerHTML = `
                <td>${prefijoSubReceta}</td>
                <td><span>${item.gridCantidad} ${item.unidadVisual}</span></td>
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
                                ${ingrediente.ingredientesInternos.map((insumoInterno, index) => `
                                    <div class="editor-receta-sub-item">
                                        <span class="editor-receta-sub-item-nom">🌾 ${escapeHTML(insumoInterno.nombre)}</span>
                                        <div class="editor-receta-sub-item-input-wrapper">
                                            <input type="number" step="any" class="swal-insumo-interno-input" data-index="${index}" value="${insumoInterno.gridCantidad}">
                                            <span class="editor-receta-sub-item-unit">${insumoInterno.unidadVisual}</span>
                                        </div>
                                    </div>
                                `).join('')}
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
                            Swal.showValidationMessage('Por favor ingresa una dosificación general válida.');
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
                                    Swal.showValidationMessage('Las cantidades de insumos deben ser mayores a 0.');
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
                            const costoUnitarioBase = ingrediente.costoProporcional / ingrediente.gridCantidad;
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

    // CONTROLADORES DE ACCIONES CATÁLOGO
    const btnGuardarR = document.getElementById('btn-guardar-receta');
    const btnCargarR = document.getElementById('btn-cargar-receta');
    const btnVaciarR = document.getElementById('btn-vaciar-receta');

    if (btnGuardarR) {
        btnGuardarR.addEventListener('click', () => {
            if (listaReceta.length === 0) {
                Swal.fire('Mesa Vacía', 'Agrega ingredientes a tu fórmula actual antes de archivarla.', 'warning');
                return;
            }

            Swal.fire({
                title: 'Guardar como Sub-receta',
                html: `
                    <div style="text-align: left;">
                        <label class="swal2-label-custom">Nombre de la Fórmula</label>
                        <input id="swal-nombre-receta" class="swal2-input-custom" placeholder="Ej: Bizcocho Vainilla">
                        <label class="swal2-label-custom">Rendimiento Estimado en gramos</label>
                        <input id="swal-rendimiento-receta" type="number" class="swal2-input-custom" placeholder="Ej: 1000">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                preConfirm: () => {
                    const nombre = document.getElementById('swal-nombre-receta').value.trim();
                    const rendimiento = parseFloat(document.getElementById('swal-rendimiento-receta').value) || 0;
                    if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio.'); return false; }
                    return { nombre, rendimiento };
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const costoTotal = listaReceta.reduce((sum, item) => sum + (item.costoProporcional || 0), 0);
                    catalogoRecetas.push({
                        id: "cat_" + Date.now(),
                        nombre: result.value.nombre,
                        rendimiento: result.value.rendimiento || 1,
                        costoTotal: costoTotal,
                        ingredientes: [...listaReceta]
                    });
                    listaReceta = []; 
                    await subirDatosNube();
                    actualizarInstanciasLocales();
                }
            });
        });
    }

    if (btnCargarR) { btnCargarR.addEventListener('click', () => { if (catalogoRecetas.length === 0) { Swal.fire('Catálogo Vacío', 'No tienes sub-recetas.', 'info'); return; } abrirModalSeleccionSubReceta(); }); }

    function abrirModalSeleccionSubReceta() {
        const listaHtml = catalogoRecetas.map(receta => `
            <div class="subreceta-item-row">
                <div class="btn-select-subreceta" data-id="${receta.id}">
                    🎨 <b>${escapeHTML(receta.nombre)}</b> <br>
                    <small>$${receta.costoTotal.toFixed(2)} - Rinde: ${receta.rendimiento}g</small>
                </div>
                <button type="button" class="btn-delete-subreceta-catalogo" data-id="${receta.id}">🗑️</button>
            </div>
        `).join('');

        Swal.fire({
            title: 'Elegir Receta', 
            html: `<div class="catalogo-modal-scroll">${listaHtml}</div>`,
            showCancelButton: true, showConfirmButton: false,
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.querySelectorAll('.btn-select-subreceta').forEach(el => {
                    el.addEventListener('click', async () => {
                        const recetaSeleccionada = catalogoRecetas.find(r => r.id === el.dataset.id);
                        if (!recetaSeleccionada) return;

                        listaReceta.push({
                            id: "sub_" + Date.now(),
                            itemIdOriginal: recetaSeleccionada.id,
                            nombre: recetaSeleccionada.nombre,
                            gridCantidad: 1, tipo: "insumo", isSubReceta: true,               
                            ingredientesInternos: recetaSeleccionada.ingredientes,
                            unidadesVisual: "pza", costoProporcional: parseFloat(recetaSeleccionada.costoTotal) 
                        });
                        await subirDatosNube();
                        actualizarInstanciasLocales();
                        Swal.close();
                    });
                });

                popup.querySelectorAll('.btn-delete-subreceta-catalogo').forEach(el => {
                    el.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        catalogoRecetas = catalogoRecetas.filter(r => r.id !== el.dataset.id);
                        await subirDatosNube();
                        actualizarInstanciasLocales();
                        Swal.close();
                    });
                });
            }
        });
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
            // Sincronizar inputs antes de mostrar el modal
            if (document.getElementById('input-mano-obra')) document.getElementById('input-mano-obra').value = parametrosComerciales.manoObraPorHora || 0;
            if (document.getElementById('select-dificultad')) document.getElementById('select-dificultad').value = parametrosComerciales.dificultad || "facil";
            if (document.getElementById('input-distancia')) document.getElementById('input-distancia').value = parametrosComerciales.distanciaIdaKm || 0;
            if (document.getElementById('input-gasolina')) document.getElementById('input-gasolina').value = parametrosComerciales.costoLitroGasolina || 0;
            if (document.getElementById('select-vehiculo')) document.getElementById('select-vehiculo').value = parametrosComerciales.tipoVehiculo || "sedan";
            if (document.getElementById('input-margen-utilidad')) document.getElementById('input-margen-utilidad').value = parametrosComerciales.margenUtilidad || CONFIG.MARGEN_UTILIDAD_DEFAULT;
            if (document.getElementById('input-porciones')) document.getElementById('input-porciones').value = parametrosComerciales.porcionesPastel || 12;

            // Mostrar quitando de forma limpia la clase hidden
            modalConfig.classList.remove("hidden");
            renderizarIconosSeguro();
        });
    }

    // Eventos para cerrar al dar clic en la (X) o en "Listo"
    [btnCerrarConfig, btnGuardarConfig].forEach(btn => {
        if (btn && modalConfig) {
            btn.addEventListener("click", () => {
                modalConfig.classList.add("hidden");
                window.calcularCostosPorRebanada();
                subirDatosNube();
            });
        }
    });

    // Cerrar si el usuario hace clic afuera de la caja blanca (en la zona opaca)
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
        // 1. Separar insumos comestibles de consumibles (para no aplicar merma de comida al cartón/empaques)
        const costoInsumosComestibles = listaReceta
            .filter(item => item.tipo === 'insumo')
            .reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

        const costoConsumiblesEmpaque = listaReceta
            .filter(item => item.tipo === 'consumible')
            .reduce((sum, item) => sum + (item.costoProporcional || 0), 0);

        // 2. Aplicar merma e indirectos fijos SÓLO a la materia prima comestible
        const costoComidaConGastosYMerma = (costoInsumosComestibles * (1 + CONFIG.PORCENTAJE_MERMA)) * (1 + CONFIG.PORCENTAJE_GASTOS_FIJOS);
        
        // 3. Mano de obra por horas de complejidad
        let horasEstimadas = 1;
        if (parametrosComerciales.dificultad === "medio") horasEstimadas = 2.5;
        if (parametrosComerciales.dificultad === "dificil") horasEstimadas = 4;
        const costoManoObra = (parametrosComerciales.manoObraPorHora || 0) * horasEstimadas;

        // 4. Logística: Combustible + Amortización por desgaste del vehículo
        let rendimientoKmPorLitro = 12; 
        if (parametrosComerciales.tipoVehiculo === "suv") rendimientoKmPorLitro = 9;
        if (parametrosComerciales.tipoVehiculo === "moto") rendimientoKmPorLitro = 25;

        const distanciaTotalKm = (parametrosComerciales.distanciaIdaKm || 0) * 2; 
        const litrosConsumidos = distanciaTotalKm / rendimientoKmPorLitro;
        const costoGasolina = litrosConsumidos * (parametrosComerciales.costoLitroGasolina || 0);
        
        // Costo de mantenimiento aproximado por km (Seguro, llantas, aceite) -> Ejemplo: $0.50 extras por km
        const COSTO_AMORTIZACION_KM = 0.50; 
        const costoDesgasteVehiculo = distanciaTotalKm * COSTO_AMORTIZACION_KM;

        // 5. Costo Total Real de Fabricación y Entrega
        const costoTotalReal = costoComidaConGastosYMerma + costoConsumiblesEmpaque + costoManoObra + costoGasolina + costoDesgasteVehiculo;

        if (totalProduccionSpan) totalProduccionSpan.textContent = `$${costoTotalReal.toFixed(2)}`;
        
        // 6. Precio Sugerido Base considerando la utilidad esperada
        let margenElegido = parseFloat(parametrosComerciales.margenUtilidad);
        if (isNaN(margenElegido) || margenElegido >= 100 || margenElegido <= 0) {
            margenElegido = CONFIG.MARGEN_UTILIDAD_DEFAULT; 
        }
        
        let precioSugeridoPastel = costoTotalReal / (1 - (margenElegido / 100));
        
        // [OPCIONAL] 7. Margen de pasarela de pago / Comisión Bancaria estándar (3.5% + IVA aprox = ~4%)
        // Descomenta las líneas de abajo si quieres blindar los pagos con tarjeta:
        // const FACTOR_COMISION_TARJETA = 0.04;
        // precioSugeridoPastel = precioSugeridoPastel / (1 - FACTOR_COMISION_TARJETA);

        const elSugerido = document.getElementById('res-precio-sugerido');
        if (elSugerido) elSugerido.textContent = `$${precioSugeridoPastel.toFixed(2)}`;
        
        calcularCostosPorRebanadaEspecial(costoTotalReal, precioSugeridoPastel);

        return costoTotalReal; 
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

        if (elCostoRebanada) elCostoRebanada.innerText = "$" + costoIndividual.toFixed(2);
        if (elSugeridoRebanada) elSugeridoRebanada.innerText = "$" + sugeridoIndividual.toFixed(2);
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
            
            Swal.fire({
                title: 'Enviar Cotización',
                input: 'text',
                inputPlaceholder: 'Número de WhatsApp (10 dígitos)',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value || !/^\d{10}$/.test(value.trim())) { return 'Debes ingresar un número válido de 10 dígitos.'; }
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const txtCodificado = encodeURIComponent(`Estimado cliente, la inversión total para su proyecto de repostería es de: ${totalPastelTexto}.`);
                    window.open(`https://api.whatsapp.com/send?phone=52${result.value.trim()}&text=${txtCodificado}`, '_blank');
                }
            });
        });
    }

    // ==========================================
    // ☁️ PERSISTENCIA EN LA NUBE CONTROLADA
    // ==========================================
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
        finally { actualizarInstanciasLocales(); actualizarBannerEstatus(); }
    }

    if (btnCerrarSesion && supabase) {
        btnCerrarSesion.addEventListener('click', async () => {
            try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
        });
    }

    // ==========================================
    // 🎙️ MÓDULO DE ACCESIBILIDAD POR VOZ (DICTADO) - CORREGIDO
    // ==========================================
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

        // Función auxiliar para dar una pequeña pausa entre alertas
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
                        // Solo abortamos si el usuario canceló manualmente el SweetAlert
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
            // 1. Capturar Nombre
            let pasoNombre = await capturarDatoVoz('Dí el NOMBRE del ingrediente');
            if (!pasoNombre?.exito || !pasoNombre.texto) return;
            insumoNombre.value = pasoNombre.texto;
            
            // Pausa crucial para que el navegador destruya la instancia anterior de grabación
            await sleep(400); 

            // 2. Capturar Marca (Si aplica)
            if (tipoActivo === 'insumo') {
                let pasoMarca = await capturarDatoVoz(`Dí la MARCA de "${pasoNombre.texto}"`);
                if (!pasoMarca?.exito) return; // Si cancela, frena el flujo
                insumoMarca.value = pasoMarca.texto;
                await sleep(400);
            }

            // 3. Capturar Precio
            let pasoPrecio = await capturarDatoVoz('Dí el PRECIO total');
            if (!pasoPrecio?.exito) return;
            // Filtra el texto para dejar solo números y puntos
            insumoPrecio.value = pasoPrecio.texto.replace(/[^0-9.]/g, '');
            await sleep(400);

            // 4. Capturar Cantidad
            let pasoCantidad = await capturarDatoVoz('Dí la CANTIDAD contada');
            if (!pasoCantidad?.exito) return;
            insumoCantidad.value = pasoCantidad.texto.replace(/[^0-9.]/g, '');

            // Mensaje de éxito final
            Swal.fire({ icon: 'success', title: '¡Campos llenados!', timer: 1500, showConfirmButton: false });
        } catch (error) { 
            console.error("Error en el flujo de dictado:", error); 
        }
    }

    // Inicialización de arranque seguro
    configurarModulo();
});
