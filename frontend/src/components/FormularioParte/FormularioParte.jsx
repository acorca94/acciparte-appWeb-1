import { useState } from 'react';
import Paso1 from './Paso1';
import Paso2 from './Paso2';
import api from '../../services/api';

const INITIAL = { nombre: '', apellidos: '', lugar: '', hora_accidente: '' };

export default function FormularioParte({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = (e) => {
    e.preventDefault();
    const { nombre, apellidos, lugar } = formData;
    if (!nombre.trim() || !apellidos.trim() || !lugar.trim()) {
      setError('Rellena todos los campos para continuar.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hora_accidente) {
      setError('Selecciona la hora del accidente.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/submissions', formData);
      setFormData(INITIAL);
      setStep(1);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="step-form-wrapper">
      <div className="progress-bar">
        <div className={`progress-segment ${step >= 1 ? 'active' : ''}`} />
        <div className={`progress-segment ${step >= 2 ? 'active' : ''}`} />
      </div>

      <form onSubmit={step === 1 ? handleNext : handleSubmit} noValidate>
        {step === 1 ? (
          <Paso1 data={formData} onChange={handleChange} />
        ) : (
          <Paso2 data={formData} onChange={handleChange} />
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {step === 2 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Atrás
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {step === 1 ? 'Siguiente →' : submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
