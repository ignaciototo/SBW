'use client';

import React, { useState, useEffect, useRef } from 'react';

interface GlobalSearchModalProps {
  onClose: () => void;
  onNavigate: (tab: any, id?: number) => void;
}

export default function GlobalSearchModal({ onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: any) => {
    if (item.type === 'causa') {
      onNavigate('cases', item.id);
    } else if (item.type === 'cliente') {
      onNavigate('clients', item.id);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: '20px', marginRight: '12px', color: 'var(--text-light)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar causa, expediente, cliente o DNI..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '18px', outline: 'none' }}
          />
          <button className="icon-btn" onClick={onClose} style={{ fontSize: '14px' }}>ESC</button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#FAF7EE' }}>
          {loading && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-light)' }}>Buscando...</div>}
          
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-light)' }}>No se encontraron resultados para "{query}"</div>
          )}

          {!loading && results.map((r, i) => (
            <div 
              key={`${r.type}-${r.id}-${i}`}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onClick={() => handleSelect(r)}
              className="search-result-item"
            >
              <div style={{ 
                background: r.type === 'causa' ? 'var(--burgundy)' : 'var(--blue)', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {r.type}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{r.title}</div>
                {r.subtitle && <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>{r.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .search-result-item:hover {
          background: #F0EAD6 !important;
        }
      `}} />
    </div>
  );
}
