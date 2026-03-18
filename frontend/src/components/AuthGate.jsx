import React, { useEffect, useState } from 'react';
import { supabase, authEnabled } from '../supabaseClient';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f1117' }}>
      <div style={{ width:360, padding:'2rem', background:'#1a1d24', borderRadius:14, boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:700, margin:'0 0 0.25rem' }}>AgentDB</h1>
        <p style={{ color:'#9ea4b0', fontSize:'0.82rem', marginBottom:'1.5rem' }}>{isSignUp ? 'Create an account' : 'Sign in to continue'}</p>

        <button onClick={() => handleOAuth('google')} style={oauthBtn}>Continue with Google</button>
        <button onClick={() => handleOAuth('github')} style={{ ...oauthBtn, marginTop:8 }}>Continue with GitHub</button>

        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'1rem 0', color:'#555' }}>
          <div style={{ flex:1, height:1, background:'#2a2d35' }} />
          <span style={{ fontSize:'0.75rem' }}>or</span>
          <div style={{ flex:1, height:1, background:'#2a2d35' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, marginTop:8 }} />
          {error && <p style={{ color:'#ff6b6b', fontSize:'0.78rem', marginTop:8 }}>{error}</p>}
          {message && <p style={{ color:'#6b4cff', fontSize:'0.78rem', marginTop:8 }}>{message}</p>}
          <button type="submit" disabled={loading} style={submitBtn}>{loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}</button>
        </form>

        <p style={{ color:'#9ea4b0', fontSize:'0.78rem', textAlign:'center', marginTop:'1rem' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{ color:'#6b4cff', cursor:'pointer' }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = { width:'100%', padding:'10px 12px', background:'#0f1117', border:'1px solid #2a2d35', borderRadius:8, color:'#fff', fontSize:'0.85rem', boxSizing:'border-box', outline:'none' };
const oauthBtn =
 { width:'100%', padding:'10px 12px', background:'#1e2130', border:'1px solid #2a2d35', borderRadius:8, color:'#fff', fontSize:'0.85rem', cursor:'pointer', boxSizing:'border-box' };
const submitBtn = { width:'100%', padding:'10px 12px', background:'#6b4cff', border:'none', borderRadius:8, color:'#fff', fontSize:'0.85rem', cursor:'pointer', marginTop:12, fontWeight:600 };

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!authEnabled) { setSession(null); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f1117' }}>
      <div style={{ color:'#9ea4b0', fontSize:'0.9rem' }}>Loading...</div>
    </div>
  );

  if (!authEnabled || session) return children;

  return <LoginForm />;
}
