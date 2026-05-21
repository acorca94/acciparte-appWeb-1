import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function leerError(err) {
  const data = err.response?.data;
  if (!data) return 'Error de conexión. Comprueba que el servidor está activo.';
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0].msg;
  return 'Algo salió mal. Inténtalo de nuevo.';
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantSlug: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenantSlug.trim()) return setError('Introduce el nombre de tu organización.');
    if (!form.email.trim())      return setError('Introduce tu email.');
    if (!form.password)          return setError('Introduce tu contraseña.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(leerError(err));
    } finally {
      setLoading(false);
    }
  };

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

        <h1>Iniciar sesión</h1>
        <p className="auth-subtitle">Accede con los datos de tu organización</p>
        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="tenantSlug">Organización (slug)</label>
            <input id="tenantSlug" type="text" value={form.tenantSlug}
              onChange={set('tenantSlug')} placeholder="mi-empresa"
              className={error && !form.tenantSlug ? 'input-error' : ''} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email}
              onChange={set('email')} placeholder="usuario@ejemplo.com"
              className={error && !form.email ? 'input-error' : ''} />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••"
              className={error && !form.password ? 'input-error' : ''} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          <span>·</span>
          <Link to="/register">Crear organización</Link>
        </div>
      </div>
    </div>
  );
}
