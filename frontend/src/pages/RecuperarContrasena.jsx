import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function RecuperarContrasena() {
  const [form, setForm] = useState({ tenantSlug: '', email: '' });
  const [estado, setEstado] = useState('idle'); // idle | loading | enviado | error
  const [mensaje, setMensaje] = useState('');

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenantSlug.trim() || !form.email.trim()) {
      setMensaje('Rellena todos los campos.');
      setEstado('error');
      return;
    }
    setEstado('loading');
    try {
      await api.post('/auth/recuperar-contrasena', form);
      setEstado('enviado');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo procesar la solicitud.');
      setEstado('error');
    }
  };

  if (estado === 'enviado') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="feedback-icon">✓</div>
          <h1>Revisa tu email</h1>
          <p className="feedback-text">
            Si el email introducido existe en nuestra base de datos, recibirás
            un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <div className="auth-links">
            <Link to="/login">← Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="auth-brand-name">Panel de acceso</span>
        </div>

        <h1>Recuperar contraseña</h1>
        <p className="auth-desc">
          Introduce tu organización y email. Te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="tenantSlug">Organización (slug)</label>
            <input
              id="tenantSlug" type="text" value={form.tenantSlug}
              onChange={set('tenantSlug')} placeholder="mi-empresa"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={form.email}
              onChange={set('email')} placeholder="usuario@ejemplo.com"
            />
          </div>

          {estado === 'error' && <p className="form-error">{mensaje}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={estado === 'loading'}>
            {estado === 'loading' ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
