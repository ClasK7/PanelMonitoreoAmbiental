import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // <-- Tu archivo CSS conectado

import GraficoEnLinea from './GraficosEnLinea';
import TarjetasIoT from './TarjetasIoT';
import TablaDatos from './TablaDatos';
import AlertasActivas from './AlertasActivas';

const App = () => {
  // Cargador inteligente de Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCPiibj5tq0cloahKf1km4p9j361spYwx0" // <-- PEGA AQUÍ TU CLAVE DE GOOGLE
  });

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [inputLimit, setInputLimit] = useState(100);
  const [fetchLimit, setFetchLimit] = useState(100); 

  const cargarDatosRespaldo = () => {
    setLocations([
      { id: 1, name: "Estación UTEQ (Simulación)", country: { name: "Ecuador" }, coordinates: { latitude: -1.0286, longitude: -79.4635 }, isMobile: false, sensors: [{ parameter: { name: "pm25", displayName: "PM2.5", units: "µg/m³" } }], provider: { name: "Red Telemática Wokwi" }, datetimeLast: { utc: new Date().toISOString() } },
      { id: 2, name: "Estación Antigua", country: { name: "Ecuador" }, coordinates: { latitude: -0.2298, longitude: -78.5249 }, isMobile: false, sensors: [{ parameter: { name: "co2", displayName: "CO2", units: "ppm" } }], provider: { name: "Red Pública" }, datetimeLast: { utc: "2024-01-01T00:00:00Z" } },
      { id: 3, name: "Sensor Bogotá", country: { name: "Colombia" }, coordinates: { latitude: 4.6097, longitude: -74.0817 }, isMobile: true, sensors: [{ parameter: { name: "pm10", displayName: "PM10", units: "µg/m³" } }], provider: { name: "Dron Móvil" }, datetimeLast: { utc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() } }
    ]);
  };

  const getSensorStatus = (dateString) => {
    if (!dateString) return { icon: "⚪", text: "Desconocido", color: "text-muted" };
    const lastUpdate = new Date(dateString);
    const diffHrs = (new Date() - lastUpdate) / (1000 * 60 * 60);

    if (diffHrs < 1) return { icon: "🟢", text: "Hace minutos", color: "text-success" };
    if (diffHrs < 24) return { icon: "🟢", text: `Hace ${Math.floor(diffHrs)}h`, color: "text-success" };
    if (diffHrs < 168) return { icon: "🟡", text: `Hace ${Math.floor(diffHrs / 24)} días`, color: "text-warning" };
    return { icon: "🔴", text: `Hace ${Math.floor(diffHrs / 24)} días`, color: "text-danger" };
  };

  const uniqueCountries = useMemo(() => {
    const countries = locations.map(loc => loc.country?.name).filter(Boolean);
    return [...new Set(countries)].sort();
  }, [locations]);

  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];
    if (selectedCountry) result = result.filter(loc => loc.country?.name === selectedCountry);
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = sortConfig.key === 'country' ? (a.country?.name || '') : new Date(a.datetimeLast?.utc || 0).getTime();
        let bValue = sortConfig.key === 'country' ? (b.country?.name || '') : new Date(b.datetimeLast?.utc || 0).getTime();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [locations, selectedCountry, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    setLoading(true);
    axios.get(`/api-openaq/v3/locations?limit=${fetchLimit}`, {
      headers: { 'X-API-Key': '8b9668b0efee71fb9fd9f6744aca66a048aa1f5557cd3773e647306e04584d3a' } // <-- PEGA AQUÍ TU CLAVE DE OPENAQ
    })
      .then(response => {
        if (response.data.results && response.data.results.length > 0) {
          const validLocations = response.data.results.filter(loc => loc.coordinates && loc.coordinates.latitude);
          setLocations(validLocations);
          setSelectedCountry(''); 
        } else { cargarDatosRespaldo(); }
        setLoading(false);
      })
      .catch(error => {
        console.error("Fallo de conexión:", error);
        cargarDatosRespaldo();
        setLoading(false);
      });
  }, [fetchLimit]); 

  const defaultCenter = { lat: 0, lng: 0 }; 

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [{ label: 'Niveles de Medición', data: [12, 19, 15, 25, 22, 18, 10], backgroundColor: '#3498db', borderColor: '#2980b9', borderWidth: 1 }]
  };

  const bigChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      { label: 'Sensor Primario', data: [45, 52, 38, 65, 48, 50, 42], borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.2)', fill: true, tension: 0.4 },
      { label: 'Promedio Regional', data: [40, 42, 45, 45, 43, 40, 38], borderColor: '#2ecc71', backgroundColor: 'transparent', borderDash: [5, 5], tension: 0.4 }
    ]
  };

  return (
    <div className="container-fluid p-0 dashboard-container">
      <nav className="navbar navbar-dark" style={{ backgroundColor: '#2c3e50' }}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fs-5">Monitoreo Ambiental (OpenAQ V3)</span>
        </div>
      </nav>

      <div className="row g-0">
        {/* Menú lateral (Responsivo) */}
        <div className="col-md-2 p-3 text-white sidebar-menu" style={{ minHeight: 'auto' }}>
          <ul className="nav flex-row flex-md-column gap-2 flex-nowrap overflow-x-auto pb-2 pb-md-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <li className="nav-item">
              <span className={`nav-link text-nowrap ${activeView === 'dashboard' ? 'text-white fw-bold border-bottom border-md-start border-3 border-info bg-dark bg-opacity-25' : 'text-white opacity-75'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveView('dashboard')}>📊 Dashboard</span>
            </li>
            <li className="nav-item">
              <span className={`nav-link text-nowrap ${activeView === 'grafico' ? 'text-white fw-bold border-bottom border-md-start border-3 border-info bg-dark bg-opacity-25' : 'text-white opacity-75'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveView('grafico')}>📈 Gráfico en línea</span>
            </li>
            <li className="nav-item">
              <span className={`nav-link text-nowrap ${activeView === 'tarjetas' ? 'text-white fw-bold border-bottom border-md-start border-3 border-info bg-dark bg-opacity-25' : 'text-white opacity-75'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveView('tarjetas')}>💳 Tarjetas IoT</span>
            </li>
            <li className="nav-item">
              <span className={`nav-link text-nowrap ${activeView === 'tablas' ? 'text-white fw-bold border-bottom border-md-start border-3 border-info bg-dark bg-opacity-25' : 'text-white opacity-75'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveView('tablas')}>📋 Tablas de datos</span>
            </li>
            <li className="nav-item border-md-top border-secondary mt-md-4 pt-md-4">
              <span className={`nav-link text-nowrap ${activeView === 'alertas' ? 'text-danger fw-bold border-bottom border-md-start border-3 border-danger bg-dark bg-opacity-25' : 'text-danger opacity-75'}`} style={{ cursor: 'pointer' }} onClick={() => setActiveView('alertas')}>⚠️ Alertas Activas</span>
            </li>
          </ul>
        </div>

        {activeView === 'dashboard' && (
          <>
            <div className="col-md-7 p-3 p-md-4">
              <div className="row mb-4 g-3">
                <div className="col-12 col-md-3">
                  <div className="card shadow-sm p-3 border-0 bg-white h-100">
                    <h6 className="text-muted fw-bold mb-1 small">SENSORES EN PANTALLA</h6>
                    <h3 className="text-primary fw-bold mb-0">{loading ? "..." : filteredAndSortedLocations.length}</h3>
                  </div>
                </div>
                
                <div className="col-12 col-md-4">
                  <div className="card shadow-sm p-3 border-0 bg-white h-100">
                    <label className="text-muted fw-bold mb-2 small">CANTIDAD A DESCARGAR:</label>
                    <div className="input-group">
                      <input type="number" className="form-control border-secondary" value={inputLimit} onChange={(e) => setInputLimit(e.target.value)} min="1" max="2000"/>
                      <button className="btn btn-primary" onClick={() => { if(inputLimit > 0) setFetchLimit(inputLimit); }} disabled={loading}>Cargar</button>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-5">
                  <div className="card shadow-sm p-3 border-0 bg-white h-100">
                    <label className="text-muted fw-bold mb-2 small">FILTRAR RED POR PAÍS:</label>
                    <select className="form-select border-secondary" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                      <option value="">🌍 Todos los Países (Global)</option>
                      {uniqueCountries.map(country => ( <option key={country} value={country}>{country}</option> ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm mb-4 p-2 border-0 map-container">
                {isLoaded ? (
                  <GoogleMap mapContainerStyle={{height: "100%", width: "100%", borderRadius: "8px"}} zoom={2} center={defaultCenter}>
                    {filteredAndSortedLocations.map(loc => (
                      <Marker key={loc.id} position={{ lat: loc.coordinates.latitude, lng: loc.coordinates.longitude }} onClick={() => setSelectedLocation(loc)} />
                    ))}
                  </GoogleMap>
                ) : (
                  <div className="p-5 text-center text-muted">Cargando plataforma de mapas...</div>
                )}
              </div>

              <div className="card shadow-sm p-3 border-0">
                <h5 className="fw-bold text-secondary mb-3">Directorio de Dispositivos</h5>
                <div className="table-responsive scrollable-table">
                  <table className="table table-hover align-middle text-nowrap">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Estado</th>
                        <th>Ubicación</th>
                        <th onClick={() => handleSort('country')} className="text-primary cursor-pointer">País</th>
                        <th onClick={() => handleSort('update')} className="text-primary cursor-pointer">Última Conexión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedLocations.map(loc => {
                        const status = getSensorStatus(loc.datetimeLast?.utc);
                        return (
                          <tr key={loc.id} onClick={() => setSelectedLocation(loc)} className="cursor-pointer">
                            <td className="fs-5">{status.icon}</td>
                            <td className="fw-bold text-secondary">{loc.name}</td>
                            <td>{loc.country?.name || "Desconocido"}</td>
                            <td className={status.color}>{status.text}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-3 p-4 bg-white border-start shadow-sm scrollable-panel">
              <h5 className="fw-bold mb-3 text-secondary">DETALLES DE LA UBICACIÓN</h5>
              <hr />
              {selectedLocation ? (
                <div>
                  <p className="mb-2"><strong>UBICACIÓN:</strong><br/><span className="text-primary">{selectedLocation.name}, {selectedLocation.country?.name || ""}</span></p>
                  <p className="mb-3"><strong>ESTADO:</strong><br/>{getSensorStatus(selectedLocation.datetimeLast?.utc).icon} {getSensorStatus(selectedLocation.datetimeLast?.utc).text}</p>
                  <div className="p-3 bg-light rounded mb-3">
                    <p className="mb-2 fw-bold text-secondary">SENSORES:</p>
                    <ul className="mb-0 ps-3">
                      {selectedLocation.sensors?.map((sensor, index) => (
                        <li key={index}>{sensor.parameter?.displayName} <span className="badge bg-secondary">{sensor.parameter?.units}</span></li>
                      ))}
                    </ul>
                  </div>
                  <hr />
                  <div className="mb-4"><Bar data={chartData} options={{ responsive: true }} /></div>
                  <div><Line data={chartData} options={{ responsive: true }} /></div>
                </div>
              ) : (
                <div className="text-center text-muted mt-5 p-4 bg-light rounded">
                  <h5>👆 Explora la red</h5>
                  <p className="small">Selecciona una estación en el mapa o tabla.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'grafico' && <GraficoEnLinea selectedLocation={selectedLocation} setActiveView={setActiveView} chartData={chartData} bigChartData={bigChartData} />}
        {activeView === 'tarjetas' && <TarjetasIoT locations={locations} getSensorStatus={getSensorStatus} />}
        {activeView === 'tablas' && <TablaDatos locations={locations} getSensorStatus={getSensorStatus} />}
        {activeView === 'alertas' && <AlertasActivas locations={locations} getSensorStatus={getSensorStatus} />}
        
      </div>
    </div>
  );
};

export default App;