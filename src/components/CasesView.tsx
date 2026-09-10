'use client';

import React, { useState, useEffect } from 'react';
import CaseDetailModal from './CaseDetailModal';

interface CaseItem {
  id: number;
  caratula: string;
  fuero: string;
  juzgado: string | null;
  numero: string | null;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono?: string;
  lawyer_id: number | null;
  lawyer_nombre?: string;
  estado: string;
  notas: string | null;
  contraparte_nombre: string | null;
  link_portal: string | null;
  ruta_carpeta: string | null;
  total_movimientos?: number;
  ultimo_movimiento?: string;
  created_at?: string;
}

interface ClientOption {
  id: number;
  nombre: string;
  doc?: string;
}

interface LawyerOption {
  id: number;
  nombre: string;
}

export default function CasesView() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'activo' | 'archivado' | 'todos'>('activo');
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  // Modal Crear Causa
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    caratula: '',
    numero: '',
    fuero: 'Civil y Comercial',
    juzgado: '',
    cliente_id: '',
    lawyer_id: '',
    contraparte_nombre: '',
    contraparte_abogado: '',
    contraparte_contacto: '',
    link_portal: '',
    ruta_carpeta: '',
    notas: '',
    jurisdiction_id: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      if (search.trim()) query.append('search', search.trim());

      const res = await fetch(`/api/cases?${query.toString()}`);
      const data = await res.json();
      if (data.cases) setCases(data.cases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [resClients, resLawyers, resJuris] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/lawyers'),
        fetch('/api/settings/jurisdictions'),
      ]);
      const dataClients = await resClients.json();
      const dataLawyers = await resLawyers.json();
      const dataJuris = await resJuris.json();
      if (dataClients.clients) setClients(dataClients.clients);
      if (dataLawyers.lawyers) setLawyers(dataLawyers.lawyers);
      if (dataJuris.jurisdictions) setJurisdictions(dataJuris.jurisdictions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const openCreateModal = () => {
    setFormData({
      caratula: '',
      numero: '',
      fuero: 'Civil y Comercial',
      juzgado: '',
      cliente_id: clients.length > 0 ? String(clients[0].id) : '',
      lawyer_id: lawyers.length > 0 ? String(lawyers[0].id) : '',
      contraparte_nombre: '',
      contraparte_abogado: '',
      contraparte_contacto: '',
      link_portal: '',
      ruta_carpeta: '',
      notas: '',
      jurisdiction_id: '',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caratula.trim()) {
      alert('La carátula es obligatoria');
      return;
    }
    if (!formData.cliente_id) {
      alert('Debe seleccionar un cliente. Si no existe, créelo primero en la sección Clientes.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cliente_id: Number(formData.cliente_id),
          lawyer_id: formData.lawyer_id ? Number(formData.lawyer_id) : null,
          jurisdiction_id: formData.jurisdiction_id ? Number(formData.jurisdiction_id) : null,
        }),
      });

      if (res.ok) {
        showToast('Causa creada exitosamente');
        setCreateModalOpen(false);
        fetchCases();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al crear la causa');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (item: CaseItem) => {
    const nuevoEstado = item.estado === 'activo' ? 'archivado' : 'activo';
    try {
      const res = await fetch('/api/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          estado: nuevoEstado,
        }),
      });
      if (res.ok) {
        showToast(`Causa marcada como ${nuevoEstado}`);
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (item: CaseItem) => {
    if (!confirm(`¿Eliminar la causa "${item.caratula}" y todos sus movimientos asociados?`)) return;

    try {
      const res = await fetch(`/api/cases?id=${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Causa eliminada');
        fetchCases();
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleExportCSV = () => {
    if (cases.length === 0) {
      alert('No hay causas para exportar');
      return;
    }
    const header = ['Carátula', 'Número', 'Fuero', 'Juzgado', 'Cliente', 'Estado', 'Fecha Inicio'].join(';');
    const rows = cases.map(c => [
      `"${c.caratula.replace(/"/g, '""')}"`,
      `"${c.numero || ''}"`,
      `"${c.fuero || ''}"`,
      `"${c.juzgado || ''}"`,
      `"${c.cliente_nombre || ''}"`,
      c.estado || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
    ].join(';'));
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Causas_${statusFilter}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Expedientes & Causas</h2>
          <p>Gestión y seguimiento de procesos judiciales del estudio</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn secondary" onClick={handleExportCSV}>
            📥 Exportar Excel/CSV
          </button>
          <button className="btn" onClick={openCreateModal}>
            + Nuevo Expediente
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${statusFilter === 'activo' ? 'active' : ''}`}
          onClick={() => setStatusFilter('activo')}
        >
          Causas Activas
        </button>
        <button
          className={`filter-tab ${statusFilter === 'archivado' ? 'active' : ''}`}
          onClick={() => setStatusFilter('archivado')}
        >
          Archivadas
        </button>
        <button
          className={`filter-tab ${statusFilter === 'todos' ? 'active' : ''}`}
          onClick={() => setStatusFilter('todos')}
        >
          Ver Todas
        </button>

        <div style={{ marginLeft: 'auto', minWidth: '320px' }}>
          <input
            type="text"
            placeholder="Buscar por carátula, expte, cliente, fuero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: '3px',
              border: '1px solid var(--line)',
              background: '#fff',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>Listado de Causas ({cases.length})</span>
        </div>

        {loading ? (
          <div className="loading">Cargando expedientes...</div>
        ) : cases.length === 0 ? (
          <div className="empty">
            {search
              ? 'No hay causas que coincidan con los criterios de búsqueda.'
              : 'No hay causas registradas en esta vista.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Carátula / Expte</th>
                <th>Fuero y Juzgado</th>
                <th>Cliente</th>
                <th>Último Movimiento</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="row-click"
                  onClick={() => setSelectedCaseId(c.id)}
                >
                  <td>
                    <strong>{c.caratula}</strong>
                    {c.numero && (
                      <span className="meta-text">N°: {c.numero}</span>
                    )}
                  </td>
                  <td>
                    <div>{c.fuero}</div>
                    {c.juzgado && (
                      <span className="meta-text">{c.juzgado}</span>
                    )}
                  </td>
                  <td>
                    <div>{c.cliente_nombre}</div>
                    {c.lawyer_nombre && (
                      <span className="meta-text">Resp: {c.lawyer_nombre}</span>
                    )}
                  </td>
                  <td>
                    {c.ultimo_movimiento ? (
                      <div>
                        <span>{c.ultimo_movimiento}</span>
                        <span className="meta-text">
                          {c.total_movimientos} movimientos
                        </span>
                      </div>
                    ) : (
                      <span className="muted">Sin movimientos</span>
                    )}
                  </td>
                  <td>
                    <span className={`tag ${c.estado}`}>{c.estado}</span>
                  </td>
                  <td
                    style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="link-btn"
                      onClick={() => setSelectedCaseId(c.id)}
                      style={{ marginRight: '10px' }}
                    >
                      Ficha
                    </button>
                    <button
                      className="link-btn"
                      onClick={() => handleToggleEstado(c)}
                      style={{ marginRight: '10px' }}
                    >
                      {c.estado === 'activo' ? 'Archivar' : 'Reactivar'}
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

      {/* Modal Ficha Detalle */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={fetchCases}
        />
      )}

      {/* Modal Nueva Causa */}
      {createModalOpen && (
        <div className="overlay" onClick={() => setCreateModalOpen(false)}>
          <div
            className="modal wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Nueva Causa Judicial</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="field">
                <label>Carátula de la Causa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pérez Juan c/ Empresa S.A. s/ Daños y Perjuicios"
                  value={formData.caratula}
                  onChange={(e) =>
                    setFormData({ ...formData, caratula: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Número de Expediente</label>
                  <input
                    type="text"
                    placeholder="Ej: 12345/2026"
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData({ ...formData, numero: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Fuero</label>
                  <select
                    value={formData.fuero}
                    onChange={(e) =>
                      setFormData({ ...formData, fuero: e.target.value })
                    }
                  >
                    <option value="Civil y Comercial">Civil y Comercial</option>
                    <option value="Laboral">Laboral</option>
                    <option value="Familia">Familia</option>
                    <option value="Penal">Penal</option>
                    <option value="Contencioso Administrativo">
                      Contencioso Administrativo
                    </option>
                    <option value="Seguridad Social">Seguridad Social</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Juzgado / Secretaría / Tribunal</label>
                  <input
                    type="text"
                    placeholder="Ej: Juzg. Civil N° 14 - Sec. Única"
                    value={formData.juzgado}
                    onChange={(e) =>
                      setFormData({ ...formData, juzgado: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Cliente / Parte Representada *</label>
                  {clients.length === 0 ? (
                    <div style={{ color: 'var(--burgundy)', fontSize: '12px' }}>
                      ⚠️ No hay clientes cargados. Primero cree uno en la sección Clientes.
                    </div>
                  ) : (
                    <select
                      value={formData.cliente_id}
                      onChange={(e) =>
                        setFormData({ ...formData, cliente_id: e.target.value })
                      }
                      required
                    >
                      {clients.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.nombre} {cl.doc ? `(DNI/CUIT: ${cl.doc})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Abogado Responsable</label>
                  <select
                    value={formData.lawyer_id}
                    onChange={(e) =>
                      setFormData({ ...formData, lawyer_id: e.target.value })
                    }
                  >
                    <option value="">-- Sin asignar --</option>
                    {lawyers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Jurisdicción (Plazos de Gracia)</label>
                  <select
                    value={formData.jurisdiction_id}
                    onChange={(e) =>
                      setFormData({ ...formData, jurisdiction_id: e.target.value })
                    }
                  >
                    <option value="">-- Sin asignar --</option>
                    {jurisdictions.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nombre} ({j.hora_gracia} hs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Contraparte (Demandado / Actor contrario)</label>
                  <input
                    type="text"
                    placeholder="Ej: Seguros del Plata S.A."
                    value={formData.contraparte_nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contraparte_nombre: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Abogado Contraparte</label>
                  <input
                    type="text"
                    placeholder="Ej: Dr. Martín López"
                    value={formData.contraparte_abogado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contraparte_abogado: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label>Contacto Contraparte</label>
                  <input
                    type="text"
                    placeholder="Teléfono / Email contraparte"
                    value={formData.contraparte_contacto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contraparte_contacto: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Enlace Portal Judicial (PJN / MEV)</label>
                  <input
                    type="url"
                    placeholder="https://scw.pjn.gov.ar/..."
                    value={formData.link_portal}
                    onChange={(e) =>
                      setFormData({ ...formData, link_portal: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>Notas Internas</label>
                <textarea
                  placeholder="Instrucciones, estrategia o detalles preliminares..."
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
                  onClick={() => setCreateModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={saving || clients.length === 0}
                >
                  {saving ? 'Guardando...' : 'Crear Causa'}
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
