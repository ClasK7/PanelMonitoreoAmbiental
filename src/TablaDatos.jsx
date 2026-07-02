import React, { useState } from 'react';

const TablaDatos = ({ locations, getSensorStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (loc.country?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="col-md-10 p-3 p-md-5 bg-white" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* CORRECCIÓN: Apilamiento del buscador en móviles */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-secondary mb-0">Registro de Telemetría</h2>
          <p className="text-muted mt-1 mb-0">Base de datos de los nodos IoT.</p>
        </div>
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <input type="text" className="form-control border-secondary shadow-sm" placeholder="🔍 Buscar nodo o país..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="text-center text-muted mt-5 p-5 bg-light rounded border border-dashed">
          <h4>Base de datos vacía</h4>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {/* CORRECCIÓN: text-nowrap evita que el texto se aplaste hacia abajo */}
            <table className="table table-striped table-hover align-middle mb-0 text-nowrap">
              <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th className="py-3">Estado</th>
                  <th className="py-3">ID Nodo</th>
                  <th className="py-3">Estación / Ubicación</th>
                  <th className="py-3">País</th>
                  <th className="py-3 text-center">Coordenadas</th>
                  <th className="py-3">Último Reporte (UTC)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredLocations.map((loc) => {
                  const status = getSensorStatus(loc.datetimeLast?.utc);
                  return (
                    <tr key={loc.id}>
                      <td className="fs-5 text-center">{status.icon}</td>
                      <td className="text-muted fw-bold">#{loc.id}</td>
                      <td className="fw-bold text-dark">{loc.name}</td>
                      <td>{loc.country?.name || "Desconocido"}</td>
                      <td className="text-center font-monospace small">
                        {loc.coordinates?.latitude?.toFixed(4)}, {loc.coordinates?.longitude?.toFixed(4)}
                      </td>
                      <td className={`small fw-bold ${status.color}`}>
                        {loc.datetimeLast?.utc ? new Date(loc.datetimeLast.utc).toLocaleString() : 'Sin datos'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default TablaDatos;