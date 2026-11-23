/* =========================================================
   FASE 1: INSTALABILIDAD
   Captura del evento beforeinstallprompt para mostrar un
   botón de instalación propio dentro de la interfaz.
   ========================================================= */
let eventoInstalacionDiferido = null;

window.addEventListener('beforeinstallprompt', (event) => {
    // Evita que el mini-banner automático aparezca antes de tiempo
    event.preventDefault();
    eventoInstalacionDiferido = event;

    // Muestra tu botón personalizado de instalación en la UI
    const btnInstalar = document.getElementById('btn-instalar');
    btnInstalar.hidden = false;
});

document.getElementById('btn-instalar').addEventListener('click', () => {
    if (!eventoInstalacionDiferido) {
        return;
    }

    // Lanza el diálogo nativo de instalación
    eventoInstalacionDiferido.prompt();

    // .userChoice es una Promesa: esperamos la decisión del usuario
    eventoInstalacionDiferido.userChoice
        .then((resultado) => {
            if (resultado.outcome === 'accepted') {
                // Instalación aceptada: ocultamos el botón
                document.getElementById('btn-instalar').hidden = true;
            }
        })
        .catch((error) => {
            console.error('Error al instalar la PWA:', error);
        })
        .finally(() => {
            // El evento solo puede usarse una vez
            eventoInstalacionDiferido = null;
        });
});

/* =========================================================
   FASE 2: FLUJO DE PRE-PERMISO Y CONTROL DE CÁMARA
   ========================================================= */
let streamActual = null;
let modoCamaraActual = 'environment'; // 'environment' = trasera | 'user' = frontal

// Actualiza el mensaje de estado visible para el usuario
function actualizarMensajeEstado(mensaje) {
    document.getElementById('mensaje-estado').textContent = mensaje;
}

// Libera el hardware: detiene todas las pistas (tracks) activas.
// Es obligatorio antes de pedir otro lente (front/back) en móviles.
function detenerCamaraActiva() {
    if (streamActual) {
        streamActual.getTracks().forEach((track) => {
            track.stop();
        });
        streamActual = null;
    }
}

// Enciende la cámara solicitada y diagnostica los errores más comunes
function iniciarCamara(modo) {
    detenerCamaraActiva();

    const restricciones = {
        video: { facingMode: modo },
        audio: false
    };

    return navigator.mediaDevices.getUserMedia(restricciones)
        .then((stream) => {
            streamActual = stream;
            const visorVideo = document.getElementById('visor-camara');
            visorVideo.srcObject = stream;
            actualizarMensajeEstado(
                `Cámara activa (${modo === 'environment' ? 'Trasera' : 'Frontal'})`
            );
        })
        .catch((error) => {
            if (error.name === 'NotAllowedError') {
                actualizarMensajeEstado(
                    'Permiso denegado. Habilita el acceso a la cámara en los ajustes de tu navegador.'
                );
            } else if (error.name === 'NotFoundError') {
                actualizarMensajeEstado(
                    'No se detectó el sensor de cámara solicitado en este dispositivo.'
                );
            } else {
                actualizarMensajeEstado(`Error al acceder al hardware: ${error.message}`);
            }
        });
}

// Paso 1: el usuario pulsa "Solicitar acceso" -> mostramos el aviso explicativo
document.getElementById('btn-preparar-camara').addEventListener('click', () => {
    document.getElementById('aviso-permiso').hidden = false;
});

// Paso 2: el usuario lee el motivo y confirma -> se pide el permiso nativo
document.getElementById('btn-confirmar-permiso').addEventListener('click', () => {
    document.getElementById('aviso-permiso').hidden = true;
    iniciarCamara(modoCamaraActual);
});

// Alternancia de lentes: invierte el modo y reinicia el flujo
document.getElementById('btn-alternar-camara').addEventListener('click', () => {
    modoCamaraActual = modoCamaraActual === 'environment' ? 'user' : 'environment';
    iniciarCamara(modoCamaraActual);
});

// Apagado: libera el hardware y limpia el visor
document.getElementById('btn-apagar-camara').addEventListener('click', () => {
    const visorVideo = document.getElementById('visor-camara');
    detenerCamaraActiva();
    visorVideo.srcObject = null;
    actualizarMensajeEstado('Cámara apagada.');
});

/* =========================================================
   SOPORTE iOS / WEBKIT
   En iOS beforeinstallprompt no existe: mostramos una guía
   manual de instalación cuando aún no está instalada.
   ========================================================= */
function verificarEntornoIOS() {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const estaInstalada = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

    // Si está en iPhone y aún la ve desde el navegador, mostrar instrucciones manuales
    if (esIOS && !estaInstalada) {
        const guiaIOS = document.getElementById('instrucciones-ios');
        if (guiaIOS) {
            guiaIOS.hidden = false;
        }
    }
}

/* =========================================================
   REGISTRO DEL SERVICE WORKER
   Solo con .then(), .catch() (prohibido async/await).
   ========================================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registro) => {
                console.log('Service Worker registrado en el scope:', registro.scope);
            })
            .catch((error) => {
                console.error('Error al registrar el Service Worker:', error);
            });
    });
}

/* Arranque */
verificarEntornoIOS();
actualizarMensajeEstado('Cámara apagada.');
