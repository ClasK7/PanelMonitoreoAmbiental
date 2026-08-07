import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const ClimaHistorico = () => {
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDispositivo, setFiltroDispositivo] = useState(''); 

  useEffect(() => {
    const fetchHistorial = async () => {
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
        const { data: dispData } = await supabase.from('dispositivos').select('nombre').eq('id', payload.new.id_dispositivo).single();
        const nuevaMedicion = { ...payload.new, dispositivos: dispData };
        
        setMediciones(prev => {
          const newData = [...prev, nuevaMedicion];
          return newData.slice(-400); 
        });
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // 1. Filtrar los datos base según el dropdown (Afecta Tarjetas y Gráficos)
  const medicionesBase = filtroDispositivo 
    ? mediciones.filter(m => m.id_dispositivo === filtroDispositivo) 
    : mediciones;

  // Extraer el último valor de cada variable para las tarjetas superiores
  const tempDatos = medicionesBase.filter(m => m.tipo_variable === 'temperatura');
  const humDatos = medicionesBase.filter(m => m.tipo_variable === 'humedad');
  const presDatos = medicionesBase.filter(m => m.tipo_variable === 'presion');
  const aqiDatos = medicionesBase.filter(m => m.tipo_variable === 'calidad_aire');

  // 2. Lógica de Gráficos (Soporte para Múltiples Líneas)
  const dispositivosUnicos = filtroDispositivo 
    ? [filtroDispositivo] 
    : [...new Set(mediciones.map(m => m.id_dispositivo))];

  const labelsX = [...new Set(medicionesBase.map(m => m.timestamp))].sort();

  // Paletas de colores estilo GitHub Dark para diferenciar dispositivos
  const paletaTemp = ['#e34c26', '#f1e05a', '#e74c3c', '#fd8c73'];
  const paletaHum = ['#58a6ff', '#79c0ff', '#1f6feb', '#a5d6ff'];

  const construirDatasets = (tipoVariable, paletaColores) => {
    return dispositivosUnicos.map((idDisp, index) => {
      const nombre = mediciones.find(m => m.id_dispositivo === idDisp)?.dispositivos?.nombre || idDisp;
      const datosDisp = mediciones.filter(m => m.id_dispositivo === idDisp && m.tipo_variable === tipoVariable);
      
      const dataAlineada = labelsX.map(tiempo => {
        const registro = datosDisp.find(d => d.timestamp === tiempo);
        return registro ? registro.valor : null; 
      });

      return {
        label: nombre,
        data: dataAlineada,
        borderColor: paletaColores[index % paletaColores.length],
        backgroundColor: paletaColores[index % paletaColores.length] + '33',
        fill: filtroDispositivo ? true : false, // Solo rellenar si hay 1 solo nodo, para no saturar la vista
        tension: 0.4,
        spanGaps: true, // Crucial: Conecta los puntos si los dispositivos envían a destiempo
        borderWidth: 2,
        pointRadius: filtroDispositivo ? 3 : 0, // Ocultar los puntos si comparamos varios nodos
      };
    });
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        display: !filtroDispositivo, // Mostrar leyenda de colores solo cuando hay varios nodos
        labels: { color: '#8b949e', usePointStyle: true, boxWidth: 8 }
      } 
    }, 
    scales: { 
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#8b949e' } }, 
      x: { grid: { display: false }, ticks: { display: false } } 
    } 
  };

  const tempChart = { labels: labelsX.map(t => new Date(t).toLocaleTimeString()), datasets: construirDatasets('temperatura', paletaTemp) };
  const humChart = { labels: labelsX.map(t => new Date(t).toLocaleTimeString()), datasets: construirDatasets('humedad', paletaHum) };

  // 3. Lógica de la Tabla de Registros
  const datosTablaAgrupados = useMemo(() => {
    const grupos = {};
    medicionesBase.forEach(m => {
      const llave = `${m.timestamp}_${m.id_dispositivo}`;
      if (!grupos[llave]) {
        grupos[llave] = {
          rawTime: m.timestamp, fechaHora: new Date(m.timestamp).toLocaleString(),
          dispositivoId: m.id_dispositivo, dispositivoNombre: m.dispositivos?.nombre || 'Desconocido',
          temperatura: '--', humedad: '--', presion: '--', calidad_aire: '--'
        };
      }
      grupos[llave][m.tipo_variable] = m.valor.toFixed(1);
    });
    return Object.values(grupos).sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));
  }, [medicionesBase]);

  if (loading) return <div className="text-center p-5 text-white"><div className="spinner-border"></div></div>;

  return (
    <div className="w-100 p-3 p-md-4 text-white animation-fade-in">
      {/* Contenedor Superior: Título y Filtro Global */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Estación Meteorológica Central</h2>
          <p className="text-github-muted mt-1 mb-0">Telemetría consolidada en tiempo real (Supabase IoT)</p>
        </div>
        
        {/* El filtro ahora controla todo el dashboard */}
        <select 
          className="form-select form-select-sm w-auto bg-dark text-white border-secondary shadow-sm"
          value={filtroDispositivo}
          onChange={(e) => setFiltroDispositivo(e.target.value)}
        >
          <option value="">Todos los dispositivos (Comparativa)</option>
          {[...new Set(mediciones.map(m => m.id_dispositivo))].map(id => (
            <option key={id} value={id}>
              {mediciones.find(m => m.id_dispositivo === id)?.dispositivos?.nombre || id}
            </option>
          ))}
        </select>
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

      {/* 2 GRÁFICOS MULTI-LÍNEA */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="bg-github-card p-3 rounded shadow-sm border border-secondary">
            <h6 className="text-white fw-bold mb-3">Histórico de Temperatura</h6>
            <div style={{ height: '220px' }}>{tempDatos.length > 0 && <Line data={tempChart} options={chartOptions} />}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-github-card p-3 rounded shadow-sm border border-secondary">
            <h6 className="text-white fw-bold mb-3">Histórico de Humedad</h6>
            <div style={{ height: '220px' }}>{humDatos.length > 0 && <Line data={humChart} options={chartOptions} />}</div>
          </div>
        </div>
      </div>

      {/* TABLA DE REGISTROS LOGS */}
      <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
        <h5 className="fw-bold text-white mb-3">Registro Histórico (Data Logger)</h5>
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