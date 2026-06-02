'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'O que é o Open Tráfego e como ele funciona?',
    answer: 'O Open Tráfego é uma plataforma de marketing digital que simula visitas reais ao seu site. Nosso motor gera conexões realistas que navegam pelas suas páginas, respeitando tempos de permanência e origens configuradas (como buscas no Google, redes sociais ou cliques diretos).'
  },
  {
    question: 'Os acessos aparecem no Google Analytics 4 (GA4)?',
    answer: 'Sim, absolutamente! Nós simulamos a execução do protocolo de medição do Google Analytics em tempo real. Isso significa que as visitas aparecerão instantaneamente no seu painel em tempo real e nos relatórios consolidados do GA4.'
  },
  {
    question: 'É seguro para sites com Google AdSense?',
    answer: 'Nosso tráfego simula perfeitamente o comportamento de navegação humana, mas recomendamos pausar os anúncios ou reduzir o volume se o seu site for novo para manter a segurança da sua conta AdSense. O tráfego serve principalmente para métricas e otimização SEO.'
  },
  {
    question: 'Preciso instalar algum programa no meu computador?',
    answer: 'Não. O sistema funciona 100% em nuvem. Toda a configuração e o monitoramento são feitos diretamente pelo nosso painel web. Você pode criar e gerenciar campanhas de qualquer dispositivo.'
  },
  {
    question: 'Como funciona o sistema de créditos?',
    answer: 'Você adquire pacotes de visitas. Cada visita enviada desconta 1 crédito do seu saldo. Os créditos não expiram e você pode distribuir entre múltiplos sites da forma que preferir.'
  }
];

const PLANS = [
  { name: 'Bronze', visits: '5.000', price: '29,90', desc: 'Perfeito para testar e validar o tráfego do seu blog.' },
  { name: 'Prata', visits: '25.000', price: '99,90', desc: 'Aumente a relevância do seu site nos buscadores.', popular: true },
  { name: 'Ouro', visits: '100.000', price: '299,90', desc: 'Ideal para lançamentos de produtos e e-commerce.' },
  { name: 'Diamante', visits: '300.000', price: '699,90', desc: 'Campanhas massivas para grandes portais de notícias.' }
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid hsl(var(--border))'
      }}>
        <div className="container flex-between" style={{ height: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Logo Icon */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
              OPEN<span style={{ color: 'hsl(var(--primary))' }}>TRÁFEGO</span>
            </span>
          </div>
          
          <nav style={{ display: 'flex', gap: '30px', fontWeight: 500, color: 'hsl(var(--text-muted))' }} className="nav-links">
            <a href="#recursos" style={{ hover: { color: 'white' } }}>Recursos</a>
            <a href="#planos">Planos</a>
            <a href="#faq">Perguntas Frequentes</a>
          </nav>

          <div>
            <Link href="/login" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)' }}>
              Painel do Cliente
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '120px 0 80px',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at top right, hsl(var(--primary) / 0.1), transparent 45%)'
      }}>
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'hsl(var(--primary) / 0.08)',
            border: '1px solid hsl(var(--primary) / 0.3)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            color: 'hsl(var(--primary))',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '28px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--primary))', display: 'inline-block' }}></span>
            Novo Motor de Tráfego 2.6 Ativo
          </div>

          <h1 style={{
            fontSize: '3.6rem',
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: '900px',
            margin: '0 auto 24px',
            fontFamily: 'var(--font-display)'
          }}>
            Multiplique os Acessos do Seu Site de Forma <span className="gradient-text">Realista e Inteligente</span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'hsl(var(--text-muted))',
            maxWidth: '650px',
            margin: '0 auto 40px'
          }}>
            Gere milhares de visitas configuráveis com controle de permanência e origem. Totalmente integrado e visível no Google Analytics Realtime.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/login?register=true" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
              Criar Conta Grátis
            </Link>
            <a href="#planos" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
              Ver Planos de Tráfego
            </a>
          </div>

          {/* Stats Bar */}
          <div className="glass-card" style={{
            maxWidth: '850px',
            margin: '80px auto 0',
            padding: '24px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px'
          }}>
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }} className="glow-text">5.4M+</div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Acessos Entregues</div>
            </div>
            <div style={{ borderLeft: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }} className="glow-text">100%</div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Visível no Google Analytics</div>
            </div>
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }} className="glow-text">1.2s</div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Velocidade de Disparo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos (Recursos) */}
      <section id="recursos" style={{ padding: '100px 0', borderTop: '1px solid hsl(var(--border))' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Por que escolher o Open Tráfego?</h2>
            <p style={{ color: 'hsl(var(--text-muted))', maxWidth: '600px', margin: '0 auto' }}>
              Tecnologia avançada que replica o comportamento humano para validar a navegação e o SEO do seu site.
            </p>
          </div>

          <div className="grid-3">
            {/* Card 1 */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{
                background: 'hsl(var(--primary) / 0.1)',
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--primary))',
                marginBottom: '24px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Google Analytics Real</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
                Utilizamos injeção direta de cookies e parâmetros reais do protocolo de medição do GA4, registrando dados perfeitamente nos dashboards de tempo real e geolocalização.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{
                background: 'hsl(var(--secondary) / 0.1)',
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--secondary))',
                marginBottom: '24px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 0-7.36 16.76L12 22l7.36-5.24A10 10 0 0 0 12 2z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Origens Flexíveis</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
                Defina como as visitas chegam: por busca orgânica com palavras-chave customizadas (Google, Bing), redes sociais (Facebook, Twitter, Instagram), tráfego direto ou links de referência.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{
                background: 'hsl(var(--accent) / 0.1)',
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--accent))',
                marginBottom: '24px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Controle de Permanência</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
                Evite taxas de rejeição altas. Defina o tempo de permanência mínimo e máximo que as visitas ficarão na sua página navegando de 1 a 10 minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" style={{ padding: '100px 0', background: 'rgba(15, 23, 42, 0.25)', borderTop: '1px solid hsl(var(--border))' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Nossos Planos de Créditos</h2>
            <p style={{ color: 'hsl(var(--text-muted))', maxWidth: '600px', margin: '0 auto' }}>
              Adquira visitas prontas para uso. Os créditos são permanentes e você pode usá-los como e quando quiser.
            </p>
          </div>

          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {PLANS.map((plan, index) => (
              <div key={index} className="glass-card" style={{
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.popular ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                transform: plan.popular ? 'scale(1.03)' : 'none',
                boxShadow: plan.popular ? '0 15px 35px -10px hsl(var(--primary-glow))' : 'none'
              }}>
                {plan.popular && (
                  <span style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'hsl(var(--primary))',
                    color: '#030712',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    Popular
                  </span>
                )}
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{plan.name}</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '24px', minHeight: '40px' }}>{plan.desc}</p>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>R$</span>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff' }}>{plan.price.split(',')[0]}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>,{plan.price.split(',')[1]}</span>
                </div>

                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'hsl(var(--primary))',
                  marginBottom: '32px'
                }}>
                  {plan.visits} visitas inclusas
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <Link href="/login?register=true" className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
                    Adquirir Créditos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '100px 0', borderTop: '1px solid hsl(var(--border))' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Perguntas Frequentes</h2>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Tire suas dúvidas sobre o funcionamento do Open Tráfego.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="glass-card" style={{
                  overflow: 'hidden',
                  cursor: 'pointer'
                }} onClick={() => toggleFaq(index)}>
                  <div style={{
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: isOpen ? 'hsl(var(--primary))' : 'white'
                  }}>
                    <span>{item.question}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform var(--transition-fast)'
                    }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {isOpen && (
                    <div style={{
                      padding: '0 24px 24px 24px',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '0.95rem',
                      lineHeight: '1.7',
                      borderTop: '1px solid hsl(var(--border) / 0.5)',
                      paddingTop: '16px'
                    }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '60px 0 40px',
        background: 'hsl(var(--bg-card))',
        borderTop: '1px solid hsl(var(--border))'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              OPEN<span style={{ color: 'hsl(var(--primary))' }}>TRÁFEGO</span>
            </span>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-dim))', marginTop: '8px' }}>
              &copy; {new Date().getFullYear()} Open Tráfego. Todos os direitos reservados.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '30px', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
            <Link href="/login">Área do Cliente</Link>
            <a href="#recursos">Sobre nós</a>
            <a href="#planos">Termos de Uso</a>
          </div>
        </div>
      </footer>

    </div>
  );
}


