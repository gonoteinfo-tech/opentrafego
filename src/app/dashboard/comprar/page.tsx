'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Profile } from '@/lib/supabase';
import { formatCurrency, formatNumber } from '@/lib/utils';

const PACKAGES = [
  { id: 'pkg-1', name: 'Start', visits: 5000, price: 29.90, desc: '5.000 créditos de visitas. Sem expiração.' },
  { id: 'pkg-2', name: 'Grow', visits: 25000, price: 99.90, desc: '25.000 créditos de visitas. Melhor custo-benefício.', popular: true },
  { id: 'pkg-3', name: 'Pro', visits: 100000, price: 299.90, desc: '100.000 créditos de visitas. Para campanhas avançadas.' },
  { id: 'pkg-4', name: 'Enterprise', visits: 300000, price: 699.90, desc: '300.000 créditos de visitas. Volume corporativo.' }
];

export default function PurchasePage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Checkout state
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check auth and load profile
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      const { data: prof } = await supabase
        .from('mt_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(prof);
      setLoading(false);
    };

    init();
  }, [router]);

  // Initiate purchase flow
  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setCheckoutLoading(true);
    setPaymentSuccess(false);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount: pkg.price,
          credits_added: pkg.visits
        })
      });

      const data = await response.json();
      if (data.success) {
        setCheckoutData(data);
      } else {
        alert('Erro ao iniciar checkout: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro na conexão: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Copy Pix key to clipboard
  const handleCopyCode = () => {
    if (!checkoutData?.copia_e_cola) return;
    navigator.clipboard.writeText(checkoutData.copia_e_cola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate confirming the payment on frontend (instantly updates credit profile)
  const handleConfirmPayment = async () => {
    if (!checkoutData?.transaction?.id) return;
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: checkoutData.transaction.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setPaymentSuccess(true);
        // Refresh local profile credits
        if (profile) {
          setProfile({
            ...profile,
            credits: data.total_credits
          });
        }
        // Redirect back to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        alert('Erro ao validar pagamento: ' + data.error);
      }
    } catch (err: any) {
      alert('Erro ao enviar confirmação: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'hsl(var(--bg-main))' }}>
        <svg className="animate-spin" width="30" height="30" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="3" style={{ color: 'hsl(var(--primary))' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-main))' }}>
      
      {/* Navbar Purchase */}
      <header style={{
        background: 'hsl(var(--bg-card))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              MAX<span style={{ color: 'hsl(var(--primary))' }}>TRÁFEGO</span>
            </span>
          </Link>
          <span style={{
            fontSize: '0.85rem',
            background: 'hsl(var(--border))',
            color: 'hsl(var(--text-muted))',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600
          }}>
            Comprar Créditos
          </span>
        </div>

        <div>
          <Link href="/dashboard" style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'hsl(var(--text-muted))'
          }}>
            ← Voltar ao Painel
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '900px' }}>
        
        {!selectedPkg ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Selecione o Pacote de Visitas</h2>
              <p style={{ color: 'hsl(var(--text-muted))' }}>Escolha o pacote que melhor se adapta às necessidades do seu site.</p>
            </div>

            {/* Packages Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {PACKAGES.map((pkg) => (
                <div key={pkg.id} className="glass-card" style={{
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  border: pkg.popular ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  position: 'relative'
                }}>
                  {pkg.popular && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'hsl(var(--primary))',
                      color: '#030712',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}>
                      Melhor Escolha
                    </span>
                  )}
                  
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{pkg.name}</h3>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    {formatNumber(pkg.visits)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>visitas</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', minHeight: '36px', marginBottom: '24px' }}>
                    {pkg.desc}
                  </p>

                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'hsl(var(--accent))',
                    marginBottom: '24px',
                    marginTop: 'auto'
                  }}>
                    {formatCurrency(pkg.price)}
                  </div>

                  <button onClick={() => handlePurchase(pkg)} className="btn btn-primary" style={{ width: '100%' }}>
                    Escolher Pacote
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Checkout Sandbox Interface */
          <div className="glass-card" style={{
            maxWidth: '550px',
            margin: '0 auto',
            padding: '32px'
          }}>
            
            {/* Header info */}
            <div style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '20px', marginBottom: '24px' }}>
              <button onClick={() => setSelectedPkg(null)} style={{
                color: 'hsl(var(--text-muted))',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginBottom: '12px',
                fontWeight: 600
              }}>
                ← Mudar de pacote
              </button>
              <h3 style={{ fontSize: '1.4rem' }}>Pagamento via Pix</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                Pacote: <strong style={{ color: 'white' }}>{selectedPkg.name} ({formatNumber(selectedPkg.visits)} Visitas)</strong>
              </p>
            </div>

            {checkoutLoading && !checkoutData ? (
              <div className="flex-center" style={{ padding: '40px', gap: '10px' }}>
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="3" style={{ color: 'hsl(var(--primary))' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
                </svg>
                <span>Criando pedido Pix...</span>
              </div>
            ) : paymentSuccess ? (
              /* Success screen */
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  background: 'hsl(var(--accent) / 0.15)',
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--accent))',
                  marginBottom: '24px'
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'hsl(var(--accent))' }}>Pagamento Confirmado!</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
                  Foram adicionados <strong style={{ color: 'white' }}>{formatNumber(selectedPkg.visits)} créditos</strong> de visitas à sua conta.
                </p>
                <div style={{
                  marginTop: '24px',
                  fontSize: '0.85rem',
                  color: 'hsl(var(--text-dim))'
                }}>
                  Redirecionando de volta para o Painel...
                </div>
              </div>
            ) : (
              /* Simulated Pix checkout layout */
              <div>
                
                {/* Simulated dynamic high-fidelity QR Code SVG */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <div style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    {/* Simulated elegant QR code grid using SVG */}
                    <svg width="180" height="180" viewBox="0 0 29 29" style={{ display: 'block' }}>
                      <rect width="29" height="29" fill="white" />
                      {/* Top-left locator */}
                      <rect x="0" y="0" width="7" height="7" fill="black" />
                      <rect x="1" y="1" width="5" height="5" fill="white" />
                      <rect x="2" y="2" width="3" height="3" fill="black" />
                      {/* Top-right locator */}
                      <rect x="22" y="0" width="7" height="7" fill="black" />
                      <rect x="23" y="1" width="5" height="5" fill="white" />
                      <rect x="24" y="2" width="3" height="3" fill="black" />
                      {/* Bottom-left locator */}
                      <rect x="0" y="22" width="7" height="7" fill="black" />
                      <rect x="1" y="23" width="5" height="5" fill="white" />
                      <rect x="2" y="24" width="3" height="3" fill="black" />
                      
                      {/* Random pixels to simulate actual QR Code */}
                      <rect x="9" y="1" width="2" height="1" fill="black" />
                      <rect x="13" y="0" width="1" height="2" fill="black" />
                      <rect x="17" y="2" width="3" height="1" fill="black" />
                      <rect x="9" y="4" width="1" height="3" fill="black" />
                      <rect x="12" y="5" width="4" height="1" fill="black" />
                      <rect x="19" y="3" width="1" height="4" fill="black" />
                      
                      <rect x="1" y="9" width="3" height="2" fill="black" />
                      <rect x="5" y="10" width="2" height="1" fill="black" />
                      <rect x="9" y="9" width="4" height="4" fill="black" />
                      <rect x="10" y="10" width="2" height="2" fill="white" />
                      <rect x="15" y="8" width="1" height="3" fill="black" />
                      <rect x="19" y="10" width="4" height="1" fill="black" />
                      <rect x="25" y="9" width="2" height="4" fill="black" />

                      <rect x="0" y="15" width="2" height="4" fill="black" />
                      <rect x="4" y="13" width="4" height="2" fill="black" />
                      <rect x="9" y="15" width="1" height="4" fill="black" />
                      <rect x="13" y="14" width="5" height="2" fill="black" />
                      <rect x="20" y="15" width="2" height="1" fill="black" />
                      <rect x="24" y="16" width="3" height="3" fill="black" />
                      
                      <rect x="9" y="21" width="3" height="3" fill="black" />
                      <rect x="14" y="20" width="2" height="4" fill="black" />
                      <rect x="18" y="22" width="3" height="1" fill="black" />
                      <rect x="24" y="21" width="1" height="4" fill="black" />
                      <rect x="27" y="23" width="2" height="2" fill="black" />
                    </svg>
                  </div>
                </div>

                {/* Copia e Cola field */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Código Copia e Cola (Pix)</span>
                    <span style={{ color: 'hsl(var(--accent))', fontWeight: 600 }}>Valor: {formatCurrency(selectedPkg.price)}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}
                      value={checkoutData?.copia_e_cola || ''}
                      readOnly
                    />
                    <button
                      onClick={handleCopyCode}
                      className="btn btn-secondary"
                      style={{ padding: '12px 16px', fontSize: '0.85rem', flexShrink: 0 }}
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Pulsing Bank Status Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '0.9rem',
                  marginBottom: '30px',
                  background: 'hsl(var(--border) / 0.15)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#fbbf24',
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}></span>
                  Aguardando confirmação do seu banco...
                </div>

                {/* Confirmation trigger */}
                <button
                  onClick={handleConfirmPayment}
                  className="btn btn-accent"
                  style={{ width: '100%', padding: '14px', fontWeight: 700 }}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Validando transação...' : 'Confirmar Pagamento Simulado'}
                </button>

                <p style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-dim))',
                  marginTop: '16px',
                  lineHeight: '1.4'
                }}>
                  Como este é um ambiente sandbox seguro, utilize o botão acima para simular a liquidação imediata da fatura do Pix e registrar o crédito no Supabase.
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Pulsing Style Injection */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '30px 24px',
        background: 'hsl(var(--bg-card))',
        borderTop: '1px solid hsl(var(--border))',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'hsl(var(--text-dim))'
      }}>
        &copy; {new Date().getFullYear()} Open Tráfego. Todos os direitos reservados.
      </footer>

    </div>
  );
}


