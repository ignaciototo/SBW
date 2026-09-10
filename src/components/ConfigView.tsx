'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ConfigView() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'users' | 'lawyers' | 'tramites' | 'holidays' | 'jurisdictions'>('users');
  
  // States for Users
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'administrativo', is_active: true });

  // States for Lawyers
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loadingLawyers, setLoadingLawyers] = useState(false);
  const [lawyerModal, setLawyerModal] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState<any>(null);
  const [lawyerForm, setLawyerForm] = useState({
    nombre: '', matricula: '', cuit: '', domicilio_constituido: '', 
    domicilio_electronico: '', banco: '', titular_cuenta: '', alias: '', cbu: ''
  });

  // States for Procedure Types
  const [procedureTypes, setProcedureTypes] = useState<any[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [procedureModal, setProcedureModal] = useState(false);
  const [procedureForm, setProcedureForm] = useState({ nombre: '', dias: 0, modo: 'habiles' });

  // States for Holidays
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidayModal, setHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ nombre: '', desde: '', hasta: '' });

  // States for Jurisdictions
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [loadingJurisdictions, setLoadingJurisdictions] = useState(false);
  const [jurisdictionModal, setJurisdictionModal] = useState(false);
  const [jurisdictionForm, setJurisdictionForm] = useState({ nombre: '', hora_gracia: '' });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = (session?.user as any)?.role === 'abogado';

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLawyers = async () => {
    setLoadingLawyers(true);
    try {
      const res = await fetch('/api/lawyers');
      const data = await res.json();
      if (data.lawyers) setLawyers(data.lawyers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLawyers(false);
    }
  };

  const fetchHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const res = await fetch('/api/settings/holidays');
      const data = await res.json();
      if (data.holidays) setHolidays(data.holidays);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const fetchProcedureTypes = async () => {
    setLoadingProcedures(true);
    try {
      const res = await fetch('/api/settings/procedure-types');
      const data = await res.json();
      if (data.procedureTypes) setProcedureTypes(data.procedureTypes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProcedures(false);
    }
  };

  const fetchJurisdictions = async () => {
    setLoadingJurisdictions(true);
    try {
      const res = await fetch('/api/settings/jurisdictions');
      const data = await res.json();
      if (data.jurisdictions) setJurisdictions(data.jurisdictions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJurisdictions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'lawyers') fetchLawyers();
    else if (activeTab === 'tramites') fetchProcedureTypes();
    else if (activeTab === 'holidays') fetchHolidays();
    else if (activeTab === 'jurisdictions') fetchJurisdictions();
  }, [activeTab]);

  // User Handlers
  const openUserModal = (u?: any) => {
    if (u) {
      setEditingUser(u);
      setUserForm({ username: u.username, password: '', role: u.role, is_active: u.is_active === 1 });
    } else {
      setEditingUser(null);
      setUserForm({ username: '', password: '', role: 'administrativo', is_active: true });
    }
    setUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { id: editingUser.id, ...userForm } : userForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast('Usuario guardado');
        setUserModal(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Usuario eliminado');
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lawyer Handlers
  const openLawyerModal = (l?: any) => {
    if (l) {
      setEditingLawyer(l);
      setLawyerForm({
        nombre: l.nombre, matricula: l.matricula, cuit: l.cuit || '', 
        domicilio_constituido: l.domicilio_constituido || '', 
        domicilio_electronico: l.domicilio_electronico || '', 
        banco: l.banco || '', titular_cuenta: l.titular_cuenta || '', 
        alias: l.alias || '', cbu: l.cbu || ''
      });
    } else {
      setEditingLawyer(null);
      setLawyerForm({
        nombre: '', matricula: '', cuit: '', domicilio_constituido: '', 
        domicilio_electronico: '', banco: '', titular_cuenta: '', alias: '', cbu: ''
      });
    }
    setLawyerModal(true);
  };

  const saveLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/lawyers';
      const method = editingLawyer ? 'PUT' : 'POST';
      const body = editingLawyer ? { id: editingLawyer.id, ...lawyerForm } : lawyerForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast('Abogado guardado');
        setLawyerModal(false);
        fetchLawyers();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLawyer = async (id: number) => {
    if (!confirm('¿Eliminar este abogado?')) return;
    try {
      const res = await fetch(`/api/lawyers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Abogado eliminado');
        fetchLawyers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Procedure Type Handlers
  const openProcedureModal = () => {
    setProcedureForm({ nombre: '', dias: 0, modo: 'habiles' });
    setProcedureModal(true);
  };

  const saveProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/procedure-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(procedureForm),
      });
      if (res.ok) {
        showToast('Tipo de trámite guardado');
        setProcedureModal(false);
        fetchProcedureTypes();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteProcedure = async (id: number) => {
    if (!confirm('¿Eliminar este tipo de trámite?')) return;
    try {
      const res = await fetch(`/api/settings/procedure-types?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Trámite eliminado');
        fetchProcedureTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Holiday Handlers
  const openHolidayModal = () => {
    setHolidayForm({ nombre: '', desde: '', hasta: '' });
    setHolidayModal(true);
  };

  const saveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      });
      if (res.ok) {
        showToast('Feria / Asueto guardado');
        setHolidayModal(false);
        fetchHolidays();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteHoliday = async (id: number) => {
    if (!confirm('¿Eliminar esta feria/asueto?')) return;
    try {
      const res = await fetch(`/api/settings/holidays?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Feria eliminada');
        fetchHolidays();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Jurisdiction Handlers
  const openJurisdictionModal = () => {
    setJurisdictionForm({ nombre: '', hora_gracia: '' });
    setJurisdictionModal(true);
  };

  const saveJurisdiction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/jurisdictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jurisdictionForm),
      });
      if (res.ok) {
        showToast('Jurisdicción guardada');
        setJurisdictionModal(false);
        fetchJurisdictions();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteJurisdiction = async (id: number) => {
    if (!confirm('¿Eliminar esta jurisdicción?')) return;
    try {
      const res = await fetch(`/api/settings/jurisdictions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Jurisdicción eliminada');
        fetchJurisdictions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty" style={{marginTop:'40px'}}>
        <h3>Acceso Denegado</h3>
        <p>Solo los usuarios con rol de abogado pueden acceder a la configuración del estudio.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Configuración del Estudio</h2>
          <p>Administración de usuarios de acceso y datos de los letrados.</p>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Usuarios del Sistema
        </button>
        <button
          className={`filter-tab ${activeTab === 'lawyers' ? 'active' : ''}`}
          onClick={() => setActiveTab('lawyers')}
        >
          Abogados / Letrados
        </button>
        <button
          className={`filter-tab ${activeTab === 'tramites' ? 'active' : ''}`}
          onClick={() => setActiveTab('tramites')}
        >
          Tipos de Trámite
        </button>
        <button
          className={`filter-tab ${activeTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('holidays')}
        >
          Ferias Judiciales
        </button>
        <button
          className={`filter-tab ${activeTab === 'jurisdictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('jurisdictions')}
        >
          Jurisdicciones
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="block">
          <div className="block-head">
            <span>Cuentas de Acceso ({users.length})</span>
            <button className="btn small" onClick={() => openUserModal()}>
              + Nuevo Usuario
            </button>
          </div>
          {loadingUsers ? <div className="loading">Cargando...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>
                      <span className="tag programado" style={{textTransform:'capitalize'}}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`tag ${u.is_active ? 'activo' : 'archivado'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="link-btn" onClick={() => openUserModal(u)} style={{marginRight:'10px'}}>Editar</button>
                      <button className="link-btn" style={{color:'var(--burgundy)'}} onClick={() => deleteUser(u.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'lawyers' && (
        <div className="block">
          <div className="block-head">
            <span>Registro de Profesionales ({lawyers.length})</span>
            <button className="btn small" onClick={() => openLawyerModal()}>
              + Nuevo Abogado
            </button>
          </div>
          {loadingLawyers ? <div className="loading">Cargando...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Matrícula</th>
                  <th>CUIT / Domicilio</th>
                  <th>Datos Bancarios</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lawyers.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.nombre}</strong></td>
                    <td>{l.matricula}</td>
                    <td>
                      {l.cuit && <div>CUIT: {l.cuit}</div>}
                      {l.domicilio_electronico && <div className="meta-text">{l.domicilio_electronico}</div>}
                    </td>
                    <td>
                      {l.banco ? (
                        <div className="meta-text">{l.banco} • {l.alias}</div>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace:'nowrap' }}>
                      <button className="link-btn" onClick={() => openLawyerModal(l)} style={{marginRight:'10px'}}>Editar</button>
                      <button className="link-btn" style={{color:'var(--burgundy)'}} onClick={() => deleteLawyer(l.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'tramites' && (
        <div className="block">
          <div className="block-head">
            <span>Tipos de Movimiento / Trámite ({procedureTypes.length})</span>
            <button className="btn small" onClick={openProcedureModal}>+ Nuevo Trámite</button>
          </div>
          {loadingProcedures ? <div className="loading">Cargando...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Nombre del Trámite</th>
                  <th>Plazo Asignado</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procedureTypes.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.nombre}</strong></td>
                    <td>{t.dias === 0 ? 'Sin plazo' : `${t.dias} días ${t.modo}`}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="link-btn" style={{color:'var(--burgundy)'}} onClick={() => deleteProcedure(t.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="block">
          <div className="block-head">
            <span>Ferias Judiciales y Asuetos Locales ({holidays.length})</span>
            <button className="btn small" onClick={openHolidayModal}>+ Nueva Feria</button>
          </div>
          <p style={{fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px'}}>
            Nota: Los feriados nacionales de Argentina se consultan automáticamente vía API oficial. Aquí solo debes agregar asuetos provinciales, locales o ferias de invierno/verano.
          </p>
          {loadingHolidays ? <div className="loading">Cargando...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Nombre / Motivo</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id}>
                    <td><strong>{h.nombre}</strong></td>
                    <td>{new Date(h.desde).toLocaleDateString()}</td>
                    <td>{new Date(h.hasta).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="link-btn" style={{color:'var(--burgundy)'}} onClick={() => deleteHoliday(h.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'jurisdictions' && (
        <div className="block">
          <div className="block-head">
            <span>Jurisdicciones Locales y Federales ({jurisdictions.length})</span>
            <button className="btn small" onClick={openJurisdictionModal}>+ Nueva Jurisdicción</button>
          </div>
          {loadingJurisdictions ? <div className="loading">Cargando...</div> : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Hora Límite de Gracia</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jurisdictions.map(j => (
                  <tr key={j.id}>
                    <td><strong>{j.nombre}</strong></td>
                    <td>{j.hora_gracia} hs</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="link-btn" style={{color:'var(--burgundy)'}} onClick={() => deleteJurisdiction(j.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Usuarios */}
      {userModal && (
        <div className="overlay" onClick={() => setUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={saveUser}>
              <div className="field">
                <label>Nombre de Usuario *</label>
                <input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
              </div>
              <div className="field">
                <label>Contraseña {editingUser && '(Dejar en blanco para mantener actual)'}</label>
                <input type="password" required={!editingUser} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Rol</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="administrativo">Administrativo</option>
                    <option value="abogado">Abogado / Administrador</option>
                  </select>
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select value={userForm.is_active ? '1' : '0'} onChange={e => setUserForm({...userForm, is_active: e.target.value === '1'})}>
                    <option value="1">Activo (Puede ingresar)</option>
                    <option value="0">Inactivo (Bloqueado)</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abogados */}
      {lawyerModal && (
        <div className="overlay" onClick={() => setLawyerModal(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h3>{editingLawyer ? 'Editar Abogado' : 'Nuevo Abogado'}</h3>
            <form onSubmit={saveLawyer}>
              <div className="field-row">
                <div className="field">
                  <label>Nombre Completo *</label>
                  <input required type="text" value={lawyerForm.nombre} onChange={e => setLawyerForm({...lawyerForm, nombre: e.target.value})} />
                </div>
                <div className="field">
                  <label>Tomo y Folio / Matrícula *</label>
                  <input required type="text" value={lawyerForm.matricula} onChange={e => setLawyerForm({...lawyerForm, matricula: e.target.value})} />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>CUIT / CUIL</label>
                  <input type="text" value={lawyerForm.cuit} onChange={e => setLawyerForm({...lawyerForm, cuit: e.target.value})} />
                </div>
                <div className="field">
                  <label>Domicilio Electrónico</label>
                  <input type="text" value={lawyerForm.domicilio_electronico} onChange={e => setLawyerForm({...lawyerForm, domicilio_electronico: e.target.value})} />
                </div>
              </div>

              <div className="field">
                <label>Domicilio Constituido (Físico)</label>
                <input type="text" value={lawyerForm.domicilio_constituido} onChange={e => setLawyerForm({...lawyerForm, domicilio_constituido: e.target.value})} />
              </div>

              <h4 style={{fontSize:'13px', margin:'16px 0 10px 0'}}>Datos Bancarios (Para oficios/transferencias)</h4>
              <div className="field-row">
                <div className="field"><label>Banco</label><input type="text" value={lawyerForm.banco} onChange={e => setLawyerForm({...lawyerForm, banco: e.target.value})} /></div>
                <div className="field"><label>Titular</label><input type="text" value={lawyerForm.titular_cuenta} onChange={e => setLawyerForm({...lawyerForm, titular_cuenta: e.target.value})} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>CBU</label><input type="text" value={lawyerForm.cbu} onChange={e => setLawyerForm({...lawyerForm, cbu: e.target.value})} /></div>
                <div className="field"><label>Alias</label><input type="text" value={lawyerForm.alias} onChange={e => setLawyerForm({...lawyerForm, alias: e.target.value})} /></div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setLawyerModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Procedimientos */}
      {procedureModal && (
        <div className="overlay" onClick={() => setProcedureModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nuevo Tipo de Trámite</h3>
            <form onSubmit={saveProcedure}>
              <div className="field">
                <label>Nombre del Trámite * (Ej. Traslado de Demanda)</label>
                <input required type="text" value={procedureForm.nombre} onChange={e => setProcedureForm({...procedureForm, nombre: e.target.value})} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Días de Plazo (0 para no generar vencimiento)</label>
                  <input type="number" min="0" required value={procedureForm.dias} onChange={e => setProcedureForm({...procedureForm, dias: Number(e.target.value)})} />
                </div>
                <div className="field">
                  <label>Modo de Cálculo</label>
                  <select value={procedureForm.modo} onChange={e => setProcedureForm({...procedureForm, modo: e.target.value})}>
                    <option value="habiles">Días Hábiles</option>
                    <option value="corridos">Días Corridos</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setProcedureModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Feriados */}
      {holidayModal && (
        <div className="overlay" onClick={() => setHolidayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nueva Feria Judicial / Asueto</h3>
            <form onSubmit={saveHoliday}>
              <div className="field">
                <label>Descripción / Motivo *</label>
                <input required type="text" value={holidayForm.nombre} onChange={e => setHolidayForm({...holidayForm, nombre: e.target.value})} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Fecha Desde *</label>
                  <input type="date" required value={holidayForm.desde} onChange={e => setHolidayForm({...holidayForm, desde: e.target.value})} />
                </div>
                <div className="field">
                  <label>Fecha Hasta *</label>
                  <input type="date" required value={holidayForm.hasta} onChange={e => setHolidayForm({...holidayForm, hasta: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setHolidayModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Jurisdicciones */}
      {jurisdictionModal && (
        <div className="overlay" onClick={() => setJurisdictionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nueva Jurisdicción</h3>
            <form onSubmit={saveJurisdiction}>
              <div className="field">
                <label>Nombre de la Jurisdicción *</label>
                <input required type="text" placeholder="Ej: CABA, Provincia Bs. As., Justicia Federal" value={jurisdictionForm.nombre} onChange={e => setJurisdictionForm({...jurisdictionForm, nombre: e.target.value})} />
              </div>
              <div className="field">
                <label>Hora Límite del Plazo de Gracia *</label>
                <input required type="time" value={jurisdictionForm.hora_gracia} onChange={e => setJurisdictionForm({...jurisdictionForm, hora_gracia: e.target.value})} />
                <div style={{fontSize: '11px', color: 'var(--text-light)', marginTop: '4px'}}>
                  Formato 24hs. Ej: Si el plazo de gracia finaliza a las 10 de la mañana, ingresa 10:00.
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setJurisdictionModal(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
