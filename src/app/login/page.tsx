'use strict';
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check query param to see if registering or logging in
  useEffect(() => {
    if (searchParams && searchParams.get('register') === 'true') {
      setIsRegister(true);
    }
  }, [searchParams]);

  // Handle Authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName || 'Usuário'
            }
          }
        });

        if (error) throw error;
        
        // Sometimes signup doesn't require confirmation, check if session is active
        if (data.session) {
          setSuccessMsg('Cadastro realizado com sucesso! Redirecionando...');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          setSuccessMsg('Cadastro realizado! Se o e-mail de confirmação estiver ativo, verifique sua caixa de entrada. Caso contrário, tente fazer login.');
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setSuccessMsg('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua requisição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{
      width: '100%',
      maxWidth: '450px',
      padding: '40px',
      position: 'relative',
      zIndex: 10
    }}>
      
      {/* Brand logo link */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            OPEN<span style={{ color: 'hsl(var(--primary))' }}>TRÁFEGO</span>
          </span>
        </Link>
        <h2 style={{ fontSize: '1.5rem', marginTop: '16px', fontWeight: 700 }}>
          {isRegister ? 'Crie sua conta grátis' : 'Acesse seu painel'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
          {isRegister ? 'Ganhe 5.000 créditos de tráfego grátis ao se cadastrar' : 'Gerencie suas campanhas de visitas'}
        </p>
      </div>

      {/* Display feedback */}
      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgb(239, 68, 68, 0.4)',
          color: 'rgb(248, 113, 113)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgb(16, 185, 129, 0.4)',
          color: 'rgb(52, 211, 153)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleAuth}>
        {isRegister && (
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Seu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input
            type="email"
            className="form-input"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '12px', padding: '14px' }}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
              </svg>
              Processando...
            </span>
          ) : (
            isRegister ? 'Criar Minha Conta' : 'Entrar no Sistema'
          )}
        </button>
      </form>

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '0.85rem',
        color: 'hsl(var(--text-muted))'
      }}>
        {isRegister ? (
          <span>
            Já tem uma conta?{' '}
            <button
              type="button"
              style={{ color: 'hsl(var(--primary))', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            >
              Faça login
            </button>
          </span>
        ) : (
          <span>
            Não tem uma conta?{' '}
            <button
              type="button"
              style={{ color: 'hsl(var(--primary))', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            >
              Cadastre-se grátis
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, hsl(var(--bg-card)), hsl(var(--bg-main)))',
      padding: '24px'
    }}>
      
      {/* Glow effect background */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--secondary) / 0.15))',
        filter: 'blur(80px)',
        zIndex: 0
      }}></div>

      <Suspense fallback={
        <div className="flex-center" style={{ minHeight: '100px', gap: '8px' }}>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="3">
            <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
          </svg>
          <span>Carregando...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}


