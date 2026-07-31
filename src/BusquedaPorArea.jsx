import React, { useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, DrawingManager } from '@react-google-maps/api';

const BusquedaPorArea = ({ isLoaded }) => {
  const [areaLocations, setAreaLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rectArea, setRectArea] = useState(null);

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

  const isNodeActive = (dateString) => {
    if (!dateString) return false;
    const lastUpdate = new Date(dateString);
    const diffHrs = (new Date() - lastUpdate) / (1000 * 60 * 60);
    return diffHrs < 24;
  };

  return (
    // 1. CORRECCIÓN MATEMÁTICA: col-md-10 en lugar de col-12 para que encaje junto al menú
    <div className="col-md-10 p-3 p-md-4" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      
      {/* CABECERA */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h2 className="fw-bold mb-0">Búsqueda Espacial (Bounding Box)</h2>
          <p className="opacity-75 mt-1 mb-0">Traza un cuadrante en el mapa para extraer la telemetría de los dispositivos en esa zona.</p>
        </div>
        {rectArea && (
          <div className="text-end d-none d-md-block">
            <small className="opacity-75 fw-bold d-block">BBOX (SW, NE):</small>
            <code className="p-1 px-2 rounded border text-danger">{rectArea}</code>
          </div>
        )}
      </div>

      {/* ZONA SUPERIOR: MAPA */}
      {/* Se removieron los fondos blancos forzados para respetar tu Dark Mode */}
      <div className="card shadow-sm border-0 mb-4" style={{ height: "45vh", background: "transparent" }}>
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
      <div className="card shadow-sm border-0 p-3" style={{ background: "transparent" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Resultados de la Extracción</h5>
          <span className="badge bg-primary fs-6 rounded-pill px-3 py-2">
            {areaLocations.length} Nodos encontrados
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p className="opacity-75">Procesando cuadrante espacial...</p>
          </div>
        ) : areaLocations.length === 0 ? (
          <div className="text-center py-5 rounded border-dashed opacity-50">
            <p className="mb-0">Dibuja un rectángulo en el mapa para ver los dispositivos.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead>
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
                      <td className="fw-bold opacity-75">{loc.id}</td>
                      <td className="fw-bold">{loc.name}</td>
                      <td>{loc.country?.name || "Desconocido"}</td>
                      <td>{loc.locality || loc.city || <span className="opacity-50 fst-italic">No disponible</span>}</td>
                      <td className="text-center fw-bold">{loc.sensors?.length || 0}</td>
                      <td className="text-center font-monospace small opacity-75">
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