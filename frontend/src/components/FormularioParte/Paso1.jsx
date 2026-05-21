export default function Step1({ data, onChange }) {
  const fields = [
    { name: 'nombre', label: 'Nombre', placeholder: 'Ej. María' },
    { name: 'apellidos', label: 'Apellidos', placeholder: 'Ej. García López' },
    { name: 'lugar', label: 'Lugar', placeholder: 'Ej. Calle Mayor, 12 – Madrid' },
  ];

  return (
    <div className="step">
      <h2 className="step-title">Datos personales</h2>
      <p className="step-desc">Paso 1 de 2 — Información del afectado</p>
      {fields.map(({ name, label, placeholder }) => (
        <div key={name} className="field">
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            type="text"
            placeholder={placeholder}
            value={data[name]}
            onChange={(e) => onChange(name, e.target.value)}
            required
          />
        </div>
      ))}
    </div>
  );
}
