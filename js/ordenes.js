// js/ordenes.js
// Módulo de Gestión de Órdenes de Trabajo (OT), Diagnósticos e Insumos

const OrdenesModule = {
  // Estructura de modelo para una nueva Orden de Trabajo (OT)
  nuevaOrden: {
    clienteId: "",
    vehiculoId: "",
    numeroOrden: "",
    fechaIngreso: "",
    fechaEntrega: "",
    diagnostico: "",
    nivelCombustible: "1/4", // "Vació", "1/4", "1/2", "3/4", "Lleno"
    estadoVisual: "",
    estado: "En Espera", // "En Espera", "En Diagnóstico", "En Reparación", "Listo para Entregar", "Entregado/Finalizado"
    manoDeObra: [], // Lista de {descripcion: "", precio: 0}
    repuestos: [],  // Lista de {descripcion: "", precio: 0, cantidad: 1}
    total: 0
  },

  // Temporales para añadir ítems al formulario de edición/creación
  tempManoDeObra: { descripcion: "", precio: "" },
  tempRepuesto: { descripcion: "", precio: "", cantidad: 1 },

  filtroEstado: "Todas",
  busquedaOrden: "",

  // Generar número correlativo para la siguiente orden de trabajo
  async generarNumeroOrden() {
    try {
      const ordenes = await db.ordenes.toArray();
      if (ordenes.length === 0) {
        return "OT-1001";
      }
      // Buscar el máximo correlativo
      const correlativos = ordenes.map(o => {
        const parts = o.numeroOrden.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : 1000;
      });
      const max = Math.max(...correlativos);
      return `OT-${max + 1}`;
    } catch (e) {
      return `OT-${Date.now()}`;
    }
  },

  // Obtener órdenes enriquecidas con la información del cliente y del vehículo
  async obtenerOrdenesCompletas() {
    try {
      const ordenes = await db.ordenes.reverse().toArray();
      const clientes = await db.clientes.toArray();
      const vehiculos = await db.vehiculos.toArray();

      return ordenes.map(o => {
        const cliente = clientes.find(c => c.id === o.clienteId);
        const vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
        return {
          ...o,
          cliente: cliente || { nombre: "Cliente no encontrado", telefono: "" },
          vehiculo: vehiculo || { marca: "Vehículo", modelo: "no encontrado", placa: "S/P" }
        };
      });
    } catch (error) {
      console.error("Error al recuperar órdenes completas:", error);
      return [];
    }
  },

  // Agregar una tarea de mano de obra a la orden temporal
  agregarManoDeObra() {
    if (this.tempManoDeObra.descripcion.trim() === "" || !this.tempManoDeObra.precio) {
      notificarError("Descripción y precio de mano de obra obligatorios.");
      return;
    }
    this.nuevaOrden.manoDeObra.push({
      descripcion: this.tempManoDeObra.descripcion.trim(),
      precio: Number(this.tempManoDeObra.precio)
    });
    this.tempManoDeObra = { descripcion: "", precio: "" };
    this.recalcularTotalOrden();
    reproducirSonido('click');
  },

  // Quitar una tarea de mano de obra
  removerManoDeObra(index) {
    this.nuevaOrden.manoDeObra.splice(index, 1);
    this.recalcularTotalOrden();
  },

  // Agregar un repuesto a la orden temporal
  agregarRepuesto() {
    if (this.tempRepuesto.descripcion.trim() === "" || !this.tempRepuesto.precio || !this.tempRepuesto.cantidad) {
      notificarError("Descripción, precio y cantidad de repuesto obligatorios.");
      return;
    }
    this.nuevaOrden.repuestos.push({
      descripcion: this.tempRepuesto.descripcion.trim(),
      precio: Number(this.tempRepuesto.precio),
      cantidad: Number(this.tempRepuesto.cantidad)
    });
    this.tempRepuesto = { descripcion: "", precio: "", cantidad: 1 };
    this.recalcularTotalOrden();
    reproducirSonido('click');
  },

  // Quitar un repuesto
  removerRepuesto(index) {
    this.nuevaOrden.repuestos.splice(index, 1);
    this.recalcularTotalOrden();
  },

  // Recalcular la suma de todos los servicios y repuestos ingresados
  recalcularTotalOrden() {
    const manoDeObraTotal = this.nuevaOrden.manoDeObra.reduce((sum, item) => sum + item.precio, 0);
    const repuestosTotal = this.nuevaOrden.repuestos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    this.nuevaOrden.total = manoDeObraTotal + repuestosTotal;
  },

  // Guardar la orden de trabajo (Guardar nueva o actualizar existente)
  async guardarOrden(ordenId = null) {
    if (!this.nuevaOrden.clienteId || !this.nuevaOrden.vehiculoId) {
      notificarError("Debes seleccionar un cliente y un vehículo para la orden.");
      return false;
    }

    if (this.nuevaOrden.diagnostico.trim() === "") {
      notificarError("Por favor ingresa un diagnóstico de ingreso inicial.");
      return false;
    }

    try {
      this.recalcularTotalOrden();

      const datos = {
        clienteId: Number(this.nuevaOrden.clienteId),
        vehiculoId: Number(this.nuevaOrden.vehiculoId),
        numeroOrden: this.nuevaOrden.numeroOrden || await this.generarNumeroOrden(),
        fechaIngreso: this.nuevaOrden.fechaIngreso || new Date().toISOString().split('T')[0],
        fechaEntrega: this.nuevaOrden.fechaEntrega || "",
        diagnostico: this.nuevaOrden.diagnostico.trim(),
        nivelCombustible: this.nuevaOrden.nivelCombustible,
        estadoVisual: this.nuevaOrden.estadoVisual.trim(),
        estado: this.nuevaOrden.estado,
        manoDeObra: JSON.parse(JSON.stringify(this.nuevaOrden.manoDeObra)),
        repuestos: JSON.parse(JSON.stringify(this.nuevaOrden.repuestos)),
        total: this.nuevaOrden.total
      };

      if (ordenId) {
        await db.ordenes.update(Number(ordenId), datos);
        notificarExito(`Orden ${datos.numeroOrden} actualizada correctamente.`);
      } else {
        await db.ordenes.add(datos);
        notificarExito(`Orden ${datos.numeroOrden} registrada con éxito.`);
      }

      // Al guardar, actualizar el kilometraje actual en el registro del auto
      const vehiculo = await db.vehiculos.get(Number(datos.vehiculoId));
      if (vehiculo) {
        // Opcional: Se puede pedir al capturar la orden el kilometraje actual
        // Para mantener coherencia, no modificamos a menos que se tenga un campo específico
      }

      this.limpiarFormularioOrden();
      return true;
    } catch (error) {
      console.error("Error al guardar orden de trabajo:", error);
      notificarError("Error en base de datos al guardar la Orden.");
      return false;
    }
  },

  // Eliminar orden de trabajo
  async eliminarOrden(ordenId) {
    const confirm = await confirmarAccion(
      "¿Eliminar Orden de Trabajo?",
      "Esta acción es irreversible y removerá todo el histórico financiero de esta orden de trabajo.",
      "Sí, eliminar"
    );

    if (!confirm) return false;

    try {
      await db.ordenes.delete(Number(ordenId));
      notificarExito("Orden de trabajo eliminada.");
      return true;
    } catch (error) {
      console.error("Error al eliminar orden de trabajo:", error);
      notificarError("Ocurrió un error al intentar eliminar la orden.");
      return false;
    }
  },

  // Limpiar el estado interno de la orden de trabajo
  async limpiarFormularioOrden() {
    this.nuevaOrden = {
      clienteId: "",
      vehiculoId: "",
      numeroOrden: await this.generarNumeroOrden(),
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaEntrega: "",
      diagnostico: "",
      nivelCombustible: "1/4",
      estadoVisual: "",
      estado: "En Espera",
      manoDeObra: [],
      repuestos: [],
      total: 0
    };
    this.tempManoDeObra = { descripcion: "", precio: "" };
    this.tempRepuesto = { descripcion: "", precio: "", cantidad: 1 };
  }
};
