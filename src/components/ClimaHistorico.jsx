import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const ClimaHistorico = () => {
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDispositivo, setFiltroDispositivo] = useState(''); // Estado para filtrar

  useEffect(() => {
    const fetchHistorial = async () => {
      // Traemos más datos (400) porque ahora son 4 variables por cada tick de tiempo
      const { data, error } = await supabase
        .from('mediciones')
        .select(`*, dispositivos(nombre, ubicacion)`)
        .order('timestamp', { ascending: false })
        .limit(400);

      if (error) console.error("Error cargando:", error);
      else setMediciones(data.reverse());
      setLoading(false);
    };
    fetchHistorial();

    const subscription = supabase
      .channel('clima_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mediciones' }, async (payload) => {
        // Obtenemos el nombre del dispositivo para la tabla
        const { data: dispData } = await supabase.from('dispositivos').select('nombre').eq('id', payload.new.id_dispositivo).single();
        const nuevaMedicion = { ...payload.new, dispositivos: dispData };
        
        setMediciones(prev => {
          const newData = [...prev, nuevaMedicion];
          return newData.slice(-400); // Mantiene solo los últimos 400 registros para no saturar RAM
        });
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // 1. Separar datos puros para los gráficos y tarjetas
  const tempDatos = mediciones.filter(m => m.tipo_variable === 'temperatura');
  const humDatos = mediciones.filter(m => m.tipo_variable === 'humedad');
  const presDatos = mediciones.filter(m => m.tipo_variable === 'presion');
  const aqiDatos = mediciones.filter(m => m.tipo_variable === 'calidad_aire');

  // 2. Lógica para Agrupar los datos en forma de Tabla (Pivot Data)
  const datosTablaAgrupados = useMemo(() => {
    const grupos = {};
    mediciones.forEach(m => {
      // Usamos el timestamp como llave única, ya que se envían por lote (Batch) en el mismo instante
      const llave = `${m.timestamp}_${m.id_dispositivo}`;
      if (!grupos[llave]) {
        grupos[llave] = {
          rawTime: m.timestamp,
          fechaHora: new Date(m.timestamp).toLocaleString(),
          dispositivoId: m.id_dispositivo,
          dispositivoNombre: m.dispositivos?.nombre || 'Desconocido',
          temperatura: '--', humedad: '--', presion: '--', calidad_aire: '--'
        };
      }
      grupos[llave][m.tipo_variable] = m.valor.toFixed(1);
    });

    let filas = Object.values(grupos).sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));
    
    // Aplicar filtro si el usuario selecciona un dispositivo
    if (filtroDispositivo) {
      filas = filas.filter(f => f.dispositivoId === filtroDispositivo);
    }
    return filas;
  }, [mediciones, filtroDispositivo]);

  // Extraer lista única de dispositivos para el Select del filtro
  const listaDispositivos = [...new Set(mediciones.map(m => m.id_dispositivo))].map(id => {
    return mediciones.find(m => m.id_dispositivo === id)?.dispositivos?.nombre || id;
  });

  // Configuración Chart.js (Graficamos Temp y Humedad)
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#8b949e' } }, x: { grid: { display: false }, ticks: { display: false } } } };
  const tempChart = { labels: tempDatos.map(m => m.timestamp), datasets: [{ label: 'Temp °C', data: tempDatos.map(m => m.valor), borderColor: '#e34c26', backgroundColor: 'rgba(227, 76, 38, 0.2)', fill: true, tension: 0.4 }] };
  const humChart = { labels: humDatos.map(m => m.timestamp), datasets: [{ label: 'Hum %', data: humDatos.map(m => m.valor), borderColor: '#58a6ff', backgroundColor: 'rgba(88, 166, 255, 0.2)', fill: true, tension: 0.4 }] };

  if (loading) return <div className="text-center p-5 text-white"><div className="spinner-border"></div></div>;

  return (
    <div className="w-100 p-3 p-md-4 text-white animation-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-0">Estación Meteorológica Central</h2>
        <p className="text-github-muted mt-1">Telemetría consolidada en tiempo real (Supabase IoT)</p>
      </div>

      {/* 4 TARJETAS SUPERIORES */}
      <div className="row g-3 mb-4">
        {[
          { title: "TEMPERATURA", value: tempDatos, unit: "°C" },
          { title: "PRESIÓN ATM.", value: presDatos, unit: "hPa" },
          { title: "HUMEDAD", value: humDatos, unit: "%" },
          { title: "CALIDAD AIRE", value: aqiDatos, unit: "AQI" }
        ].map((card, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="bg-github-card p-3 rounded shadow-sm border border-secondary text-center">
              <h6 className="text-github-muted small mb-1">{card.title}</h6>
              <h3 className="fw-bold text-white mb-0">
                {card.value.length > 0 ? `${card.value[card.value.length - 1].valor.toFixed(1)} ${card.unit}` : '--'}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* 2 GRÁFICOS */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="bg-github-card p-3 rounded shadow-sm border border-secondary">
            <h6 className="text-white fw-bold mb-3">Histórico de Temperatura</h6>
            <div style={{ height: '200px' }}>{tempDatos.length > 0 && <Line data={tempChart} options={chartOptions} />}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-github-card p-3 rounded shadow-sm border border-secondary">
            <h6 className="text-white fw-bold mb-3">Histórico de Humedad</h6>
            <div style={{ height: '200px' }}>{humDatos.length > 0 && <Line data={humChart} options={chartOptions} />}</div>
          </div>
        </div>
      </div>

      {/* TABLA DE REGISTROS LOGS (Data Logger) */}
      <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-white mb-0">Registro Histórico (Data Logger)</h5>
          
          {/* Filtro por Dispositivo */}
          <select 
            className="form-select form-select-sm w-auto bg-dark text-white border-secondary"
            value={filtroDispositivo}
            onChange={(e) => setFiltroDispositivo(e.target.value)}
          >
            <option value="">Todos los dispositivos</option>
            {/* Solo extrae IDs únicos presentes en los datos */}
            {[...new Set(mediciones.map(m => m.id_dispositivo))].map(id => (
              <option key={id} value={id}>
                {mediciones.find(m => m.id_dispositivo === id)?.dispositivos?.nombre || id}
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="table table-dark table-hover align-middle text-center">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th className="text-start">Fecha y Hora</th>
                <th>Dispositivo</th>
                <th>Temp (°C)</th>
                <th>Presión (hPa)</th>
                <th>Humedad (%)</th>
                <th>Calidad Aire (AQI)</th>
              </tr>
            </thead>
            <tbody>
              {datosTablaAgrupados.map((fila, index) => (
                <tr key={index}>
                  <td className="text-start fw-bold text-github-muted">{fila.fechaHora}</td>
                  <td><span className="badge bg-secondary">{fila.dispositivoNombre}</span></td>
                  <td className="text-warning">{fila.temperatura}</td>
                  <td className="text-info">{fila.presion}</td>
                  <td className="text-primary">{fila.humedad}</td>
                  <td className={fila.calidad_aire > 100 ? 'text-danger' : 'text-success'}>
                    {fila.calidad_aire}
                  </td>
                </tr>
              ))}
              {datosTablaAgrupados.length === 0 && (
                <tr><td colSpan="6" className="text-muted py-4">No hay registros disponibles.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClimaHistorico;