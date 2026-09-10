'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Template {
  id: number;
  titulo: string;
  tipo: string;
  contenido: string;
}

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'escrito',
    contenido: '',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const insertSnippet = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) {
      setForm((prev) => ({ ...prev, contenido: prev.contenido + prefix + suffix }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = form.contenido;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || '') + suffix;
    const updated = current.substring(0, start) + replacement + current.substring(end);
    setForm((prev) => ({ ...prev, contenido: updated }));
    setTimeout(() => {
      el.focus();
      const newPos = start + prefix.length + (selected ? selected.length : 0);
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setForm({ titulo: '', tipo: 'escrito', contenido: '' });
    setModalOpen(true);
  };

  const openEditModal = (t: Template) => {
    setEditingTemplate(t);
    setForm({ titulo: t.titulo, tipo: t.tipo, contenido: t.contenido });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.contenido.trim()) return;

    setSaving(true);
    try {
      const url = '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      const body = editingTemplate ? { id: editingTemplate.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
        setModalOpen(false);
        fetchTemplates();
      } else {
        alert('Error al guardar plantilla');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plantilla eliminada');
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Formatos y Modelos</h2>
          <p>Repositorio de escritos, cédulas y oficios con variables automáticas.</p>
        </div>
        <div>
          <button className="btn" onClick={openCreateModal}>
            + Nuevo Modelo
          </button>
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>Plantillas Disponibles ({templates.length})</span>
        </div>

        {loading ? (
          <div className="loading">Cargando plantillas...</div>
        ) : templates.length === 0 ? (
          <div className="empty">No hay plantillas creadas.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.titulo}</strong>
                  </td>
                  <td>
                    <span className="tag programado" style={{textTransform:'capitalize'}}>
                      {t.tipo}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
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
          <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <h3>{editingTemplate ? 'Editar Modelo' : 'Nuevo Modelo'}</h3>
            <form onSubmit={handleSave}>
              <div className="field-row">
                <div className="field" style={{ flex: 2 }}>
                  <label>Título del Escrito *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cédula de Notificación Genérica"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="escrito">Escrito Común</option>
                    <option value="cedula">Cédula</option>
                    <option value="oficio">Oficio</option>
                    <option value="poder">Poder</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span>Contenido de la plantilla *</span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    Soporta <strong>**negrita**</strong>, <u>__subrayado__</u> o etiquetas HTML &lt;b&gt;...&lt;/b&gt;
                  </span>
                </label>

                {/* Barra de formato rápido y variables */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                    padding: '6px 8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--line)', paddingRight: '8px', marginRight: '4px' }}>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '3px 8px', fontSize: '12px', fontWeight: 'bold' }}
                      title="Poner en negrita"
                      onClick={() => insertSnippet('**', '**')}
                    >
                      B (Negrita)
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '3px 8px', fontSize: '12px', textDecoration: 'underline' }}
                      title="Poner en subrayado"
                      onClick={() => insertSnippet('__', '__')}
                    >
                      U (Subrayado)
                    </button>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Variables:</span>
                  {[
                    { label: 'Cliente', tag: '{{cliente.nombre}}' },
                    { label: 'Carátula', tag: '{{causa.caratula}}' },
                    { label: 'N° Expte', tag: '{{causa.numero}}' },
                    { label: 'Juzgado', tag: '{{juzgado}}' },
                    { label: 'Abogado', tag: '{{lawyer.nombre}}' },
                    { label: 'Contraparte', tag: '{{contraparte.nombre}}' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      className="btn secondary"
                      style={{ padding: '2px 7px', fontSize: '11px' }}
                      onClick={() => insertSnippet(v.tag)}
                    >
                      +{v.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  required
                  style={{ height: '300px', fontFamily: 'monospace', fontSize: '13px' }}
                  placeholder="Escribe el modelo aquí..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
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
                  {saving ? 'Guardando...' : 'Guardar Plantilla'}
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
