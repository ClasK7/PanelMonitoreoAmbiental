import React, { useState } from 'react';

const TablaDatos = ({ locations, getSensorStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Un pequeño buscador interno solo para la tabla
  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (loc.country?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="col-md-10 p-5 bg-white" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-secondary mb-0">Registro Detallado de Telemetría</h2>
          <p className="text-muted mt-1 mb-0">Vista de administrador de base de datos de los nodos IoT.</p>
        </div>
        <div className="w-25">
          <input 
            type="text" 
            className="form-control border-secondary shadow-sm" 
            placeholder="🔍 Buscar nodo o país..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="text-center text-muted mt-5 p-5 bg-light rounded border border-dashed">
          <h1 className="display-1 mb-3">🗄️</h1>
          <h4>Base de datos vacía</h4>
          <p className="lead">No hay registros para mostrar. Regresa al Dashboard para descargar un nuevo paquete de datos.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <table className="table table-striped table-hover align-middle mb-0">
              <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th className="py-3">Estado</th>
                  <th className="py-3">ID Nodo</th>
                  <th className="py-3">Estación / Ubicación</th>
                  <th className="py-3">País</th>
                  <th className="py-3 text-center">Coordenadas (Lat, Lng)</th>
                  <th className="py-3">Proveedor de Red</th>
                  <th className="py-3">Parámetros (Hardware)</th>
                  <th className="py-3">Último Reporte (UTC)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => {
                    const status = getSensorStatus(loc.datetimeLast?.utc);
                    
                    return (
                      <tr key={loc.id}>
                        <td title={status.text} className="fs-5 text-center">{status.icon}</td>
                        <td className="text-muted fw-bold">#{loc.id}</td>
                        <td className="fw-bold text-dark">{loc.name}</td>
                        <td>{loc.country?.name || "Desconocido"}</td>
                        <td className="text-center font-monospace small">
                          {loc.coordinates?.latitude?.toFixed(4)}, {loc.coordinates?.longitude?.toFixed(4)}
                        </td>
                        <td className="small">{loc.provider?.name || "Red Pública"}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {loc.sensors?.map((sensor, idx) => (
                              <span key={idx} className="badge bg-info text-dark">
                                {sensor.parameter?.displayName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={`small fw-bold ${status.color}`}>
                          {loc.datetimeLast?.utc ? new Date(loc.datetimeLast.utc).toLocaleString() : 'Sin datos'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No se encontraron resultados para "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaDatos;