'use client';

import React, { useState } from 'react';

interface PlazosCalculatorModalProps {
  onClose: () => void;
  onSaveEvent?: (eventData: any) => void;
}

export default function PlazosCalculatorModal({ onClose, onSaveEvent }: PlazosCalculatorModalProps) {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dias, setDias] = useState(5);
  const [tipoDias, setTipoDias] = useState<'habiles' | 'corridos'>('habiles');
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>('');
  const [calculado, setCalculado] = useState<any>(null);

  const formatDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [resJ, resC] = await Promise.all([
          fetch('/api/settings/jurisdictions'),
          fetch('/api/cases?status=activo')
        ]);
        const dataJ = await resJ.json();
        const dataC = await resC.json();
        if (dataJ.jurisdictions) setJurisdictions(dataJ.jurisdictions);
        if (dataC.cases) setCases(dataC.cases);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calculate-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio,
          dias,
          modo: tipoDias,
          hora_gracia: jurisdictions.find(j => j.id.toString() === selectedJurisdictionId)?.hora_gracia
        })
      });
      const data = await res.json();
      if (res.ok && data.normal) {
        setCalculado(data);
      } else {
        alert(data.error || 'Error calculando vencimiento');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>Calculadora de Plazos Judiciales</h2>
          <button className="icon-btn" onClick={onClose}>✖</button>
        </div>
        <div className="modal-body">
          <div className="field" style={{ marginBottom: '12px' }}>
            <label>Causa Asociada (Opcional)</label>
            <select
              value={selectedCaseId}
              onChange={(e) => {
                const cid = e.target.value;
                setSelectedCaseId(cid);
                const found = cases.find((c) => c.id.toString() === cid);
                if (found && found.jurisdiction_id) {
                  setSelectedJurisdictionId(found.jurisdiction_id.toString());
                }
              }}
            >
              <option value="">-- Sin causa específica --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caratula} {c.jurisdiction_nombre ? `(${c.jurisdiction_nombre})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Fecha de Notificación</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="field">
              <label>Plazo (Días)</label>
              <input type="number" min="1" value={dias} onChange={e => setDias(parseInt(e.target.value))} />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select value={tipoDias} onChange={e => setTipoDias(e.target.value as any)}>
                <option value="habiles">Hábiles</option>
                <option value="corridos">Corridos</option>
              </select>
            </div>
            <div className="field">
              <label>Jurisdicción</label>
              <select value={selectedJurisdictionId} onChange={e => setSelectedJurisdictionId(e.target.value)}>
                <option value="">Ninguna</option>
                {jurisdictions.map(j => (
                  <option key={j.id} value={j.id}>{j.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button className="btn primary" style={{ width: '100%', marginBottom: '20px' }} onClick={calculate} disabled={loading}>
            {loading ? 'Calculando feriados y hábiles...' : 'Calcular Vencimiento'}
          </button>

          {calculado && (
            <div style={{ background: '#FAF7EE', padding: '16px', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <div style={{ marginBottom: '10px' }}>
                <span className="meta-text">Vencimiento Ordinario:</span>
                <h3 style={{ margin: '4px 0', color: 'var(--burgundy)' }}>{formatDateSafe(calculado.normal)}</h3>
              </div>
              <div>
                <span className="meta-text">Vencimiento c/ Plazo de Gracia:</span>
                <h3 style={{ margin: '4px 0', color: 'var(--gold)' }}>
                  {formatDateSafe(calculado.fecha_gracia)}
                  {calculado.hora_gracia && ` hasta las ${calculado.hora_gracia} hs`}
                </h3>
              </div>

              {onSaveEvent && (
                <button 
                  className="btn secondary small" 
                  style={{ marginTop: '16px', width: '100%' }}
                  onClick={() => onSaveEvent({
                    fecha: calculado.normal,
                    fecha_gracia: calculado.fecha_gracia,
                    hora_gracia: calculado.hora_gracia,
                    titulo: '',
                    tipo: 'vencimiento_plazo',
                    case_id: selectedCaseId || ''
                  })}
                >
                  📅 Cargar en Formulario de Agenda
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
