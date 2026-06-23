# 🎂 NEXI Repostería — Cotizador Inteligente

¡Bienvenido al cotizador web de **NEXI Repostería**! Esta aplicación está diseñada especialmente para optimizar, agilizar y automatizar el cálculo de costos en la producción de pasteles y postres en el taller, reduciendo drásticamente el uso del teclado gracias al dictado por voz.

---

## ✨ Características Principales

*   **🎙️ Asistente de Dictado por Voz Interactivo:** Diseñado para entornos de cocina. Permite registrar insumos y armar recetas completas con manos libres usando comandos de voz ultra rápidos ("Nombre" -> "Cantidad").
*   **⚖️ Conversor Inteligente de Unidades:** El motor de voz detecta automáticamente si mencionas unidades de medida mayores como *Kilos* o *Litros* y realiza la conversión matemática instantánea al formato base de la receta (gramos/mililitros).
*   **📂 Gestión de Insumos y Almacén:** Registro detallado de ingredientes, marcas y precios.
*   **🧮 Composición y Costeo en Tiempo Real:** Visualización interactiva del desglose de porciones, costos operativos y cálculo automático del **Costo Total de Producción**.
*   **☁️ Conexión en la Nube:** Integración fluida con base de datos en tiempo real para mantener el inventario siempre al día.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** HTML5, CSS3 (Diseño responsivo optimizado para móviles) y JavaScript (Vanilla JS).
*   **Reconocimiento de Voz:** Web Speech API (`SpeechRecognition` y `SpeechSynthesis`).
*   **Despliegue:** Vercel para hosting continuo.

---

## 👩‍🍳 Cómo Utilizar el Asistente de Voz

1.  Haz clic en el botón **🎙️ Dictar a la Receta** en el Bloque 02.
2.  El sistema te pedirá el **"Nombre"**; pronuncia el ingrediente (ej: *"Harina"* o *"Leche"*). El sistema lo buscará y seleccionará automáticamente.
3.  A la señal de **"Cantidad"**, dicta la porción deseada. Puedes usar decimales completos como *"1 punto 30 kilos"* o *"500 gramos"*. 
4.  El sistema calculará el costo de la porción y lo inyectará directamente en la tabla de la receta sin pasos adicionales.

---
*Desarrollado con ❤️ para el control preciso y eficiente de la repostería artesanal.*
