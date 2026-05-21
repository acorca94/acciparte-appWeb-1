import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function leerError(err) {
  const data = err.response?.data;
  if (!data) return 'Error de conexión.';
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0].msg;
  return 'Algo salió mal.';
}

export default function GestionUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleCrear = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!form.email.trim())       return setError('Introduce un email.');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    setGuardando(true);
    try {
      await api.post('/usuarios', form);
      setExito(`Usuario ${form.email} creado correctamente.`);
      setForm({ email: '', password: '', role: 'user' });
      cargarUsuarios();
    } catch (err) {
      setError(leerError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(leerError(err));
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>Gestión de usuarios</h1>
          <span className="tenant-badge">{user?.tenantId}</span>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">← Volver</Link>
      </header>

      <main className="dash-content">
        {/* Formulario nuevo usuario */}
        <section className="step-form-wrapper">
          <h2>Crear nuevo usuario</h2>
          <form onSubmit={handleCrear} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="email" value={form.email}
                onChange={set('email')} placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña (mín. 8 caracteres)</label>
              <input
                id="password" type="password" value={form.password}
                onChange={set('password')} placeholder="••••••••"
              />
            </div>
            <div className="field">
              <label htmlFor="role">Rol</label>
              <select id="role" value={form.role} onChange={set('role')}>
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {error && <p className="form-error">{error}</p>}
            {exito && <p className="form-success">{exito}</p>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </section>

        {/* Lista de usuarios */}
        <section className="submissions-list">
          <h2>Usuarios de la organización</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : usuarios.length === 0 ? (
            <p className="empty-state">No hay usuarios todavía.</p>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha de alta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td><span className="badge">{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      {u.id !== user?.userId && (
                        <button className="btn-delete" onClick={() => handleEliminar(u.id)}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
