'use client';

import React, { useState, useEffect } from 'react';
import PlazosCalculatorModal from './PlazosCalculatorModal';

interface EventItem {
  id: number;
  case_id: number | null;
  caratula?: string;
  numero?: string;
  fecha: string;
  hora: string | null;
  fecha_gracia?: string | null;
  hora_gracia?: string | null;
  titulo: string;
  tipo: string;
  estado: string;
  notas: string | null;
  juzgado?: string;
}

export default function AgendaView() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    case_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    fecha_gracia: '',
    hora_gracia: '',
    titulo: '',
    tipo: 'vencimiento_plazo',
    notas: '',
  });
  const [showCalcHelper, setShowCalcHelper] = useState(false);
  const [calcDias, setCalcDias] = useState(5);
  const [calcModo, setCalcModo] = useState<'habiles' | 'corridos'>('habiles');
  const [calcFechaBase, setCalcFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [calculatingInModal, setCalculatingInModal] = useState(false);

  const formatDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleCalculateInModal = async () => {
    setCalculatingInModal(true);
    try {
      const selectedCase = cases.find((c) => c.id.toString() === form.case_id);
      const res = await fetch('/api/calculate-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: calcFechaBase,
          dias: calcDias,
          modo: calcModo,
          hora_gracia: form.hora_gracia || selectedCase?.hora_gracia || '',
        }),
      });
      const data = await res.json();
      if (data.normal) {
        setForm((prev) => ({
          ...prev,
          fecha: data.normal,
          fecha_gracia: data.fecha_gracia || '',
          hora_gracia: data.hora_gracia || prev.hora_gracia || selectedCase?.hora_gracia || '10:00',
        }));
      } else {
        alert(data.error || 'Error calculando vencimiento');
      }
    } catch (err) {
      console.error(err);
      alert('Error al calcular vencimiento');
    } finally {
      setCalculatingInModal(false);
    }
  };

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases?status=activo');
      const data = await res.json();
      if (data.cases) setCases(data.cases);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgenda();
    fetchCases();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          case_id: '',
          fecha: new Date().toISOString().split('T')[0],
          hora: '09:00',
          fecha_gracia: '',
          hora_gracia: '',
          titulo: '',
          tipo: 'vencimiento_plazo',
          notas: '',
        });
        fetchAgenda();
      } else {
        alert('Error al crear evento');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (ev: EventItem) => {
    const nuevoEstado = ev.estado === 'cumplido' ? 'pendiente' : 'cumplido';
    try {
      const res = await fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ev.id, estado: nuevoEstado }),
      });
      if (res.ok) fetchAgenda();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este recordatorio?')) return;
    try {
      const res = await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAgenda();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) {
      alert('No hay eventos para exportar');
      return;
    }
    const header = ['Fecha', 'Título', 'Tipo', 'Estado', 'Causa Vinculada', 'Juzgado'].join(';');
    const rows = events.map(e => [
      new Date(e.fecha).toLocaleDateString(),
      `"${e.titulo.replace(/"/g, '""')}"`,
      e.tipo,
      e.estado,
      `"${e.caratula || ''}"`,
      `"${e.juzgado || ''}"`
    ].join(';'));
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Agenda_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Agenda & Vencimientos</h2>
          <p>Control de plazos fatales, audiencias judiciales y reuniones</p>
        </div>
        <div>
          <button className="btn secondary" onClick={() => setCalcOpen(true)} style={{ marginRight: '10px' }}>
            ⏳ Calculadora de Plazos
          </button>
          <button className="btn secondary" onClick={handleExportCSV} style={{ marginRight: '10px' }}>
            📥 Exportar Excel
          </button>
          <button className="btn" onClick={() => setModalOpen(true)}>
            + Nuevo Vencimiento
          </button>
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>Próximas Fechas ({events.length})</span>
        </div>

        {loading ? (
          <div className="loading">Cargando agenda...</div>
        ) : events.length === 0 ? (
          <div className="empty">No hay eventos ni vencimientos agendados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha & Hora</th>
                <th>Tipo</th>
                <th>Causa Asociada</th>
                <th>Detalle</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--navy-deep)' }}>
                      {formatDateSafe(ev.fecha)}
                      {ev.hora && <span className="meta-text" style={{ marginLeft: '6px' }}>{ev.hora} hs</span>}
                    </div>
                    {ev.fecha_gracia && (
                      <div
                        style={{
                          marginTop: '5px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#8c6b00',
                          background: '#FAF7EE',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--gold)',
                          display: 'inline-block',
                        }}
                      >
                        ⏳ Plazo de gracia: {formatDateSafe(ev.fecha_gracia)} {ev.hora_gracia ? `hasta las ${ev.hora_gracia} hs` : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`tag ${ev.tipo === 'audiencia' ? 'hoy' : 'proximo'}`}>
                      {ev.tipo === 'vencimiento_plazo' ? 'Vencimiento' : ev.tipo}
                    </span>
                  </td>
                  <td>
                    {ev.caratula ? (
                      <div>
                        <strong>{ev.caratula}</strong>
                        {ev.numero && <span className="meta-text">N°: {ev.numero}</span>}
                      </div>
                    ) : (
                      <span className="muted">— General —</span>
                    )}
                  </td>
                  <td>
                    <div>{ev.titulo}</div>
                    {ev.notas && <span className="meta-text">{ev.notas}</span>}
                  </td>
                  <td>
                    <span className={`tag ${ev.estado === 'cumplido' ? 'cumplido' : 'vencido'}`}>
                      {ev.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="link-btn"
                      onClick={() => handleToggleEstado(ev)}
                      style={{ marginRight: '10px' }}
                    >
                      {ev.estado === 'cumplido' ? 'Marcar Pendiente' : 'Cumplido ✔'}
                    </button>
                    <button
                      className="link-btn"
                      style={{ color: 'var(--burgundy)' }}
                      onClick={() => handleDelete(ev.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Evento */}
      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo Recordatorio / Vencimiento</h3>
            <form onSubmit={handleCreate}>
              <div className="field-row">
                <div className="field">
                  <label>Tipo de Evento</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="vencimiento_plazo">Vencimiento de Plazo</option>
                    <option value="audiencia">Audiencia</option>
                    <option value="reunion">Reunión con Cliente</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="field">
                  <label>Causa Vinculada</label>
                  <select
                    value={form.case_id}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cItem = cases.find((c) => c.id.toString() === cid);
                      setForm((prev) => ({
                        ...prev,
                        case_id: cid,
                        hora_gracia: prev.hora_gracia || cItem?.hora_gracia || '',
                      }));
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
              </div>

              {/* Si es vencimiento de plazo, mostrar el bloque interactivo de cálculo y edición */}
              {form.tipo === 'vencimiento_plazo' ? (
                <div
                  style={{
                    background: '#FAF7EE',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--navy-deep)' }}>
                      ⏰ Vencimiento y Plazo de Gracia (Validar antes de agendar)
                    </span>
                    <button
                      type="button"
                      className="link-btn"
                      style={{ fontSize: '11px', color: 'var(--gold)' }}
                      onClick={() => setShowCalcHelper(!showCalcHelper)}
                    >
                      {showCalcHelper ? 'Ocultar Calculador' : '🧮 Asistente de Cálculo'}
                    </button>
                  </div>

                  {showCalcHelper && (
                    <div
                      style={{
                        background: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px dashed var(--line)',
                        marginBottom: '12px',
                      }}
                    >
                      <div className="field-row">
                        <div className="field">
                          <label style={{ fontSize: '11px' }}>Fecha Notificación / Inicio</label>
                          <input
                            type="date"
                            value={calcFechaBase}
                            onChange={(e) => setCalcFechaBase(e.target.value)}
                          />
                        </div>
                        <div className="field" style={{ maxWidth: '80px' }}>
                          <label style={{ fontSize: '11px' }}>Días</label>
                          <input
                            type="number"
                            min="1"
                            value={calcDias}
                            onChange={(e) => setCalcDias(parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="field" style={{ maxWidth: '120px' }}>
                          <label style={{ fontSize: '11px' }}>Cómputo</label>
                          <select
                            value={calcModo}
                            onChange={(e) => setCalcModo(e.target.value as any)}
                          >
                            <option value="habiles">Hábiles</option>
                            <option value="corridos">Corridos</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn secondary small"
                        style={{ width: '100%', marginTop: '4px' }}
                        onClick={handleCalculateInModal}
                        disabled={calculatingInModal}
                      >
                        {calculatingInModal ? 'Calculando feriados y hábiles...' : '⚡ Calcular y Rellenar Fechas'}
                      </button>
                    </div>
                  )}

                  <div className="field-row" style={{ alignItems: 'flex-end' }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Vto. Ordinario *</label>
                      <input
                        type="date"
                        required
                        value={form.fecha}
                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Plazo de Gracia</label>
                      <input
                        type="date"
                        value={form.fecha_gracia}
                        onChange={(e) => setForm({ ...form, fecha_gracia: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ width: '130px', flex: 'none' }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Hora de Gracia</label>
                      <input
                        type="text"
                        placeholder="Ej: 10:00"
                        value={form.hora_gracia}
                        onChange={(e) => setForm({ ...form, hora_gracia: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                    ✦ Puedes ajustar estas fechas manualmente antes de guardar.
                  </div>
                </div>
              ) : (
                <div className="field-row">
                  <div className="field">
                    <label>Fecha *</label>
                    <input
                      type="date"
                      required
                      value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Hora</label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <label>Descripción / Detalle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Contestar demanda / Audiencia Art. 360"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Notas adicionales</label>
                <textarea
                  placeholder="Instrucciones, documentación a llevar, etc."
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Guardando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {calcOpen && (
        <PlazosCalculatorModal 
          onClose={() => setCalcOpen(false)} 
          onSaveEvent={(eventData) => {
            setForm({
              ...form,
              fecha: eventData.fecha,
              fecha_gracia: eventData.fecha_gracia || '',
              hora_gracia: eventData.hora_gracia || '',
              titulo: eventData.titulo,
              tipo: eventData.tipo,
              case_id: eventData.case_id || form.case_id || '',
            });
            setCalcOpen(false);
            setModalOpen(true);
          }} 
        />
      )}
    </div>
  );
}
