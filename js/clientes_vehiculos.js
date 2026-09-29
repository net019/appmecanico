// js/clientes_vehiculos.js
// Módulo de Gestión de Clientes y Parque Vehicular (CRUD Completo)

const ClientesVehiculosModule = {
  // Modelos de datos para el formulario de ingreso
  nuevoCliente: {
    nombre: "",
    telefono: "",
    email: "",
    documento: ""
  },

  nuevoVehiculo: {
    clienteId: "",
    marca: "",
    modelo: "",
    anio: "",
    placa: "",
    color: "",
    vin: "",
    kilometraje: ""
  },

  // Variables de filtrado y búsqueda
  busquedaClientes: "",
  busquedaVehiculos: "",

  // Obtener todos los clientes vinculados con sus vehículos
  async obtenerClientesConVehiculos() {
    try {
      const clientes = await db.clientes.reverse().toArray();
      const vehiculos = await db.vehiculos.toArray();

      return clientes.map(c => {
        return {
          ...c,
          vehiculos: vehiculos.filter(v => v.clienteId === c.id)
        };
      });
    } catch (error) {
      console.error("Error obteniendo clientes con vehículos:", error);
      return [];
    }
  },

  // Crear o actualizar un cliente
  async guardarCliente(clienteId = null) {
    if (this.nuevoCliente.nombre.trim() === "" || this.nuevoCliente.telefono.trim() === "") {
      notificarError("El nombre y teléfono del cliente son campos obligatorios.");
      return false;
    }

    try {
      const datos = {
        nombre: this.nuevoCliente.nombre.trim(),
        telefono: this.nuevoCliente.telefono.trim(),
        email: this.nuevoCliente.email.trim(),
        documento: this.nuevoCliente.documento.trim(),
        fechaRegistro: new Date().toISOString().split('T')[0]
      };

      if (clienteId) {
        await db.clientes.update(Number(clienteId), datos);
        notificarExito("Cliente actualizado correctamente.");
      } else {
        await db.clientes.add(datos);
        notificarExito("Cliente registrado con éxito.");
      }

      this.limpiarFormularioCliente();
      return true;
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      notificarError("Error de base de datos al guardar cliente.");
      return false;
    }
  },

  // Eliminar un cliente y sus vehículos correspondientes
  async eliminarCliente(clienteId) {
    const confirm = await confirmarAccion(
      "¿Eliminar Cliente?",
      "Esta acción es irreversible y eliminará también todos los vehículos y órdenes de trabajo asociados a este cliente.",
      "Sí, eliminar"
    );

    if (!confirm) return false;

    try {
      const idNum = Number(clienteId);

      // Eliminar órdenes de trabajo relacionadas
      const ordenes = await db.ordenes.where("clienteId").equals(idNum).toArray();
      for (const o of ordenes) {
        await db.ordenes.delete(o.id);
      }

      // Eliminar vehículos relacionados
      const vehiculos = await db.vehiculos.where("clienteId").equals(idNum).toArray();
      for (const v of vehiculos) {
        await db.vehiculos.delete(v.id);
      }

      // Eliminar cliente
      await db.clientes.delete(idNum);
      notificarExito("Cliente y sus registros eliminados correctamente.");
      return true;
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      notificarError("Ocurrió un error al intentar eliminar el cliente.");
      return false;
    }
  },

  // Guardar o actualizar un vehículo
  async guardarVehiculo(vehiculoId = null) {
    if (!this.nuevoVehiculo.clienteId) {
      notificarError("Debes seleccionar un cliente propietario.");
      return false;
    }
    if (this.nuevoVehiculo.marca.trim() === "" || this.nuevoVehiculo.modelo.trim() === "" || this.nuevoVehiculo.placa.trim() === "") {
      notificarError("Marca, modelo y placa/patente son obligatorios.");
      return false;
    }

    try {
      const datos = {
        clienteId: Number(this.nuevoVehiculo.clienteId),
        marca: this.nuevoVehiculo.marca.trim(),
        modelo: this.nuevoVehiculo.modelo.trim(),
        anio: this.nuevoVehiculo.anio ? Number(this.nuevoVehiculo.anio) : "",
        placa: this.nuevoVehiculo.placa.trim().toUpperCase(),
        color: this.nuevoVehiculo.color.trim(),
        vin: this.nuevoVehiculo.vin.trim().toUpperCase(),
        kilometraje: this.nuevoVehiculo.kilometraje ? Number(this.nuevoVehiculo.kilometraje) : 0
      };

      if (vehiculoId) {
        await db.vehiculos.update(Number(vehiculoId), datos);
        notificarExito("Vehículo actualizado correctamente.");
      } else {
        await db.vehiculos.add(datos);
        notificarExito("Vehículo registrado exitosamente.");
      }

      this.limpiarFormularioVehiculo();
      return true;
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      notificarError("Error de base de datos al registrar el vehículo.");
      return false;
    }
  },

  // Eliminar un vehículo de forma directa
  async eliminarVehiculo(vehiculoId) {
    const confirm = await confirmarAccion(
      "¿Eliminar Vehículo?",
      "Se eliminará el vehículo del sistema. Las órdenes de trabajo correspondientes también serán borradas.",
      "Sí, borrar"
    );

    if (!confirm) return false;

    try {
      const idNum = Number(vehiculoId);

      // Eliminar órdenes
      const ordenes = await db.ordenes.where("vehiculoId").equals(idNum).toArray();
      for (const o of ordenes) {
        await db.ordenes.delete(o.id);
      }

      // Eliminar vehículo
      await db.vehiculos.delete(idNum);
      notificarExito("Vehículo eliminado correctamente.");
      return true;
    } catch (error) {
      console.error("Error al eliminar vehículo:", error);
      notificarError("Ocurrió un error al intentar eliminar el vehículo.");
      return false;
    }
  },

  // Limpiar formularios
  limpiarFormularioCliente() {
    this.nuevoCliente = { nombre: "", telefono: "", email: "", documento: "" };
  },

  limpiarFormularioVehiculo() {
    this.nuevoVehiculo = { clienteId: "", marca: "", modelo: "", anio: "", placa: "", color: "", vin: "", kilometraje: "" };
  }
};
