import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, DrawingManager } from '@react-google-maps/api';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const BusquedaPorArea = ({ isLoaded }) => {
  const [areaLocations, setAreaLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rectArea, setRectArea] = useState(null);
  
  // Nuevos estados para ordenamiento y selección
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedNode, setSelectedNode] = useState(null);
  const [chartSensor, setChartSensor] = useState('PM2.5 µg/m³');

  const defaultCenter = { lat: -0.2298, lng: -78.5249 }; 

  const handleRectangleComplete = async (rectangle) => {
    setLoading(true);
    setSelectedNode(null); // Limpiamos selección al buscar nueva área
    
    const bounds = rectangle.getBounds();
    const sw = bounds.getSouthWest(); 
    const ne = bounds.getNorthEast(); 

    const bboxString = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;
    setRectArea(bboxString);

    try {
      const response = await axios.get(`/api-openaq/v3/locations?bbox=${bboxString}&limit=1000`, {
        headers: { 'X-API-Key': import.meta.env.VITE_OPENAQ_API_KEY } 
      });
      
      if (response.data.results) {
        const validos = response.data.results.filter(loc => loc.coordinates);
        setAreaLocations(validos);
      }
    } catch (error) {
      console.error("Error en búsqueda espacial:", error);
      alert("Hubo un error al consultar el área seleccionada.");
    }
    
    setLoading(false);
    rectangle.setMap(null); 
  };

  const isNodeActive = (dateString) => {
    if (!dateString) return false;
    const lastUpdate = new Date(dateString);
    const diffHrs = (new Date() - lastUpdate) / (1000 * 60 * 60);
    return diffHrs < 24;
  };

  // Lógica de Ordenamiento
  const handleSort = (key) => {
    let direction = 'desc'; // Por defecto mostrar activos primero al dar clic
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLocations = useMemo(() => {
    let sortableItems = [...areaLocations];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'estado') {
          const aActive = isNodeActive(a.datetimeLast?.utc) ? 1 : 0;
          const bActive = isNodeActive(b.datetimeLast?.utc) ? 1 : 0;
          return sortConfig.direction === 'asc' ? aActive - bActive : bActive - aActive;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [areaLocations, sortConfig]);

  // --- GENERACIÓN DE DATOS SIMULADOS PARA GRÁFICOS ---
  // (En producción, esto se reemplazaría por una llamada a tu API de Firebase)
  
  const lineChartData = {
    labels: ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [{
      label: chartSensor,
      data: [20, 17, 17.5, 16.5, 15, 15.2, 16.5, 19, 16.5, 18.2, 18.5, 19.8, 28, 28, 28.2, 22.5, 22, 27, 29.5, 35, 38, 42, 41, 21],
      borderColor: '#8b5cf6', // Morado exacto de tu captura
      backgroundColor: 'rgba(139, 92, 246, 0.15)', // Relleno translúcido
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#8b5cf6',
      borderWidth: 3
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)', borderDash: [5, 5] }, ticks: { color: '#9ca3af' }, min: 0, max: 50 },
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
    }
  };

  // Gráfico de Patrones (Barras Flotantes para simular el rango IQR)
  const patternData = {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{
      label: 'Rango del Percentil (25th - 75th)',
      data: [[9, 15], [8, 14], [8.5, 15.5], [10, 16], [12, 20], [13, 21], [11, 18], [9.5, 15.5]],
      backgroundColor: '#1e3a8a', // Azul oscuro de tu captura
      borderRadius: 4,
      barPercentage: 0.6
    }]
  };

  return (
    <div className="w-100 p-3 p-md-4 text-white">
      
      {/* CABECERA */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h2 className="fw-bold mb-0">Búsqueda Espacial (Bounding Box)</h2>
          <p className="opacity-75 mt-1 mb-0">Traza un cuadrante en el mapa para extraer la telemetría de los dispositivos en esa zona.</p>
        </div>
        {rectArea && (
          <div className="text-end d-none d-md-block">
            <small className="opacity-75 fw-bold d-block">BBOX (SW, NE):</small>
            <code className="p-1 px-2 rounded border border-secondary text-danger bg-dark">{rectArea}</code>
          </div>
        )}
      </div>

      {/* MAPA */}
      <div className="card shadow-sm border-0 mb-4 bg-transparent" style={{ height: "40vh" }}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ height: "100%", width: "100%", borderRadius: "8px" }} zoom={6} center={defaultCenter}>
            <DrawingManager
              onRectangleComplete={handleRectangleComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: { position: window.google.maps.ControlPosition.TOP_CENTER, drawingModes: [window.google.maps.drawing.OverlayType.RECTANGLE] },
                rectangleOptions: { fillColor: '#3498db', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#2980b9', clickable: false, editable: false, zIndex: 1 }
              }}
            />
            {areaLocations.map(loc => (
              <Marker key={`bbox-${loc.id}`} position={{ lat: loc.coordinates.latitude, lng: loc.coordinates.longitude }} title={loc.name} />
            ))}
          </GoogleMap>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100"><div className="spinner-border text-primary"></div></div>
        )}
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-white">Resultados de la Extracción</h5>
          <span className="badge bg-primary fs-6 rounded-pill px-3 py-2">{areaLocations.length} Nodos encontrados</span>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary mb-2"></div><p className="opacity-75">Procesando cuadrante...</p></div>
        ) : areaLocations.length === 0 ? (
          <div className="text-center py-5 rounded border border-secondary opacity-50"><p className="mb-0">Dibuja un rectángulo en el mapa para extraer los nodos.</p></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0 text-nowrap" style={{ backgroundColor: '#1c1c1c' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333' }}>
                  <th className="py-3 text-muted">ID</th>
                  <th className="py-3 text-muted">ESTACIÓN</th>
                  <th className="py-3 text-muted">PAÍS</th>
                  <th className="py-3 text-muted">LOCALIDAD</th>
                  <th className="py-3 text-center text-muted">SENSORES</th>
                  <th className="py-3 text-center text-muted">COORDENADAS</th>
                  {/* CABECERA CLICABLE PARA ORDENAR */}
                  <th className="py-3 text-center text-white" onClick={() => handleSort('estado')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    ESTADO {sortConfig.key === 'estado' ? (sortConfig.direction === 'asc' ? '↓' : '↑') : '↕'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLocations.map(loc => {
                  const isActive = isNodeActive(loc.datetimeLast?.utc);
                  const isSelected = selectedNode?.id === loc.id;
                  return (
                    <tr 
                      key={loc.id} 
                      onClick={() => setSelectedNode(loc)} 
                      style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                    >
                      <td className="fw-bold text-white">{loc.id}</td>
                      <td className="fw-bold text-white">{loc.name}</td>
                      <td className="text-light opacity-75">{loc.country?.name || "Desconocido"}</td>
                      <td className="text-light opacity-75">{loc.locality || loc.city || <span className="fst-italic">No disponible</span>}</td>
                      <td className="text-center fw-bold text-white">{loc.sensors?.length || 0}</td>
                      <td className="text-center font-monospace small text-light opacity-75">{loc.coordinates.latitude.toFixed(4)}, {loc.coordinates.longitude.toFixed(4)}</td>
                      <td className="text-center">
                        {isActive ? (
                          <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#14532d', color: '#4ade80', border: '1px solid #22c55e' }}>Activo</span>
                        ) : (
                          <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }}>Inactivo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PANEL DE DETALLES Y ANALÍTICA (Se muestra solo si hay un nodo seleccionado) --- */}
      {selectedNode && (
        <div className="animation-fade-in">
          
          {/* SECCIÓN 1: CARACTERÍSTICAS */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h5 className="text-muted fw-bold mb-4 tracking-wider fs-6">CHARACTERISTICS</h5>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="d-flex mb-3"><span className="text-muted w-25">Type</span><span className="text-white w-75 fw-medium d-flex align-items-center">Air sensor <span className="ms-2 rounded-circle bg-primary" style={{width: '10px', height:'10px'}}></span><br/>Stationary</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Owner</span><span className="text-white w-75 fw-medium">Administrador de Red Local</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Measures</span><span className="text-white w-75 fw-medium opacity-75">{selectedNode.sensors?.map(s => s.parameter?.displayName).join(', ') || 'Desconocido'}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Instrument(s)</span><span className="text-white w-75 fw-medium">Estación Multiparamétrica Genérica</span></div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex mb-3"><span className="text-muted w-25">Name</span><span className="text-white w-75 fw-medium">{selectedNode.name}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Reporting</span><span className="text-white w-75 fw-medium">Updated {isNodeActive(selectedNode.datetimeLast?.utc) ? 'recently' : 'days ago'}<br/><span className="opacity-75 small">Última lectura: {new Date(selectedNode.datetimeLast?.utc).toLocaleDateString()}</span></span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Provider</span><span className="text-white w-75 fw-medium">{selectedNode.provider?.name || 'OpenAQ Network'}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Licenses</span><span className="text-primary w-75 fw-medium text-decoration-underline cursor-pointer">CC BY 4.0</span></div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LATEST READINGS (Gráfico de Líneas) */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h4 className="fw-bold mb-4 text-info">Latest Readings</h4>
            
            {/* Controles del gráfico */}
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div>
                <label className="text-white small mb-1">Sensor</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary" value={chartSensor} onChange={(e) => setChartSensor(e.target.value)}>
                  {selectedNode.sensors?.map((s, i) => <option key={i} value={`${s.parameter?.displayName} ${s.parameter?.units}`}>{s.parameter?.displayName} {s.parameter?.units}</option>)}
                  <option value="PM2.5 µg/m³">PM2.5 µg/m³</option>
                </select>
              </div>
              <div>
                <label className="text-white small mb-1">Time range</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>Last 24 hours</option></select>
              </div>
              <div>
                <label className="text-white small mb-1">Scale type</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>Linear</option></select>
              </div>
              <div className="d-flex align-items-end"><button className="btn btn-sm text-white px-4" style={{ backgroundColor: '#0d9488' }}>Update</button></div>
            </div>

            {/* Renderizado de la Línea */}
            <div style={{ height: '300px' }}><Line data={lineChartData} options={lineChartOptions} /></div>
            
            <div className="mt-3 text-muted small d-flex align-items-center">
              <span className="fs-5 me-2">🕒</span> Chart shows local times (America/Guayaquil UTC-05:00)
            </div>
          </div>

          {/* SECCIÓN 3: PATTERNS (Gráfico de Cajas simulado) */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h4 className="fw-bold mb-4 text-info">Patterns</h4>
            
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div>
                <label className="text-white small mb-1">Sensor</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>PM1 µg/m³</option></select>
              </div>
              <div>
                <label className="text-white small mb-1">Time range</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>2026</option></select>
              </div>
              <div className="d-flex align-items-end"><button className="btn btn-sm text-white px-4" style={{ backgroundColor: '#0d9488' }}>Update</button></div>
            </div>

            <h6 className="text-white fw-bold mb-3">Hour of day</h6>
            <button className="btn btn-sm btn-outline-secondary mb-4 text-white">View as table 📊</button>

            {/* Renderizado de Patrones (Barras flotantes) */}
            <div style={{ height: '300px' }}>
              <Bar 
                data={patternData} 
                options={{
                  responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' }, min: 0, max: 35 },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                  }
                }} 
              />
            </div>

            <div className="mt-3 text-muted small d-flex align-items-center">
              <span className="fs-5 me-2">🕒</span> Chart shows local times (America/Guayaquil UTC-05:00)
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default BusquedaPorArea;