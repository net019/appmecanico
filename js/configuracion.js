// js/configuracion.js
// Gestión de Ajustes, Datos de Onboarding, Modificaciones y Respaldos del Taller

const ConfiguracionModule = {
  // Datos vigentes del taller cargados en memoria
  datosTaller: {
    nombre: "",
    propietario: "",
    telefono: "",
    whatsapp: "",
    direccion: "",
    pais: "",
    moneda: "$",
    formatoMoneda: "es-CL",
    logoUrl: ""
  },

  // Cargar datos actuales del taller desde IndexedDB
  async cargarConfiguracion() {
    try {
      const configArray = await db.configuracion.toArray();
      const mapped = {};
      configArray.forEach(item => {
        mapped[item.clave] = item.valor;
      });

      this.datosTaller = {
        nombre: mapped.nombre || "",
        propietario: mapped.propietario || "",
        telefono: mapped.telefono || "",
        whatsapp: mapped.whatsapp || "",
        direccion: mapped.direccion || "",
        pais: mapped.pais || "",
        moneda: mapped.moneda || "$",
        formatoMoneda: mapped.formatoMoneda || "es-CL",
        logoUrl: mapped.logoUrl || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200"
      };
    } catch (e) {
      console.error("Error al cargar configuraciones del taller:", e);
    }
  },

  // Guardar modificaciones realizadas en el panel de configuración
  async actualizarConfiguracion() {
    if (this.datosTaller.nombre.trim() === "" || this.datosTaller.propietario.trim() === "" || this.datosTaller.telefono.trim() === "") {
      notificarError("Por favor, rellena los campos obligatorios del taller.");
      return false;
    }

    try {
      await db.configuracion.put({ clave: "nombre", valor: this.datosTaller.nombre.trim() });
      await db.configuracion.put({ clave: "propietario", valor: this.datosTaller.propietario.trim() });
      await db.configuracion.put({ clave: "telefono", valor: this.datosTaller.telefono.trim() });
      await db.configuracion.put({ clave: "whatsapp", valor: this.datosTaller.whatsapp.trim() || this.datosTaller.telefono.trim() });
      await db.configuracion.put({ clave: "direccion", valor: this.datosTaller.direccion.trim() });
      await db.configuracion.put({ clave: "pais", valor: this.datosTaller.pais.trim() });
      await db.configuracion.put({ clave: "moneda", valor: this.datosTaller.moneda.trim() });
      await db.configuracion.put({ clave: "formatoMoneda", valor: this.datosTaller.formatoMoneda.trim() });
      await db.configuracion.put({ clave: "logoUrl", valor: this.datosTaller.logoUrl.trim() });

      notificarExito("Información del taller actualizada con éxito.");
      return true;
    } catch (error) {
      console.error("Error al actualizar la configuración del taller:", error);
      notificarError("No se pudieron guardar los ajustes del taller.");
      return false;
    }
  },

  // Limpiar y resetear la base de datos completa para comenzar de cero
  async restablecerSistemaCompleto() {
    const confirm = await confirmarAccion(
      "¿RESTAURAR DE FÁBRICA?",
      "Esta acción eliminará absolutamente todos los clientes, vehículos, órdenes, plantillas y configuraciones. El sistema volverá a iniciar el proceso de Onboarding. ¿ESTÁS SEGURO?",
      "Sí, borrar todo"
    );

    if (!confirm) return false;

    try {
      await db.clientes.clear();
      await db.vehiculos.clear();
      await db.ordenes.clear();
      await db.plantillas.clear();
      await db.configuracion.clear();

      localStorage.removeItem('mecanico_installed');
      notificarExito("Sistema restablecido por completo. Recargando aplicación...");

      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (error) {
      console.error("Error al resetear el taller:", error);
      notificarError("Ocurrió un error al restablecer el sistema.");
      return false;
    }
  }
};
