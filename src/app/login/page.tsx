"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false
    });

    if (res?.error) {
      setError("Usuario o contraseña incorrectos");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--navy-deep)',
      color: '#fff'
    }}>
      <div style={{
        background: 'var(--panel)',
        padding: '40px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--navy-deep)', fontSize: '24px', margin: 0 }}>Estudio Jurídico</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '13px', marginTop: '8px' }}>Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '6px', fontWeight: 600 }}>USUARIO</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '6px', fontWeight: 600 }}>CONTRASEÑA</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)'
              }}
              required
            />
          </div>

          {error && <div style={{ color: 'var(--burgundy)', fontSize: '12.5px', background: 'var(--danger-bg)', padding: '10px', borderRadius: '4px' }}>{error}</div>}

          <button type="submit" className="btn" style={{ marginTop: '10px', width: '100%' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
