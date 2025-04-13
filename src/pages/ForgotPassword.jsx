import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/request-password-reset`, 
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: (status) => status < 500 // Considerar todos los status < 500 como exitosos
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Proceso de recuperación iniciado',
          html: `
            <p>Tienes que usar el código MFA para restablecer tu contraseña.</p> 
          `,
          confirmButtonText: 'Continuar',
        }).then(() => {
          showResetForm(response.data.resetToken, response.data.mfaSecret);
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Aviso',
          text: response.data.message || 'Si el email existe, recibirás instrucciones.',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Ocurrió un error al procesar tu solicitud',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showResetForm = (resetToken, mfaSecret) => {
    Swal.fire({
      title: 'Restablecer contraseña',
      html: `
        <input id="mfaCode" class="swal2-input" placeholder="Código MFA (6 dígitos)" type="number">
        <input id="newPassword" class="swal2-input" placeholder="Nueva contraseña" type="password">
        <input id="confirmPassword" class="swal2-input" placeholder="Confirmar contraseña" type="password">
      `,
      focusConfirm: false,
      preConfirm: async () => {
        const mfaCode = document.getElementById('mfaCode').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones
        if (!mfaCode || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Todos los campos son requeridos');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
          return false;
        }

        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/reset-password`,
            {
              resetToken,
              mfaCode,
              newPassword
            },
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          return response.data;
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || 'Error al actualizar la contraseña'
          );
          return false;
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Cambiar contraseña',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          icon: 'success',
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido cambiada exitosamente',
          confirmButtonText: 'Iniciar sesión'
        }).then(() => {
          window.location.href = '/';
        });
      }
    });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Recuperar contraseña</h3>
              <form onSubmit={handleRequest}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Ingresa tu email registrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Procesando...
                      </>
                    ) : (
                      'Solicitar cambio'
                    )}
                  </button>
                </div>
              </form>
              <div className="text-center mt-3">
                <a href="/login" className="text-decoration-none">
                  Volver al inicio de sesión
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;