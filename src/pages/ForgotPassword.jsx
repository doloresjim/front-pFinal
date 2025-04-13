import React, { useState } from 'react';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';

function PasswordResetRequest() {
  const [email, setEmail] = useState('');

  const handleRequest = async () => {
    try {
      const response = await fetch('https://pfinal-back-1.onrender.com/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Token generado',
          html: `
            <p><b>Token:</b> <code>${data.resetToken}</code></p>
            <p>Ingresa el código MFA y tu nueva contraseña.</p>
          `,
          confirmButtonText: 'Continuar',
        }).then(() => {
          showResetForm(data.resetToken);
        });
      } else {
        Swal.fire('Aviso', data.message, 'info');
      }
    } catch (err) {
      Swal.fire('Error', 'Ocurrió un error al solicitar el token', 'error');
    }
  };

  const showResetForm = (token) => {
    Swal.fire({
      title: 'Restablecer contraseña',
      html: `
        <input id="mfa" class="swal2-input" placeholder="Código MFA">
        <input id="newPass" type="password" class="swal2-input" placeholder="Nueva contraseña">
      `,
      confirmButtonText: 'Cambiar',
      preConfirm: async () => {
        const mfaCode = document.getElementById('mfa').value;
        const newPassword = document.getElementById('newPass').value;

        if (!mfaCode || !newPassword) {
          Swal.showValidationMessage('Todos los campos son requeridos');
          return false;
        }

        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resetToken: token,
              mfaCode,
              newPassword
            })
          });

          const resData = await res.json();

          if (!res.ok) throw new Error(resData.message || 'Error');

          Swal.fire('Listo', 'Contraseña actualizada correctamente', 'success');
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  return (
    <div className="container mt-5">
      <h3 className="mb-3">Recuperar contraseña</h3>
      <input
        type="email"
        className="form-control mb-2"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn btn-primary" onClick={handleRequest}>
        Solicitar cambio
      </button>
    </div>
  );
}

export default PasswordResetRequest;
