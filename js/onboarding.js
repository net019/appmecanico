// js/onboarding.js
// Módulo de Onboarding único y calibración de sistemas

const OnboardingModule = {
  // Estado inicial del formulario de Onboarding
  nuevoTaller: {
    nombre: "",
    propietario: "",
    telefono: "",
    whatsapp: "",
    direccion: "",
    pais: "Chile",
    moneda: "$",
    formatoMoneda: "es-CL",
    logoUrl: ""
  },

  // Paso actual del asistente (1: Datos del Taller, 2: Calibración y Carga, 3: Éxito/Completado)
  paso: 1,
  calibrando: false,
  progresoCalibracion: 0,
  mensajeCalibracion: "Iniciando sistema de diagnóstico...",

  // Verificar si la instalación inicial ya se realizó
  estaInstalado() {
    return localStorage.getItem('mecanico_installed') === 'true';
  },

  // Iniciar la calibración simulada y cargar los datos
  async iniciarCalibracion(alCompletar) {
    if (this.nuevoTaller.nombre.trim() === "" || this.nuevoTaller.propietario.trim() === "" || this.nuevoTaller.telefono.trim() === "") {
      notificarError("Por favor completa los datos obligatorios del taller.");
      return;
    }

    this.paso = 2;
    this.calibrando = true;
    this.progresoCalibracion = 0;
    reproducirSonido('calibration');

    const mensajes = [
      "Iniciando base de datos IndexedDB local...",
      "Creando tablas de Clientes y Parque Vehicular...",
      "Calibrando analizador de Órdenes de Trabajo...",
      "Pre-cargando plantillas inteligentes para WhatsApp...",
      "Cargando conjunto de datos de prueba (Mock Data)...",
      "Sincronizando configuraciones de moneda y país...",
      "Verificando integridad física de los circuitos mecánicos del CRM...",
      "Sistema listo al 100%. ¡Buen viaje, mecánico!"
    ];

    let indiceMensaje = 0;

    const intervalo = setInterval(() => {
      this.progresoCalibracion += 10;
      if (this.progresoCalibracion % 20 === 0 && indiceMensaje < mensajes.length - 1) {
        indiceMensaje++;
        this.mensajeCalibracion = mensajes[indiceMensaje];
        reproducirSonido('bell');
      }

      if (this.progresoCalibracion >= 100) {
        clearInterval(intervalo);
        this.progresoCalibracion = 100;
        this.mensajeCalibracion = "¡Calibración completada con éxito!";
        this.finalizarOnboarding(alCompletar);
      }
    }, 400);
  },

  // Finalizar el onboarding guardando la configuración y activando el flag
  async finalizarOnboarding(alCompletar) {
    try {
      // Guardar parámetros del taller en IndexedDB
      await db.configuracion.put({ clave: "nombre", valor: this.nuevoTaller.nombre });
      await db.configuracion.put({ clave: "propietario", valor: this.nuevoTaller.propietario });
      await db.configuracion.put({ clave: "telefono", valor: this.nuevoTaller.telefono });
      await db.configuracion.put({ clave: "whatsapp", valor: this.nuevoTaller.whatsapp || this.nuevoTaller.telefono });
      await db.configuracion.put({ clave: "direccion", valor: this.nuevoTaller.direccion });
      await db.configuracion.put({ clave: "pais", valor: this.nuevoTaller.pais });
      await db.configuracion.put({ clave: "moneda", valor: this.nuevoTaller.moneda });
      await db.configuracion.put({ clave: "formatoMoneda", valor: this.nuevoTaller.formatoMoneda });
      await db.configuracion.put({ clave: "logoUrl", valor: this.nuevoTaller.logoUrl || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200" });

      // Inicializar base de datos con datos de prueba predeterminados
      await inicializarDatosDePrueba();

      // Bloquear onboarding mediante localStorage
      localStorage.setItem('mecanico_installed', 'true');

      setTimeout(() => {
        this.calibrando = false;
        this.paso = 3;
        reproducirSonido('success');
        if (typeof alCompletar === 'function') {
          alCompletar();
        }
      }, 1000);

    } catch (error) {
      console.error("Error en onboarding:", error);
      notificarError("Ocurrió un error al guardar la configuración inicial.");
      this.calibrando = false;
    }
  }
};
