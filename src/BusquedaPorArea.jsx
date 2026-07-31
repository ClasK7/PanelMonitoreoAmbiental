import React, { useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, DrawingManager } from '@react-google-maps/api';

const BusquedaPorArea = ({ isLoaded }) => {
  const [areaLocations, setAreaLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rectArea, setRectArea] = useState(null);

  // Centramos por defecto en Ecuador
  const defaultCenter = { lat: -1.0286, lng: -79.4635 }; 

  const handleRectangleComplete = async (rectangle) => {
    setLoading(true);
    
    // 1. Extraemos los límites (Bounds) del rectángulo dibujado
    const bounds = rectangle.getBounds();
    const sw = bounds.getSouthWest(); // Esquina inferior izquierda (Mínimos)
    const ne = bounds.getNorthEast(); // Esquina superior derecha (Máximos)

    // 2. Formateamos el bbox según la documentación de OpenAQ (minX, minY, maxX, maxY)
    const bboxString = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;
    setRectArea(bboxString);

    try {
      // 3. Hacemos la petición usando nuestro Proxy de Vercel
      const response = await axios.get(`/api-openaq/v3/locations?bbox=${bboxString}&limit=1000`, {
        headers: { 'X-API-Key': 'TU_API_KEY_OPENAQ' } // Pega tu clave real de OpenAQ aquí
      });
      
      if (response.data.results) {
        // Filtramos para asegurar que tengan coordenadas válidas
        const validos = response.data.results.filter(loc => loc.coordinates);
        setAreaLocations(validos);
      }
    } catch (error) {
      console.error("Error en búsqueda espacial:", error);
      alert("Hubo un error al consultar el área seleccionada.");
    }
    
    setLoading(false);
    // Borramos el rectángulo rojo para mantener el mapa limpio, ya que dibujaremos los marcadores
    rectangle.setMap(null); 
  };

  return (
    <div className="col-12 p-3 p-md-5 bg-white" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      <div className="mb-4">
        <h2 className="fw-bold text-secondary mb-0">Búsqueda Espacial (Bounding Box)</h2>
        <p className="text-muted mt-1">Selecciona la herramienta de rectángulo en el mapa y encierra un país o ciudad para extraer todos sus dispositivos.</p>
      </div>

      <div className="row g-4">
        {/* MAPA Y HERRAMIENTA DE DIBUJO */}
        <div className="col-md-8">
          <div className="card shadow-sm p-2 border-0" style={{ height: "60vh" }}>
            {isLoaded ? (
              <GoogleMap mapContainerStyle={{ height: "100%", width: "100%", borderRadius: "8px" }} zoom={5} center={defaultCenter}>
                <DrawingManager
                  onRectangleComplete={handleRectangleComplete}
                  options={{
                    drawingControl: true,
                    drawingControlOptions: {
                      position: window.google.maps.ControlPosition.TOP_CENTER,
                      drawingModes: [window.google.maps.drawing.OverlayType.RECTANGLE],
                    },
                    rectangleOptions: {
                      fillColor: '#e74c3c',
                      fillOpacity: 0.2,
                      strokeWeight: 2,
                      clickable: false,
                      editable: false,
                      zIndex: 1,
                    },
                  }}
                />
                
                {/* Dibujamos los sensores encontrados dentro del área */}
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
                <span className="text-muted">Cargando motor espacial...</span>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DE RESULTADOS */}
        <div className="col-md-4">
          <div className="card shadow-sm p-4 border-0 h-100 bg-light">
            <h5 className="fw-bold text-primary mb-3">Resultados del Área</h5>
            
            {loading ? (
              <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Analizando cuadrante espacial...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h1 className="display-4 fw-bold text-dark mb-0">{areaLocations.length}</h1>
                  <span className="text-muted">Nodos IoT encontrados</span>
                </div>
                
                {rectArea && (
                  <div className="mb-3">
                    <small className="text-muted fw-bold d-block">BBOX (SW lng, SW lat, NE lng, NE lat):</small>
                    <code className="bg-white p-2 d-block rounded border">{rectArea}</code>
                  </div>
                )}

                <hr/>
                <div className="table-responsive" style={{ maxHeight: "30vh", overflowY: "auto" }}>
                  <table className="table table-sm table-hover text-nowrap">
                    <tbody>
                      {areaLocations.map(loc => (
                        <tr key={loc.id}>
                          <td><strong>#{loc.id}</strong></td>
                          <td className="text-truncate" style={{maxWidth: "150px"}}>{loc.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusquedaPorArea;