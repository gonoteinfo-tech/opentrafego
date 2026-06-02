'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Project, Profile, TrafficLog } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();

  // State variables
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ label: string, count: number, gaCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State for new/editing campaign
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [dailyVisits, setDailyVisits] = useState(1000);
  const [retentionMin, setRetentionMin] = useState(1);
  const [retentionMax, setRetentionMax] = useState(3);
  const [referrerType, setReferrerType] = useState<'direct' | 'search' | 'social' | 'custom'>('direct');
  const [customReferrersText, setCustomReferrersText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [deviceDesktop, setDeviceDesktop] = useState(70);

  // Geotargeting Form State
  const [geotargetType, setGeotargetType] = useState<'global' | 'country' | 'state' | 'city'>('global');
  const [geotargetCountry, setGeotargetCountry] = useState('BR');
  const [geotargetState, setGeotargetState] = useState('GO');
  const [geotargetCity, setGeotargetCity] = useState('Goiânia');

  // Form Actions feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Initialize and check Auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch all user specific data
  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Profile (Credits, Role)
      const { data: prof, error: profErr } = await supabase
        .from('mt_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profErr) {
        // If profile doesn't exist yet, wait or trigger signout
        console.warn('Profile not found, waiting for trigger');
      } else {
        setProfile(prof);
      }

      // 2. Fetch Projects
      const { data: projs, error: projsErr } = await supabase
        .from('mt_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projsErr) throw projsErr;
      setProjects(projs || []);

      const setDefaultChartData = () => {
        const now = new Date();
        const hourlyData = [];
        for (let i = 6; i >= 0; i--) {
          const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hourLabel = `${String(targetTime.getHours()).padStart(2, '0')}:00`;
          hourlyData.push({ label: hourLabel, count: 0, gaCount: 0 });
        }
        setChartData(hourlyData);
      };

      // 3. Fetch Traffic Logs (Join with projects)
      const projectIds = projs?.map(p => p.id) || [];
      if (projectIds.length > 0) {
        const { data: trafficLogs, error: logsErr } = await supabase
          .from('mt_traffic_logs')
          .select(`
            *,
            project:mt_projects(name)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsErr) throw logsErr;
        setLogs(trafficLogs || []);

        // 4. Fetch Traffic stats for Chart (Last 7 hours)
        const sevenHoursAgo = new Date();
        sevenHoursAgo.setHours(sevenHoursAgo.getHours() - 7);
        
        const { data: chartLogs, error: chartErr } = await supabase
          .from('mt_traffic_logs')
          .select('created_at, ga_status')
          .in('project_id', projectIds)
          .gte('created_at', sevenHoursAgo.toISOString());

        if (!chartErr && chartLogs) {
          const now = new Date();
          const hourlyData = [];
          
          for (let i = 6; i >= 0; i--) {
            const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourLabel = `${String(targetTime.getHours()).padStart(2, '0')}:00`;
            
            const start = new Date(targetTime);
            start.setMinutes(0, 0, 0);
            const end = new Date(targetTime);
            end.setMinutes(59, 59, 999);
            
            // Count total hits in this hour (representing server hits)
            const totalHits = chartLogs.filter(log => {
              const d = new Date(log.created_at);
              return d >= start && d <= end;
            }).length;

            // Count GA4 hits in this hour
            const gaHits = chartLogs.filter(log => {
              const d = new Date(log.created_at);
              return d >= start && d <= end && log.ga_status === 'sent';
            }).length;

            hourlyData.push({
              label: hourLabel,
              count: totalHits,
              gaCount: gaHits
            });
          }
          setChartData(hourlyData);
        } else {
          setDefaultChartData();
        }
      } else {
        setLogs([]);
        setDefaultChartData();
      }

    } catch (err: any) {
      console.error('Error loading dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Open modal in create mode
  const handleCreateOpen = () => {
    setEditingProject(null);
    setName('');
    setUrl('');
    setDailyVisits(1000);
    setRetentionMin(1);
    setRetentionMax(3);
    setReferrerType('direct');
    setCustomReferrersText('');
    setKeywordsText('');
    setDeviceDesktop(70);
    setGeotargetType('global');
    setGeotargetCountry('BR');
    setGeotargetState('GO');
    setGeotargetCity('Goiânia');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleEditOpen = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setUrl(project.url);
    setDailyVisits(project.daily_visits);
    setRetentionMin(project.retention_min);
    setRetentionMax(project.retention_max);
    setReferrerType(project.referrer_type);
    setCustomReferrersText(project.custom_referrers?.join(', ') || '');
    setKeywordsText(project.keywords?.join(', ') || '');
    setDeviceDesktop(project.device_desktop);
    setGeotargetType(project.geotarget_type || 'global');
    setGeotargetCountry(project.geotarget_country || 'BR');
    setGeotargetState(project.geotarget_state || 'GO');
    setGeotargetCity(project.geotarget_city || 'Goiânia');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Create or Update Campaign
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Basic URL validation
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }

    try {
      new URL(formattedUrl);
    } catch (_) {
      setFormError('Por favor, digite um URL válido (Ex: https://meusite.com)');
      setFormLoading(false);
      return;
    }

    // Process lists
    const customReferrers = customReferrersText
      ? customReferrersText.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const keywords = keywordsText
      ? keywordsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const campaignData = {
      user_id: user.id,
      name: name.trim() || 'Nova Campanha',
      url: formattedUrl,
      daily_visits: Number(dailyVisits),
      retention_min: Number(retentionMin),
      retention_max: Number(retentionMax),
      referrer_type: referrerType,
      custom_referrers: customReferrers,
      keywords: keywords,
      device_desktop: Number(deviceDesktop),
      device_mobile: 100 - Number(deviceDesktop),
      geotarget_type: geotargetType,
      geotarget_country: geotargetCountry,
      geotarget_state: geotargetState,
      geotarget_city: geotargetCity,
      status: editingProject ? editingProject.status : 'active'
    };

    try {
      if (editingProject) {
        // Update
        const { error } = await supabase
          .from('mt_projects')
          .update(campaignData)
          .eq('id', editingProject.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('mt_projects')
          .insert(campaignData);

        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchUserData(user.id);
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro ao salvar o projeto.');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle status (Pause / Start)
  const toggleCampaignStatus = async (project: Project) => {
    const newStatus = project.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('mt_projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) return;
    try {
      const { error } = await supabase
        .from('mt_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await fetchUserData(user.id);
    } catch (err: any) {
      alert('Erro ao excluir campanha: ' + err.message);
    }
  };

  // Calculate sum metrics for top boxes
  const totalVisitsSentToday = projects.reduce((acc, p) => acc + p.visits_delivered_today, 0);
  const activeCampaignsCount = projects.filter(p => p.status === 'active').length;

  // Chart rendering coordinates calculation
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count), 5) : 5;
  const maxGaCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.gaCount), 5) : 5;
  
  // Align scale so both lines are visually comparable or scaled together
  const maxScale = Math.max(maxCount, maxGaCount);
  
  const xCoords = [0, 166, 333, 500, 666, 833, 1000];
  const yCoords = chartData.map(d => 170 - (d.count / maxScale) * 130);
  const yGaCoords = chartData.map(d => 170 - (d.gaCount / maxScale) * 130);

  const linePath = yCoords.length > 0 
    ? `M ${xCoords[0]},${yCoords[0]} ` + yCoords.slice(1).map((y, i) => `L ${xCoords[i+1]},${y}`).join(' ')
    : '';

  const areaPath = yCoords.length > 0
    ? `${linePath} L 1000,200 L 0,200 Z`
    : '';

  const lineGaPath = yGaCoords.length > 0
    ? `M ${xCoords[0]},${yGaCoords[0]} ` + yGaCoords.slice(1).map((y, i) => `L ${xCoords[i+1]},${y}`).join(' ')
    : '';

  const areaGaPath = yGaCoords.length > 0
    ? `${lineGaPath} L 1000,200 L 0,200 Z`
    : '';

  if (loading && !user) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', gap: '12px', background: 'hsl(var(--bg-main))' }}>
        <svg className="animate-spin" width="30" height="30" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="3" style={{ color: 'hsl(var(--primary))' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0"></circle>
        </svg>
        <span>Carregando painel...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-main))' }}>
      
      {/* Navbar Dashboard */}
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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            background: 'hsl(var(--border))',
            color: 'hsl(var(--text-muted))',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600
          }}>
            Painel do Cliente
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {profile?.role === 'admin' && (
            <Link href="/admin" style={{
              fontSize: '0.9rem',
              color: 'hsl(var(--accent))',
              fontWeight: 600,
              border: '1px solid hsl(var(--accent) / 0.3)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--accent) / 0.05)'
            }}>
              ⚙ Painel Admin
            </Link>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>Olá,</span>
            <span style={{ fontWeight: 600 }}>{profile?.full_name || 'Usuário'}</span>
          </div>

          <button onClick={handleLogout} style={{
            fontSize: '0.9rem',
            color: 'hsl(0 100% 70%)',
            cursor: 'pointer',
            fontWeight: 600
          }}>
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ padding: '40px 24px', flex: 1 }}>
        
        {/* Top Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Card 1: Balance Credits */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>SEU SALDO</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px' }} className="glow-text">
                {profile ? formatNumber(profile.credits) : '0'} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>visitas</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent))' }}>● Pronto para uso</span>
            </div>
            <div>
              <Link href="/dashboard/comprar" className="btn btn-accent" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                + Comprar Créditos
              </Link>
            </div>
          </div>

          {/* Card 2: Hits Sent Today */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>TRÁFEGO ENTREGUE HOJE</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: 'hsl(var(--primary))' }}>
              {formatNumber(totalVisitsSentToday)}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Visitas geradas nas últimas 24 horas</span>
          </div>

          {/* Card 3: Active Campaigns */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>CAMPANHAS ATIVAS</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: 'white' }}>
              {activeCampaignsCount} <span style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))' }}>/ {projects.length}</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Projetos que estão gerando visitas</span>
          </div>
        </div>

        {/* Analytics Section with SVG graph */}
        <div className="glass-card" style={{ padding: '30px', marginBottom: '32px' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Visão Geral de Acessos</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Fluxo de entrega simulado do motor nas últimas 7 horas</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--primary))' }}></span> GA4 Injetado
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--secondary))' }}></span> Servidor Direto
              </span>
            </div>
          </div>

          {/* Beautiful Custom SVG Chart */}
          <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <svg width="100%" height="200" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chartGaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="1000" y2="40" stroke="hsl(var(--border) / 0.4)" strokeWidth="1" />
              <line x1="0" y1="105" x2="1000" y2="105" stroke="hsl(var(--border) / 0.4)" strokeWidth="1" />
              <line x1="0" y1="170" x2="1000" y2="170" stroke="hsl(var(--border) / 0.4)" strokeWidth="1" />

              {/* Total Server Hits Area & Line (Secondary: Purple) */}
              {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
              {linePath && <path d={linePath} fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" strokeDasharray="4 4" />}

              {/* GA4 Injected Area & Line (Primary: Cyan) */}
              {areaGaPath && <path d={areaGaPath} fill="url(#chartGaGrad)" />}
              {lineGaPath && <path d={lineGaPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />}

              {/* Dynamic Dots on Peak for both lines */}
              {chartData.map((d, index) => {
                const x = xCoords[index];
                const yTotal = yCoords[index];
                const yGa = yGaCoords[index];
                return (
                  <g key={index}>
                    {/* Render dots for active values */}
                    {d.count > 0 && <circle cx={x} cy={yTotal} r="4" fill="#fff" stroke="hsl(var(--secondary))" strokeWidth="2.5" />}
                    {d.gaCount > 0 && <circle cx={x} cy={yGa} r="5" fill="#fff" stroke="hsl(var(--primary))" strokeWidth="3" />}
                  </g>
                );
              })}
            </svg>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '12px',
            fontSize: '0.75rem',
            color: 'hsl(var(--text-dim))',
            fontWeight: 600
          }}>
            {chartData.map((d, index) => (
              <span key={index}>{index === 6 ? 'Agora' : d.label}</span>
            ))}
          </div>
        </div>

        {/* Projects / Campaigns Header */}
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>Suas Campanhas</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Gerencie as URLs e volumes de visitas ativos</p>
          </div>
          <button onClick={handleCreateOpen} className="btn btn-primary">
            + Nova Campanha
          </button>
        </div>

        {/* Projects / Campaigns Table */}
        <div className="glass-card" style={{ marginBottom: '40px', overflow: 'hidden' }}>
          {projects.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--text-muted))" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h4 style={{ marginBottom: '8px' }}>Nenhuma campanha ativa</h4>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                Você possui {profile?.credits ? formatNumber(profile.credits) : '0'} créditos grátis. Crie sua primeira campanha para começar a receber visitas agora mesmo!
              </p>
              <button onClick={handleCreateOpen} className="btn btn-primary">Criar Primeira Campanha</button>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>URL</th>
                    <th>Origem / Referer</th>
                    <th>Meta Diária</th>
                    <th>Entregue Hoje</th>
                    <th>Total Entregue</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td style={{ fontWeight: 600 }}>{project.name}</td>
                      <td>
                        <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>
                          {project.url.length > 30 ? project.url.substring(0, 30) + '...' : project.url}
                        </a>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {project.referrer_type === 'direct' && 'Direto'}
                        {project.referrer_type === 'search' && `Google (${project.keywords?.slice(0,2).join(', ')})`}
                        {project.referrer_type === 'social' && 'Redes Sociais'}
                        {project.referrer_type === 'custom' && 'Customizado'}
                      </td>
                      <td>{formatNumber(project.daily_visits)} / dia</td>
                      <td style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{formatNumber(project.visits_delivered_today)}</td>
                      <td>{formatNumber(project.total_visits_delivered)}</td>
                      <td>
                        <span className={`badge badge-${project.status}`}>
                          {project.status === 'active' && 'Ativo'}
                          {project.status === 'paused' && 'Pausado'}
                          {project.status === 'pending_credits' && 'Sem Saldo'}
                          {project.status === 'completed' && 'Finalizado'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => toggleCampaignStatus(project)}
                            title={project.status === 'active' ? 'Pausar' : 'Ativar'}
                            style={{ cursor: 'pointer', fontSize: '1.1rem' }}
                          >
                            {project.status === 'active' ? '⏸' : '▶'}
                          </button>
                          <button
                            onClick={() => handleEditOpen(project)}
                            title="Editar"
                            style={{ cursor: 'pointer', fontSize: '1.1rem' }}
                          >
                            ✏
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(project.id)}
                            title="Excluir"
                            style={{ cursor: 'pointer', fontSize: '1.1rem', color: 'hsl(0 100% 70%)' }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Logs Section */}
        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Logs em Tempo Real (Últimos disparos)</h3>
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
              Nenhum tráfego gerado recentemente. Ative suas campanhas e aguarde alguns minutos.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Campanha</th>
                    <th>Origem / Referrer</th>
                    <th>Dispositivo</th>
                    <th>IP do Visitante</th>
                    <th>Integração GA4</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: 'hsl(var(--text-muted))' }}>
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')} - {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.project?.name || 'Projeto'}</td>
                      <td>
                        {log.referrer === 'Direto' || !log.referrer ? (
                          <span style={{ color: 'hsl(var(--text-dim))' }}>Direto / Acesso Direto</span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))' }}>{log.referrer}</span>
                        )}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {log.device === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'hsl(var(--text-muted))' }}>{log.ip}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: log.ga_status === 'sent' ? 'hsl(var(--accent))' : 'hsl(var(--text-dim))',
                          fontWeight: 600
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: log.ga_status === 'sent' ? 'hsl(var(--accent))' : 'hsl(var(--text-dim))'
                          }}></span>
                          {log.ga_status === 'sent' ? 'GA4 Ativo' : 'Apenas Servidor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modal: Criar / Editar Campanha */}
      {isModalOpen && (
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
          zIndex: 100,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '650px',
            padding: '30px',
            background: 'hsl(var(--bg-card))',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>{editingProject ? 'Editar Campanha' : 'Criar Nova Campanha'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgb(239, 68, 68, 0.4)',
                color: 'rgb(248, 113, 113)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCampaign}>
              <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome da Campanha</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Meu E-commerce"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL de Destino</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: https://meusite.com/pagina"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Visitas Diárias Desejadas</label>
                  <input
                    type="number"
                    className="form-input"
                    min="500"
                    max="300000"
                    value={dailyVisits}
                    onChange={(e) => setDailyVisits(Number(e.target.value))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Mínimo 500 / Máximo 300.000</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Permanência na Página (Minutos)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '45%' }}
                      min="1"
                      max="10"
                      value={retentionMin}
                      onChange={(e) => setRetentionMin(Number(e.target.value))}
                      required
                    />
                    <span>a</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '45%' }}
                      min="1"
                      max="10"
                      value={retentionMax}
                      onChange={(e) => setRetentionMax(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Referrer Selector */}
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Origem do Tráfego (Referrer)</label>
                <select
                  className="form-select"
                  value={referrerType}
                  onChange={(e) => setReferrerType(e.target.value as any)}
                >
                  <option value="direct">Acesso Direto (Sem referrer)</option>
                  <option value="search">Busca Orgânica (Google, Bing)</option>
                  <option value="social">Redes Sociais (Facebook, Instagram, LinkedIn)</option>
                  <option value="custom">Referenciadores Personalizados (Custom URLs)</option>
                </select>
              </div>

              {/* Conditional Referrer Input fields */}
              {referrerType === 'search' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Palavras-chave (Separadas por vírgula)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: comprar tenis, tenis corrida barato, melhor tenis"
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>O motor simulará pesquisas no Google com estes termos.</span>
                </div>
              )}

              {referrerType === 'custom' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">URLs de Referência (Separadas por vírgula)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: https://parceiro.com, https://outrosite.com"
                    value={customReferrersText}
                    onChange={(e) => setCustomReferrersText(e.target.value)}
                  />
                </div>
              )}

              {/* Geotargeting Selector Fields */}
              <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Direcionamento de Tráfego</label>
                  <select
                    className="form-select"
                    value={geotargetType}
                    onChange={(e) => setGeotargetType(e.target.value as any)}
                  >
                    <option value="global">Mundial (Países Aleatórios)</option>
                    <option value="country">Por País</option>
                    <option value="state">Por Estado (Brasil)</option>
                    <option value="city">Por Cidade (Brasil)</option>
                  </select>
                </div>

                {geotargetType === 'country' && (
                  <div className="form-group">
                    <label className="form-label">Selecionar País</label>
                    <select
                      className="form-select"
                      value={geotargetCountry}
                      onChange={(e) => setGeotargetCountry(e.target.value)}
                    >
                      <option value="BR">Brasil</option>
                      <option value="US">Estados Unidos</option>
                      <option value="PT">Portugal</option>
                      <option value="ES">Espanha</option>
                      <option value="GB">Reino Unido</option>
                    </select>
                  </div>
                )}

                {geotargetType === 'state' && (
                  <div className="form-group">
                    <label className="form-label">Selecionar Estado (Brasil)</label>
                    <select
                      className="form-select"
                      value={geotargetState}
                      onChange={(e) => setGeotargetState(e.target.value)}
                    >
                      <option value="GO">Goiás</option>
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                    </select>
                  </div>
                )}

                {geotargetType === 'city' && (
                  <div className="form-group">
                    <label className="form-label">Selecionar Cidade (Brasil)</label>
                    <select
                      className="form-select"
                      value={geotargetCity}
                      onChange={(e) => setGeotargetCity(e.target.value)}
                    >
                      <optgroup label="Goiás (GO)">
                        <option value="Goiânia">Goiânia</option>
                        <option value="Anápolis">Anápolis</option>
                        <option value="Aparecida de Goiânia">Aparecida de Goiânia</option>
                        <option value="Rio Verde">Rio Verde</option>
                        <option value="Itumbiara">Itumbiara</option>
                        <option value="Catalão">Catalão</option>
                        <option value="Jataí">Jataí</option>
                        <option value="Senador Canedo">Senador Canedo</option>
                        <option value="Trindade">Trindade</option>
                        <option value="Formosa">Formosa</option>
                        <option value="Luziânia">Luziânia</option>
                        <option value="Valparaíso de Goiás">Valparaíso de Goiás</option>
                        <option value="Caldas Novas">Caldas Novas</option>
                        <option value="Ceres">Ceres</option>
                        <option value="Goianésia">Goianésia</option>
                        <option value="Porangatu">Porangatu</option>
                        <option value="Mineiros">Mineiros</option>
                        <option value="Pires do Rio">Pires do Rio</option>
                        <option value="Inhumas">Inhumas</option>
                        <option value="Jaraguá">Jaraguá</option>
                        <option value="Quirinópolis">Quirinópolis</option>
                        <option value="Morrinhos">Morrinhos</option>
                        <option value="Cristalina">Cristalina</option>
                      </optgroup>
                      <optgroup label="Distrito Federal (DF)">
                        <option value="Brasília">Brasília</option>
                      </optgroup>
                      <optgroup label="São Paulo (SP)">
                        <option value="São Paulo">São Paulo</option>
                        <option value="Campinas">Campinas</option>
                        <option value="Santos">Santos</option>
                      </optgroup>
                      <optgroup label="Rio de Janeiro (RJ)">
                        <option value="Rio de Janeiro">Rio de Janeiro</option>
                        <option value="Niterói">Niterói</option>
                      </optgroup>
                      <optgroup label="Minas Gerais (MG)">
                        <option value="Belo Horizonte">Belo Horizonte</option>
                        <option value="Uberlândia">Uberlândia</option>
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              {/* Device distribution */}
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distribuição de Dispositivos</span>
                  <span style={{ color: 'hsl(var(--primary))' }}>🖥 {deviceDesktop}% Desktop / 📱 {100 - deviceDesktop}% Mobile</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={deviceDesktop}
                  onChange={(e) => setDeviceDesktop(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'hsl(var(--primary))',
                    cursor: 'pointer',
                    background: 'hsl(var(--border))',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    appearance: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid hsl(var(--border))',
                paddingTop: '20px'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Salvando...' : 'Salvar Campanha'}
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


