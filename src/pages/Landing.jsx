import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-github-dark d-flex flex-column align-items-center justify-content-center text-center px-3">
      <h1 className="display-3 fw-bold text-white mb-3" style={{ letterSpacing: '-1px' }}>
        El futuro del monitoreo ocurre aquí
      </h1>
      <p className="text-github-muted fs-5 mb-5" style={{ maxWidth: '600px' }}>
        Las redes telemáticas evolucionan, pero el control perdura. Únete a la plataforma centralizada para la gestión de dispositivos IoT ambientales.
      </p>
      <div className="d-flex gap-3">
        <button className="btn btn-github-green fs-5 px-4 py-2" onClick={() => navigate('/auth')}>
          Registrarse o Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default Landing;