import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase, authEnabled } from '../supabaseClient';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!authEnabled) { setSession(null); return; }

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Loading
  if (session === undefined) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117' }}>
      <div style={{ color: '#9ea4b0', fontSize: '0.9rem' }}>Loading...</div>
    </div>
  );

  // Auth disabled (dev) or logged in
  if (!authEnabled || session) return children;

  // Show login
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0f1117'
    }}>
      <div style={{ width: 380, padding: '2rem', background: '#1a1d24', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>AgentDB</h1>
          <p style={{ color: '#9ea4b0', fontSize: '0.82rem', marginTop: 6 }}>Sign in to continue</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#6b4cff', brandAccent: '#5538ee' } } } }}
          providers={['google', 'github']}
          theme="dark"
        />
      </div>
    </div>
  );
}
