import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Obtener userId de la URL
    const params = new URLSearchParams(location.search);
    const id = params.get('userId');
    if (id) {
      setUserId(id);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Enlace de recuperación inválido',
      });
      navigate('/login');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/reset-password`, {
        userId,
        token,
        newPassword
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Tu contraseña ha sido actualizada correctamente',
        });
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al restablecer la contraseña',
        });
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Ocurrió un error al restablecer la contraseña',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="card shadow-lg p-4" style={{ width: '400px' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Restablecer Contraseña</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="token" className="form-label">Código MFA</label>
              <input
                type="text"
                className="form-control"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="Ingresa tu código de autenticación"
              />
              <small className="form-text text-muted">
                Ingresa el código de tu aplicación de autenticación
              </small>
            </div>
            
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">Nueva Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Ingresa tu nueva contraseña"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirma tu nueva contraseña"
              />
            </div>
            
            <div className="d-grid gap-2">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;