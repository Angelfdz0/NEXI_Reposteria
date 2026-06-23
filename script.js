document.addEventListener('DOMContentLoaded', () => {

    // =================================================================********
    // ⚙️ PANEL DE CONFIGURACIÓN GLOBAL (EDITABLE)
    // =================================================================********
    const CONFIG = {
        // 🔑 CONEXIÓN A BASE DE DATOS (SUPABASE)
        SUPABASE_URL: "https://mpvhgukapfqqavxhjcof.supabase.co", 
        SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmhndWthcGZxcWF2eGhqY29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI3NDcsImV4cCI6MjA5NzU0ODc0N30.TlRjs3v0y85QvCin9FmUYOOMlWMutgFm_LyGRA5FJHM",

        // 💵 PARÁMETROS FINANCIEROS Y MÁRGENES DEFAULT
        PORCENTAJE_MERMA: 0.05,         // 5% de merma default
        PORCENTAJE_GASTOS_FIJOS: 0.10,   // 10% de gastos fijos
        MARGEN_UTILIDAD_DEFAULT: 200,    // 200% de margen de utilidad base
        ITEMS_POR_PAGINA: 5,             // Paginación de las tablas

        // 📝 TEXTOS DE AUTENTICACIÓN (LOGIN / REGISTRO)
        AUTH: {
            TITULO_LOGIN: "Iniciar Sesión",
            DESC_LOGIN: "Gestiona los costos de tu negocio.",
            BTN_LOGIN: "Ingresar",
            SWITCH_LOGIN: "¿No tienes una cuenta?",
            SWITCH_LINK_LOGIN: "Regístrate aquí",

            TITULO_REGISTRE: "Crear Cuenta",
            DESC_REGISTRO: "Regístrate para guardar tus recetas en la nube",
            BTN_REGISTRO: "Registrarse",
            SWITCH_REGISTRO: "¿Ya tienes cuenta?",
            SWITCH_LINK_REGISTRO: "Inicia sesión aquí",
            
            MSJ_VERIFICACION_TITULO: "¡Cuenta creada con éxito! 🎉",
            MSJ_VERIFICACION_CUERPO: `
                <p style="font-size: 14px; color: #6D675B; line-height: 1.5; margin-bottom: 10px;">
                    Para proteger tus recetas en la nube, hemos enviado un enlace de verificación a tu correo.
                </p>
                <div style="background-color: #FDFCFA; border: 1px dashed #7A7265; border-radius: 8px; padding: 12px; font-weight: bold; color: #2C2A27; font-size: 13px;">
                    📬 Revisa tu bandeja de entrada (o SPAM) y confirma tu cuenta para poder ingresar.
                </div>
            `,
            MSJ_VERIFICACION_BTN: "Entendido, iré a revisar"
        },

        // 🗂️ PLACEHOLDERS Y MENSAJES DE SWEETALERT (ALERTAS)
        ALERTAS: {
            PLACEHOLDER_SUBRECETA: "Ej. Bizcocho de Vainilla Especial...",
            TXT_CATALOGO_VACIO: "No tienes recetas guardadas. Diseña una receta en este bloque y presiona \"Guardar Receta\".",
            BANNER_PREMIUM: "<strong>Suite Premium</strong> • Control de Alta Pastelería",
            BANNER_BASICO: "<strong>Plan Esencial</strong> • Respaldo en NexiCloud"
        },

        // 📖 MANUAL DE AYUDA AL USUARIO (TEXTO COMPLETO)
        MANUAL_AYUDA: `
            <div style="text-align: left; font-family: system-ui, -apple-system, sans-serif; max-height: 460px; overflow-y: auto; padding-right: 6px; display: flex; flex-direction: column; gap: 14px;">
                <p style="font-size: 13px; color: #6D675B; margin: 0 0 4px 0; line-height: 1.5; text-align: center;">
                    <strong>¡Qué gusto tenerte en la cocina!</strong><br>Explora esta guía para dominar cada rincón de tu panel. Diseñamos este espacio para <strong>cuidar la exactitud de cada gramo y centavo,</strong> permitiéndote crear sin complicaciones.
                </p>
                <div style="background: #FDFCFA; border: 1px solid #EAE6E1; border-radius: 8px; padding: 12px;">
                    <h4 style="color: #2C2A27; margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🏢 01. Almacén Integral</h4>
                    <p style="color: #6D675B; margin: 0; font-size: 12.5px; line-height: 1.5;">Registra tu inventario maestro. Al ingresar un paquete (ej. kilo o litro), el sistema divide el costo de forma interna para obtener el valor preciso por gramo o mililitro.</p>
                </div>
                <div style="background: #FDFCFA; border: 1px solid #EAE6E1; border-radius: 8px; padding: 12px;">
                    <h4 style="color: #2C2A27; margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🥣 02. Composición de Receta</h4>
                    <p style="color: #6D675B; margin: 0; font-size: 12.5px; line-height: 1.5; margin-bottom: 6px;">Agrega las cantidades exactas que lleva tu pastel actual para obtener el <b>Costo de Production</b>.</p>
                    <p style="color: #4A6B82; margin: 0; font-size: 12px; line-height: 1.4; background: #F4F7F9; padding: 8px; border-radius: 6px; font-weight: 500;">💡 <b>Sub-Recetas:</b> Si preparas bases repetitivas (ej. un bizcocho), añade sus ingredientes aquí y usa <b>"Guardar Receta"</b>. En tu próxima cotización, presiona <b>"Cargar Sub-Receta"</b> para insertarla armada como un único bloque compacto.</p>
                </div>
                <div style="background: #FDFCFA; border: 1px solid #7A7265; border-left: 4px solid #7A7265; border-radius: 8px; padding: 12px;">
                    <h4 style="color: #2C2A27; margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">📍 Configuración por Kilómetro (Ruta)</h4>
                    <ol style="color: #6D675B; margin: 0; padding-left: 18px; font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
                        <li>Abre <b>Google Maps</b> y mide la distancia desde tu taller hasta el domicilio del cliente.</li>
                        <li>Escribe únicamente los kilómetros de <b>Ida</b> en el campo <i>"Ruta Maps"</i>. El sistema multiplicará automáticamente por 2 para cubrir la vuelta.</li>
                        <li>Selecciona tu tipo de vehículo. Cada uno tiene un rendimiento real asignado.</li>
                        <li>El sistema dividirá la distancia total entre el rendimiento y lo multiplicará por el precio de gasolina ingresado para darte el gasto exacto de traslado.</li>
                    </ol>
                </div>
                <div style="background: #FDFCFA; border: 1px solid #EAE6E1; border-radius: 8px; padding: 12px;">
                    <h4 style="color: #2C2A27; margin: 0 0 6px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📊 03. Proyección Comercial</h4>
                    <p style="color: #6D675B; margin: 0; font-size: 12.5px; line-height: 1.5;">• <b>Precio Sugerido:</b> Suma total de ingredientes + mano de obra calculada + gasolina de entrega, multiplicado por tu margen de ganancia.<br><br>• <b>Costos Indirectos (MO + Envío):</b> Muestra el dinero destinado exclusivamente a pagar el tiempo invertido en la cocina (mano de obra) y el combustible necesario para el reparto.<br><br>• <b>PVP Mínimo Rebanada:</b> Divide el precio sugerido entre el número de porciones configuradas.</p>
                </div>
            </div>
        `
    };

    // =========================================================================
    // INSTANCIA DE SUPABASE CON LOCALSTORAGE EXPLÍCITO Y COORDENADAS DE FLUJO
    // =========================================================================
    const supabase = window.supabase ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            storageKey: 'nexi-auth-token',
            storage: window.localStorage,
            autoRefreshToken: true
        }
    }) : null;

    const authContainer = document.getElementById('auth-container');
    const formAuth = document.getElementById('form-auth');
    const authTitle = document.getElementById('auth-title');
    const authDesc = document.getElementById('auth-desc');
    const groupAuthNombre = document.getElementById('group-auth-nombre');
    const authNombre = document.getElementById('auth-nombre');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const btnAuthSwitch = document.getElementById('btn-auth-switch');
    const authSwitchText = document.getElementById('auth-switch-text');
    
    const bloqueAlmacen = document.getElementById('seccion-almacen');
    const bloqueReceta = document.getElementById('seccion-recetas');
    const bloqueFinanzas = document.getElementById('seccion-proyeccion');
    const appFooter = document.querySelector('.footer');

    let modoRegistro = false;
    let usuarioActual = null;

    // ESTADO DE LA APLICACIÓN (VARIABLES GLOBALES)
    let listaItems = [];
    let listaReceta = [];
    let catalogoRecetas = [];
    let insumoSeleccionadoPorBuscador = null;

    let tipoActivo = 'insumo';
    let tipoRecetaActivo = 'insumo'; 
    
    let paginaActual = 1;
    let paginaActualReceta = 1; 
    
    let parametrosComerciales = {
        dificultad: "facil",
        manoObraPorHora: 0,
        distanciaIdaKm: 0,
        costoLitroGasolina: 0,
        tipoVehiculo: "sedan",
        porcionesPastel: 12,
        margenUtilidad: CONFIG.MARGEN_UTILIDAD_DEFAULT
    };

    if (btnAuthSwitch) {
        btnAuthSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            modoRegistro = !modoRegistro;
            
            if (modoRegistro) {
                if (authTitle) authTitle.textContent = CONFIG.AUTH.TITULO_REGISTRO;
                if (authDesc) authDesc.textContent = CONFIG.AUTH.DESC_REGISTRO;
                if (btnAuthSubmit) btnAuthSubmit.textContent = CONFIG.AUTH.BTN_REGISTRO;
                if (authSwitchText) authSwitchText.textContent = CONFIG.AUTH.SWITCH_REGISTRO;
                btnAuthSwitch.textContent = CONFIG.AUTH.SWITCH_LINK_REGISTRO;
                if (groupAuthNombre) groupAuthNombre.classList.remove('hidden');
                if (authNombre) authNombre.setAttribute('required', 'required');
            } else {
                if (authTitle) authTitle.textContent = CONFIG.AUTH.TITULO_LOGIN;
                if (authDesc) authDesc.textContent = CONFIG.AUTH.DESC_LOGIN;
                if (btnAuthSubmit) btnAuthSubmit.textContent = CONFIG.AUTH.BTN_LOGIN;
                if (authSwitchText) authSwitchText.textContent = CONFIG.AUTH.SWITCH_LOGIN;
                btnAuthSwitch.textContent = CONFIG.AUTH.SWITCH_LINK_LOGIN;
                if (groupAuthNombre) groupAuthNombre.classList.add('hidden');
                if (authNombre) {
                    authNombre.removeAttribute('required');
                    authNombre.value = "";
                }
            }
            renderizarIconosSeguro();
        });
    }

    if (formAuth && supabase) {
        formAuth.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = authEmail.value.trim();
            const password = authPassword.value;
            const nombre = authNombre ? authNombre.value.trim() : '';
            const inputConfirmar = document.getElementById('auth-confirm-password');

            if (!email || !password || (modoRegistro && !nombre)) {
                Swal.fire('Campos vacíos', 'Por favor, rellena todos los datos de acceso requeridos.', 'warning');
                return;
            }

            if (modoRegistro && inputConfirmar) {
                if (password !== inputConfirmar.value) {
                    Swal.fire('Contraseñas distintas', 'Por favor, asegúrate de que ambas contraseñas sean exactamente iguales.', 'warning');
                    return;
                }
            }

            Swal.fire({
                title: 'Procesando...',
                text: 'Conectando con NexiCloud',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            if (modoRegistro) {
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: { data: { display_name: nombre } }
                });
                
                if (error) {
                    Swal.fire('Error al crear cuenta', error.message, 'error');
                } else {
                    Swal.fire({
                        title: CONFIG.AUTH.MSJ_VERIFICACION_TITULO,
                        html: CONFIG.AUTH.MSJ_VERIFICACION_CUERPO,
                        icon: 'info',
                        confirmButtonText: CONFIG.AUTH.MSJ_VERIFICACION_BTN,
                        buttonsStyling: false,
                        customClass: {
                            popup: 'swal2-popup-custom',
                            title: 'swal2-title-custom',
                            confirmButton: 'swal2-confirm-custom'
                        }
                    });
                    btnAuthSwitch.click();
                    formAuth.reset();
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    Swal.fire('Error de Acceso', 'El correo o la contraseña son incorrectos', 'error');
                } else {
                    Swal.fire({
                        title: '¡Sesión Iniciada! 👩‍🍳',
                        text: 'Tu taller digital está listo. Hemos sincronizado tus recetas y costos con la nube.',
                        icon: 'success',
                        timer: 2500,
                        showConfirmButton: false
                    });
                    // Aquí no llamamos a controlarInterfazUsuario directamente, 
                    // dejamos que onAuthStateChange intercepte el inicio de sesión de forma limpia.
                }
            }
        });
    }

    function controlarInterfazUsuario(user) {
        const botonAyuda = document.getElementById('btn-ayuda-usuario');
        const banner = document.getElementById('status-banner');

        if (user) {
            if (authContainer) authContainer.classList.add('hidden');
            if (bloqueAlmacen) bloqueAlmacen.classList.remove('hidden');
            if (bloqueReceta) bloqueReceta.classList.remove('hidden');
            if (bloqueFinanzas) bloqueFinanzas.classList.remove('hidden');
            if (appFooter) appFooter.classList.remove('hidden');
            if (botonAyuda) botonAyuda.classList.remove('hidden');
        } else {
            if (authContainer) authContainer.classList.remove('hidden');
            if (bloqueAlmacen) bloqueAlmacen.classList.add('hidden');
            if (bloqueReceta) bloqueReceta.classList.add('hidden');
            if (bloqueFinanzas) bloqueFinanzas.classList.add('hidden');
            if (appFooter) appFooter.classList.add('hidden');
            if (botonAyuda) botonAyuda.classList.add('hidden');
            
            if (banner) banner.classList.add('hidden');
            if (formAuth) formAuth.reset();
            
            if (Swal.isVisible()) {
                Swal.close();
            }
        }
        
        renderizarIconosSeguro();
    }

    // ==========================================
    // ESCUCHADOR GLOBAL DE AUTENTICACIÓN (SÚPER FUENTE DE VERDAD)
    // ==========================================
    if (supabase) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            const banner = document.getElementById('status-banner');
            console.log("Evento Auth Detectado:", event);
            
            if (session) {
                usuarioActual = session.user;
                if (banner) banner.classList.remove('hidden');
                
                // Descargamos datos automáticamente al recuperar o iniciar sesión
                await descargarDatosNube();
                controlarInterfazUsuario(session.user);
                
                try {
                    const { data, error } = await supabase
                        .from('usuarios_datos')
                        .select('plan')
                        .eq('id_usuario', session.user.id)
                        .maybeSingle();

                    if (data && !error && data.plan === 'premium') {
                        actualizarBannerJapandi(true);
                    } else {
                        actualizarBannerJapandi(false);
                    }
                } catch (err) {
                    console.error("Error al obtener el plan del usuario:", err);
                    actualizarBannerJapandi(false);
                }
            } else {
                usuarioActual = null;
                listaItems = [];
                listaReceta = [];
                catalogoRecetas = [];
                if (banner) banner.classList.add('hidden');
                controlarInterfazUsuario(null);
            }
            
            // Garantizar visibilidad del layout
            document.body.style.display = 'block';
        });
    }

    // ==========================================
    // CONEXIÓN ASÍNCRONA CON SUPABASE CLOUD
    // ==========================================
    async function subirDatosNube() {
        if (!supabase || !usuarioActual) return;
        
        const payload = {
            id_usuario: usuarioActual.id,
            inventario: listaItems,
            composicion_activa: listaReceta,
            catalogo: catalogoRecetas,
            parametros: parametrosComerciales,
            updated_at: new Date().toISOString()
        };

        try {
            await supabase
                .from('usuarios_datos')
                .upsert(payload, { onConflict: 'id_usuario' });
        } catch (err) {
            console.error("Error al subir datos:", err);
        }
    }

    async function descargarDatosNube() {
        if (!supabase || !usuarioActual) return;

        try {
            const { data, error } = await supabase
                .from('usuarios_datos')
                .select('inventario, composicion_activa, catalogo, parametros')
                .eq('id_usuario', usuarioActual.id)
                .maybeSingle();

            if (data && !error) {
                const inventarioCrudo = data.inventario || [];
                
                listaItems = [...inventarioCrudo].sort((a, b) => {
                    const nombreA = (a.nombre || '').trim();
                    const nombreB = (b.nombre || '').trim();
                    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                });

                listaReceta = data.composicion_activa || [];
                catalogoRecetas = data.catalogo || [];
                parametrosComerciales = data.parametros || parametrosComerciales;
            } else {
                listaItems = [];
                listaReceta = [];
                catalogoRecetas = [];
            }
        } catch (err) {
            console.error("Error al descargar datos:", err);
        }

        actualizarTablaInventario();
        actualizarSelectReceta();
        actualizarTablaReceta();
        calcularFinanzas();
    }

    // ==========================================
    // REFERENCIAS AL DOM
    // ==========================================
    const tabInsumos = document.getElementById('tab-insumos');
    const tabConsumibles = document.getElementById('tab-consumibles');
    const formInsumo = document.getElementById('form-insumo');
    const insumoNombre = document.getElementById('insumo-nombre');
    const insumoMarca = document.getElementById('insumo-marca');
    const insumoPrecio = document.getElementById('insumo-precio');
    const insumoCantidad = document.getElementById('insumo-cantidad');
    const insumoUnidad = document.getElementById('insumo-unidad');
    const wrapperMarca = document.getElementById('wrapper-marca');
    const searchInput = document.getElementById('search-input');
    const tablaInsumosBody = document.querySelector('#tabla-insumos tbody');
    const btnPagPrev = document.getElementById('btn-pag-prev');
    const btnPagNext = document.getElementById('btn-pag-next');
    const pagInfoTexto = document.getElementById('pag-info-texto');

    const tabRecetaInsumos = document.getElementById('tab-receta-insumos');
    const tabRecetaConsumibles = document.getElementById('tab-receta-consumibles');
    const selectRecetaInsumo = document.getElementById('receta-insumo');
    const formReceta = document.getElementById('form-receta');
    const recetaCantidad = document.getElementById('receta-cantidad');
    const tablaRecetaBody = document.querySelector('#tabla-receta tbody');
    const totalProduccionSpan = document.getElementById('total-produccion');
    
    const btnPagRecetaPrev = document.getElementById('btn-pag-receta-prev');
    const btnPagRecetaNext = document.getElementById('btn-pag-receta-next');
    const pagInfoRecetaTexto = document.getElementById('pag-info-receta-texto');

    const btnGuardarAlmacen = document.getElementById('btn-guardar-almacen'); 
    const btnCargarAlmacen = document.getElementById('btn-cargar-almacen');   
    const btnVaciarAlmacen = document.getElementById('btn-vaciar-almacen');   

    const btnFinalizar = document.getElementById('btn-finalizar');
    const mensajeExito = document.getElementById('mensaje-exito');
    const btnConfigurarProyeccion = document.getElementById('btn-configurar-proyeccion');
    const btnAyudaUsuario = document.getElementById('btn-ayuda-usuario');
    const btnTogglePassword = document.getElementById('btn-toggle-password');

    const unidadesInsumos = `
        <option value="gr">Gramos (gr)</option>
        <option value="kilo">Kilos (kg)</option>
        <option value="litro">Litros (L)</option>
        <option value="ml">Mililitros (ml)</option>
        <option value="pieza">Pieza (pza)</option>
    `;

    const unidadesConsumibles = `
        <option value="pieza">Pieza (pza)</option>
        <option value="metro">Metro (m)</option>
        <option value="paquete">Paquete (paq)</option>
    `;
    
    const inputBuscar = document.getElementById('inputBuscarInsumo');
    const listaResultados = document.getElementById('listaResultadosInsumos');

    if (inputBuscar && listaResultados) {
        inputBuscar.addEventListener('input', function() {
            const terminoBusqueda = this.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (terminoBusqueda === '') {
                listaResultados.style.display = 'none';
                return;
            }

            const itemsCompatibles = listaItems.filter(item => item.tipo === tipoRecetaActivo);
            
            const filtrados = itemsCompatibles.filter(item => {
                const nombreNormalizado = item.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const marcaNormalizada = (item.marca || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                const regexBusqueda = new RegExp(`\\b${terminoBusqueda}`);
                return regexBusqueda.test(nombreNormalizado) || regexBusqueda.test(marcaNormalizada);
            });

            if (filtrados.length > 0) {
                listaResultados.innerHTML = filtrados.map(item => `
                    <div class="opcion-insumo-lista" data-id="${item.id}" 
                         style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #FAF9F6; font-size: 13px; color: #2C2A27; text-align: left;"
                         onmouseover="this.style.background='#FDFCFA'" 
                         onmouseout="this.style.background='#FFF'">
                        📌 <b>${item.nombre}</b> <span style="color: #8A857C; font-size: 11px;">(${item.marca !== 'Genérico' ? item.marca : item.unidadVisual})</span>
                    </div>
                `).join('');
                listaResultados.style.display = 'block';
            } else {
                listaResultados.innerHTML = `<div style="padding: 12px; color: #8A857C; font-size: 12.5px; text-align: center;">No se encontraron coincidencias</div>`;
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

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.buscador-insumo-container')) {
                listaResultados.style.display = 'none';
            }
        });
    }

    function renderizarIconosSeguro() {
        try { if (typeof lucide !== 'undefined') lucide.createIcons(); } catch (e) {}
    }

    function configurarModulo() {
        formInsumo.reset();
        if (searchInput) searchInput.value = ""; 
        if (tipoActivo === 'insumo') {
            if (wrapperMarca) wrapperMarca.style.display = 'flex';
            if (insumoUnidad) insumoUnidad.innerHTML = unidadesInsumos;
        } else {
            if (wrapperMarca) wrapperMarca.style.display = 'none'; 
            if (insumoUnidad) insumoUnidad.innerHTML = unidadesConsumibles;
        }
        paginaActual = 1;
        actualizarTablaInventario();
    }

    function configurarModuloReceta() {
        formReceta.reset();
        paginaActualReceta = 1;
        actualizarTablaReceta();
    }
    
    function evaluarFuerzaContrasena(password) {
        let puntaje = 0;
        if (!password) return { texto: 'Vacía', color: '#999', ancho: '0%' };
        if (password.length >= 6) puntaje += 1; 
        if (password.length >= 10) puntaje += 1; 
        if (/[A-Z]/.test(password)) puntaje += 1; 
        if (/[0-9]/.test(password)) puntaje += 1; 
        if (/[^A-Za-z0-9]/.test(password)) puntaje += 1; 

        if (puntaje <= 2) return { texto: 'Fácil / Débil 🔴', color: '#e74c3c', ancho: '33%' };
        if (puntaje <= 4) return { texto: 'Intermedia 🟡', color: '#f1c40f', ancho: '66%' };
        return { texto: 'Muy Compleja / Segura 🟢', color: '#2ecc71', ancho: '100%' };
    }

    function verificarCamposContrasena() {
        if (!modoRegistro) return true;

        const pass = authPassword ? authPassword.value : '';
        const confirmPass = document.getElementById('auth-confirm-password');
        const feedbackConfirm = document.getElementById('feedback-confirmacion');
        const barraFuerza = document.getElementById('barra-fuerza-progreso');
        const textoFuerza = document.getElementById('texto-fuerza');

        const evaluacion = evaluarFuerzaContrasena(pass);
        if (barraFuerza && textoFuerza) {
            barraFuerza.style.width = evaluacion.ancho;
            barraFuerza.style.backgroundColor = evaluacion.color;
            textoFuerza.textContent = `Fuerza: ${evaluacion.texto}`;
        }

        if (confirmPass && feedbackConfirm) {
            if (confirmPass.value === '') {
                feedbackConfirm.textContent = '';
                return false;
            } else if (pass === confirmPass.value) {
                feedbackConfirm.textContent = '✓ Las contraseñas coinciden';
                feedbackConfirm.style.color = '#2ecc71';
                return true;
            } else {
                feedbackConfirm.textContent = '✗ Las contraseñas no coinciden';
                feedbackConfirm.style.color = '#e74c3c';
                return false;
            }
        }
        return false;
    }

    // ==========================================
    // MÓDULO: ALMACÉN INTEGRAL
    // ==========================================
    if (formInsumo) {
        formInsumo.addEventListener('submit', async function(event) {
            event.preventDefault();
            ejecutarRegistroInsumo(
                insumoNombre.value.trim(),
                tipoActivo === 'insumo' ? (insumoMarca.value.trim() || 'S/M') : 'Genérico',
                parseFloat(insumoPrecio.value),
                parseFloat(insumoCantidad.value),
                insumoUnidad.value
            );
        });
    }

    async function ejecutarRegistroInsumo(nombre, marca, precio, cantidadOriginal, unidadOriginal) {
        let cantidadNormalizada = cantidadOriginal;
        let unidadVisual = unidadOriginal;

        if (unidadOriginal === 'kilo' || unidadOriginal === 'litro' || unidadOriginal === 'kg' || unidadOriginal === 'L') {
            cantidadNormalizada = cantidadOriginal * 1000; 
            unidadVisual = (unidadOriginal === 'kilo' || unidadOriginal === 'kg') ? 'kg' : 'L';
        } 
        else if (unidadOriginal === 'pieza' || unidadOriginal === 'pza') {
            unidadVisual = 'pza';
        } else if (unidadOriginal === 'metro' || unidadOriginal === 'm') {
            unidadVisual = 'm';
        } else if (unidadOriginal === 'paquete' || unidadOriginal === 'paq') {
            unidadVisual = 'paq';
        } else if (unidadOriginal === 'ml') {
            unidadVisual = 'ml';
        } else if (unidadOriginal === 'gr') {
            unidadVisual = 'gr';
        }

        const costoUnitario = precio / cantidadNormalizada;

        const nuevoItem = {
            id: Date.now().toString(),
            nombre, marca, precio, cantidadOriginal, unidadOriginal, unidadVisual, costoUnitario,
            tipo: tipoActivo
        };

        if (supabase && usuarioActual) {
            try {
                let { data: filaUsuario, error: fetchError } = await supabase
                    .from('usuarios_datos')
                    .select('inventario')
                    .eq('id_usuario', usuarioActual.id)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

                const inventarioPrevio = (filaUsuario && filaUsuario.inventario) ? filaUsuario.inventario : [];
                const inventarioNube = [...inventarioPrevio, nuevoItem];

                const { error: updateError } = await supabase
                    .from('usuarios_datos')
                    .upsert({ id_usuario: usuarioActual.id, inventario: inventarioNube }, { onConflict: 'id_usuario' });

                if (updateError) throw updateError;

                listaItems = inventarioNube;

                Swal.fire({
                    title: '¡Registrado!',
                    text: `"${nombre}" se guardó con éxito en NexiCloud.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

            } catch (error) {
                console.error("Error al sincronizar con Supabase:", error);
                Swal.fire('Error de sincronización', 'Se guardará solo localmente temporalmente.', 'error');
                listaItems.push(nuevoItem);
            }
        } else {
            listaItems.push(nuevoItem);
        }
        
        actualizarTablaInventario();
        actualizarSelectReceta();
        formInsumo.reset();
        if(tipoActivo === 'consumible' && wrapperMarca) wrapperMarca.style.display = 'none';
    }

    function actualizarTablaInventario() {
        if (!tablaInsumosBody) return;
        tablaInsumosBody.innerHTML = '';
        let itemsFiltrados = listaItems.filter(item => item.tipo === tipoActivo);
        
        const textoBusqueda = searchInput ? searchInput.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ""; 
        if (textoBusqueda) {
            itemsFiltrados = itemsFiltrados.filter(item => {
                const nombreItem = item.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const marcaItem = (item.marca || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                const regexBusqueda = new RegExp(`\\b${textoBusqueda}`);
                return regexBusqueda.test(nombreItem) || regexBusqueda.test(marcaItem);
            });
        }

        if (itemsFiltrados.length === 0) {
            tablaInsumosBody.innerHTML = `<td colspan="5" style="text-align: center; width: 100%;">No se encontró ningún artículo...</td>`;
            if (pagInfoTexto) pagInfoTexto.textContent = "0 de 0";
            if (btnPagPrev) btnPagPrev.disabled = true; 
            if (btnPagNext) btnPagNext.disabled = true;
            return;
        }

        const totalPaginas = Math.ceil(itemsFiltrados.length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * CONFIG.ITEMS_POR_PAGINA;
        const itemsPagina = itemsFiltrados.slice(inicio, inicio + CONFIG.ITEMS_POR_PAGINA);

        itemsPagina.forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${item.nombre}</strong> <br><small style="color:var(--text-muted)">${item.marca}</small></td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>${item.cantidadOriginal} ${item.unidadVisual}</td>
                <td class="text-center">$${item.costoUnitario.toFixed(2)}</td>
                <td class="text-right">
                    <div class="actions-cell">
                        <button type="button" class="btn-icon btn-edit-trigger" data-id="${item.id}"><i data-lucide="edit-3"></i></button>
                        <button type="button" class="btn-icon delete btn-delete-trigger" data-id="${item.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            `;
            tablaInsumosBody.appendChild(fila);
        });

        document.querySelectorAll('.btn-edit-trigger').forEach(b => b.addEventListener('click', () => abrirModalEdicion(b.getAttribute('data-id'))));
        document.querySelectorAll('.btn-delete-trigger').forEach(b => b.addEventListener('click', () => solicitarConfirmacionBorrado(b.getAttribute('data-id'))));

        if (pagInfoTexto) pagInfoTexto.textContent = `${paginaActual} de ${totalPaginas}`;
        if (btnPagPrev) btnPagPrev.disabled = paginaActual === 1;
        if (btnPagNext) btnPagNext.disabled = paginaActual === totalPaginas;
        renderizarIconosSeguro();
    }

    if (btnPagPrev) btnPagPrev.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; actualizarTablaInventario(); } });
    if (btnPagNext) btnPagNext.addEventListener('click', () => {
        const totalPaginas = Math.ceil(listaItems.filter(i => i.tipo === tipoActivo).length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActual < totalPaginas) { paginaActual++; actualizarTablaInventario(); }
    });

    function solicitarConfirmacionBorrado(id) {
        const item = listaItems.find(i => i.id === id);
        Swal.fire({
            title: '¿Eliminar del Inventario?',
            text: `Vas a remover "${item.nombre}". Esto la quitará también de las composiciones activas.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                listaItems = listaItems.filter(i => i.id !== id);
                listaReceta = listaReceta.filter(r => r.itemIdOriginal !== id);
                await subirDatosNube();
                actualizarTablaInventario();
                actualizarSelectReceta();
                actualizarTablaReceta();
                calcularFinanzas();
                Swal.fire({ title: 'Eliminado', text: 'El insumo fue removido.', icon: 'success', timer: 1500, showConfirmButton: false });
            }
        });
    }

    window.abrirModalEdicion = function(id) {
        const item = listaItems.find(i => i.id === id);
        if (!item) return;
        let opcionesSelect = item.tipo === 'insumo' ? unidadesInsumos : unidadesConsumibles;

        Swal.fire({
            title: 'Editar Elemento de Almacén',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' },
            html: `
                <div style="text-align: left; display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">NOMBRE DE ELEMENTO</label>
                    <input id="swal-nombre" class="swal2-input-custom" value="${item.nombre}">
                    ${item.tipo === 'insumo' ? `<label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">MARCA</label><input id="swal-marca" class="swal2-input-custom" value="${item.marca === 'S/M' ? '' : item.marca}">` : ''}
                    <label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">PRECIO ($)</label>
                    <input id="swal-precio" type="number" step="0.01" class="swal2-input-custom" value="${item.precio}">
                    <label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">CANTIDAD NETO</label>
                    <input id="swal-cantidad" type="number" step="0.01" class="swal2-input-custom" value="${item.cantidadOriginal}">
                    <label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">UNIDAD MEDIDA</label>
                    <select id="swal-unidad" class="swal2-input-custom" style="height:42px; background-color:#FAF9F6;">${opcionesSelect}</select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value.trim();
                const precio = parseFloat(document.getElementById('swal-precio').value);
                const cantidadOriginal = parseFloat(document.getElementById('swal-cantidad').value);
                const unidadOriginal = document.getElementById('swal-unidad').value;
                const marca = item.tipo === 'insumo' ? (document.getElementById('swal-marca').value.trim() || 'S/M') : 'Genérico';
                if (!nombre || isNaN(precio) || isNaN(cantidadOriginal)) { Swal.showValidationMessage('Por favor llena todos los campos.'); return false; }
                return { nombre, precio, cantidadOriginal, unidadOriginal, marca };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = result.value;
                let cantidadNormalizada = data.cantidadOriginal;
                let unidadVisual = data.unidadOriginal;
                if (data.unidadOriginal === 'kilo' || data.unidadOriginal === 'litro') { 
                    cantidadNormalizada = data.cantidadOriginal * 1000; 
                    unidadVisual = data.unidadOriginal === 'kilo' ? 'kg' : 'L'; 
                }
                
                const costoUnitario = data.precio / cantidadNormalizada;
                const index = listaItems.findIndex(i => i.id === id);
                if (index !== -1) {
                    listaItems[index] = { ...listaItems[index], nombre: data.nombre, marca: data.marca, precio: data.precio, cantidadOriginal: data.cantidadOriginal, unidadOriginal: data.unidadOriginal, unidadVisual, costoUnitario };
                }
                await subirDatosNube();
                actualizarTablaInventario();
                actualizarSelectReceta();
                actualizarTablaReceta();
                calcularFinanzas();
                Swal.fire({ title: 'Actualizado', text: 'Cambios guardados con éxito.', icon: 'success', timer: 1500, showConfirmButton: false });
            }
        });
    };

    if (tabInsumos) tabInsumos.addEventListener('click', () => { tipoActivo = 'insumo'; tabInsumos.classList.add('active'); if(tabConsumibles) tabConsumibles.classList.remove('active'); configurarModulo(); });
    if (tabConsumibles) tabConsumibles.addEventListener('click', () => { tipoActivo = 'consumible'; tabConsumibles.classList.add('active'); if(tabInsumos) tabInsumos.classList.remove('active'); configurarModulo(); });
    if (searchInput) searchInput.addEventListener('input', () => { paginaActual = 1; actualizarTablaInventario(); });

    // ==========================================
    // MÓDULO: COMPOSICIÓN DE RECETA
    // ==========================================
    function actualizarSelectReceta() {
        if (!selectRecetaInsumo) return;
        selectRecetaInsumo.innerHTML = '<option value="" disabled selected>Selecciona un elemento...</option>';
        listaItems.filter(item => item.tipo === tipoRecetaActivo).forEach(item => {
            const opcion = document.createElement('option');
            opcion.value = item.id;
            opcion.textContent = `${item.nombre} (${item.marca})`;
            selectRecetaInsumo.appendChild(opcion);
        });
    }

    if (formReceta) {
        formReceta.addEventListener('submit', async function(event) {
            event.preventDefault();
            const cantidadUsada = parseFloat(recetaCantidad.value);

            if (!insumoSeleccionadoPorBuscador) {
                Swal.fire('Elemento requerido', 'Por favor selecciona un artículo válido usando el buscador en tiempo real.', 'warning');
                return;
            }

            if (isNaN(cantidadUsada) || cantidadUsada <= 0) {
                Swal.fire('Cantidad inválida', 'Por favor ingresa una porción mayor a cero.', 'warning');
                return;
            }

            const nuevoIngrediente = {
                id: Date.now().toString(),
                itemIdOriginal: insumoSeleccionadoPorBuscador.id, 
                nombre: insumoSeleccionadoPorBuscador.nombre,
                gridCantidad: cantidadUsada,
                tipo: insumoSeleccionadoPorBuscador.tipo,
                isSubReceta: false,
                unidadVisual: insumoSeleccionadoPorBuscador.unidadVisual === 'kg' ? 'gr' : (insumoSeleccionadoPorBuscador.unidadVisual === 'L' ? 'ml' : insumoSeleccionadoPorBuscador.unidadVisual),
                costoProporcional: insumoSeleccionadoPorBuscador.costoUnitario * cantidadUsada
            };

            if (supabase && usuarioActual) {
                try {
                    let { data: filaUsuario, error: fetchError } = await supabase
                        .from('usuarios_datos')
                        .select('composicion_activa')
                        .eq('id_usuario', usuarioActual.id)
                        .single();

                    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

                    const recetaPrevia = (filaUsuario && filaUsuario.composicion_activa) ? filaUsuario.composicion_activa : [];
                    const recetaNube = [...recetaPrevia, nuevoIngrediente];

                    const { error: updateError } = await supabase
                        .from('usuarios_datos')
                        .upsert({ id_usuario: usuarioActual.id, composicion_activa: recetaNube }, { onConflict: 'id_usuario' });

                    if (updateError) throw updateError;

                    listaReceta = recetaNube;

                    Swal.fire({
                        title: '¡Añadido!',
                        text: `"${insumoSeleccionadoPorBuscador.nombre}" se agregó a la composición.`,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });

                } catch (error) {
                    console.error("Error al sincronizar receta con Supabase:", error);
                    Swal.fire('Error de red', 'Se guardará localmente de forma temporal.', 'error');
                    listaReceta.push(nuevoIngrediente);
                }
            } else {
                listaReceta.push(nuevoIngrediente);
            }

            formReceta.reset();
            if (inputBuscar) inputBuscar.value = '';
            insumoSeleccionadoPorBuscador = null;

            actualizarTablaReceta();
            calcularFinanzas();
        });
    }

    function actualizarTablaReceta() {
        if (!tablaRecetaBody) return;
        tablaRecetaBody.innerHTML = '';
        let recetaFiltrada = listaReceta.filter(item => item.tipo === tipoRecetaActivo);

        if (recetaFiltrada.length === 0) {
            tablaRecetaBody.innerHTML = `<td colspan="4" style="text-align: center; width: 100%;">No hay elementos en esta categoría...</td>`;
            if (pagInfoRecetaTexto) pagInfoRecetaTexto.textContent = "0 de 0";
            if (btnPagRecetaPrev) btnPagRecetaPrev.disabled = true; 
            if (btnPagRecetaNext) btnPagRecetaNext.disabled = true;
            return;
        }

        const totalPaginasReceta = Math.ceil(recetaFiltrada.length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActualReceta > totalPaginasReceta) paginaActualReceta = totalPaginasReceta;

        const inicio = (paginaActualReceta - 1) * CONFIG.ITEMS_POR_PAGINA;
        const itemsPaginaReceta = recetaFiltrada.slice(inicio, inicio + CONFIG.ITEMS_POR_PAGINA);

        itemsPaginaReceta.forEach(item => {
            const fila = document.createElement('tr');
            
            let botonesEscritorioHTML = '';
            if (item.isSubReceta) {
                botonesEscritorioHTML = `
                    <button type="button" class="btn-icon btn-view-sub" data-id="${item.id}">
                        <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                    </button>
                    <button type="button" class="btn-icon btn-edit-sub" data-id="${item.id}">
                        <i data-lucide="edit-3" style="width: 18px; height: 18px;"></i>
                    </button>
                `;
            }
            botonesEscritorioHTML += `
                <button type="button" class="btn-icon btn-remove-receta" data-id="${item.id}">
                    <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                </button>
            `;

            const botonMovilHTML = `
                <button type="button" class="btn-mobile-options" data-id="${item.id}">
                    <span>Opciones</span><i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                </button>
            `;

            fila.innerHTML = `
                <td>
                    <strong>${item.nombre}</strong> 
                    ${item.isSubReceta ? '<br><small style="color:#4A6B82; font-weight:600; font-size:10px;">[Sub-Receta]</small>' : ''}
                </td>
                <td>${item.gridCantidad} ${item.unidadVisual}</td>
                <td style="font-weight: 600;">$${item.costoProporcional.toFixed(2)}</td>
                <td class="text-right">
                    <div class="actions-cell">
                        ${botonesEscritorioHTML}
                        ${botonMovilHTML}
                    </div>
                </td>
            `;
            tablaRecetaBody.appendChild(fila);
        });

        document.querySelectorAll('.btn-remove-receta').forEach(b => b.addEventListener('click', async () => {
            const idABorrar = b.getAttribute('data-id');
            const recetaActualizada = listaReceta.filter(r => r.id !== idABorrar);

            if (supabase && usuarioActual) {
                try {
                    const { error } = await supabase
                        .from('usuarios_datos')
                        .update({ composicion_activa: recetaActualizada })
                        .eq('id_usuario', usuarioActual.id);

                    if (error) throw error;
                    listaReceta = recetaActualizada;
                } catch (e) {
                    console.error("Error al eliminar de la nube:", e);
                    listaReceta = recetaActualizada;
                }
            } else {
                listaReceta = recetaActualizada;
            }

            actualizarTablaReceta(); 
            calcularFinanzas();
        }));

        document.querySelectorAll('.btn-view-sub').forEach(b => b.addEventListener('click', () => verDetalleSubReceta(b.getAttribute('data-id'))));
        document.querySelectorAll('.btn-edit-sub').forEach(b => b.addEventListener('click', () => editarSubRecetaEnTabla(b.getAttribute('data-id'))));
        document.querySelectorAll('.btn-mobile-options').forEach(b => b.addEventListener('click', () => abrirMenuOpcionesMovil(b.getAttribute('data-id'))));

        if (pagInfoRecetaTexto) pagInfoRecetaTexto.textContent = `${paginaActualReceta} de ${totalPaginasReceta}`;
        if (btnPagRecetaPrev) btnPagRecetaPrev.disabled = paginaActualReceta === 1;
        if (btnPagRecetaNext) btnPagRecetaNext.disabled = paginaActualReceta === totalPaginasReceta;
        renderizarIconosSeguro();
    }

    if (btnPagRecetaPrev) btnPagRecetaPrev.addEventListener('click', () => { if (paginaActualReceta > 1) { paginaActualReceta--; actualizarTablaReceta(); } });
    if (btnPagRecetaNext) btnPagRecetaNext.addEventListener('click', () => {
        const totalPaginasReceta = Math.ceil(listaReceta.filter(i => i.tipo === tipoRecetaActivo).length / CONFIG.ITEMS_POR_PAGINA) || 1;
        if (paginaActualReceta < totalPaginasReceta) { paginaActualReceta++; actualizarTablaReceta(); }
    });

    if (btnVaciarAlmacen) {
        btnVaciarAlmacen.addEventListener('click', () => {
            if (listaReceta.length === 0) return;

            Swal.fire({
                title: '¿Limpiar Ficha Actual?',
                text: 'Se removerán todos los elementos del desglose de esta receta. El catálogo y el inventario general no se tocarán.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, limpiar',
                cancelButtonText: 'Cancelar',
                buttonsStyling: false,
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom' }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    listaReceta = [];
                    await subirDatosNube();
                    actualizarTablaReceta();
                    calcularFinanzas();
                }
            });
        });
    }

    if (tabRecetaInsumos) tabRecetaInsumos.addEventListener('click', () => { tipoRecetaActivo = 'insumo'; tabRecetaInsumos.classList.add('active'); if(tabRecetaConsumibles) tabRecetaConsumibles.classList.remove('active'); configurarModuloReceta(); });
    if (tabRecetaConsumibles) tabRecetaConsumibles.addEventListener('click', () => { tipoRecetaActivo = 'consumible'; tabRecetaConsumibles.classList.add('active'); if(tabRecetaInsumos) tabRecetaInsumos.classList.remove('active'); configurarModuloReceta(); });

    // ==========================================
    // SISTEMA DE SUB-RECETAS Y CATÁLOGO
    // ==========================================
    if (btnGuardarAlmacen) {
        btnGuardarAlmacen.addEventListener('click', () => {
            if (listaReceta.length === 0) {
                Swal.fire({ title: 'Ficha Vacía', text: 'Agrega ingredientes antes de intentar guardar una receta.', icon: 'warning', confirmButtonText: 'Entendido', buttonsStyling: false, customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }});
                return;
            }

            Swal.fire({
                title: 'Guardar composición como receta',
                text: 'Asigna un nombre descriptivo para tu catálogo de sub-recetas:',
                input: 'text',
                inputPlaceholder: CONFIG.ALERTAS.PLACEHOLDER_SUBRECETA,
                showCancelButton: true,
                confirmButtonText: 'Guardar Estructura',
                cancelButtonText: 'Cancelar',
                buttonsStyling: false,
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' },
                inputValidator: (value) => { if (!value) return '¡Debes escribir un nombre!'; }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const nombreReceta = result.value.trim();
                    const costoHistorico = calcularFinanzas();
                    
                    catalogoRecetas.push({
                        id: Date.now().toString(),
                        nombre: nombreReceta,
                        costoTotal: costoHistorico,
                        ingredientes: JSON.parse(JSON.stringify(listaReceta))
                    });

                    await subirDatosNube();
                    Swal.fire({ title: 'Receta Guardada', text: `"${nombreReceta}" está disponible en tu catálogo.`, icon: 'success', confirmButtonText: 'Excelente', buttonsStyling: false, customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }});
                }
            });
        });
    }

    if (btnCargarAlmacen) {
        btnCargarAlmacen.addEventListener('click', () => {
            if (catalogoRecetas.length === 0) {
                Swal.fire({ 
                    title: 'Catálogo Vacío', 
                    text: CONFIG.ALERTAS.TXT_CATALOGO_VACIO, 
                    icon: 'info', 
                    confirmButtonText: 'Entendido', 
                    buttonsStyling: false, 
                    customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
                });
                return;
            }

            let opcionesOptionsHTML = '<option value="" disabled selected>Selecciona una sub-receta...</option>';
            catalogoRecetas.forEach(receta => {
                opcionesOptionsHTML += `<option value="${receta.id}">${receta.nombre} ($${receta.costoTotal.toFixed(2)})</option>`;
            });

            Swal.fire({
                title: 'Cargar Sub-Receta',
                text: 'Selecciona la receta que deseas integrar de forma compacta en tu Ficha Técnica Actual o elimínala si ya no la ocupas:',
                html: `
                    <div class="swal-select-container">
                        <select id="select-subreceta-dinamico" class="swal-select-dropdown">
                            ${opcionesOptionsHTML}
                        </select>
                        <button type="button" id="btn-eliminar-subreceta-catalogo" class="btn-delete-catalog" title="Eliminar del catálogo permanentemente">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    </div>
                    <div class="swal-custom-buttons">
                        <button id="btn-swal-inyectar" class="btn btn-secondary" style="background-color: var(--text-color); color: white;">Inyectar a la Receta</button>
                        <button id="btn-swal-cancelar" class="btn" style="background-color: #FAF9F6; border: 1px solid #DCD4C4; color: #7A7265;">Cancelar</button>
                    </div>
                `,
                showConfirmButton: false, 
                showCancelButton: false,
                buttonsStyling: false,
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom' },
                didOpen: () => {
                    renderizarIconosSeguro();

                    const selectSub = document.getElementById('select-subreceta-dinamico');
                    const btnInyectar = document.getElementById('btn-swal-inyectar');
                    const btnCancelar = document.getElementById('btn-swal-cancelar');
                    const btnEliminarCatalogo = document.getElementById('btn-eliminar-subreceta-catalogo');

                    btnInyectar.addEventListener('click', async () => {
                        const idSeleccionado = selectSub.value;
                        if (!idSeleccionado) {
                            Swal.showValidationMessage('Por favor selecciona una receta antes de continuar.');
                            return;
                        }

                        const recetaSeleccionada = catalogoRecetas.find(r => r.id === idSeleccionado);
                        
                        const ingredientesConCostoUnitario = recetaSeleccionada.ingredientes.map(ing => {
                            const itemOriginal = listaItems.find(i => i.id === ing.itemIdOriginal);
                            const costoUnitarioFijo = itemOriginal ? itemOriginal.costoUnitario : (ing.costoProporcional / (ing.gridCantidad || 1));
                            return { ...ing, costoUnitarioBase: costoUnitarioFijo };
                        });

                        listaReceta.push({
                            id: Date.now().toString(),
                            itemIdOriginal: 'SUB_' + recetaSeleccionada.id,
                            nombre: recetaSeleccionada.nombre,
                            gridCantidad: 1,
                            tipo: 'insumo', 
                            isSubReceta: true,
                            parentCatId: recetaSeleccionada.id,
                            unidadVisual: 'pza',
                            costoProporcional: recetaSeleccionada.costoTotal,
                            ingredientesHistoricos: ingredientesConCostoUnitario
                        });

                        await subirDatosNube();
                        actualizarTablaReceta();
                        calcularFinanzas();
                        Swal.close();
                        Swal.fire({ title: 'Inyectado', text: `"${recetaSeleccionada.nombre}" se sumó al bloque de composición actual.`, icon: 'success', timer: 1500, showConfirmButton: false });
                    });

                    btnEliminarCatalogo.addEventListener('click', () => {
                        const idSeleccionado = selectSub.value;
                        if (!idSeleccionado) {
                            Swal.fire({ title: 'Atención', text: 'Selecciona qué sub-receta deseas borrar primero.', icon: 'warning', timer: 2000, showConfirmButton: false });
                            return;
                        }

                        const recetaABorrar = catalogoRecetas.find(r => r.id === idSeleccionado);

                        Swal.fire({
                            title: '¿Destruir del Catálogo?',
                            text: `Eliminarás "${recetaABorrar.nombre}" para siempre. Los desgloses guardados no se podrán recuperar.`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, borrar del sistema',
                            cancelButtonText: 'Mantener',
                            buttonsStyling: false,
                            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom' }
                        }).then(async (conf) => {
                            if (conf.isConfirmed) {
                                const catalogoActualizado = catalogoRecetas.filter(r => r.id !== idSeleccionado);

                                if (supabase && usuarioActual) {
                                    try {
                                        const { error } = await supabase
                                            .from('usuarios_datos')
                                            .update({ catalogo: catalogoActualizado })
                                            .eq('id_usuario', usuarioActual.id);

                                        if (error) throw error;
                                        catalogoRecetas = catalogoActualizado;

                                    } catch (error) {
                                        console.error("Error al eliminar del catálogo en la nube:", error);
                                        Swal.fire('Error de sincronización', 'No se pudo eliminar de NexiCloud.', 'error');
                                        return; 
                                    }
                                } else {
                                    catalogoRecetas = catalogoActualizado;
                                }

                                if (typeof configurarModuloReceta === 'function') {
                                    configurarModuloReceta(); 
                                }

                                Swal.close();
                                Swal.fire({ 
                                    title: 'Removida', 
                                    text: 'Sub-receta eliminada con éxito del catálogo histórico.', 
                                    icon: 'success', 
                                    timer: 1500, 
                                    showConfirmButton: false 
                                });
                            }
                        });
                    });

                    btnCancelar.addEventListener('click', () => { Swal.close(); });
                }
            });
        });
    }

    function verDetalleSubReceta(idInLista) {
        const item = listaReceta.find(r => r.id === idInLista);
        if (!item || !item.ingredientesHistoricos) return;

        let tablaIngredientesHTML = `
            <table style="width:100%; border-collapse: collapse; margin-top:10px; font-size:12px; text-align:left;">
                <thead>
                    <tr style="border-bottom: 2px solid #EAE6DF; color: var(--text-muted);">
                        <th style="padding: 6px;">Elemento</th>
                        <th style="padding: 6px;">Porción</th>
                        <th style="padding: 6px; text-align:right;">Costo</th>
                    </tr>
                </thead>
                <tbody>
        `;

        item.ingredientesHistoricos.forEach(ing => {
            tablaIngredientesHTML += `
                <tr style="border-bottom: 1px solid #FAF9F6;">
                    <td style="padding: 6px;"><strong>${ing.nombre}</strong></td>
                    <td style="padding: 6px;">${ing.gridCantidad} ${ing.unidadVisual}</td>
                    <td style="padding: 6px; text-align:right;">$${ing.costoProporcional.toFixed(2)}</td>
                </tr>
            `;
        });

        tablaIngredientesHTML += `</tbody></table>`;

        Swal.fire({
            title: `Desglose: ${item.nombre}`,
            html: `<div><p style="font-size:13px; color:var(--text-muted);">Esta es la estructura fija de costos guardada para este elemento:</p>${tablaIngredientesHTML}</div>`,
            confirmButtonText: 'Cerrar ventana',
            buttonsStyling: false,
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
        });
    }

    function editarSubRecetaEnTabla(idInLista) {
        const index = listaReceta.findIndex(r => r.id === idInLista);
        if (index === -1) return;
        const subReceta = listaReceta[index];

        if (!subReceta.ingredientesHistoricos || subReceta.ingredientesHistoricos.length === 0) {
            Swal.fire({ title: 'Error', text: 'Esta sub-receta no cuenta con ingredientes internos desglosables.', icon: 'error' });
            return;
        }

        let filasHTML = '';
        subReceta.ingredientesHistoricos.forEach((ing, i) => {
            const itemOriginal = listaItems.find(item => item.id === ing.itemIdOriginal);
            const costoUnitarioReal = itemOriginal ? itemOriginal.costoUnitario : (ing.costoUnitarioBase || 0);
            
            filasHTML += `
                <tr style="border-bottom: 1px solid #FAF9F6;" class="fila-swal-ingrediente" data-index="${i}" data-costo-unitario="${costoUnitarioReal}">
                    <td style="padding: 6px 0; font-size:13px;"><strong>${ing.nombre}</strong></td>
                    <td style="padding: 6px 0; text-align: center;">
                        <div style="display: inline-flex; align-items: center; gap: 4px;">
                            <input type="number" step="any" class="swal-input-porcion" value="${ing.gridCantidad}" 
                                   style="width: 75px; text-align: center; padding: 4px; border: 1px solid #CCC; border-radius: 4px; font-size:12px; font-weight: bold;">
                            <span style="font-size:11px; color:var(--text-muted); width:25px; text-align:left;">${ing.unidadVisual}</span>
                        </div>
                    </td>
                    <td style="padding: 6px 0; text-align: right; font-size:13px; font-weight: 600;" class="swal-costo-dinamico">
                        $${ing.costoProporcional.toFixed(2)}
                    </td>
                </tr>
            `;
        });

        Swal.fire({
            title: 'Modificar Cantidades de Sub-Receta',
            html: `
                <div style="text-align: left; display: flex; flex-direction: column; gap: 10px; width: 100%;">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:10px; color:var(--text-muted); font-weight:600; letter-spacing:0.5px;">NOMBRE DE ESTA INSTANCIA</label>
                        <input id="swal-sub-nombre-edit" class="swal2-input-custom" value="${subReceta.nombre}" style="margin-bottom:10px;">
                    </div>
                    
                    <p style="font-size:12px; color:var(--text-muted); margin: 0;">Modifica las proporciones de los insumos. El costo total se actualizará automáticamente:</p>
                    
                    <table style="width:100%; border-collapse: collapse; margin-top:5px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #EAE6DF; color: var(--text-muted); font-size:11px; text-align:left;">
                                <th style="padding: 4px 0;">ELEMENTO</th>
                                <th style="padding: 4px 0; text-align:center; width:120px;">PORCIÓN</th>
                                <th style="padding: 4px 0; text-align:right; width:70px;">COSTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasHTML}
                        </tbody>
                    </table>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #EAE6DF;">
                        <span style="font-weight: bold; font-size: 14px;">NUEVO COSTO TOTAL:</span>
                        <span id="swal-sub-total-acumulado" style="font-weight: 800; font-size: 18px; color: var(--accent-color); font-family: sans-serif;">
                            $${subReceta.costoProporcional.toFixed(2)}
                        </span>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Actualizar Ficha',
            cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' },
            didOpen: () => {
                const recalcularCostosModal = () => {
                    let acumuladoSuma = 0;
                    const filas = document.querySelectorAll('.fila-swal-ingrediente');
                    
                    filas.forEach(fila => {
                        const costoUnitario = parseFloat(fila.getAttribute('data-costo-unitario')) || 0;
                        const inputPorcion = fila.querySelector('.swal-input-porcion');
                        const nuevaCantidad = parseFloat(inputPorcion.value) || 0;
                        
                        const nuevoCostoProporcional = nuevaCantidad * costoUnitario;
                        acumuladoSuma += nuevoCostoProporcional;
                        
                        fila.querySelector('.swal-costo-dinamico').textContent = `$${nuevoCostoProporcional.toFixed(2)}`;
                    });
                    
                    const elAcumulado = document.getElementById('swal-sub-total-acumulado');
                    if (elAcumulado) elAcumulado.textContent = `$${acumuladoSuma.toFixed(2)}`;
                };

                document.querySelectorAll('.swal-input-porcion').forEach(input => {
                    input.addEventListener('input', recalcularCostosModal);
                });
            },
            preConfirm: () => {
                const nuevoNombreReceta = document.getElementById('swal-sub-nombre-edit').value.trim();
                if (!nuevoNombreReceta) { Swal.showValidationMessage('La receta debe conservar un nombre.'); return false; }

                let nuevoCostoTotalSub = 0;
                const nuevosIngredientesActualizados = subReceta.ingredientesHistoricos.map((ing, index) => {
                    const fila = document.querySelector(`.fila-swal-ingrediente[data-index="${index}"]`);
                    const nuevaCantidad = parseFloat(fila.querySelector('.swal-input-porcion').value) || 0;
                    const costoUnitario = parseFloat(fila.getAttribute('data-costo-unitario')) || 0;
                    const nuevoCostoProp = nuevaCantidad * costoUnitario;
                    
                    nuevoCostoTotalSub += nuevoCostoProp;

                    return { ...ing, gridCantidad: nuevaCantidad, costoProporcional: nuevoCostoProp };
                });

                return { nombre: nuevoNombreReceta, ingredientes: nuevosIngredientesActualizados, costoTotal: nuevoCostoTotalSub };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                listaReceta[index].nombre = result.value.nombre;
                listaReceta[index].ingredientesHistoricos = result.value.ingredientes;
                listaReceta[index].costoProporcional = result.value.costoTotal;
                
                await subirDatosNube();
                actualizarTablaReceta();
                calcularFinanzas();
                Swal.fire({ title: 'Recalculado', text: 'La sub-receta mutó y actualizó los costos de producción.', icon: 'success', timer: 1500, showConfirmButton: false });
            }
        });
    }

    // ==========================================
    // INTERFAZ RESPONSIVE (MÓVIL)
    // ==========================================
    function abrirMenuOpcionesMovil(idElemento) {
        const item = listaReceta.find(r => r.id === idElemento);
        if (!item) return;

        let botonesMenuHTML = '';
        if (item.isSubReceta) {
            botonesMenuHTML += `
                <button id="menu-movil-ver" class="swal2-mobile-menu-btn">Ver estructura desglosada</button>
                <button id="menu-movil-editar" class="swal2-mobile-menu-btn">Modificar cantidades/gramos</button>
            `;
        }

        botonesMenuHTML += `<button id="menu-movil-eliminar" class="swal2-mobile-menu-btn delete">Eliminar de la receta</button>`;

        Swal.fire({
            title: item.nombre,
            text: '¿Qué ajuste deseas realizar en este insumo?',
            html: `<div style="margin-top: 15px;">${botonesMenuHTML}</div>`,
            showConfirmButton: false, 
            showCancelButton: true,
            cancelButtonText: 'Cerrar opciones',
            buttonsStyling: false,
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', cancelButton: 'swal2-cancel-custom' },
            didOpen: () => {
                const btnVer = document.getElementById('menu-movil-ver');
                if (btnVer) {
                    btnVer.addEventListener('click', () => { Swal.close(); verDetalleSubReceta(idElemento); });
                }

                const btnEditar = document.getElementById('menu-movil-editar');
                if (btnEditar) {
                    btnEditar.addEventListener('click', () => { Swal.close(); editarSubRecetaEnTabla(idElemento); });
                }

                document.getElementById('menu-movil-eliminar').addEventListener('click', async () => {
                    Swal.close();
                    listaReceta = listaReceta.filter(r => r.id !== idElemento);
                    await subirDatosNube();
                    actualizarTablaReceta();
                    calcularFinanzas();
                });
            }
        });
    }

    // ==========================================
    // CÁLCULOS FINANCIEROS Y RENDIMIENTO
    // ==========================================
    function calcularFinanzas() {
        let costoProduccion = listaReceta.reduce((sum, item) => sum + (item.costoProporcional || 0), 0);
        let costoProduccionConMerma = costoProduccion * (1 + CONFIG.PORCENTAJE_MERMA);

        const formatMoneda = (val) => {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2
            }).format(val || 0);
        };

        if (totalProduccionSpan) {
            totalProduccionSpan.textContent = formatMoneda(costoProduccion);
        }

        const diffActual = parametrosComerciales.dificultad || 'facil';
        let horasAsignadas = 1.5; 
        if (diffActual === "intermedio") horasAsignadas = 3.5;
        if (diffActual === "complejo") horasAsignadas = 6.0;

        let totalManoObra = horasAsignadas * (parametrosComerciales.manoObraPorHora || 0);

        const vehiculoActual = parametrosComerciales.tipoVehiculo || 'sedan';
        let rendimientoKmL = 12; 
        switch (vehiculoActual) {
            case 'moto': rendimientoKmL = 30; break;
            case 'chico': rendimientoKmL = 15; break;
            case 'sedan': rendimientoKmL = 12; break;
            case 'camioneta': rendimientoKmL = 8; break;
        }

        let distanciaTotalRuta = (parametrosComerciales.distanciaIdaKm || 0) * 2;
        let litrosConsumidos = distanciaTotalRuta > 0 ? (distanciaTotalRuta / rendimientoKmL) : 0;
        let totalCostoEnvio = litrosConsumidos * (parametrosComerciales.costoLitroGasolina || 0);

        let totalCostosIndirectosOperativos = totalManoObra + totalCostoEnvio;
        let costoOperativoGlobal = costoProduccionConMerma + totalCostosIndirectosOperativos;
        let costoTotalRealConServicios = costoOperativoGlobal * (1 + CONFIG.PORCENTAJE_GASTOS_FIJOS);

        let margenConfigurado = parametrosComerciales.margenUtilidad !== undefined ? parametrosComerciales.margenUtilidad : CONFIG.MARGEN_UTILIDAD_DEFAULT;
        let factorUtilidad = 1 + (margenConfigurado / 100);
        let precioSugeridoPastel = costoTotalRealConServicios * factorUtilidad;

        let totalPorciones = Math.max(1, parametrosComerciales.porcionesPastel || 12);
        let costoPorRebanada = costoTotalRealConServicios / totalPorciones;
        let pvpMinimoRebanada = precioSugeridoPastel / totalPorciones;

        const elIndirectos = document.getElementById('res-costos-indirectos');
        const elSugerido = document.getElementById('res-precio-sugerido');
        const elCostoReb = document.getElementById('res-costo-rebanada');
        const elPvpReb = document.getElementById('res-pvp-rebanada');

        let bolsaCostosIndirectosTotales = totalCostosIndirectosOperativos + (costoOperativoGlobal * CONFIG.PORCENTAJE_GASTOS_FIJOS) + (costoProduccion * CONFIG.PORCENTAJE_MERMA);

        if (elIndirectos) elIndirectos.textContent = formatMoneda(bolsaCostosIndirectosTotales);
        if (elSugerido) elSugerido.textContent = formatMoneda(precioSugeridoPastel);
        if (elCostoReb) elCostoReb.textContent = formatMoneda(costoPorRebanada);
        if (elPvpReb) elPvpReb.textContent = formatMoneda(pvpMinimoRebanada);
        
        return costoProduccion; 
    }

    if (btnConfigurarProyeccion) {
        btnConfigurarProyeccion.addEventListener('click', () => {
            const diffActual = parametrosComerciales.dificultad || 'facil';
            const vehiculoActual = parametrosComerciales.tipoVehiculo || 'sedan';

            const valManoObra = (parametrosComerciales.manoObraPorHora && parametrosComerciales.manoObraPorHora !== 0) ? parametrosComerciales.manoObraPorHora : '';
            const valDistancia = (parametrosComerciales.distanciaIdaKm && parametrosComerciales.distanciaIdaKm !== 0) ? parametrosComerciales.distanciaIdaKm : '';
            const valGasolina = (parametrosComerciales.costoLitroGasolina && parametrosComerciales.costoLitroGasolina !== 0) ? parametrosComerciales.costoLitroGasolina : '';
            const valRebanadas = (parametrosComerciales.porcionesPastel && parametrosComerciales.porcionesPastel !== 0) ? parametrosComerciales.porcionesPastel : '';

            Swal.fire({
                title: 'Parámetros Comerciales',
                html: `
                    <div class="swal-form-group" style="margin-bottom: 15px; text-align: left;">
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">NIVEL DE DIFICULTAD (AUTOCALCULA HORAS)</label>
                        <select id="swal-diff" class="swal-custom-input" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; font-size: 15px;">
                            <option value="facil" ${diffActual === 'facil' ? 'selected' : ''}>Fácil / Básico (1.5 hrs)</option>
                            <option value="intermedio" ${diffActual === 'intermedio' ? 'selected' : ''}>Intermedio / Detallado (3.5 hrs)</option>
                            <option value="complejo" ${diffActual === 'complejo' ? 'selected' : ''}>Complejo / Alta Costura (6.0 hrs)</option>
                        </select>
                    </div>
                    <div class="swal-form-group" style="margin-bottom: 15px; text-align: left;">
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">PAGO MANO DE OBRA ($ POR HORA)</label>
                        <input type="number" id="swal-mo-hora" class="swal-custom-input" value="${valManoObra}" placeholder="Ej. 50" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; font-size: 15px;">
                    </div>
                    <div class="row" style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <div class="col-6" style="flex: 1; text-align: left;">
                            <div class="swal-form-group">
                                <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">RUTA MAPS (SOLO IDA KM)</label>
                                <input type="number" id="swal-maps-ida" class="swal-custom-input" value="${valDistancia}" placeholder="Ej. 8" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; font-size: 15px;">
                            </div>
                        </div>
                        <div class="col-6" style="flex: 1; text-align: left;">
                            <div class="swal-form-group">
                                <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">PRECIO GASOLINA ($/L)</label>
                                <input type="number" id="swal-gas-litro" class="swal-custom-input" value="${valGasolina}" placeholder="Ej. 24" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; font-size: 15px;">
                            </div>
                        </div>
                    </div>
                    <div class="swal-form-group" style="margin-bottom: 15px; text-align: left;">
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">UNIDAD MÓVIL DE REPARTO</label>
                        <select id="swal-vehiculo" class="swal-custom-input" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; font-size: 15px;">
                            <option value="moto" ${vehiculoActual === 'moto' ? 'selected' : ''}>Motocicleta (30 km/L)</option>
                            <option value="chico" ${vehiculoActual === 'chico' ? 'selected' : ''}>Auto Chico / Hatchback (15 km/L)</option>
                            <option value="sedan" ${vehiculoActual === 'sedan' ? 'selected' : ''}>Auto Sedán (12 km/L)</option>
                            <option value="camioneta" ${vehiculoActual === 'camioneta' ? 'selected' : ''}>Camioneta / SUV (8 km/L)</option>
                        </select>
                    </div>
                    <div class="swal-form-group" style="margin-bottom: 15px; text-align: left;">
                        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #555;">N° REBANADAS</label>
                        <input type="number" id="swal-porciones" min="1" class="swal-custom-input" value="${valRebanadas}" placeholder="Ej. 12" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; font-size: 15px;">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Aplicar Cambios',
                cancelButtonText: 'Cerrar',
                buttonsStyling: false,
                customClass: {
                    popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom'
                },
                preConfirm: () => {
                    const porcionesInput = parseInt(document.getElementById('swal-porciones').value);
                    if (!porcionesInput || porcionesInput < 1) {
                        Swal.showValidationMessage('El número de rebanadas/porciones debe ser como mínimo 1.');
                        return false;
                    }
                    return {
                        dificultad: document.getElementById('swal-diff').value,
                        manoObraPorHora: parseFloat(document.getElementById('swal-mo-hora').value) || 0,
                        distanciaIdaKm: parseFloat(document.getElementById('swal-maps-ida').value) || 0,
                        costoLitroGasolina: parseFloat(document.getElementById('swal-gas-litro').value) || 0,
                        tipoVehiculo: document.getElementById('swal-vehiculo').value,
                        porcionesPastel: porcionesInput,
                        margenUtilidad: parametrosComerciales.margenUtilidad || CONFIG.MARGEN_UTILIDAD_DEFAULT 
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    parametrosComerciales = result.value;
                    await subirDatosNube();
                    calcularFinanzas();
                }
            });
        });
    }

    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', async function() {
            await subirDatosNube();
            if (mensajeExito) {
                mensajeExito.classList.add('show');
                setTimeout(() => { mensajeExito.classList.remove('show'); }, 4000);
            }
        });
    }

    // ==========================================
    // MODAL: GUÍA DE AYUDA PREMIUM
    // ==========================================
    if (btnAyudaUsuario) {
        btnAyudaUsuario.addEventListener('click', () => {
            Swal.fire({
                title: 'Manual de Uso y Costeo',
                html: CONFIG.MANUAL_AYUDA,
                confirmButtonText: 'Entendido, volver a hornear',
                buttonsStyling: false,
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
            });
        });
    }

    // ==========================================
    // INICIALIZACIÓN DE MOTORES & EVENTOS AUTH
    // ==========================================
    if (btnTogglePassword && authPassword) {
        btnTogglePassword.addEventListener('click', () => {
            const esPassword = authPassword.getAttribute('type') === 'password';
            authPassword.setAttribute('type', esPassword ? 'text' : 'password');
            if (esPassword) {
                btnTogglePassword.innerHTML = `<i data-lucide="eye-off" style="width: 18px; height: 18px; stroke-width: 1.75;"></i>`;
            } else {
                btnTogglePassword.innerHTML = `<i data-lucide="eye" style="width: 18px; height: 18px; stroke-width: 1.75;"></i>`;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    const inputConfirmar = document.getElementById('auth-confirm-password');
    const contenedorConfirmar = document.getElementById('group-auth-confirmar');
    const contenedorMedidor = document.getElementById('group-auth-medidor');

    if (authPassword) authPassword.addEventListener('input', verificarCamposContrasena);
    if (inputConfirmar) inputConfirmar.addEventListener('input', verificarCamposContrasena);

    if (btnAuthSwitch) {
        btnAuthSwitch.addEventListener('click', () => {
            setTimeout(() => {
                if (modoRegistro) {
                    if (contenedorConfirmar) contenedorConfirmar.classList.remove('hidden');
                    if (contenedorMedidor) contenedorMedidor.classList.remove('hidden');
                    if (inputConfirmar) inputConfirmar.setAttribute('required', 'required');
                } else {
                    if (contenedorConfirmar) contenedorConfirmar.classList.add('hidden');
                    if (contenedorMedidor) contenedorMedidor.classList.add('hidden');
                    if (inputConfirmar) {
                        inputConfirmar.removeAttribute('required');
                        inputConfirmar.value = '';
                    }
                    const feedbackConfirm = document.getElementById('feedback-confirmacion');
                    if (feedbackConfirm) feedbackConfirm.textContent = '';
                }
                verificarCamposContrasena();
            }, 50);
        });
    }

    const btnToggleConfirm = document.getElementById('btn-toggle-confirm-password');
    if (btnToggleConfirm && inputConfirmar) {
        btnToggleConfirm.addEventListener('click', () => {
            if (inputConfirmar.type === 'password') {
                inputConfirmar.type = 'text';
                btnToggleConfirm.innerHTML = `<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>`;
            } else {
                inputConfirmar.type = 'password';
                btnToggleConfirm.innerHTML = `<i data-lucide="eye" style="width: 18px; height: 18px;"></i>`;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

// ==========================================
// BOTÓN DE CIERRE EXPLÍCITO (CORREGIDO)
// ==========================================
const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
if (btnCerrarSesion && supabase) {
    btnCerrarSesion.addEventListener('click', () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Se ocultará tu panel de repostería hasta que vuelvas a ingresar.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            customClass: {
                popup: 'swal2-popup-custom', title: 'swal2-title-custom', actions: 'swal2-actions-custom', confirmButton: 'swal2-deny-custom', cancelButton: 'swal2-cancel-custom'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    Swal.fire('Error', 'No se pudo cerrar la sesión correctamente.', 'error');
                } else {
                    // ¡Adiós a localStorage.clear()! 
                    // Si tienes variables de estado locales que limpiar del Storage, hazlo uno por uno:
                    // localStorage.removeItem('tus_variables_locales'); 
                    
                    Swal.fire({ 
                        title: 'Sesión Finalizada 🌟', 
                        text: 'Tus recetas y costos quedan resguardados de forma segura. ¡Vuelve pronto a NEXI Pastelería!', 
                        icon: 'success', 
                        timer: 2500, 
                        showConfirmButton: false 
                    });
                }
            }
        });
    });
}

    // ==========================================
    // MANEJO INTERACTIVO DEL BANNER Y CAPA DE BLOQUEO
    // ==========================================
    function actualizarBannerJapandi(esPremium) {
        const banner = document.getElementById('status-banner');
        const mensaje = document.getElementById('banner-message');
        const capaBloqueo = document.getElementById('bloqueo-premium-overlay');
        
        if (!banner || !mensaje) return;

        if (esPremium) {
            banner.className = 'japandi-banner premium';
            mensaje.innerHTML = CONFIG.ALERTAS.BANNER_PREMIUM;
            if (capaBloqueo) {
                capaBloqueo.style.display = 'none';
            }
        } else {
            banner.className = 'japandi-banner basico';
            mensaje.innerHTML = CONFIG.ALERTAS.BANNER_BASICO;
            if (capaBloqueo) {
                capaBloqueo.style.display = 'flex';
            }
        }
    }
    
    // ==========================================
    // NUEVO MOTOR INTERACTIVO DE VOZ GUIADO PASO A PASO (OPTIMIZADO RAPIDEZ)
    // ==========================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let reconocimientoVoz;
    let asistenteVozActivo = false;
    let pasoVozActual = 0; 
    
    const pasosVoz = ["nombre", "marca", "precio", "cantidad"];
    const datosVozInsumo = { nombre: "", marca: "", precio: 0, cantidad: 0, unidad: "gr" };

    function hablarSistema(texto, callback) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); 
        const enunciado = new SpeechSynthesisUtterance(texto);
        enunciado.lang = 'es-MX';
        enunciado.rate = 1.1; 
        
        enunciado.onend = () => { 
            setTimeout(() => { if (callback) callback(); }, 300); 
        };
        window.speechSynthesis.speak(enunciado); 
    }

    if (SpeechRecognition) {
        reconocimientoVoz = new SpeechRecognition();
        reconocimientoVoz.lang = 'es-MX';
        reconocimientoVoz.continuous = false; 
        reconocimientoVoz.interimResults = false;

                reconocimientoVoz.onresult = function(event) {
            const resultadoTexto = event.results[0][0].transcript.trim().toLowerCase();
            
            // Si el asistente de la RECETA es el que está activo:
            if (asistenteRecetaActivo) {
                console.log("Asistente Receta - Capturado:", resultadoTexto);
                procesarPasoRecetaVoz(resultadoTexto);
                return;
            }

            // Si no, corre el asistente del ALMACÉN (Tu código anterior)
            if (asistenteVozActivo) {
                console.log(`Asistente Almacén - Capturado paso [${pasosVoz[pasoVozActual]}]:`, resultadoTexto);
                procesarEntradaPasoVoz(resultadoTexto);
            }
        };

        reconocimientoVoz.onend = function() {
            if (asistenteVozActivo) {
                console.log("Micrófono en espera...");
            }
        };

        reconocimientoVoz.onerror = function(event) {
            console.error("Error detectado:", event.error);
            if (event.error === 'no-speech' && asistenteVozActivo) {
                hablarSistema("No te escuché, intenta de nuevo.", () => {
                    try { reconocimientoVoz.start(); } catch(e) {}
                });
            } else if (asistenteVozActivo) {
                hablarSistema("Hubo un error, repite por favor.", () => {
                    try { reconocimientoVoz.start(); } catch(e) {}
                });
            }
        };

        const btnVozElement = document.getElementById('btn-voz-almacen');
        if (btnVozElement) {
            btnVozElement.addEventListener('click', toggleAsistenteVozGuiado);
        }
    } else {
        const btnVoz = document.getElementById('btn-voz-almacen');
        if (btnVoz) btnVoz.style.display = 'none';
    }

    function toggleAsistenteVozGuiado() {
        if (!asistenteVozActivo) {
            asistenteVozActivo = true;
            pasoVozActual = 0;
            const btn = document.getElementById('btn-voz-almacen');
            if (btn) {
                btn.innerHTML = "🛑 Detener Asistente";
                btn.style.backgroundColor = "#dc3545";
            }
            ejecutarSiguientePreguntaVoz();
        } else {
            finalizarAsistenteVoz(false);
        }
    }

    function ejecutarSiguientePreguntaVoz() {
        if (!asistenteVozActivo) return;

        let preguntaTexto = "";
        switch(pasosVoz[pasoVozActual]) {
            case "nombre": preguntaTexto = "Nombre del Artículo"; break;
            case "marca": preguntaTexto = "Marca"; break;
            case "precio": preguntaTexto = "Precio"; break;
            case "cantidad": preguntaTexto = "Cantidad"; break;
        }

        hablarSistema(preguntaTexto, () => {
            if (asistenteVozActivo) {
                try { reconocimientoVoz.start(); } catch(e) { console.log(e); }
            }
        });
    }

    function procesarEntradaPasoVoz(texto) {
        let textoLimpio = texto.replace(/\bun\b|\buna\b/g, "1")
                               .replace(/\bdos\b/g, "2")
                               .replace(/\btres\b/g, "3")
                               .replace(/ pesos/g, "").trim();

        const pasoActual = pasosVoz[pasoVozActual];

        switch(pasoActual) {
            case "nombre":
                if (texto.length > 2) {
                    datosVozInsumo.nombre = texto.charAt(0).toUpperCase() + texto.slice(1);
                    pasoVozActual++;
                } else {
                    hablarSistema("No te entendí. ¿Cuál es el nombre del insumo?", () => { reconocimientoVoz.start(); });
                    return;
                }
                break;

            case "marca":
                if (textoLimpio.includes("no tiene") || textoLimpio.includes("generico") || textoLimpio.includes("sin marca")) {
                    datosVozInsumo.marca = "Genérico";
                } else {
                    datosVozInsumo.marca = texto.charAt(0).toUpperCase() + texto.slice(1);
                }
                pasoVozActual++;
                break;

            case "precio":
                let precioDetectado = parseFloat(textoLimpio.match(/\d+(?:\.\d+)?/));
                if (!isNaN(precioDetectado)) {
                    datosVozInsumo.precio = precioDetectado;
                    pasoVozActual++;
                } else {
                    hablarSistema("No pude identificar el precio. Por favor, dime solo el número.", () => { reconocimientoVoz.start(); });
                    return;
                }
                break;

                        case "cantidad":
                // 1. Normalizamos lo que el navegador escucha (ej. "1 punto 30 kilos" o "1 coma 5 kg")
                let cantidadLimpia = textoLimpio
                    .replace(/ y medio/g, ".5")
                    .replace(/ medio/g, "0.5")
                    .replace(/ con /g, ".")
                    .replace(/ punto /g, ".")
                    .replace(/ coma /g, ".")
                    .replace(/,/g, "."); // Por si el navegador devuelve la coma decimal natural

                // 2. Regex mejorada para capturar números enteros o decimales con su unidad
                let infoExtraida = cantidadLimpia.match(/(\d+(?:\.\d+)?)\s*(gramos?|gr|kilos?|kg|litros?|l|mililitros?|ml|piezas?|pza|metros?|m|paquetes?|paq)/);
                
                if (infoExtraida) {
                    // Convertimos explícitamente a Float para conservar los decimales (ej. 1.30)
                    datosVozInsumo.cantidad = parseFloat(infoExtraida[1]); 
                    const unidadRaw = infoExtraida[2];
                    
                    if (unidadRaw.includes("kg") || unidadRaw.includes("kilo")) datosVozInsumo.unidad = "kilo";
                    else if (unidadRaw.includes("litro") || unidadRaw === "l") datosVozInsumo.unidad = "litro";
                    else if (unidadRaw.includes("ml")) datosVozInsumo.unidad = "ml";
                    else if (unidadRaw.includes("pza") || unidadRaw.includes("pieza")) datosVozInsumo.unidad = "pieza";
                    else datosVozInsumo.unidad = "gr";
                    
                    pasoVozActual++;
                } else {
                    hablarSistema("No entendí la cantidad o unidad. Di por ejemplo, 1 punto 30 kilos.", () => { reconocimientoVoz.start(); });
                    return;
                }
                break;

        }

        if (pasoVozActual < pasosVoz.length) {
            ejecutarSiguientePreguntaVoz();
        } else {
            completarFlujoRegistroVoz();
        }
    }

    async function completarFlujoRegistroVoz() {
        asistenteVozActivo = false;
        restaurarBotonVoz();

        await ejecutarRegistroInsumo(
            datosVozInsumo.nombre,
            datosVozInsumo.marca,
            datosVozInsumo.precio,
            datosVozInsumo.cantidad,
            datosVozInsumo.unidad
        );
    }

    function finalizarAsistenteVoz(completado = false) {
        asistenteVozActivo = false;
        try { reconocimientoVoz.stop(); } catch(e){}
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        restaurarBotonVoz();
    }

    function restaurarBotonVoz() {
        const btn = document.getElementById('btn-voz-almacen');
        if (btn) {
            btn.removeAttribute("disabled"); 
            btn.disabled = false; 
            btn.style.backgroundColor = "#7c7267"; 
            btn.style.color = "#ffffff"; 
            btn.innerHTML = "🎙️ Dictar Insumo"; 
        }
    }
    
    let asistenteRecetaActivo = false;
let pasoRecetaActual = 0;
const pasosReceta = ["nombreInsumo", "cantidadInsumo"];
const datosVozReceta = { nombre: "", cantidad: 0 };

    // =========================================================================
    // MOTOR DE VOZ PARA COMPOSICIÓN DE RECETA (NUEVO)
    // =========================================================================
    function toggleAsistenteReceta() {
        if (!asistenteRecetaActivo) {
            asistenteRecetaActivo = true;
            pasoRecetaActual = 0;
            datosVozReceta.nombre = "";
            datosVozReceta.cantidad = 0;
            
            const btn = document.getElementById('btn-voz-receta');
            if (btn) {
                btn.innerHTML = "🛑 Detener Dictado";
                btn.style.backgroundColor = "#dc3545";
            }
            ejecutarPreguntaRecetaVoz();
        } else {
            finalizarAsistenteReceta();
        }
    }

    function ejecutarPreguntaRecetaVoz() {
        if (!asistenteRecetaActivo) return;

        let preguntaTexto = "";
        if (pasosReceta[pasoRecetaActual] === "nombreInsumo") {
            preguntaTexto = "Nombre"; // Corto y rápido
        } else if (pasosReceta[pasoRecetaActual] === "cantidadInsumo") {
            preguntaTexto = "Cantidad"; // Al grano
        }

        hablarSistema(preguntaTexto, () => {
            if (asistenteRecetaActivo) {
                try { reconocimientoVoz.start(); } catch(e) { console.log(e); }
            }
        });
    }
    
    // Modificamos el comportamiento de captura cuando este asistente esté activo
    // Para lograrlo, interceptaremos el "onresult" existente o lo adaptamos:

    function procesarPasoRecetaVoz(texto) {
        let pasoActual = pasosReceta[pasoRecetaActual];

        if (pasoActual === "nombreInsumo") {
            const termino = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const itemEncontrado = listaItems.find(item => 
                item.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termino)
            );

            if (itemEncontrado) {
                datosVozReceta.nombre = itemEncontrado.nombre;
                insumoSeleccionadoPorBuscador = itemEncontrado; 
                
                if (inputBuscar) {
                    inputBuscar.value = itemEncontrado.nombre + (itemEncontrado.marca !== 'Genérico' ? ` (${itemEncontrado.marca})` : '');
                }
                
                pasoRecetaActual++;
                ejecutarPreguntaRecetaVoz(); // Pasa inmediatamente a pedir la "Cantidad"
            } else {
                // Si falla, da un aviso ultra corto y vuelve a escuchar el nombre rápido
                hablarSistema("No existe", () => {
                    try { reconocimientoVoz.start(); } catch(e) {}
                });
            }
        } 
                else if (pasoActual === "cantidadInsumo") {
            // 1. Normalizamos el texto del número
            let cantidadLimpia = texto
                .replace(/\bun\b|\buna\b/g, "1")
                .replace(/ y medio/g, ".5")
                .replace(/ medio/g, "0.5")
                .replace(/ con /g, ".")
                .replace(/ punto /g, ".")
                .replace(/ coma /g, ".")
                .replace(/,/g, ".");

            // 2. Extraemos el número flotante
            let numeroDetectado = parseFloat(cantidadLimpia.match(/\d+(?:\.\d+)?/));

            if (!isNaN(numeroDetectado)) {
                // 3. ¡CONVERSIÓN INTELIGENTE!: Si el usuario menciona unidades grandes, multiplicamos por 1000
                if (cantidadLimpia.includes("kilo") || cantidadLimpia.includes("kg") || 
                    cantidadLimpia.includes("litro") || cantidadLimpia.match(/\bl\b/)) {
                    
                    numeroDetectado = numeroDetectado * 1000; // 1.1 litros -> 1100 ml
                }

                datosVozReceta.cantidad = numeroDetectado;
                
                // Asignamos el valor final convertido al input de la interfaz
                if (recetaCantidad) recetaCantidad.value = numeroDetectado;
                
                completarFlujoRecetaVoz(); // Sube directo a Supabase
            } else {
                hablarSistema("Repite número", () => {
                    try { reconocimientoVoz.start(); } catch(e) {}
                });
            }
        }
    }
    
    function completarFlujoRecetaVoz() {
        asistenteRecetaActivo = false;
        restaurarBotonRecetaVoz();

        // Disparamos un submit simulado al formulario de tu receta para que use tu lógica Supabase existente
        if (formReceta) {
            formReceta.dispatchEvent(new Event('submit'));
        }
    }

    function finalizarAsistenteReceta() {
        asistenteRecetaActivo = false;
        try { reconocimientoVoz.stop(); } catch(e){}
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        restaurarBotonRecetaVoz();
    }

    function restaurarBotonRecetaVoz() {
        const btn = document.getElementById('btn-voz-receta');
        if (btn) {
            btn.style.backgroundColor = "#7c7267";
            btn.innerHTML = "🎙️ Dictar a la Receta";
        }
    }

    const btnVozRecetaElement = document.getElementById('btn-voz-receta');
    if (btnVozRecetaElement && SpeechRecognition) {
        btnVozRecetaElement.addEventListener('click', toggleAsistenteReceta);
    }


});
