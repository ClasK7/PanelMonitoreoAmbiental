import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Función para manejar el acceso por Correo y Contraseña
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard'); // Si tiene éxito, entra al dashboard
    } catch (err) {
      setError('Error en la autenticación. Verifica tus credenciales.');
    }
  };

  // Función para manejar el acceso rápido con Google
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard'); // Si tiene éxito, entra al dashboard
    } catch (err) {
      setError('Error al iniciar sesión con Google.');
    }
  };

  return (
    <div className="bg-github-dark d-flex flex-column align-items-center justify-content-center px-3" style={{ minHeight: '100vh' }}>
      <div className="text-center mb-4">
        <h2 className="text-white fw-light tracking-tight">
          {isLogin ? 'Iniciar sesión en la plataforma' : 'Crea tu cuenta gratuita'}
        </h2>
      </div>

      <div className="bg-github-card p-4 shadow-sm w-100" style={{ maxWidth: '340px' }}>
        {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
        
        <form onSubmit={handleAuth}>
          <div className="mb-3">
            <label className="form-label text-white small fw-semibold">Correo electrónico</label>
            <input 
              type="email" 
              className="input-github" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-4">
            <label className="form-label text-white small fw-semibold">Contraseña</label>
            <input 
              type="password" 
              className="input-github" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-github-green w-100 py-2 mb-3">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        {/* Separador estético para las opciones de Login */}
        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1 border-secondary m-0" />
          <span className="text-github-muted small px-2">o</span>
          <hr className="flex-grow-1 border-secondary m-0" />
        </div>

        {/* Botón oficial de Google */}
        <button 
          onClick={handleGoogleSignIn} 
          className="btn text-white w-100 py-2 d-flex align-items-center justify-content-center gap-2"
          style={{ backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '6px' }}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google Logo" 
            style={{ width: '18px' }} 
          />
          Continuar con Google
        </button>
      </div>

      <div className="mt-4 p-3 bg-github-card w-100 text-center" style={{ maxWidth: '340px' }}>
        <span className="text-white small">
          {isLogin ? '¿Eres nuevo en la plataforma? ' : '¿Ya tienes una cuenta? '}
          <span 
            className="text-primary cursor-pointer text-decoration-none" 
            style={{ cursor: 'pointer' }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Crea una cuenta' : 'Inicia sesión'}
          </span>
        </span>
      </div>
    </div>
  );
};

export default Auth;