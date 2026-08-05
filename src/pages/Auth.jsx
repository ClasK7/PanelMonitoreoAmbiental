import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Estado para controlar las reglas de la contraseña
  const [passRules, setPassRules] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
    notEmail: false
  });

  const navigate = useNavigate();

  // Motor de validación en tiempo real
  useEffect(() => {
    if (!isLogin) {
      const emailPrefix = email.split('@')[0].toLowerCase();
      setPassRules({
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        notEmail: password.length > 0 && emailPrefix.length > 0 ? !password.toLowerCase().includes(emailPrefix) : false
      });
    }
  }, [password, email, isLogin]);

  // Verifica si todas las reglas se cumplen para habilitar el botón
  const isPasswordValid = Object.values(passRules).every(Boolean);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Bloqueo de seguridad si intentan registrase sin cumplir las reglas
    if (!isLogin && !isPasswordValid) {
      setError('Por favor, cumple con todos los requisitos de seguridad de la contraseña.');
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard'); 
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        
        alert('¡Registro exitoso! Te hemos enviado un correo de bienvenida. Por favor, revisa tu bandeja de entrada o spam.');
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError('Error en la autenticación. Verifica tus credenciales o intenta con otra cuenta.');
    }
  };

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
    <div className="bg-github-dark d-flex flex-column align-items-center justify-content-center px-3 position-relative" style={{ minHeight: '100vh' }}>
      
      {/* NUEVO: Botón para regresar a la página de presentación (Landing) */}
      <button 
        onClick={() => navigate('/')}
        className="btn btn-link text-github-muted text-decoration-none position-absolute top-0 start-0 m-3 m-md-4 d-flex align-items-center gap-2 hover-white"
        style={{ fontSize: '14px', cursor: 'pointer' }}
      >
        <span>←</span> Volver al inicio
      </button>

      <div className="text-center mb-4 mt-5 mt-md-0">
        <h2 className="text-white fw-light tracking-tight">
          {isLogin ? 'Iniciar sesión en la plataforma' : 'Crea tu cuenta gratuita'}
        </h2>
      </div>

      <div className="bg-github-card p-4 shadow-sm w-100" style={{ maxWidth: '340px' }}>
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
          
          <div className={isLogin ? "mb-4" : "mb-2"}>
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
              required 
            />
          </div>

          {/* LISTA DE VALIDACIÓN TIPO CISCO */}
          {!isLogin && (
            <div className="p-2 mb-4 rounded" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
              <ul className="list-unstyled mb-0 small" style={{ fontSize: '11px' }}>
                <li className={passRules.length ? 'text-success' : 'text-github-muted'}>
                  {passRules.length ? '✓' : '○'} Al menos 8 caracteres
                </li>
                <li className={passRules.lower ? 'text-success' : 'text-github-muted'}>
                  {passRules.lower ? '✓' : '○'} Una letra minúscula
                </li>
                <li className={passRules.upper ? 'text-success' : 'text-github-muted'}>
                  {passRules.upper ? '✓' : '○'} Una letra mayúscula
                </li>
                <li className={passRules.number ? 'text-success' : 'text-github-muted'}>
                  {passRules.number ? '✓' : '○'} Un número
                </li>
                <li className={passRules.special ? 'text-success' : 'text-github-muted'}>
                  {passRules.special ? '✓' : '○'} Al menos un carácter especial (!@#$%...)
                </li>
                <li className={passRules.notEmail ? 'text-success' : 'text-github-muted'}>
                  {passRules.notEmail ? '✓' : '○'} No debe coincidir con tu correo
                </li>
              </ul>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-github-green w-100 py-2 mb-3"
            disabled={!isLogin && !isPasswordValid}
          >
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="d-flex align-items-center mb-3">
          <hr className="flex-grow-1 border-secondary m-0" />
          <span className="text-github-muted small px-2">o</span>
          <hr className="flex-grow-1 border-secondary m-0" />
        </div>

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
              setPassword(''); 
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