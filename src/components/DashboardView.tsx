'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || {
    activeCases: 0,
    totalClients: 0,
    pendingAlerts: 0,
    archivedCases: 0,
  };

  const pendingEvents = data?.pendingEvents || [];
  const recentMovements = data?.recentMovements || [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Panel de Control</h2>
          <p>
            Bienvenido, <strong>{session?.user?.name || 'Doctor'}</strong>.
            Resumen de actividad y expedientes del estudio.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn secondary" onClick={() => onNavigate('clients')}>
            + Nuevo Cliente
          </button>
          <button className="btn" onClick={() => onNavigate('cases')}>
            + Nueva Causa
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats">
        <div
          className="stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('cases')}
        >
          <div className="n">{stats.activeCases}</div>
          <div className="l">CAUSAS ACTIVAS</div>
        </div>

        <div
          className="stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('clients')}
        >
          <div className="n">{stats.totalClients}</div>
          <div className="l">CLIENTES REGISTRADOS</div>
        </div>

        <div
          className={`stat ${stats.pendingAlerts > 0 ? 'alert' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('agenda')}
        >
          <div className="n">{stats.pendingAlerts}</div>
          <div className="l">VENCIMIENTOS PENDIENTES</div>
        </div>

        <div
          className="stat"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('cases')}
        >
          <div className="n">{stats.archivedCases}</div>
          <div className="l">CAUSAS ARCHIVADAS</div>
        </div>
      </div>

      {/* Two columns: Agenda y Movimientos Recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Vencimientos */}
        <div className="block">
          <div className="block-head">
            <span>Próximos Vencimientos & Audiencias</span>
            <button
              className="link-btn"
              onClick={() => onNavigate('agenda')}
            >
              Ver agenda →
            </button>
          </div>
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : pendingEvents.length === 0 ? (
            <div className="empty">No hay plazos urgentes pendientes.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Causa</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {pendingEvents.map((ev: any) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="tag hoy">{ev.fecha}</span>
                    </td>
                    <td>
                      <strong>{ev.caratula}</strong>
                    </td>
                    <td>{ev.titulo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Movimientos Recientes */}
        <div className="block">
          <div className="block-head">
            <span>Últimos Movimientos Registrados</span>
            <button
              className="link-btn"
              onClick={() => onNavigate('cases')}
            >
              Ver causas →
            </button>
          </div>
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : recentMovements.length === 0 ? (
            <div className="empty">No hay actuaciones judiciales cargadas todavía.</div>
          ) : (
            <div className="timeline" style={{ padding: '4px 18px' }}>
              {recentMovements.map((m: any) => (
                <div className="timeline-item" key={m.id} style={{ gridTemplateColumns: '80px 1fr' }}>
                  <div className="timeline-date">{m.fecha}</div>
                  <div className="timeline-desc">
                    <strong>{m.titulo}</strong>
                    <span className="meta-text">{m.caratula}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
