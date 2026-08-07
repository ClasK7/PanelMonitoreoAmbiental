import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const ClimaHistorico = () => {
  const [mediciones, setMediciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos históricos
  useEffect(() => {
    const fetchHistorial = async () => {
      const { data, error } = await supabase
        .from('mediciones')
        .select(`*, dispositivos(nombre, ubicacion)`)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) console.error("Error cargando historial:", error);
      else setMediciones(data.reverse()); // Revertir para el gráfico (izq a der)
      
      setLoading(false);
    };

    fetchHistorial();

    // Suscripción en Tiempo Real (WebSockets de Supabase)
    const subscription = supabase
      .channel('clima_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mediciones' }, payload => {
        setMediciones(prev => {
          const newData = [...prev, payload.new];
          if (newData.length > 20) newData.shift(); // Mantener solo los últimos 20 datos
          return newData;
        });
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // Separar datos para los gráficos
  const tempDatos = mediciones.filter(m => m.tipo_variable === 'temperatura');
  const humDatos = mediciones.filter(m => m.tipo_variable === 'humedad');

  // Configuración de Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#8b949e' } },
      x: { grid: { display: false }, ticks: { color: '#8b949e', display: false } }
    }
  };

  const tempChart = {
    labels: tempDatos.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Temperatura (°C)',
      data: tempDatos.map(m => m.valor),
      borderColor: '#e34c26',
      backgroundColor: 'rgba(227, 76, 38, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  const humChart = {
    labels: humDatos.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Humedad (%)',
      data: humDatos.map(m => m.valor),
      borderColor: '#58a6ff',
      backgroundColor: 'rgba(88, 166, 255, 0.2)',
      fill: true,
      tension: 0.4
    }]
  };

  if (loading) return <div className="text-center p-5 text-white"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="w-100 p-3 p-md-4 text-white animation-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-0">Monitoreo Climático IoT</h2>
        <p className="text-github-muted mt-1">Backend histórico almacenado en Supabase</p>
      </div>

      {/* Tarjetas de Valores Actuales */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
            <h6 className="text-github-muted mb-2">ÚLTIMA TEMPERATURA</h6>
            <h2 className="fw-bold text-white mb-0">
              {tempDatos.length > 0 ? `${tempDatos[tempDatos.length - 1].valor} °C` : '--'}
            </h2>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
            <h6 className="text-github-muted mb-2">ÚLTIMA HUMEDAD</h6>
            <h2 className="fw-bold text-white mb-0">
              {humDatos.length > 0 ? `${humDatos[humDatos.length - 1].valor} %` : '--'}
            </h2>
          </div>
        </div>
      </div>

      {/* Gráficos Históricos */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
            <h5 className="text-white fw-bold mb-4">Histórico de Temperatura</h5>
            <div style={{ height: '250px' }}>
              {tempDatos.length > 0 ? <Line data={tempChart} options={chartOptions} /> : <p className="text-muted text-center mt-5">Esperando telemetría...</p>}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="bg-github-card p-4 rounded shadow-sm border border-secondary">
            <h5 className="text-white fw-bold mb-4">Histórico de Humedad</h5>
            <div style={{ height: '250px' }}>
              {humDatos.length > 0 ? <Line data={humChart} options={chartOptions} /> : <p className="text-muted text-center mt-5">Esperando telemetría...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimaHistorico;