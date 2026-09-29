// js/dashboard.js
// Módulo para cálculos de KPIs de negocio, métricas del taller y gestión de gráficos con Chart.js

const DashboardModule = {
  kpis: {
    vehiculosHoy: 0,
    ordenesActivas: 0,
    ingresosMes: 0,
    presupuestosPendientes: 0
  },
  graficoInstancia: null,

  // Calcular las métricas agregadas desde la base de datos
  async recalcularMetricas() {
    try {
      const ordenes = await db.ordenes.toArray();
      const hoyStr = new Date().toISOString().split('T')[0];
      const mesActual = new Date().getMonth(); // 0 - 11
      const anioActual = new Date().getFullYear();

      // 1. Vehículos en taller hoy (Cualquier orden que no esté en 'Entregado/Finalizado')
      this.kpis.vehiculosHoy = ordenes.filter(o => o.estado !== 'Entregado/Finalizado').length;

      // 2. Órdenes activas (En Diagnóstico, En Reparación, Listo para Entregar)
      const estadosActivos = ['En Diagnóstico', 'En Reparación', 'Listo para Entregar'];
      this.kpis.ordenesActivas = ordenes.filter(o => estadosActivos.includes(o.estado)).length;

      // 3. Ingresos del mes (Órdenes finalizadas y entregadas con fecha dentro del mes actual)
      this.kpis.ingresosMes = ordenes
        .filter(o => {
          if (o.estado !== 'Entregado/Finalizado') return false;
          // Se asume fechaEntrega como la fecha de liquidación/entrega
          const fecha = new Date(o.fechaEntrega || o.fechaIngreso);
          return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      // 4. Presupuestos pendientes (Órdenes que están 'En Espera' o 'En Diagnóstico')
      this.kpis.presupuestosPendientes = ordenes.filter(o => ['En Espera', 'En Diagnóstico'].includes(o.estado)).length;

    } catch (error) {
      console.error("Error recalculando métricas del Dashboard:", error);
    }
  },

  // Inicializar o actualizar el gráfico de barras y líneas combinado de Chart.js
  async renderizarGrafico(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.warn("Elemento de gráfico no encontrado.");
      return;
    }

    try {
      const ordenes = await db.ordenes.toArray();

      // Nombres de meses en español
      const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

      // Obtener los últimos 6 meses para mostrar
      const hoy = new Date();
      const ultimosMeses = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        ultimosMeses.push({
          mes: d.getMonth(),
          anio: d.getFullYear(),
          label: `${mesesNombres[d.getMonth()]} ${d.getFullYear()}`,
          ingresos: 0,
          reparaciones: 0
        });
      }

      // Distribuir datos por mes
      ordenes.forEach(o => {
        const fecha = new Date(o.fechaEntrega || o.fechaIngreso);
        const m = fecha.getMonth();
        const a = fecha.getFullYear();

        const bucket = ultimosMeses.find(b => b.mes === m && b.anio === a);
        if (bucket) {
          bucket.reparaciones++;
          if (o.estado === 'Entregado/Finalizado') {
            bucket.ingresos += (o.total || 0);
          }
        }
      });

      const labels = ultimosMeses.map(b => b.label);
      const dataIngresos = ultimosMeses.map(b => b.ingresos);
      const dataReparaciones = ultimosMeses.map(b => b.reparaciones);

      // Destruir gráfico anterior si existe para evitar superposiciones
      if (this.graficoInstancia) {
        this.graficoInstancia.destroy();
      }

      this.graficoInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Ingresos Mensuales ($)',
              data: dataIngresos,
              backgroundColor: 'rgba(59, 130, 246, 0.7)', // Tailwind blue-500
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              yAxisID: 'yIngresos',
              borderRadius: 4
            },
            {
              label: 'Cantidad de Reparaciones',
              data: dataReparaciones,
              type: 'line',
              borderColor: 'rgba(245, 158, 11, 1)', // Tailwind amber-500
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              borderWidth: 3,
              tension: 0.3,
              fill: false,
              yAxisID: 'yReparaciones'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#374151',
                font: { family: 'Inter, sans-serif', weight: '500' }
              }
            }
          },
          scales: {
            yIngresos: {
              type: 'linear',
              position: 'left',
              title: {
                display: true,
                text: 'Ingresos ($)',
                color: '#3b82f6',
                font: { weight: 'bold' }
              },
              grid: {
                color: 'rgba(243, 244, 246, 1)'
              },
              ticks: {
                color: '#374151'
              }
            },
            yReparaciones: {
              type: 'linear',
              position: 'right',
              title: {
                display: true,
                text: 'Reparaciones (u)',
                color: '#f59e0b',
                font: { weight: 'bold' }
              },
              grid: {
                drawOnChartArea: false // Evita superposición de líneas de grilla
              },
              ticks: {
                stepSize: 1,
                color: '#374151'
              }
            },
            x: {
              ticks: { color: '#374151' },
              grid: { display: false }
            }
          }
        }
      });

    } catch (error) {
      console.error("Error al renderizar el gráfico del Dashboard:", error);
    }
  }
};
