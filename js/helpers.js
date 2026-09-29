// js/helpers.js
// Ayudantes de sonidos, alertas y utilidades de respaldo (Backup)

// 1. Configuración de sonidos con Howler.js utilizando sonidos sintéticos u oficiales mediante URLs estables de CDN o Data URIs para máxima fiabilidad
const sonidos = {
  click: new Howl({
    src: ['https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', 'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/button_click.mp3'],
    volume: 0.3
  }),
  success: new Howl({
    src: ['https://actions.google.com/sounds/v1/cartoon/slide_whistle_up.ogg', 'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/water_droplet.mp3'],
    volume: 0.4
  }),
  bell: new Howl({
    src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg', 'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/bell_ring.mp3'],
    volume: 0.4
  }),
  calibration: new Howl({
    src: ['https://actions.google.com/sounds/v1/science_fiction/teleport.ogg', 'https://cdnjs.cloudflare.com/ajax/libs/ion-sound/3.0.7/sounds/computer_chips.mp3'],
    volume: 0.5
  })
};

// Funciones para reproducir sonidos
function reproducirSonido(tipo) {
  if (sonidos[tipo]) {
    sonidos[tipo].play();
  }
}

// 2. Alertas y Toasts modernos con SweetAlert2
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

function notificarExito(mensaje) {
  reproducirSonido('success');
  Toast.fire({
    icon: 'success',
    title: mensaje
  });
}

function notificarError(mensaje) {
  Toast.fire({
    icon: 'error',
    title: mensaje
  });
}

function notificarInfo(mensaje) {
  Toast.fire({
    icon: 'info',
    title: mensaje
  });
}

// Alertas modales completas
async function confirmarAccion(titulo, texto, botonConfirmar = 'Sí, continuar') {
  reproducirSonido('click');
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: botonConfirmar,
    cancelButtonText: 'Cancelar'
  });
  return resultado.isConfirmed;
}

// 3. Utilidades de backup y formateo
function formatearMoneda(monto, simbolo = '$', formato = 'es-CL') {
  try {
    return new Intl.NumberFormat(formato, {
      style: 'currency',
      currency: 'USD', // Fallback genérico para formateo
      minimumFractionDigits: 0
    }).format(monto).replace('USD', simbolo).trim();
  } catch (e) {
    return `${simbolo}${monto}`;
  }
}

// Función para exportar toda la base de datos IndexedDB como un archivo JSON
async function exportarBackup() {
  try {
    const clientes = await db.clientes.toArray();
    const vehiculos = await db.vehiculos.toArray();
    const ordenes = await db.ordenes.toArray();
    const plantillas = await db.plantillas.toArray();
    const configuracion = await db.configuracion.toArray();

    const backupObj = {
      version: 1,
      fecha: new Date().toISOString(),
      data: {
        clientes,
        vehiculos,
        ordenes,
        plantillas,
        configuracion
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Backup_Taller_CRM_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    notificarExito("Backup exportado correctamente.");
  } catch (error) {
    console.error("Error al exportar el backup:", error);
    notificarError("No se pudo exportar el backup de forma correcta.");
  }
}

// Función para importar un backup desde un string JSON
async function importarBackup(jsonString) {
  try {
    const backupObj = JSON.parse(jsonString);
    if (!backupObj.data || !backupObj.data.clientes) {
      throw new Error("El archivo no tiene el formato de backup correcto.");
    }

    const confirm = await confirmarAccion(
      "¿Restaurar Copia de Seguridad?",
      "Esta acción reemplazará toda la información actual de clientes, vehículos, órdenes y plantillas. ¿Deseas continuar?",
      "Sí, restaurar"
    );

    if (!confirm) return false;

    // Limpiar tablas actuales antes de restaurar
    await db.clientes.clear();
    await db.vehiculos.clear();
    await db.ordenes.clear();
    await db.plantillas.clear();
    await db.configuracion.clear();

    const data = backupObj.data;

    // Insertar datos restaurados
    if (data.clientes && data.clientes.length > 0) {
      await db.clientes.bulkAdd(data.clientes);
    }
    if (data.vehiculos && data.vehiculos.length > 0) {
      await db.vehiculos.bulkAdd(data.vehiculos);
    }
    if (data.ordenes && data.ordenes.length > 0) {
      await db.ordenes.bulkAdd(data.ordenes);
    }
    if (data.plantillas && data.plantillas.length > 0) {
      await db.plantillas.bulkAdd(data.plantillas);
    }
    if (data.configuracion && data.configuracion.length > 0) {
      await db.configuracion.bulkAdd(data.configuracion);
    }

    notificarExito("Copia de seguridad restaurada con éxito.");
    return true;
  } catch (error) {
    console.error("Error al restaurar backup:", error);
    notificarError("El archivo JSON no es válido o está corrupto.");
    return false;
  }
}
