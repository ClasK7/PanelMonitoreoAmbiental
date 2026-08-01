import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, DrawingManager } from '@react-google-maps/api';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const BusquedaPorArea = ({ isLoaded }) => {
  const [areaLocations, setAreaLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rectArea, setRectArea] = useState(null);
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedNode, setSelectedNode] = useState(null);
  const [chartSensor, setChartSensor] = useState('');

  const defaultCenter = { lat: -0.2298, lng: -78.5249 }; 

  // Cuando se selecciona un nuevo nodo, el menú desplegable del gráfico 
  // se ajusta automáticamente al primer sensor que tenga disponible esa estación.
  useEffect(() => {
    if (selectedNode && selectedNode.sensors && selectedNode.sensors.length > 0) {
      setChartSensor(`${selectedNode.sensors[0].parameter.displayName} ${selectedNode.sensors[0].parameter.units}`);
    }
  }, [selectedNode]);

  const handleRectangleComplete = async (rectangle) => {
    setLoading(true);
    setSelectedNode(null); 
    
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

  const handleSort = (key) => {
    let direction = 'desc'; 
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

  // --- GENERADOR DE DATOS DINÁMICOS PARA GRÁFICOS ---
  // Crea una curva visual única basada en el ID del nodo para simular telemetría en tiempo real
  const generateDynamicData = (baseId, isPattern = false) => {
    if (!baseId) return [];
    let seed = baseId % 30; // Usamos el ID del nodo como "semilla" matemática
    const data = [];
    for (let i = 0; i < (isPattern ? 8 : 24); i++) {
      let noise = Math.sin(i + seed) * 10;
      let val = Math.abs(15 + noise + (Math.random() * 5));
      
      if (isPattern) {
        data.push([Math.max(0, val - 5), val + 5]); // Genera rangos [min, max] para las cajas
      } else {
        data.push(val); // Puntos de línea
      }
    }
    return data;
  };

  const lineChartData = {
    labels: ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [{
      label: chartSensor,
      data: generateDynamicData(selectedNode?.id, false),
      borderColor: '#8b5cf6', 
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#8b5cf6',
      borderWidth: 3
    }]
  };

  const lineChartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)', borderDash: [5, 5] }, ticks: { color: '#9ca3af' }, min: 0 },
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
    }
  };

  const patternData = {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{
      label: 'Rango del Percentil (25th - 75th)',
      data: generateDynamicData(selectedNode?.id, true),
      backgroundColor: '#1e3a8a', 
      borderRadius: 4,
      barPercentage: 0.6
    }]
  };

  return (
    <div className="w-100 p-3 p-md-4 text-white">
      
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

      {selectedNode && (
        <div className="animation-fade-in">
          
          {/* SECCIÓN 1: CARACTERÍSTICAS (Traducido y Dinámico) */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h5 className="text-muted fw-bold mb-4 tracking-wider fs-6">CARACTERÍSTICAS</h5>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="d-flex mb-3"><span className="text-muted w-25">Tipo</span><span className="text-white w-75 fw-medium d-flex align-items-center">{selectedNode.sensorType === 'reference grade' ? 'Grado de referencia' : 'Sensor de aire'} <span className={`ms-2 rounded-circle ${selectedNode.sensorType === 'reference grade' ? 'bg-primary' : 'bg-secondary'}`} style={{width: '10px', height:'10px'}}></span><br/>Estacionario</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Propietario</span><span className="text-white w-75 fw-medium">{selectedNode.owner?.name || 'Organización Desconocida'}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Parámetros</span><span className="text-white w-75 fw-medium opacity-75">{selectedNode.sensors?.map(s => s.parameter?.displayName).join(', ') || 'Desconocido'}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Instrumento(s)</span><span className="text-white w-75 fw-medium">{selectedNode.manufacturers?.map(m => m.modelName).join(', ') || 'Monitor de Red (IoT)'}</span></div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex mb-3"><span className="text-muted w-25">Nombre</span><span className="text-white w-75 fw-medium">{selectedNode.name}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Reporte</span><span className="text-white w-75 fw-medium">Actualizado {isNodeActive(selectedNode.datetimeLast?.utc) ? 'recientemente' : 'hace días'}<br/><span className="opacity-75 small">Reportando desde {selectedNode.datetimeFirst?.utc ? new Date(selectedNode.datetimeFirst.utc).toLocaleDateString() : 'fecha desconocida'}</span></span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Proveedor</span><span className="text-white w-75 fw-medium">{selectedNode.provider?.name || 'OpenAQ'}</span></div>
                <div className="d-flex mb-3"><span className="text-muted w-25">Licencias</span><span className="text-primary w-75 fw-medium text-decoration-underline cursor-pointer">{selectedNode.licenses?.map(l => l.name).join(', ') || 'Dominio Público'}</span></div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ÚLTIMAS LECTURAS (Dinámico según sensor seleccionado) */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h4 className="fw-bold mb-4 text-info">Últimas Lecturas</h4>
            
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div>
                <label className="text-white small mb-1">Sensor</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary" value={chartSensor} onChange={(e) => setChartSensor(e.target.value)}>
                  {selectedNode.sensors?.map((s, i) => <option key={i} value={`${s.parameter?.displayName} ${s.parameter?.units}`}>{s.parameter?.displayName} {s.parameter?.units}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white small mb-1">Rango de tiempo</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>Últimas 24 horas</option></select>
              </div>
              <div>
                <label className="text-white small mb-1">Tipo de escala</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>Lineal</option></select>
              </div>
              <div className="d-flex align-items-end"><button className="btn btn-sm text-white px-4" style={{ backgroundColor: '#0d9488' }}>Actualizar</button></div>
            </div>

            <div style={{ height: '300px' }}><Line data={lineChartData} options={lineChartOptions} /></div>
            
            <div className="mt-3 text-muted small d-flex align-items-center">
              <span className="fs-5 me-2">🕒</span> El gráfico muestra la hora local (America/Guayaquil UTC-05:00)
            </div>
          </div>

          {/* SECCIÓN 3: PATRONES */}
          <div className="card shadow-sm border-0 p-4 mb-4" style={{ backgroundColor: '#1c1c1c' }}>
            <h4 className="fw-bold mb-4 text-info">Patrones</h4>
            
            <div className="d-flex flex-wrap gap-3 mb-4">
              <div>
                <label className="text-white small mb-1">Sensor</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary" value={chartSensor} onChange={(e) => setChartSensor(e.target.value)}>
                   {selectedNode.sensors?.map((s, i) => <option key={i} value={`${s.parameter?.displayName} ${s.parameter?.units}`}>{s.parameter?.displayName} {s.parameter?.units}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white small mb-1">Rango de tiempo</label>
                <select className="form-select form-select-sm bg-dark text-white border-secondary"><option>2026</option></select>
              </div>
              <div className="d-flex align-items-end"><button className="btn btn-sm text-white px-4" style={{ backgroundColor: '#0d9488' }}>Actualizar</button></div>
            </div>

            <h6 className="text-white fw-bold mb-3">Hora del día</h6>
            <button className="btn btn-sm btn-outline-secondary mb-4 text-white">Ver como tabla 📊</button>

            <div style={{ height: '300px' }}>
              <Bar 
                data={patternData} 
                options={{
                  responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' }, min: 0 },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                  }
                }} 
              />
            </div>

            <div className="mt-3 text-muted small d-flex align-items-center">
              <span className="fs-5 me-2">🕒</span> El gráfico muestra la hora local (America/Guayaquil UTC-05:00)
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default BusquedaPorArea;