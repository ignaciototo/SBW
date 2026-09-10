'use client';

import React, { useState, useEffect } from 'react';

interface Tramite {
  id: number;
  titulo: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
}

export default function TramitesView() {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTramite, setEditingTramite] = useState<Tramite | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    cliente_id: '',
    estado: 'pendiente',
    notas: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTramites, resClients] = await Promise.all([
        fetch('/api/tramites'),
        fetch('/api/clients')
      ]);
      const dataTramites = await resTramites.json();
      const dataClients = await resClients.json();
      
      if (dataTramites.tramites) setTramites(dataTramites.tramites);
      if (dataClients.clients) setClients(dataClients.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTramite(null);
    setForm({ titulo: '', cliente_id: '', estado: 'pendiente', notas: '' });
    setModalOpen(true);
  };

  const openEditModal = (t: Tramite) => {
    setEditingTramite(t);
    setForm({ 
      titulo: t.titulo, 
      cliente_id: t.cliente_id ? String(t.cliente_id) : '', 
      estado: t.estado, 
      notas: t.notas || '' 
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setSaving(true);
    try {
      const url = '/api/tramites';
      const method = editingTramite ? 'PUT' : 'POST';
      const body = editingTramite ? { id: editingTramite.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          cliente_id: body.cliente_id ? Number(body.cliente_id) : null
        }),
      });

      if (res.ok) {
        showToast(editingTramite ? 'Trámite actualizado' : 'Trámite creado');
        setModalOpen(false);
        fetchData();
      } else {
        alert('Error al guardar trámite');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este trámite?')) return;
    try {
      const res = await fetch(`/api/tramites?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Trámite eliminado');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (t: Tramite) => {
    const newStatus = t.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      const res = await fetch('/api/tramites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, estado: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Trámites y Gestoría</h2>
          <p>Seguimiento de diligencias extrajudiciales (IGJ, RPI, AFIP, etc.)</p>
        </div>
        <div>
          <button className="btn" onClick={openCreateModal}>
            + Nuevo Trámite
          </button>
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>Trámites Activos e Histórico ({tramites.length})</span>
        </div>

        {loading ? (
          <div className="loading">Cargando trámites...</div>
        ) : tramites.length === 0 ? (
          <div className="empty">No hay trámites registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trámite / Diligencia</th>
                <th>Cliente Vinculado</th>
                <th>Notas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tramites.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.titulo}</strong>
                    <div className="meta-text">{new Date(t.created_at).toLocaleDateString()}</div>
                  </td>
                  <td>
                    {t.cliente_nombre ? (
                      <span>{t.cliente_nombre}</span>
                    ) : (
                      <span className="muted">Interno / Sin Cliente</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '250px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                      {t.notas || <span className="muted">—</span>}
                    </span>
                  </td>
                  <td>
                    <span className={`tag ${t.estado === 'completado' ? 'cumplido' : 'proximo'}`} style={{textTransform:'capitalize'}}>
                      {t.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="link-btn"
                      onClick={() => handleToggleStatus(t)}
                      style={{ marginRight: '10px' }}
                    >
                      {t.estado === 'completado' ? 'Reabrir' : 'Completar ✔'}
                    </button>
                    <button
                      className="link-btn"
                      onClick={() => openEditModal(t)}
                      style={{ marginRight: '10px' }}
                    >
                      Editar
                    </button>
                    <button
                      className="link-btn"
                      style={{ color: 'var(--burgundy)' }}
                      onClick={() => handleDelete(t.id)}
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

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTramite ? 'Editar Trámite' : 'Nuevo Trámite'}</h3>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Descripción del Trámite *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Inscripción Declaratoria en RPI"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Cliente Vinculado</label>
                  <select
                    value={form.cliente_id}
                    onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  >
                    <option value="">-- Interno / Sin cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Notas Adicionales</label>
                <textarea
                  placeholder="Requisitos, vencimientos, costo de sellados..."
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
                  {saving ? 'Guardando...' : 'Guardar Trámite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
