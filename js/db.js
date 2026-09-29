// js/db.js
// Base de datos local IndexedDB con Dexie.js

const db = new Dexie("TallerCRMDatabase");

// Definición de tablas y sus índices de búsqueda
db.version(1).stores({
  clientes: '++id, nombre, telefono, email, documento, fechaRegistro',
  vehiculos: '++id, clienteId, marca, modelo, anio, placa, color, vin, kilometraje',
  ordenes: '++id, clienteId, vehiculoId, numeroOrden, fechaIngreso, fechaEntrega, estado, total',
  plantillas: '++id, titulo, texto',
  configuracion: 'clave, valor'
});

// Función para verificar si la base de datos está vacía e insertar datos de prueba (Mock Data)
async function inicializarDatosDePrueba() {
  const countClientes = await db.clientes.count();
  if (countClientes > 0) {
    console.log("La base de datos ya contiene información.");
    return;
  }

  console.log("Inicializando base de datos con datos de prueba...");

  // 1. Clientes de prueba
  const clientesIds = [];
  const clientesMock = [
    { nombre: "Juan Pérez", telefono: "555123456", email: "juan.perez@example.com", documento: "12345678-K", fechaRegistro: new Date().toISOString().split('T')[0] },
    { nombre: "María González", telefono: "555987654", email: "maria.g@example.com", documento: "87654321-0", fechaRegistro: new Date().toISOString().split('T')[0] },
    { nombre: "Carlos Silva", telefono: "555456789", email: "carlos.silva@example.com", documento: "11223344-5", fechaRegistro: new Date().toISOString().split('T')[0] }
  ];

  for (const c of clientesMock) {
    const id = await db.clientes.add(c);
    clientesIds.push(id);
  }

  // 2. Vehículos de prueba vinculados a clientes
  const vehiculosIds = [];
  const vehiculosMock = [
    { clienteId: clientesIds[0], marca: "Toyota", modelo: "Corolla", anio: "2018", placa: "AB-123-CD", color: "Gris Plata", vin: "93H8F83H28H82F812", kilometraje: 45000 },
    { clienteId: clientesIds[0], marca: "Hyundai", modelo: "Tucson", anio: "2020", placa: "XY-987-ZZ", color: "Azul Marino", vin: "93H8F83H28H82F899", kilometraje: 28000 },
    { clienteId: clientesIds[1], marca: "Ford", modelo: "Focus", anio: "2015", placa: "FG-456-HJ", color: "Rojo Rubí", vin: "1FA6P8CF0F5123456", kilometraje: 112000 },
    { clienteId: clientesIds[2], marca: "Chevrolet", modelo: "Onix", anio: "2021", placa: "JK-789-LM", color: "Blanco", vin: "8AGAA69K0MR098765", kilometraje: 15000 }
  ];

  for (const v of vehiculosMock) {
    const id = await db.vehiculos.add(v);
    vehiculosIds.push(id);
  }

  // 3. Plantillas de WhatsApp predeterminadas
  const plantillasMock = [
    {
      titulo: "Recepción de vehículo",
      texto: "Hola {nombre_cliente}, te informamos que hemos recibido tu vehículo {vehiculo} (Placa: {placa}) en nuestro taller {nombre_taller}. Estaremos realizando el diagnóstico correspondiente y te avisaremos ante cualquier novedad. ¡Gracias por tu confianza!"
    },
    {
      titulo: "Presupuesto listo",
      texto: "Estimado/a {nombre_cliente}, el diagnóstico y presupuesto para tu {vehiculo} (Placa: {placa}) ya está listo. El total estimado es de {total_pagar}. Por favor, confírmanos la autorización para proceder con la reparación. Atentamente, {nombre_taller}."
    },
    {
      titulo: "Avance de reparación",
      texto: "Hola {nombre_cliente}, te escribimos de {nombre_taller} para comentarte que tu vehículo {vehiculo} se encuentra actualmente en estado de '{estado_orden}'. Todo marcha según lo planificado."
    },
    {
      titulo: "Vehículo listo para retiro",
      texto: "¡Excelentes noticias {nombre_cliente}! Tu vehículo {vehiculo} (Placa: {placa}) ya está reparado y listo para ser retirado. El saldo total a pagar es de {total_pagar}. Te esperamos en {nombre_taller}."
    },
    {
      titulo: "Recordatorio de mantenimiento preventivo",
      texto: "Hola {nombre_cliente}, de parte del equipo de {nombre_taller} te recordamos que se acerca la fecha del mantenimiento preventivo para tu {vehiculo}. Mantener tus mantenciones al día prolonga la vida útil de tu motor. ¡Reserva tu hora!"
    }
  ];

  for (const p of plantillasMock) {
    await db.plantillas.add(p);
  }

  // 4. Órdenes de trabajo de prueba
  const fechaHoy = new Date().toISOString().split('T')[0];
  const fechaHace10dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fechaHace5dias = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const ordenesMock = [
    {
      clienteId: clientesIds[0],
      vehiculoId: vehiculosIds[0],
      numeroOrden: "OT-1001",
      fechaIngreso: fechaHace10dias,
      fechaEntrega: fechaHace5dias,
      diagnostico: "Cambio de pastillas de freno delanteras y rectificado de discos. Ruido al frenar.",
      nivelCombustible: "1/4",
      estadoVisual: "Rayón leve en guardabarros trasero derecho.",
      estado: "Entregado/Finalizado",
      manoDeObra: [
        { descripcion: "Mano de obra cambio pastillas", precio: 30000 },
        { descripcion: "Rectificado de discos delanteros", precio: 20000 }
      ],
      repuestos: [
        { descripcion: "Pastillas de freno Bosch", precio: 35000, cantidad: 1 }
      ],
      total: 85000
    },
    {
      clienteId: clientesIds[1],
      vehiculoId: vehiculosIds[2],
      numeroOrden: "OT-1002",
      fechaIngreso: fechaHace5dias,
      fechaEntrega: fechaHoy,
      diagnostico: "Mantención de 110.000 km. Cambio de aceite, filtros y bujías. Check engine encendido.",
      nivelCombustible: "1/2",
      estadoVisual: "Sin abolladuras. Desgaste normal de pintura.",
      estado: "Listo para Entregar",
      manoDeObra: [
        { descripcion: "Mantención afinamiento completo", precio: 45000 },
        { descripcion: "Escáner diagnóstico check engine", precio: 15000 }
      ],
      repuestos: [
        { descripcion: "Filtro de aire", precio: 12000, cantidad: 1 },
        { descripcion: "Filtro de aceite original", precio: 8000, cantidad: 1 },
        { descripcion: "Aceite sintético 5W30 (4L)", precio: 42000, cantidad: 1 },
        { descripcion: "Bujías de Iridio (x4)", precio: 32000, cantidad: 1 }
      ],
      total: 154000
    },
    {
      clienteId: clientesIds[2],
      vehiculoId: vehiculosIds[3],
      numeroOrden: "OT-1003",
      fechaIngreso: fechaHoy,
      fechaEntrega: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      diagnostico: "Ruido extraño en tren delantero al pasar por baches.",
      nivelCombustible: "3/4",
      estadoVisual: "Parachoques delantero levemente descuadrado.",
      estado: "En Diagnóstico",
      manoDeObra: [
        { descripcion: "Diagnóstico de suspensión delantera", precio: 10000 }
      ],
      repuestos: [],
      total: 10000
    }
  ];

  for (const o of ordenesMock) {
    await db.ordenes.add(o);
  }

  console.log("Mock data cargado exitosamente.");
}
