import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
// 1. Añadimos sendPasswordResetEmail a la importación de Firebase
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Nuevo estado para alertas de éxito
  const navigate = useNavigate();

  // Función para manejar el acceso por Correo y Contraseña
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard'); // Si tiene éxito, entra al dashboard
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        
        alert('¡Registro exitoso! Te hemos enviado un correo de bienvenida. Por favor, revisa tu bandeja de entrada o spam.');
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError('Error en la autenticación. Verifica tus credenciales.');
    }
  };

  // Función para manejar el acceso rápido con Google
  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err); 
      setError('Error al iniciar sesión con Google.');
    }
  };

  // 2. Nueva función para manejar el restablecimiento de contraseña
  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico arriba para poder enviarte el enlace de recuperación.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('¡Enlace enviado! Revisa tu bandeja de entrada o la carpeta de spam para restablecer tu contraseña.');
    } catch (err) {
      console.error(err);
      setError('Error al intentar enviar el correo. Verifica que la dirección esté bien escrita y registrada.');
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
        {/* Sistema de alertas (Errores en rojo, Éxitos en verde) */}
        {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
        {message && <div className="alert alert-success py-2 px-3 small">{message}</div>}
        
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
            {/* Cabecera del input de contraseña con el botón de recuperar */}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-white small fw-semibold m-0">Contraseña</label>
              {isLogin && (
                <span 
                  className="text-primary small text-decoration-none" 
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                  onClick={handleResetPassword}
                >
                  ¿Olvidaste tu contraseña?
                </span>
              )}
            </div>
            <input 
              type="password" 
              className="input-github" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required={!isLogin} /* Solo es estrictamente requerido al crear cuenta */
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
          type="button"
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
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
          >
            {isLogin ? 'Crea una cuenta' : 'Inicia sesión'}
          </span>
        </span>
      </div>
    </div>
  );
};

export default Auth;