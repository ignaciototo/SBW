'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import CasesView from './CasesView';
import ClientsView from './ClientsView';
import AgendaView from './AgendaView';
import TemplatesView from './TemplatesView';
import TramitesView from './TramitesView';
import ConfigView from './ConfigView';
import GlobalSearchModal from './GlobalSearchModal';

export default function MainLayout() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'cases' | 'clients' | 'agenda' | 'formatos' | 'tramites' | 'config'>('dashboard');
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const fetchActiveCount = async () => {
    try {
      const res = await fetch('/api/cases?status=activo');
      const data = await res.json();
      if (data.cases) setActiveCasesCount(data.cases.length);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveCount();
    fetchAlerts();
  }, [currentTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab: any) => setCurrentTab(tab)}
        activeCasesCount={activeCasesCount}
      />
      <main className="main" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* App Header (Search & Alerts) */}
        <header style={{ 
          height: '60px', 
          borderBottom: '1px solid var(--line)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 30px',
          background: 'white',
          flexShrink: 0
        }}>
          <div>
            <button 
              className="btn secondary small" 
              onClick={() => setSearchOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', background: '#F5F2E9', border: 'none' }}
            >
              <span>🔍 Buscar causas o clientes...</span>
              <kbd style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', border: '1px solid var(--line)' }}>Ctrl K</kbd>
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              className="icon-btn" 
              onClick={() => setAlertsOpen(!alertsOpen)}
              style={{ position: 'relative', fontSize: '20px' }}
              title="Vencimientos próximos"
            >
              🔔
              {alerts.length > 0 && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  background: 'var(--burgundy)', color: 'white',
                  borderRadius: '50%', fontSize: '10px', fontWeight: 'bold',
                  width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {alerts.length}
                </span>
              )}
            </button>
            {alertsOpen && (
              <div style={{
                position: 'absolute', top: '40px', right: '0',
                width: '320px', background: 'white', border: '1px solid var(--line)',
                borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', fontWeight: 'bold', background: '#FAF7EE' }}>
                  Vencimientos Críticos
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>No hay alertas urgentes.</div>
                  ) : (
                    alerts.map(a => (
                      <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', fontSize: '13px', cursor: 'pointer' }} onClick={() => { setCurrentTab('agenda'); setAlertsOpen(false); }}>
                        <div style={{ color: 'var(--burgundy)', fontWeight: 'bold', marginBottom: '4px' }}>{new Date(a.fecha).toLocaleDateString()}</div>
                        <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                        <div style={{ color: 'var(--text-light)', fontSize: '11px', marginTop: '4px' }}>{a.caratula}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {currentTab === 'dashboard' && <DashboardView onNavigate={(tab: any) => setCurrentTab(tab)} />}
          {currentTab === 'cases' && <CasesView />}
          {currentTab === 'clients' && <ClientsView />}
          {currentTab === 'agenda' && <AgendaView />}
          {currentTab === 'formatos' && <TemplatesView />}
          {currentTab === 'tramites' && <TramitesView />}
          {currentTab === 'config' && <ConfigView />}
        </div>
      </main>

      {searchOpen && (
        <GlobalSearchModal 
          onClose={() => setSearchOpen(false)} 
          onNavigate={(tab) => {
            setCurrentTab(tab);
            setSearchOpen(false);
          }} 
        />
      )}
    </div>
  );
}
