const HORAS = [
  '00:00 - 02:00',
  '02:00 - 04:00',
  '04:00 - 06:00',
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '22:00 - 00:00',
];

export default function Step2({ data, onChange }) {
  return (
    <div className="step">
      <h2 className="step-title">Hora del accidente</h2>
      <p className="step-desc">Paso 2 de 2 — Franja horaria del incidente</p>
      <div className="field">
        <label htmlFor="hora_accidente">Hora del accidente</label>
        <select
          id="hora_accidente"
          name="hora_accidente"
          value={data.hora_accidente}
          onChange={(e) => onChange('hora_accidente', e.target.value)}
          required
        >
          <option value="">-- Selecciona una franja --</option>
          {HORAS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
