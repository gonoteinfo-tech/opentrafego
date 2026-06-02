'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Profile, Project } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();

  // Loading & states
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Credit allocation state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(10000);
  const [submittingCredits, setSubmittingCredits] = useState(false);

  // Check auth and permissions
  useEffect(() => {
    const verifyAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Query profile role
      const { data: prof, error } = await supabase
        .from('mt_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !prof || prof.role !== 'admin') {
        alert('Acesso negado: Somente administradores do sistema podem acessar esta página.');
        router.push('/dashboard');
        return;
      }

      await loadAdminData();
    };

    verifyAdmin();
  }, [router]);

  // Load global system records
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all user profiles (Supabase has auth.users but profiles references it, so we fetch profiles)
      // Since profiles contains email and metadata, let's select it all
      const { data: profs, error: profsErr } = await supabase
        .from('mt_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profsErr) throw profsErr;
      setProfiles(profs || []);

      // 2. Fetch all user campaigns
      const { data: projs, error: projsErr } = await supabase
        .from('mt_projects')
        .select(`
          *,
          profile:mt_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (projsErr) throw projsErr;
      setProjects(projs || []);

    } catch (err: any) {
      console.error('Failed loading admin records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add credits directly to the user
  const handleAddCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmittingCredits(true);

    try {
      const { error } = await supabase.rpc('decrement_user_credits', {
        user_uuid: selectedUser.id,
        // Passing a negative number subtracts a negative (which adds credits!)
        // Or we can just read current credits and update.
        // Let's use standard update for simplicity and reliability.
        amount_to_sub: -Number(creditsToAdd)
      }).catch(async () => {
        // Fallback
        const newCredits = selectedUser.credits + Number(creditsToAdd);
        await supabase
          .from('mt_profiles')
          .update({ credits: newCredits })
          .eq('id', selectedUser.id);
      });

      setSelectedUser(null);
      await loadAdminData();
      alert('Créditos adicionados com sucesso!');
    } catch (err: any) {
      alert('Erro ao creditar visitas: ' + err.message);
    } finally {
      setSubmittingCredits(false);
    }
  };

  // Toggle user role between user and admin
  const toggleUserRole = async (userProf: Profile) => {
    const newRole = userProf.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Deseja alterar o cargo de ${userProf.full_name} para ${newRole.toUpperCase()}?`)) return;

    try {
      const { error } = await supabase
        .from('mt_profiles')
        .update({ role: newRole })
        .eq('id', userProf.id);

      if (error) throw error;
      await loadAdminData();
    } catch (err: any) {
      alert('Erro ao alterar cargo: ' + err.message);
    }
  };

  // Force-toggle status (Pause / Start) of any user campaign
  const toggleProjectStatus = async (project: Project) => {
    const newStatus = project.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('mt_projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) throw error;
      await loadAdminData();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // Sum system metrics
  const totalSystemVisitsSent = projects.reduce((acc, p) => acc + p.total_visits_delivered, 0);
  const totalSystemActiveCampaigns = projects.filter(p => p.status === 'active').length;

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
      
      {/* Navbar Admin */}
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
              OPEN<span style={{ color: 'hsl(var(--primary))' }}>TRÁFEGO</span>
            </span>
          </Link>
          <span style={{
            fontSize: '0.85rem',
            background: 'hsl(var(--accent) / 0.15)',
            color: 'hsl(var(--accent))',
            border: '1px solid hsl(var(--accent) / 0.3)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700
          }}>
            PAINEL ADMINISTRATIVO
          </span>
        </div>

        <div>
          <Link href="/dashboard" style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'hsl(var(--text-muted))'
          }}>
            ← Voltar para Área Cliente
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={{ padding: '40px 24px', flex: 1 }}>
        
        {/* System Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>TOTAL DE USUÁRIOS</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: 'white' }}>{profiles.length}</h2>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Perfis registrados</span>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>CAMPANHAS ATIVAS / TOTAIS</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: 'hsl(var(--primary))' }}>
              {totalSystemActiveCampaigns} <span style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))' }}>/ {projects.length}</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Fila global de entrega ativa</span>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>TOTAL DE VISITAS GERADAS</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: 'hsl(var(--accent))' }}>
              {formatNumber(totalSystemVisitsSent)}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Volumetria total de disparos</span>
          </div>
        </div>

        {/* User Management Section */}
        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Gerenciamento de Usuários</h3>
        <div className="glass-card" style={{ marginBottom: '40px', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nome do Usuário</th>
                  <th>ID / UUID</th>
                  <th>Créditos Disponíveis</th>
                  <th>Cargo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((prof) => (
                  <tr key={prof.id}>
                    <td style={{ fontWeight: 600 }}>{prof.full_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{prof.id}</td>
                    <td style={{ color: 'hsl(var(--accent))', fontWeight: 700 }}>{formatNumber(prof.credits)}</td>
                    <td>
                      <span className={`badge ${prof.role === 'admin' ? 'badge-active' : 'badge-completed'}`}>
                        {prof.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => setSelectedUser(prof)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          💸 Add Créditos
                        </button>
                        <button
                          onClick={() => toggleUserRole(prof)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          Cargo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Campaign List Section */}
        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Fila Global de Campanhas</h3>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Cliente</th>
                  <th>URL</th>
                  <th>Cota Diária</th>
                  <th>Entregue Hoje</th>
                  <th>Total Entregue</th>
                  <th>Status</th>
                  <th>Controles</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => {
                  const clientName = proj.profile?.full_name || 'Desconhecido';
                  return (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 600 }}>{proj.name}</td>
                      <td style={{ color: 'hsl(var(--text-muted))' }}>{clientName}</td>
                      <td>
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>
                          {proj.url.length > 30 ? proj.url.substring(0, 30) + '...' : proj.url}
                        </a>
                      </td>
                      <td>{formatNumber(proj.daily_visits)}</td>
                      <td style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatNumber(proj.visits_delivered_today)}</td>
                      <td>{formatNumber(proj.total_visits_delivered)}</td>
                      <td>
                        <span className={`badge badge-${proj.status}`}>
                          {proj.status === 'active' && 'Ativo'}
                          {proj.status === 'paused' && 'Pausado'}
                          {proj.status === 'pending_credits' && 'Sem Saldo'}
                          {proj.status === 'completed' && 'Concluído'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleProjectStatus(proj)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          {proj.status === 'active' ? 'Pausar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal: Adicionar Créditos */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '30px',
            background: 'hsl(var(--bg-card))'
          }}>
            <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Creditar Visitas</h3>
              <button onClick={() => setSelectedUser(null)} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleAddCreditsSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Usuário Selecionado</span>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '4px' }}>
                  {selectedUser.full_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-dim))' }}>
                  Saldo Atual: {formatNumber(selectedUser.credits)} visitas
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade de Visitas (Créditos)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{
                marginTop: '28px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUser(null)}
                  disabled={submittingCredits}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={submittingCredits}
                >
                  {submittingCredits ? 'Salvando...' : 'Adicionar Créditos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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


