'use client';

import React, { useState, useEffect } from 'react';

interface Movement {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string | null;
  tipo: string | null;
  agenda_event_id?: number | null;
  agenda_fecha?: string | null;
  agenda_fecha_gracia?: string | null;
  agenda_hora_gracia?: string | null;
  agenda_estado?: string | null;
}

interface CaseDetailProps {
  caseId: number;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export default function CaseDetailModal({
  caseId,
  onClose,
  onCaseUpdated,
}: CaseDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMovOpen, setNewMovOpen] = useState(false);
  const [movForm, setMovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
    tipo: 'proveido',
    procedure_type_id: '',
    fecha_vencimiento: '',
    fecha_gracia: '',
    hora_gracia: '',
    has_deadline: false,
  });
  const [savingMov, setSavingMov] = useState(false);
  const [calculatingDeadline, setCalculatingDeadline] = useState(false);
  const [procedureTypes, setProcedureTypes] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [autoLogMov, setAutoLogMov] = useState(true);

  // Economía
  const [showEco, setShowEco] = useState(false);
  const [ecoForm, setEcoForm] = useState({ tipo: 'gasto', concepto: '', importe: '', moneda: 'Pesos' });
  const [savingEco, setSavingEco] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({ monto: '', fecha: new Date().toISOString().split('T')[0] });
  const [savingPayment, setSavingPayment] = useState(false);
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const json = await res.json();
      if (json.templates) setTemplates(json.templates);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProcedureTypes = async () => {
    try {
      const res = await fetch('/api/settings/procedure-types');
      const json = await res.json();
      if (json.procedureTypes) setProcedureTypes(json.procedureTypes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.case) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchTemplates();
    fetchProcedureTypes();
  }, [caseId]);

  const handleGenerateDoc = async () => {
    const t = templates.find(x => x.id.toString() === selectedTemplateId);
    if (!t) return;
    
    const c = data?.case;
    if (!c) return;

    let content = t.contenido;
    content = content.replace(/{{cliente\.nombre}}/g, c.cliente_nombre || '');
    content = content.replace(/{{causa\.caratula}}/g, c.caratula || '');
    content = content.replace(/{{causa\.numero}}/g, c.numero || '');
    content = content.replace(/{{juzgado}}/g, c.juzgado || '');
    content = content.replace(/{{lawyer\.nombre}}/g, c.lawyer_nombre || '');
    content = content.replace(/{{contraparte\.nombre}}/g, c.contraparte_nombre || '');

    // Soporte para Markdown simple (**negrita**, __subrayado__)
    content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');

    // Convertir saltos de línea a párrafos HTML
    const htmlParagraphs = content.split('\n').map((line: string) => `<p>${line || '&nbsp;'}</p>`).join('');

    // Plantilla HTML con formato Microsoft Word Legal Argentino
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${t.titulo}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
              mso-page-orientation: portrait;
              size: 21cm 29.7cm; /* A4 */
              margin: 3cm 2cm 3cm 5cm; /* Superior 3cm, Inferior 3cm, Izquierdo 5cm, Derecho 2cm */
          }
          @page Section1 {
              mso-header-margin: 1.5cm;
              mso-footer-margin: 1.5cm;
          }
          div.Section1 { page: Section1; }
          p {
              font-family: "Times New Roman", serif;
              font-size: 12pt;
              line-height: 150%;
              text-align: justify;
              margin: 0;
              margin-bottom: 0pt;
              mso-line-height-rule: exactly;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${htmlParagraphs}
        </div>
      </body>
      </html>
    `;

    // Descargar como documento de Word (.doc)
    const element = document.createElement("a");
    const file = new Blob([wordHtml], {type: 'application/msword;charset=utf-8'});
    const fileName = `${t.titulo} - ${c.caratula}.doc`;
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Guardar automáticamente en los documentos adjuntos de la causa
    try {
      const docFormData = new FormData();
      docFormData.append('file', file, fileName);
      await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: docFormData,
      });
    } catch (err) {
      console.error('Error auto-guardando el documento generado', err);
    }

    // Auto log movement if checked
    if (autoLogMov) {
      try {
        const res = await fetch(`/api/cases/${caseId}/movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fecha: new Date().toISOString().split('T')[0],
            titulo: `Confección: ${t.titulo}`,
            descripcion: `Documento generado automáticamente a partir del modelo "${t.titulo}".`,
            tipo: t.tipo || 'escrito',
          }),
        });
        if (res.ok) {
          if (onCaseUpdated) onCaseUpdated();
        }
      } catch (err) {
        console.error('Error auto-logging movement', err);
      }
    }

    fetchDetail();
    setShowTemplateModal(false);
  };

  const formatDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const calculateDeadlineForMovement = async (procId: string, fechaStr: string) => {
    const proc = procedureTypes.find(p => p.id.toString() === procId);
    if (!proc || proc.dias <= 0) {
      setMovForm(prev => ({
        ...prev,
        procedure_type_id: procId,
        fecha_vencimiento: '',
        fecha_gracia: '',
        hora_gracia: '',
        has_deadline: false,
      }));
      return;
    }

    setCalculatingDeadline(true);
    try {
      const res = await fetch('/api/calculate-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: fechaStr,
          dias: proc.dias,
          modo: proc.modo,
          hora_gracia: data?.case?.hora_gracia || ''
        })
      });
      const calc = await res.json();
      if (calc.normal) {
        setMovForm(prev => ({
          ...prev,
          procedure_type_id: procId,
          titulo: prev.titulo || proc.nombre,
          fecha_vencimiento: calc.normal,
          fecha_gracia: calc.fecha_gracia || '',
          hora_gracia: calc.hora_gracia || data?.case?.hora_gracia || '',
          has_deadline: true,
        }));
      }
    } catch (err) {
      console.error('Error calculando plazo:', err);
    } finally {
      setCalculatingDeadline(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.titulo.trim()) return;

    setSavingMov(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movForm),
      });
      if (res.ok) {
        setNewMovOpen(false);
        setMovForm({
          fecha: new Date().toISOString().split('T')[0],
          titulo: '',
          descripcion: '',
          tipo: 'proveido',
          procedure_type_id: '',
          fecha_vencimiento: '',
          fecha_gracia: '',
          hora_gracia: '',
          has_deadline: false,
        });
        fetchDetail();
        if (onCaseUpdated) onCaseUpdated();
      } else {
        alert('Error al agregar movimiento');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSavingMov(false);
    }
  };

  const handleDeleteMovement = async (movId: number) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      const res = await fetch(
        `/api/cases/${caseId}/movements?movId=${movId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        fetchDetail();
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAgendaEstado = async (agendaId: number, currentEstado: string) => {
    const nuevoEstado = currentEstado === 'cumplido' ? 'pendiente' : 'cumplido';
    try {
      const res = await fetch('/api/agenda', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agendaId, estado: nuevoEstado }),
      });
      if (res.ok) {
        fetchDetail();
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecoForm.concepto || !ecoForm.importe) return;
    setSavingEco(true);
    try {
      const isFee = ecoForm.tipo === 'honorario';
      const endpoint = `/api/cases/${caseId}/${isFee ? 'fees' : 'expenses'}`;
      const payload = isFee ? {
        concepto: ecoForm.concepto,
        monto: ecoForm.importe,
        moneda: ecoForm.moneda,
      } : {
        concepto: ecoForm.concepto,
        importe: ecoForm.importe,
        tipo: ecoForm.tipo, // 'gasto' o 'adelanto'
        fecha: new Date().toISOString().split('T')[0],
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchDetail();
        setEcoForm({ tipo: 'gasto', concepto: '', importe: '', moneda: 'Pesos' });
        setShowEco(false);
      } else {
        alert('Error al guardar registro económico');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setSavingEco(false);
    }
  };

  const handleDeleteEco = async (id: number, type: 'fee' | 'expense') => {
    if (!confirm('¿Eliminar este registro permanentemente?')) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/${type}s?${type}Id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent, feeId: number) => {
    e.preventDefault();
    if (!paymentForm.monto) return;
    setSavingPayment(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/fees/${feeId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: paymentForm.monto,
          fecha: paymentForm.fecha
        }),
      });
      if (res.ok) {
        fetchDetail();
        setPaymentFormOpen(null);
        setPaymentForm({ monto: '', fecha: new Date().toISOString().split('T')[0] });
      } else {
        alert('Error al registrar pago');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (feeId: number, paymentId: number) => {
    if (!confirm('¿Eliminar este pago parcial?')) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/fees/${feeId}/payments?paymentId=${paymentId}`, { method: 'DELETE' });
      if (res.ok) fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchDetail();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al subir el archivo');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al subir');
    } finally {
      setUploadingDoc(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('¿Eliminar este archivo adjunto de forma permanente?')) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal wide" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Cargando detalles del expediente...</div>
        </div>
      </div>
    );
  }

  if (!data?.case) {
    return null;
  }

  const c = data.case;
  const movements: Movement[] = data.movements || [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '14px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <span className={`tag ${c.estado}`}>{c.estado}</span>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                {c.fuero} {c.juzgado ? `• ${c.juzgado}` : ''}
              </span>
            </div>
            <h3 style={{ fontSize: '20px', margin: 0 }}>{c.caratula}</h3>
            {c.numero && (
              <div className="meta-text" style={{ fontSize: '13px' }}>
                Expte. N°: <strong>{c.numero}</strong>
              </div>
            )}
            <div className="meta-text" style={{ fontSize: '13px', marginTop: '4px' }}>
              Jurisdicción: <strong>{c.jurisdiction_nombre || 'Sin asignar'}</strong>
              {c.hora_gracia && ` (Gracia hasta las ${c.hora_gracia} hs)`}
            </div>
            
            {(c.link_portal || c.ruta_carpeta) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {c.link_portal && (
                  <a href={c.link_portal} target="_blank" rel="noreferrer" className="btn secondary small" style={{ fontSize: '12px', padding: '4px 8px' }}>
                    🌐 Portal Judicial
                  </a>
                )}
                {c.ruta_carpeta && (
                  <a href={c.ruta_carpeta.startsWith('http') ? c.ruta_carpeta : `file:///${c.ruta_carpeta.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="btn secondary small" style={{ fontSize: '12px', padding: '4px 8px' }}>
                    📁 Carpeta
                  </a>
                )}
              </div>
            )}
          </div>
          <button
            className="icon-btn"
            style={{ fontSize: '20px', lineHeight: 1 }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Ficha de Partes */}
        <div className="ficha-grid" style={{ marginBottom: '18px', border: '1px solid var(--line)' }}>
          <div className="ficha-col">
            <h4>Parte Representada (Cliente)</h4>
            <div className="ficha-dato">
              <strong>{c.cliente_nombre}</strong>
              {c.cliente_doc && <div>Doc: {c.cliente_doc}</div>}
              {c.cliente_telefono && (
                <div>
                  Tel: {c.cliente_telefono}{' '}
                  <a
                    href={`https://wa.me/${c.cliente_telefono.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn wa small"
                    style={{ padding: '1px 5px', fontSize: '10.5px', marginLeft: '4px' }}
                  >
                    WhatsApp
                  </a>
                </div>
              )}
              {c.cliente_email && <div>Email: {c.cliente_email}</div>}
            </div>

            {c.lawyer_nombre && (
              <div style={{ marginTop: '12px' }}>
                <h4>Abogado Asignado</h4>
                <div className="ficha-dato">
                  <strong>{c.lawyer_nombre}</strong>
                  {c.lawyer_matricula && <div className="meta-text">{c.lawyer_matricula}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="ficha-col">
            <h4>Contraparte</h4>
            <div className="ficha-dato">
              {c.contraparte_nombre ? (
                <>
                  <strong>{c.contraparte_nombre}</strong>
                  {c.contraparte_abogado && (
                    <div>Patrocinio: {c.contraparte_abogado}</div>
                  )}
                  {c.contraparte_contacto && (
                    <div>Contacto: {c.contraparte_contacto}</div>
                  )}
                </>
              ) : (
                <span className="muted">Sin contraparte especificada</span>
              )}
            </div>

            {/* Accesos rápidos */}
            <div style={{ marginTop: '14px' }}>
              <h4>Accesos Rápidos</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {c.link_portal && (
                  <a
                    href={c.link_portal}
                    target="_blank"
                    rel="noreferrer"
                    className="btn secondary small"
                  >
                    🔗 Portal Judicial
                  </a>
                )}
                <button
                  className="btn secondary small"
                  onClick={async () => {
                    const folderPath = c.ruta_carpeta || `storage\\documents\\${caseId}`;
                    try {
                      const res = await fetch(`/api/open-folder?path=${encodeURIComponent(folderPath)}`);
                      if (!res.ok) throw new Error('API request failed');
                    } catch (e) {
                      // Fallback
                      navigator.clipboard.writeText(folderPath);
                      alert(`Ruta de la carpeta copiada al portapapeles:\n${folderPath}`);
                    }
                  }}
                  title="Abrir carpeta de la causa"
                >
                  📁 Abrir Carpeta Local
                </button>
                
                {/* Nuevo: Integración WhatsApp y Generador */}
                {c.cliente_telefono && movements.length > 0 && (
                  <button
                    className="btn wa small"
                    onClick={() => {
                      const mov = movements[0];
                      const msg = `Hola ${c.cliente_nombre}, te escribo del Estudio por tu causa "${c.caratula}". Te aviso que tuvimos una novedad judicial:\n\n*${mov.titulo}*\n${mov.descripcion ? mov.descripcion : ''}\n\nQuedamos a disposición por cualquier consulta.`;
                      window.open(`https://wa.me/${c.cliente_telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                  >
                    Notificar Novedad (WA)
                  </button>
                )}
                
                <button
                  className="btn small"
                  style={{ background: 'var(--navy-deep)', color: '#fff' }}
                  onClick={() => setShowTemplateModal(true)}
                >
                  Generar Escrito
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notas del caso */}
        {c.notas && (
          <div
            style={{
              background: '#FAF7EE',
              border: '1px solid var(--line)',
              padding: '10px 14px',
              fontSize: '13px',
              marginBottom: '18px',
              borderRadius: '2px',
            }}
          >
            <strong>Notas internas:</strong> {c.notas}
          </div>
        )}

        {/* Economía / Finanzas */}
        <div className="block" style={{ marginBottom: '18px' }}>
          <div className="block-head">
            <span>Economía de la Causa</span>
            <button className="btn small" onClick={() => setShowEco(!showEco)}>
              {showEco ? 'Cancelar' : '+ Agregar Registro'}
            </button>
          </div>
          
          {showEco && (
            <form onSubmit={handleAddEco} style={{ background: '#F5F2E9', padding: '14px', borderBottom: '1px solid var(--line)' }}>
              <div className="field-row">
                <div className="field" style={{ maxWidth: '150px' }}>
                  <label>Categoría</label>
                  <select value={ecoForm.tipo} onChange={e => setEcoForm({...ecoForm, tipo: e.target.value})}>
                    <option value="honorario">Honorario</option>
                    <option value="gasto">Gasto (A reintegrar)</option>
                    <option value="adelanto">Ingreso del Cliente (Adelanto / Reintegro)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Concepto</label>
                  <input type="text" value={ecoForm.concepto} onChange={e => setEcoForm({...ecoForm, concepto: e.target.value})} required placeholder="Ej. Bono 8480, Pacto..." />
                </div>
                <div className="field" style={{ maxWidth: '150px' }}>
                  <label>Monto</label>
                  <input type="number" step="0.01" value={ecoForm.importe} onChange={e => setEcoForm({...ecoForm, importe: e.target.value})} required />
                </div>
                {ecoForm.tipo === 'honorario' && (
                  <div className="field" style={{ maxWidth: '100px' }}>
                    <label>Moneda</label>
                    <select value={ecoForm.moneda} onChange={e => setEcoForm({...ecoForm, moneda: e.target.value})}>
                      <option value="Pesos">Pesos</option>
                      <option value="USD">USD</option>
                      <option value="JUS">JUS</option>
                    </select>
                  </div>
                )}
                <div className="field" style={{ maxWidth: '100px', display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn primary" disabled={savingEco}>{savingEco ? '...' : 'Guardar'}</button>
                </div>
              </div>
            </form>
          )}

          <div style={{ padding: '14px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--navy-deep)', borderBottom: '1px solid var(--line)', paddingBottom: '4px' }}>Cta. Cte. Honorarios</h4>
            {(data.fees || []).length === 0 ? (
              <div className="empty" style={{ margin: '0 0 20px 0' }}>No hay honorarios registrados.</div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                {(data.fees || []).map((f: any) => {
                  const saldo = f.monto - (f.pagado || 0);
                  const isPaid = saldo <= 0;
                  return (
                    <div key={`fee-${f.id}`} style={{ border: '1px solid var(--line)', borderRadius: '4px', marginBottom: '10px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', alignItems: 'center', borderBottom: f.payments?.length || paymentFormOpen === f.id ? '1px solid var(--line)' : 'none' }}>
                        <div>
                          <strong style={{ fontSize: '14px' }}>{f.concepto}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                            Total: {f.moneda} {f.monto} | Cobrado: {f.moneda} {f.pagado || 0}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: isPaid ? 'var(--green)' : 'var(--burgundy)', fontSize: '14px' }}>
                            {isPaid ? 'CANCELADO' : `Saldo: ${f.moneda} ${saldo}`}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                            {!isPaid && (
                              <button className="link-btn" style={{ fontSize: '11px', color: 'var(--blue)' }} onClick={() => setPaymentFormOpen(paymentFormOpen === f.id ? null : f.id)}>+ Cobrar</button>
                            )}
                            <button className="link-btn" style={{ fontSize: '11px', color: 'var(--burgundy)' }} onClick={() => handleDeleteEco(f.id, 'fee')}>Borrar</button>
                          </div>
                        </div>
                      </div>

                      {paymentFormOpen === f.id && (
                        <div style={{ padding: '10px 14px', background: '#F5F2E9', borderBottom: '1px solid var(--line)' }}>
                          <form onSubmit={(e) => handleAddPayment(e, f.id)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div className="field" style={{ margin: 0, flex: 1 }}>
                              <label>Fecha de Cobro</label>
                              <input type="date" value={paymentForm.fecha} onChange={e => setPaymentForm({...paymentForm, fecha: e.target.value})} required />
                            </div>
                            <div className="field" style={{ margin: 0, flex: 1 }}>
                              <label>Monto ({f.moneda})</label>
                              <input type="number" step="0.01" value={paymentForm.monto} onChange={e => setPaymentForm({...paymentForm, monto: e.target.value})} required />
                            </div>
                            <button type="submit" className="btn small primary" disabled={savingPayment}>{savingPayment ? '...' : 'Registrar'}</button>
                          </form>
                        </div>
                      )}

                      {f.payments?.length > 0 && (
                        <div style={{ padding: '0' }}>
                          <table style={{ margin: 0, background: '#fafafa' }}>
                            <tbody>
                              {f.payments.map((p: any) => (
                                <tr key={`payment-${p.id}`}>
                                  <td style={{ fontSize: '11px', color: 'var(--text-light)', width: '100px' }}>{new Date(p.fecha).toLocaleDateString()}</td>
                                  <td style={{ fontSize: '12px' }}>Pago parcial</td>
                                  <td style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', textAlign: 'right' }}>+ {f.moneda} {p.monto}</td>
                                  <td style={{ width: '60px', textAlign: 'right' }}>
                                    <button className="link-btn" style={{ fontSize: '11px', color: 'var(--burgundy)' }} onClick={() => handleDeletePayment(f.id, p.id)}>X</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <h4 style={{ margin: '20px 0 10px 0', color: 'var(--navy-deep)', borderBottom: '1px solid var(--line)', paddingBottom: '4px' }}>Caja de Gastos (Fondo vs Reintegros)</h4>
            {(data.expenses || []).length === 0 ? (
              <div className="empty">No hay movimientos de caja.</div>
            ) : (
              <div>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Fecha</th>
                      <th>Concepto / Tipo</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Ingreso (Cliente)</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Egreso (Gasto)</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.expenses || []).map((e: any) => (
                      <tr key={`exp-${e.id}`}>
                        <td style={{ fontSize: '12px' }}>{new Date(e.fecha).toLocaleDateString()}</td>
                        <td>
                          {e.concepto}
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>{e.tipo}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)' }}>
                          {e.tipo === 'adelanto' ? `$${e.importe}` : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--burgundy)' }}>
                          {e.tipo === 'gasto' ? `-$${e.importe}` : ''}
                        </td>
                        <td style={{ textAlign: 'right' }}><button className="link-btn" style={{ color: 'var(--burgundy)' }} onClick={() => handleDeleteEco(e.id, 'expense')}>Borrar</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>SALDO DE CAJA:</td>
                      <td colSpan={2} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', background: '#F5F2E9' }}>
                        {(() => {
                          const adelantos = (data.expenses || []).filter((e: any) => e.tipo === 'adelanto').reduce((acc: number, e: any) => acc + e.importe, 0);
                          const gastos = (data.expenses || []).filter((e: any) => e.tipo === 'gasto').reduce((acc: number, e: any) => acc + e.importe, 0);
                          const saldoCaja = adelantos - gastos;
                          return <span style={{ color: saldoCaja >= 0 ? 'var(--green)' : 'var(--burgundy)' }}>${saldoCaja.toFixed(2)}</span>;
                        })()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Documentos y Adjuntos */}
        <div className="block" style={{ marginBottom: '18px' }}>
          <div className="block-head">
            <span>Documentos y Adjuntos ({data.documents?.length || 0})</span>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                id="upload-doc"
                style={{ display: 'none' }}
                onChange={handleUploadDoc}
                disabled={uploadingDoc}
              />
              <label htmlFor="upload-doc" className="btn small" style={{ cursor: 'pointer', margin: 0 }}>
                {uploadingDoc ? 'Subiendo...' : '📎 Adjuntar Archivo'}
              </label>
            </div>
          </div>
          
          {!data.documents || data.documents.length === 0 ? (
            <div className="empty">No hay archivos adjuntos en esta causa.</div>
          ) : (
            <table style={{ margin: 0, borderTop: '1px solid var(--line)' }}>
              <tbody>
                {data.documents.map((doc: any) => (
                  <tr key={doc.id}>
                    <td style={{ width: '40px', textAlign: 'center' }}>
                      {doc.tipo === 'pdf' ? '📄' : doc.tipo === 'word' ? '📝' : doc.tipo === 'imagen' ? '🖼️' : '📁'}
                    </td>
                    <td>
                      <strong>{doc.nombre}</strong>
                      <div className="meta-text" style={{ fontSize: '11px' }}>
                        Subido el {doc.fecha}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a
                        href={`/api/cases/${caseId}/documents/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link-btn"
                        style={{ marginRight: '12px' }}
                      >
                        Ver / Descargar
                      </a>
                      <button
                        className="link-btn"
                        style={{ color: 'var(--burgundy)' }}
                        onClick={() => handleDeleteDoc(doc.id)}
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

        {/* Movimientos / Timeline */}
        <div className="block" style={{ marginBottom: 0 }}>
          <div className="block-head">
            <span>Historial de Movimientos ({movements.length})</span>
            <button
              className="btn small"
              onClick={() => setNewMovOpen(!newMovOpen)}
            >
              {newMovOpen ? 'Cancelar' : '+ Agregar Movimiento'}
            </button>
          </div>

          {/* Formulario nuevo movimiento */}
          {newMovOpen && (
            <form
              onSubmit={handleAddMovement}
              style={{
                background: '#F5F2E9',
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div className="field-row">
                <div className="field" style={{ maxWidth: '160px' }}>
                  <label>Fecha *</label>
                  <input
                    type="date"
                    required
                    value={movForm.fecha}
                    onChange={(e) =>
                      setMovForm({ ...movForm, fecha: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Título / Tipo de Actuación *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Proveído que ordena traslado / Presentación demanda"
                    value={movForm.titulo}
                    onChange={(e) =>
                      setMovForm({ ...movForm, titulo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>Descripción / Transcripción</label>
                <textarea
                  placeholder="Detalles de la resolución, plazo otorgado o proveído..."
                  value={movForm.descripcion}
                  onChange={(e) =>
                    setMovForm({ ...movForm, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Vincular a Trámite Automático (Generará Vencimiento)</label>
                  {!movForm.has_deadline && (
                    <button
                      type="button"
                      className="link-btn"
                      style={{ fontSize: '11px', color: 'var(--gold)' }}
                      onClick={() => {
                        setMovForm({
                          ...movForm,
                          has_deadline: true,
                          hora_gracia: data?.case?.hora_gracia || '10:00'
                        });
                      }}
                    >
                      + Ingresar vencimiento manual
                    </button>
                  )}
                </div>
                <select
                  value={movForm.procedure_type_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    calculateDeadlineForMovement(val, movForm.fecha);
                  }}
                >
                  <option value="">-- Ninguno (Solo historial) --</option>
                  {procedureTypes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dias === 0 ? 'Sin plazo' : `${p.dias} días ${p.modo}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Panel de Vencimiento y Plazo de Gracia para Validar o Ajustar a mano */}
              {(movForm.has_deadline || movForm.procedure_type_id) && (
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
                      ⏰ Vencimiento y Plazo de Gracia (Validar antes de guardar)
                    </span>
                    {calculatingDeadline ? (
                      <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 'bold' }}>
                        Calculando hábiles...
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="link-btn"
                        style={{ fontSize: '11px', color: 'var(--burgundy)' }}
                        onClick={() => {
                          setMovForm({
                            ...movForm,
                            procedure_type_id: '',
                            fecha_vencimiento: '',
                            fecha_gracia: '',
                            hora_gracia: '',
                            has_deadline: false,
                          });
                        }}
                      >
                        Quitar vencimiento
                      </button>
                    )}
                  </div>

                  <div className="field-row" style={{ alignItems: 'flex-end' }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Vto. Ordinario *</label>
                      <input
                        type="date"
                        value={movForm.fecha_vencimiento}
                        onChange={(e) =>
                          setMovForm({ ...movForm, fecha_vencimiento: e.target.value })
                        }
                        required={movForm.has_deadline || !!movForm.procedure_type_id}
                      />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Plazo de Gracia</label>
                      <input
                        type="date"
                        value={movForm.fecha_gracia}
                        onChange={(e) =>
                          setMovForm({ ...movForm, fecha_gracia: e.target.value })
                        }
                      />
                    </div>
                    <div className="field" style={{ width: '130px', flex: 'none' }}>
                      <label style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>Hora de Gracia</label>
                      <input
                        type="text"
                        placeholder="Ej: 10:00"
                        value={movForm.hora_gracia}
                        onChange={(e) =>
                          setMovForm({ ...movForm, hora_gracia: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                    ✦ Puedes ajustar estas fechas manualmente antes de guardar si el juzgado otorgó un plazo distinto.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setNewMovOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn small" disabled={savingMov}>
                  {savingMov ? 'Guardando...' : 'Guardar Movimiento'}
                </button>
              </div>
            </form>
          )}

          {movements.length === 0 ? (
            <div className="empty">No hay movimientos registrados en este expediente.</div>
          ) : (
            <div className="timeline">
              {movements.map((m) => (
                <div className="timeline-item" key={m.id}>
                  <div className="timeline-date">{formatDateSafe(m.fecha)}</div>
                  <div className="timeline-desc">
                    <strong>{m.titulo}</strong>
                    {m.descripcion && (
                      <div
                        style={{
                          marginTop: '4px',
                          color: 'var(--ink-soft)',
                          fontSize: '13px',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.descripcion}
                      </div>
                    )}
                    {m.agenda_event_id && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px 14px',
                          background: '#FAF7EE',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--navy-deep)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⏰ Vencimiento:</span>
                            <span style={{ color: 'var(--burgundy)', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                              {formatDateSafe(m.agenda_fecha)}
                            </span>
                          </div>
                          {m.agenda_fecha_gracia && (
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gold)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⏳ Plazo de Gracia:</span>
                              <span style={{ background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--gold)', color: '#8c6b00' }}>
                                {formatDateSafe(m.agenda_fecha_gracia)} {m.agenda_hora_gracia ? `hasta las ${m.agenda_hora_gracia} hs` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`tag ${m.agenda_estado === 'cumplido' ? 'cumplido' : 'pendiente'}`}>
                            {m.agenda_estado === 'cumplido' ? '✔ Cumplido' : '⏳ Pendiente'}
                          </span>
                          <button
                            type="button"
                            className="btn small"
                            style={{
                              background: m.agenda_estado === 'cumplido' ? '#e2e8f0' : 'var(--navy-deep)',
                              color: m.agenda_estado === 'cumplido' ? 'var(--text-main)' : '#fff',
                            }}
                            onClick={() => handleToggleAgendaEstado(m.agenda_event_id!, m.agenda_estado!)}
                          >
                            {m.agenda_estado === 'cumplido' ? 'Marcar Pendiente' : '✔ Marcar Cumplido'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="timeline-actions">
                    <button
                      className="icon-btn"
                      title="Eliminar movimiento"
                      onClick={() => handleDeleteMovement(m.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="btn secondary" onClick={onClose}>
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* Modal Generador de Escritos */}
      {showTemplateModal && (
        <div className="overlay" onClick={() => setShowTemplateModal(false)} style={{ zIndex: 100 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Generar Escrito a partir de Plantilla</h3>
            
            <div className="field" style={{ marginTop: '16px' }}>
              <label>Seleccionar Modelo / Formato</label>
              <select 
                value={selectedTemplateId} 
                onChange={e => setSelectedTemplateId(e.target.value)}
              >
                <option value="">-- Seleccione una plantilla --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.titulo}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="autoLogMov" 
                checked={autoLogMov} 
                onChange={(e) => setAutoLogMov(e.target.checked)} 
              />
              <label htmlFor="autoLogMov" style={{ fontSize: '14px', cursor: 'pointer', margin: 0 }}>
                Registrar automáticamente en los movimientos
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                className="btn secondary"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={handleGenerateDoc}
                disabled={!selectedTemplateId}
              >
                Descargar Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
