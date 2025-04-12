import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/request-password-reset`, { email });
      
      Swal.fire({
        icon: 'success',
        title: 'Siw solicitud enviada',
        text: 'Si el correo existe en nuestra base de datos, recibirás instrucciones para restablecer tu contraseña.',
      });
      
      setEmail('');
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="card shadow-lg p-4" style={{ width: '400px' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Recuperar Contraseña</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ingresa tu correo electrónico"
              />
            </div>
            
            <div className="d-grid gap-2">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-3">
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;