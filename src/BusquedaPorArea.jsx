import React, { useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, DrawingManager } from '@react-google-maps/api';

const BusquedaPorArea = ({ isLoaded }) => {
  const [areaLocations, setAreaLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rectArea, setRectArea] = useState(null);

  // Centro inicial ajustado a las coordenadas de Quito
  const defaultCenter = { lat: -0.2298, lng: -78.5249 }; 

  const handleRectangleComplete = async (rectangle) => {
    setLoading(true);
    
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

  // Función interna para determinar si el nodo está vivo (Reportó en las últimas 24h)
  const isNodeActive = (dateString) => {
    if (!dateString) return false;
    const lastUpdate = new Date(dateString);
    const diffHrs = (new Date() - lastUpdate) / (1000 * 60 * 60);
    return diffHrs < 24;
  };

  return (
    <div className="col-12 p-3 p-md-4 bg-light" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      
      {/* CABECERA */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h2 className="fw-bold text-secondary mb-0">Búsqueda Espacial (Bounding Box)</h2>
          <p className="text-muted mt-1 mb-0">Traza un cuadrante en el mapa para extraer la telemetría de los dispositivos en esa zona.</p>
        </div>
        {rectArea && (
          <div className="text-end d-none d-md-block">
            <small className="text-muted fw-bold d-block">BBOX (SW, NE):</small>
            <code className="bg-white p-1 px-2 rounded border text-danger">{rectArea}</code>
          </div>
        )}
      </div>

      {/* ZONA SUPERIOR: MAPA (Ancho Completo) */}
      <div className="card shadow-sm border-0 mb-4" style={{ height: "45vh" }}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ height: "100%", width: "100%", borderRadius: "8px" }} zoom={6} center={defaultCenter}>
            <DrawingManager
              onRectangleComplete={handleRectangleComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: window.google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [window.google.maps.drawing.OverlayType.RECTANGLE],
                },
                rectangleOptions: {
                  fillColor: '#3498db',
                  fillOpacity: 0.2,
                  strokeWeight: 2,
                  strokeColor: '#2980b9',
                  clickable: false,
                  editable: false,
                  zIndex: 1,
                },
              }}
            />
            
            {areaLocations.map(loc => (
              <Marker 
                key={`bbox-${loc.id}`} 
                position={{ lat: loc.coordinates.latitude, lng: loc.coordinates.longitude }} 
                title={loc.name}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        )}
      </div>

      {/* ZONA INFERIOR: TABLA DE RESULTADOS */}
      <div className="card shadow-sm border-0 bg-white p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-secondary mb-0">Resultados de la Extracción</h5>
          <span className="badge bg-primary fs-6 rounded-pill px-3 py-2">
            {areaLocations.length} Nodos encontrados
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p className="text-muted">Procesando cuadrante espacial...</p>
          </div>
        ) : areaLocations.length === 0 ? (
          <div className="text-center py-5 bg-light rounded border-dashed">
            <p className="text-muted mb-0">Dibuja un rectángulo en el mapa para ver los dispositivos.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 text-nowrap">
              <thead className="table-dark">
                <tr>
                  <th className="py-3">ID</th>
                  <th className="py-3">ESTACIÓN</th>
                  <th className="py-3">PAÍS</th>
                  <th className="py-3">LOCALIDAD</th>
                  <th className="py-3 text-center">SENSORES</th>
                  <th className="py-3 text-center">COORDENADAS</th>
                  <th className="py-3 text-center">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {areaLocations.map(loc => {
                  const isActive = isNodeActive(loc.datetimeLast?.utc);
                  return (
                    <tr key={loc.id}>
                      <td className="fw-bold text-muted">{loc.id}</td>
                      <td className="fw-bold text-dark">{loc.name}</td>
                      <td>{loc.country?.name || "Desconocido"}</td>
                      {/* OpenAQ a veces manda locality o city, validamos ambas o ponemos "No disponible" */}
                      <td>{loc.locality || loc.city || <span className="text-muted fst-italic">No disponible</span>}</td>
                      <td className="text-center fw-bold">{loc.sensors?.length || 0}</td>
                      <td className="text-center font-monospace small text-muted">
                        {loc.coordinates.latitude.toFixed(4)}, {loc.coordinates.longitude.toFixed(4)}
                      </td>
                      <td className="text-center">
                        {isActive ? (
                          <span className="badge rounded-pill bg-success px-3 py-2 shadow-sm">Activo</span>
                        ) : (
                          <span className="badge rounded-pill bg-danger px-3 py-2 shadow-sm opacity-75">Inactivo</span>
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
    </div>
  );
};

export default BusquedaPorArea;