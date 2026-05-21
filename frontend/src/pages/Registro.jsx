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

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenantName.trim()) return setError('Introduce el nombre de tu organización.');
    if (!form.email.trim())      return setError('Introduce un email válido.');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
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

        <h1>Crear organización</h1>
        <p className="auth-subtitle">Crea tu espacio de trabajo y primer usuario administrador</p>

        <div className="auth-divider" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="tenantName">Nombre de la organización</label>
            <input
              id="tenantName" type="text" value={form.tenantName}
              onChange={set('tenantName')} placeholder="Acciparte S.L."
              className={error && !form.tenantName ? 'input-error' : ''}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email del administrador</label>
            <input
              id="email" type="email" value={form.email}
              onChange={set('email')} placeholder="admin@ejemplo.com"
              className={error && !form.email ? 'input-error' : ''}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña (mín. 8 caracteres)</label>
            <input
              id="password" type="password" value={form.password}
              onChange={set('password')} placeholder="••••••••"
              className={error && form.password.length < 8 ? 'input-error' : ''}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
