// js/whatsapp.js
// Módulo de mensajería interactiva de WhatsApp y gestión de plantillas editables

const WhatsAppModule = {
  // Estado para crear/editar plantillas
  nuevaPlantilla: {
    titulo: "",
    texto: ""
  },

  // Generar mensaje pre-redactado sustituyendo las variables dinámicas
  async formatearMensaje(plantillaTexto, ordenCompleta, datosTaller) {
    if (!ordenCompleta) return "";

    const variables = {
      "{nombre_cliente}": ordenCompleta.cliente ? ordenCompleta.cliente.nombre : "Cliente",
      "{vehiculo}": ordenCompleta.vehiculo ? `${ordenCompleta.vehiculo.marca} ${ordenCompleta.vehiculo.modelo}` : "Vehículo",
      "{placa}": ordenCompleta.vehiculo ? ordenCompleta.vehiculo.placa : "S/P",
      "{estado_orden}": ordenCompleta.estado || "Ingresado",
      "{total_pagar}": formatearMoneda(ordenCompleta.total || 0, datosTaller.moneda || '$', datosTaller.formatoMoneda || 'es-CL'),
      "{nombre_taller}": datosTaller.nombre || "Taller Mecánico"
    };

    let mensajeFormateado = plantillaTexto;
    for (const [clave, valor] of Object.entries(variables)) {
      mensajeFormateado = mensajeFormateado.replaceAll(clave, valor);
    }

    return mensajeFormateado;
  },

  // Generar enlace wa.me para abrir la conversación de WhatsApp Web o Móvil
  async generarEnlaceWhatsApp(telefonoCliente, mensaje) {
    // Limpiar el teléfono de caracteres no numéricos
    const telefonoLimpio = telefonoCliente.replace(/[^\d+]/g, "");

    // Si el teléfono no tiene código de país, podemos asumir que el taller deba proveerlo o enviarlo tal cual
    const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    return url;
  },

  // Obtener todas las plantillas desde IndexedDB
  async obtenerPlantillas() {
    try {
      return await db.plantillas.toArray();
    } catch (e) {
      console.error("Error al recuperar plantillas de WhatsApp:", e);
      return [];
    }
  },

  // Guardar nueva plantilla o actualizar existente
  async guardarPlantilla(plantillaId = null) {
    if (this.nuevaPlantilla.titulo.trim() === "" || this.nuevaPlantilla.texto.trim() === "") {
      notificarError("El título y el texto de la plantilla son obligatorios.");
      return false;
    }

    try {
      const datos = {
        titulo: this.nuevaPlantilla.titulo.trim(),
        texto: this.nuevaPlantilla.texto.trim()
      };

      if (plantillaId) {
        await db.plantillas.update(Number(plantillaId), datos);
        notificarExito("Plantilla actualizada correctamente.");
      } else {
        await db.plantillas.add(datos);
        notificarExito("Plantilla de WhatsApp creada exitosamente.");
      }

      this.limpiarFormularioPlantilla();
      return true;
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      notificarError("Error al persistir la plantilla en base de datos.");
      return false;
    }
  },

  // Eliminar plantilla
  async eliminarPlantilla(plantillaId) {
    const confirm = await confirmarAccion(
      "¿Eliminar Plantilla?",
      "Esta acción removerá esta plantilla de tus opciones rápidas de envío.",
      "Sí, eliminar"
    );

    if (!confirm) return false;

    try {
      await db.plantillas.delete(Number(plantillaId));
      notificarExito("Plantilla eliminada.");
      return true;
    } catch (error) {
      console.error("Error al eliminar plantilla:", error);
      notificarError("No se pudo eliminar la plantilla.");
      return false;
    }
  },

  // Limpiar formulario de plantilla
  limpiarFormularioPlantilla() {
    this.nuevaPlantilla = { titulo: "", texto: "" };
  }
};
