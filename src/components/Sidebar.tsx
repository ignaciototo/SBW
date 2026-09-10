'use client';

import React from 'react';
import { signOut, useSession } from 'next-auth/react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeCasesCount?: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  activeCasesCount = 0,
}: SidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Estudio Legal</h1>
        <span>Gestión Jurídica</span>
      </div>

      <ul className="nav">
        <li>
          <button
            className={currentTab === 'dashboard' ? 'active' : ''}
            onClick={() => onSelectTab('dashboard')}
          >
            <span>📊</span>
            <span>Panel General</span>
          </button>
        </li>
        <li>
          <button
            className={currentTab === 'cases' ? 'active' : ''}
            onClick={() => onSelectTab('cases')}
          >
            <span>📁</span>
            <span>Causas / Expedientes</span>
            {activeCasesCount > 0 && (
              <span className="count">{activeCasesCount}</span>
            )}
          </button>
        </li>
        <li>
          <button
            className={currentTab === 'clients' ? 'active' : ''}
            onClick={() => onSelectTab('clients')}
          >
            <span>👥</span>
            <span>Clientes</span>
          </button>
        </li>
        <li>
          <button
            className={currentTab === 'agenda' ? 'active' : ''}
            onClick={() => onSelectTab('agenda')}
          >
            <span>📅</span>
            <span>Agenda & Plazos</span>
          </button>
        </li>
        <li>
          <button
            className={currentTab === 'formatos' ? 'active' : ''}
            onClick={() => onSelectTab('formatos')}
          >
            <span>📑</span>
            <span>Formatos y Modelos</span>
          </button>
        </li>
        <li>
          <button
            className={currentTab === 'tramites' ? 'active' : ''}
            onClick={() => onSelectTab('tramites')}
          >
            <span>🏛️</span>
            <span>Trámites / Gestoría</span>
          </button>
        </li>
        <li style={{ marginTop: '10px' }}>
          <button
            className={currentTab === 'config' ? 'active' : ''}
            onClick={() => onSelectTab('config')}
            style={{ color: '#A09886' }}
          >
            <span>⚙️</span>
            <span>Configuración</span>
          </button>
        </li>
      </ul>

      <div
        style={{
          padding: '16px 22px',
          borderTop: '1px solid rgba(239, 233, 220, 0.15)',
          marginTop: 'auto',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>
            {session?.user?.name || 'Usuario'}
          </div>
          <div
            style={{
              color: '#B9AF97',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {(session?.user as any)?.role || 'Abogado'}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn secondary small"
          style={{
            width: '100%',
            color: '#EFE9DC',
            borderColor: 'rgba(239, 233, 220, 0.25)',
            justifyContent: 'center',
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
