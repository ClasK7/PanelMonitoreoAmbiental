import React from 'react';

const TarjetasIoT = ({ locations, getSensorStatus }) => {
  return (
    <div className="w-100 p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-secondary mb-0">Gestión de Nodos IoT</h2>
        <span className="badge bg-primary fs-6 py-2 px-3 shadow-sm">
          {locations.length} Nodos en Red
        </span>
      </div>
      
      <p className="text-muted mb-4 border-bottom pb-3">
        Monitoreo individual del hardware desplegado. Cada tarjeta representa una estación remota de telemetría ambiental.
      </p>

      {locations.length === 0 ? (
        <div className="text-center text-muted mt-5 p-5 bg-light rounded border border-dashed">
          <h1 className="display-1 mb-3">📡</h1>
          <h4>Red Vacía o Sin Conexión</h4>
          <p className="lead">No hay dispositivos en memoria. Asegúrate de haber cargado la red desde el Dashboard principal.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 pb-4">
          {locations.map((loc) => {
            // Reutilizamos la función de tiempo para saber si el nodo está vivo
            const status = getSensorStatus(loc.datetimeLast?.utc);
            
            return (
              <div className="col" key={loc.id}>
                <div className="card h-100 border-0 shadow-sm hover-shadow transition" style={{ backgroundColor: '#fdfdfd' }}>
                  
                  {/* Cabecera de la Tarjeta */}
                  <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-start">
                    <h6 className="fw-bold text-dark text-truncate pe-2 mb-0" title={loc.name}>
                      📍 {loc.name}
                    </h6>
                    <span title={status.text} style={{ cursor: "help" }}>{status.icon}</span>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="card-body py-2">
                    <p className="card-text mb-1 small text-muted">
                      <strong>Ubicación:</strong> {loc.country?.name || 'Desconocido'}
                    </p>
                    <p className="card-text mb-3 small text-muted">
                      <strong>Coordenadas:</strong> {loc.coordinates?.latitude?.toFixed(3)}, {loc.coordinates?.longitude?.toFixed(3)}
                    </p>
                    
                    <div className="mt-3">
                      <span className="small fw-bold text-secondary d-block mb-2">Módulos de Hardware:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {loc.sensors && loc.sensors.length > 0 ? (
                          loc.sensors.map((sensor, idx) => (
                            <span key={idx} className="badge bg-secondary bg-opacity-75 text-white fw-normal">
                              {sensor.parameter?.displayName} <small className="opacity-75">({sensor.parameter?.units})</small>
                            </span>
                          ))
                        ) : (
                          <span className="badge bg-light text-muted border">Sin lectura</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pie de la Tarjeta */}
                  <div className="card-footer bg-transparent border-top-0 pb-3 pt-0 text-end">
                    <small className={`fw-bold ${status.color}`}>
                      Último ping: {status.text.replace('Hace', '').trim()}
                    </small>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TarjetasIoT;