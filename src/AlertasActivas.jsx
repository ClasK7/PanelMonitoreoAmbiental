import React, { useMemo } from 'react';

const AlertasActivas = ({ locations, getSensorStatus }) => {
  const activeAlerts = useMemo(() => {
    const alerts = [];
    locations.forEach(loc => {
      const status = getSensorStatus(loc.datetimeLast?.utc);
      if (status.icon === "🔴" || status.icon === "🟡") {
        alerts.push({
          id: loc.id, name: loc.name, country: loc.country?.name || "Desconocido",
          statusIcon: status.icon, timeText: status.text,
          severity: status.icon === "🔴" ? "danger" : "warning",
          issueTitle: status.icon === "🔴" ? "Pérdida de Conexión" : "Conexión Inestable",
          action: status.icon === "🔴" ? "Revisión física requerida." : "Monitorear red."
        });
      }
    });
    return alerts.sort((a, b) => a.severity === 'danger' ? -1 : 1);
  }, [locations, getSensorStatus]);

  return (
    <div className="col-md-10 p-3 p-md-5 bg-white" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      {/* CORRECCIÓN: Flex-column en móviles, Flex-row en PC */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-secondary mb-0">Centro de Alertas</h2>
          <p className="text-muted mt-1 mb-0">Monitoreo automático de fallos.</p>
        </div>
        <div className="text-start text-md-end">
          <span className={`badge ${activeAlerts.length > 0 ? 'bg-danger' : 'bg-success'} fs-5 px-4 py-2 shadow-sm`}>
            {activeAlerts.length} Alertas
          </span>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="text-center text-muted mt-5 p-5 bg-light rounded border border-dashed">
          <h4>Sistema en Reposo</h4>
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="text-center text-success mt-5 p-5 bg-light rounded border border-success border-opacity-25">
          <h4>Todo el sistema opera con normalidad</h4>
        </div>
      ) : (
        <div className="row g-3">
          {activeAlerts.map((alert, index) => (
            <div className="col-12" key={`${alert.id}-${index}`}>
              {/* CORRECCIÓN: flex-column para apilar en móviles */}
              <div className={`alert alert-${alert.severity} shadow-sm border-start border-5 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-0`} role="alert">
                <div>
                  <h5 className="alert-heading fw-bold mb-1">{alert.statusIcon} {alert.issueTitle}</h5>
                  <p className="mb-0 text-dark"><strong>Nodo:</strong> #{alert.id} - {alert.name}</p>
                  <hr className="my-2" />
                  <p className="mb-0 small"><strong>Sugerencia:</strong> {alert.action}</p>
                </div>
                {/* CORRECCIÓN: Margen superior en móviles */}
                <div className="text-start text-md-end mt-3 mt-md-0">
                  <span className={`badge bg-${alert.severity} text-dark bg-opacity-25 border border-${alert.severity} p-2`}>
                    Desconectado: {alert.timeText}
                  </span>
                  <div className="mt-2">
                    <button className={`btn btn-sm btn-outline-${alert.severity} fw-bold`}>Crear Ticket</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AlertasActivas;