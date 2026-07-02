import React, { useMemo } from 'react';

const AlertasActivas = ({ locations, getSensorStatus }) => {
  
  // Motor de Inferencia de Alertas: Filtra solo los sensores con problemas
  const activeAlerts = useMemo(() => {
    const alerts = [];
    
    locations.forEach(loc => {
      const status = getSensorStatus(loc.datetimeLast?.utc);
      
      // Si el sensor está intermitente (Amarillo) o muerto (Rojo), generamos una alerta
      if (status.icon === "🔴" || status.icon === "🟡") {
        alerts.push({
          id: loc.id,
          name: loc.name,
          country: loc.country?.name || "Desconocido",
          statusIcon: status.icon,
          timeText: status.text,
          severity: status.icon === "🔴" ? "danger" : "warning",
          issueTitle: status.icon === "🔴" ? "Pérdida de Conexión (Timeout Crítico)" : "Conexión Inestable (Latencia Alta)",
          action: status.icon === "🔴" ? "Requiere revisión física de hardware o suministro eléctrico." : "Monitorear paquetes de red y reinicio remoto."
        });
      }
    });

    // Ordenar para que las alertas Rojas (críticas) aparezcan arriba
    return alerts.sort((a, b) => {
      if (a.severity === 'danger' && b.severity === 'warning') return -1;
      if (a.severity === 'warning' && b.severity === 'danger') return 1;
      return 0;
    });
  }, [locations, getSensorStatus]);

  return (
    <div className="col-md-10 p-5 bg-white" style={{ maxHeight: "100vh", overflowY: "auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-secondary mb-0">Centro de Alertas (NOC)</h2>
          <p className="text-muted mt-1 mb-0">Monitoreo automático de fallos en la infraestructura IoT.</p>
        </div>
        <div className="text-end">
          <span className={`badge ${activeAlerts.length > 0 ? 'bg-danger' : 'bg-success'} fs-5 px-4 py-2 shadow-sm`}>
            {activeAlerts.length} Alertas Activas
          </span>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="text-center text-muted mt-5 p-5 bg-light rounded border border-dashed">
          <h1 className="display-1 mb-3">😴</h1>
          <h4>Sistema en Reposo</h4>
          <p className="lead">Carga los datos desde el Dashboard para iniciar el análisis de fallos en la red.</p>
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="text-center text-success mt-5 p-5 bg-light rounded border border-success border-opacity-25">
          <h1 className="display-1 mb-3">✅</h1>
          <h4>Todo el sistema opera con normalidad</h4>
          <p className="lead">Los {locations.length} sensores analizados están respondiendo en tiempo real.</p>
        </div>
      ) : (
        <div className="row g-3">
          {activeAlerts.map((alert, index) => (
            <div className="col-12" key={`${alert.id}-${index}`}>
              <div className={`alert alert-${alert.severity} shadow-sm border-start border-5 d-flex align-items-center justify-content-between mb-0`} role="alert">
                <div>
                  <h5 className="alert-heading fw-bold mb-1">
                    {alert.statusIcon} {alert.issueTitle}
                  </h5>
                  <p className="mb-0 text-dark">
                    <strong>Nodo afectado:</strong> #{alert.id} - {alert.name} ({alert.country})
                  </p>
                  <hr className="my-2" />
                  <p className="mb-0 small">
                    <strong>Sugerencia del sistema:</strong> {alert.action}
                  </p>
                </div>
                <div className="text-end ms-3">
                  <span className={`badge bg-${alert.severity} text-dark bg-opacity-25 border border-${alert.severity} p-2`}>
                    Desconectado: {alert.timeText}
                  </span>
                  <div className="mt-2">
                    <button className={`btn btn-sm btn-outline-${alert.severity} fw-bold`}>
                      Crear Ticket
                    </button>
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