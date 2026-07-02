import React from 'react';
import { Bar, Line } from 'react-chartjs-2';

const GraficoEnLinea = ({ selectedLocation, setActiveView, chartData, bigChartData }) => {
  return (
    <div className="col-md-10 p-5 bg-white">
      <h2 className="fw-bold text-secondary mb-4">Análisis de Telemetría en Tiempo Real</h2>
      
      {selectedLocation ? (
        <div className="row">
          <div className="col-12 mb-4">
            <div className="alert alert-info border-0 shadow-sm">
              <strong>Sensor Activo:</strong> Analizando datos de la estación <u>{selectedLocation.name}</u> en {selectedLocation.country?.name || "Desconocido"}.
            </div>
          </div>
          
          <div className="col-md-8">
            <div className="card shadow-sm p-4 border-0 h-100">
              <h5 className="text-muted mb-4">Fluctuación de Contaminantes (Últimos 7 días)</h5>
              <div style={{ height: "400px" }}>
                <Line data={bigChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm p-4 border-0 h-100">
              <h5 className="text-muted mb-4">Distribución por Parámetro</h5>
              <div style={{ height: "400px" }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted mt-5 py-5 bg-light rounded border border-dashed">
          <h1 className="display-1 mb-3">📊</h1>
          <h4>No hay ningún sensor seleccionado</h4>
          <p className="lead">Vuelve al <strong>Dashboard</strong>, selecciona una estación en el mapa o en la tabla, y regresa a esta pestaña para ver sus gráficos detallados.</p>
          <button className="btn btn-primary mt-3" onClick={() => setActiveView('dashboard')}>
            Volver al Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default GraficoEnLinea;