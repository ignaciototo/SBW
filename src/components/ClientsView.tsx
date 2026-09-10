'use client';

import React, { useState, useEffect } from 'react';

interface Client {
  id: number;
  nombre: string;
  doc: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  total_cases?: number;
}

export default function ClientsView({
  onSelectClient,
}: {
  onSelectClient?: (client: Client) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    doc: '',
    telefono: '',
    email: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ nombre: '', doc: '', telefono: '', email: '', notas: '' });
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nombre: client.nombre || '',
      doc: client.doc || '',
      telefono: client.telefono || '',
      email: client.email || '',
      notas: client.notas || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        // Edit
        const res = await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient.id, ...formData }),
        });
        if (res.ok) {
          showToast('Cliente actualizado con éxito');
          setModalOpen(false);
          fetchClients();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al actualizar');
        }
      } else {
        // Create
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast('Cliente creado correctamente');
          setModalOpen(false);
          fetchClients();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al crear cliente');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Eliminar al cliente "${client.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/clients?id=${client.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Cliente eliminado');
        fetchClients();
      } else {
        alert(data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.doc && c.doc.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Directorio de Clientes</h2>
          <p>Contactos y partes representadas por el estudio</p>
        </div>
        <div>
          <button className="btn" onClick={openCreateModal}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, DNI/CUIT, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '480px',
            padding: '9px 12px',
            borderRadius: '3px',
            border: '1px solid var(--line)',
            background: '#fff',
            fontSize: '13.5px',
          }}
        />
      </div>

      <div className="block">
        <div className="block-head">
          <span>Clientes Registrados ({filtered.length})</span>
        </div>

        {loading ? (
          <div className="loading">Cargando directorio...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {search
              ? 'No se encontraron clientes que coincidan con la búsqueda.'
              : 'Aún no hay clientes registrados. Haz clic en "+ Nuevo Cliente" para comenzar.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente / Razón Social</th>
                <th>DNI / CUIT</th>
                <th>Contacto</th>
                <th>Causas</th>
                <th>Notas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.nombre}</strong>
                  </td>
                  <td>{c.doc || <span className="muted">—</span>}</td>
                  <td>
                    {c.telefono ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.telefono}</span>
                        <a
                          href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn wa small"
                          title="Enviar WhatsApp"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                        >
                          WA
                        </a>
                      </div>
                    ) : null}
                    {c.email && (
                      <div className="meta-text">{c.email}</div>
                    )}
                    {!c.telefono && !c.email && <span className="muted">—</span>}
                  </td>
                  <td>
                    <span className="tag programado">
                      {c.total_cases || 0} causas
                    </span>
                  </td>
                  <td style={{ maxWidth: '240px' }}>
                    {c.notas ? (
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                        {c.notas}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="link-btn"
                      onClick={() => openEditModal(c)}
                      style={{ marginRight: '10px' }}
                    >
                      Editar
                    </button>
                    <button
                      className="link-btn"
                      style={{ color: 'var(--burgundy)' }}
                      onClick={() => handleDelete(c)}
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
            <h3>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nombre y Apellido / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez / Gómez Hnos. S.A."
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>DNI o CUIT</label>
                  <input
                    type="text"
                    placeholder="Ej: 30-12345678-9"
                    value={formData.doc}
                    onChange={(e) =>
                      setFormData({ ...formData, doc: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Teléfono (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="Ej: 11 5555-1234"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>Notas de Referencia</label>
                <textarea
                  placeholder="Información adicional sobre el cliente..."
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving
                    ? 'Guardando...'
                    : editingClient
                    ? 'Actualizar'
                    : 'Guardar Cliente'}
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
