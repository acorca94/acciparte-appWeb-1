import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioParte from '../components/FormularioParte/FormularioParte';
import api from '../services/api';

export default function Inicio() {
  const { user, logout } = useAuth();
  const [partes, setPartes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarPartes = useCallback(async () => {
    try {
      const { data } = await api.get('/submissions');
      setPartes(data);
    } catch (err) {
      console.error('Error cargando registros:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPartes(); }, [cargarPartes]);

  const handleFormSuccess = () => {
    setShowForm(false);
    cargarPartes();
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    await api.delete(`/submissions/${id}`);
    setPartes((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>Panel de registros</h1>
          <span className="tenant-badge">{user?.tenantId}</span>
        </div>
        <div className="dash-actions">
          {user?.role === 'admin' && (
            <Link to="/usuarios" className="btn btn-secondary">Usuarios</Link>
          )}
          <button onClick={logout} className="btn btn-secondary">Cerrar sesión</button>
        </div>
      </header>

      <main className="dash-content">
        {!showForm ? (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nuevo registro
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <FormularioParte onSuccess={handleFormSuccess} />
          </>
        )}

        <section className="submissions-list">
          <h2>Registros</h2>
          {cargando ? (
            <p>Cargando...</p>
          ) : partes.length === 0 ? (
            <p className="empty-state">Sin registros todavía.</p>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Lugar</th>
                  <th>Hora del accidente</th>
                  <th>Creado por</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {partes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nombre}</td>
                    <td>{s.apellidos}</td>
                    <td>{s.lugar}</td>
                    <td><span className="badge">{s.hora_accidente}</span></td>
                    <td>{s.created_by}</td>
                    <td>{new Date(s.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleEliminar(s.id)}>✕</button>
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
