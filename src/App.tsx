import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ClipboardCheck, 
  BellRing, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  X, 
  Info, 
  Calendar, 
  UserCheck 
} from 'lucide-react';
import { 
  Edital, 
  Candidato, 
  Convocacao, 
  AuditLog, 
  Usuario, 
  ActiveModule, 
  Toast 
} from './types';
import { 
  INITIAL_EDITAIS, 
  INITIAL_CANDIDATOS, 
  INITIAL_CONVOCACOES, 
  INITIAL_LOGS, 
  INITIAL_USUARIOS 
} from './data';

import DashboardModule from './components/DashboardModule';
import EditaisModule from './components/EditaisModule';
import CandidatosModule from './components/CandidatosModule';
import AvaliacoesModule from './components/AvaliacoesModule';
import ConvocacoesModule from './components/ConvocacoesModule';
import AuditoriaModule from './components/AuditoriaModule';
import AdministracaoModule from './components/AdministracaoModule';

const MODULE_URL_MAP: Record<ActiveModule, string> = {
  dashboard: '/Dashboard',
  editais: '/Editais',
  candidatos: '/Candidatos',
  avaliacoes: '/Avaliacoes',
  convocacoes: '/Convocacoes',
  auditoria: '/Auditoria',
  administracao: '/Administracao',
};

const getModuleFromPath = (pathname: string): ActiveModule => {
  const path = pathname.slice(1).toLowerCase();
  const validModules: ActiveModule[] = ['dashboard', 'editais', 'candidatos', 'avaliacoes', 'convocacoes', 'auditoria', 'administracao'];
  return validModules.includes(path as ActiveModule) ? (path as ActiveModule) : 'dashboard';
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Global States
  const [editais, setEditais] = useState<Edital[]>(INITIAL_EDITAIS);
  const [candidatos, setCandidatos] = useState<Candidato[]>(INITIAL_CANDIDATOS);
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>(INITIAL_CONVOCACOES);
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);

  // System Configurations
  const [systemName, setSystemName] = useState<string>(() => {
    return localStorage.getItem('selectpro_system_name') || 'SelectPro';
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('selectpro_primary_color') || 'azul';
  });

  // Shell Layout navigation states
  const activeModule = getModuleFromPath(location.pathname);
  const [isModuleLoading, setIsModuleLoading] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Dark/Light Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('selectpro_theme');
    return saved === 'dark';
  });

  // Floating notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Confirmation action modal helper state
  const [confirmState, setConfirmState] = useState<{
    mensagem: string;
    callback: () => void;
  } | null>(null);

  const confirmAction = (mensagem: string, callback: () => void) => {
    setConfirmState({
      mensagem,
      callback: () => {
        callback();
        setConfirmState(null);
      }
    });
  };

  // Global Presenças tracking state to survive session screen transitions
  const [presencas, setPresencas] = useState<Record<string, 'Presente' | 'Ausente' | 'Pendente'>>({
    "1-1": "Presente",
    "1-5": "Pendente",
    "2-2": "Presente",
    "2-6": "Ausente",
    "3-3": "Presente",
  });

  // Simulation Dropdowns
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'create_edital' | 'create_candidato' | 'view_candidato' | 'view_convocacao' | 'confirm_inativacao' | null;
    data?: any;
  }>(null);

  // Sync Dark Mode to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('selectpro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('selectpro_theme', 'light');
    }
  }, [isDarkMode]);

  // Handle ESC key to close active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Logger helper
  const logAction = (acao: string, modulo: string, registro: string, detalhe: string) => {
    const newLog: AuditLog = {
      id: Date.now(),
      dataHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      usuario: "Administrador Sistema",
      acao,
      modulo,
      registro,
      ip: "192.168.1.10",
      detalhe
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Toast System Helper
  const showToast = (mensagem: string, tipo: 'success' | 'error' | 'warning') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Switch Module with transition
  const handleModuleChange = (module: ActiveModule) => {
    setIsModuleLoading(true);
    setIsMobileSidebarOpen(false);
    setTimeout(() => {
      navigate(MODULE_URL_MAP[module]);
      setIsModuleLoading(false);
    }, 600);
  };

  // Redirect bare "/" to "/Dashboard" on first load
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/Dashboard', { replace: true });
    }
  }, []);

  // --- ACTIONS: EDITAIS ---
  const handleCreateEdital = (newEditalData: Omit<Edital, 'id' | 'inscritos'>) => {
    const newEdital: Edital = {
      id: Date.now(),
      ...newEditalData,
      inscritos: 0
    };
    setEditais(prev => [newEdital, ...prev]);
    logAction("Publicação de Edital", "Editais", `Edital ${newEdital.numero}`, `Edital criado para ${newEditalData.instituicao} com ${newEditalData.vagas} vagas.`);
    showToast(`Edital ${newEdital.numero} cadastrado com sucesso!`, 'success');
    setActiveModal(null);
  };

  // --- ACTIONS: CANDIDATOS ---
  const handleCreateCandidato = (newCandData: Omit<Candidato, 'id' | 'inscricao' | 'status' | 'notaEscrita' | 'notaTitulos' | 'peso_escrita' | 'peso_titulos'>) => {
    // Generate a secure sequence number
    const startInsc = 2026001007 + candidatos.length + 1;
    const newCand: Candidato = {
      id: Date.now(),
      inscricao: startInsc.toString(),
      ...newCandData,
      status: 'Pendente',
      notaEscrita: 0.0,
      notaTitulos: 0.0,
      peso_escrita: 6,
      peso_titulos: 4
    };
    setCandidatos(prev => [newCand, ...prev]);
    
    // Auto-update edital metrics inside state
    setEditais(prev => prev.map(ed => {
      if (ed.numero === newCandData.edital) {
        return { ...ed, inscritos: ed.inscritos + 1 };
      }
      return ed;
    }));

    logAction("Cadastro de Candidato", "Candidatos", `Candidato ${newCand.inscricao}`, `${newCand.nome} cadastrado manualmente no cargo ${newCand.cargo}.`);
    showToast(`Candidato ${newCand.nome} registrado! Inscrição: ${newCand.inscricao}`, 'success');
    setActiveModal(null);
  };

  const handleUpdateCandidatoStatus = (candidatoId: number, nextStatus: string) => {
    setCandidatos(prev => prev.map(c => {
      if (c.id === candidatoId) {
        logAction("Homologação Cadastral", "Candidatos", `Candidato ${c.inscricao}`, `Situação cadastral alterada de ${c.status} para ${nextStatus}.`);
        if (nextStatus === 'Homologado') {
          showToast(`Inscrição ${c.inscricao} homologada com sucesso!`, 'success');
        } else if (nextStatus === 'Indeferido') {
          showToast(`Inscrição ${c.inscricao} indeferida cadastralmente.`, 'error');
        } else {
          showToast(`Inscrição revertida para pendente.`, 'warning');
        }
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    setActiveModal(null);
  };

  // --- ACTIONS: AVALIAÇÕES ---
  const handleSaveScores = (candidatoId: number, scores: { notaEscrita: number; notaTitulos: number; peso_escrita: number; peso_titulos: number }) => {
    setCandidatos(prev => prev.map(cand => {
      if (cand.id === candidatoId) {
        logAction("Lançamento de Nota", "Avaliações", `Candidato ${cand.inscricao}`, `Escrita: ${scores.notaEscrita} (P${scores.peso_escrita}) | Títulos: ${scores.notaTitulos} (P${scores.peso_titulos}).`);
        showToast(`Avaliação de ${cand.nome} atualizada!`, 'success');
        return {
          ...cand,
          ...scores
        };
      }
      return cand;
    }));
  };

  // --- ACTIONS: CONVOCAÇÕES ---
  const handleCreateConvocacao = (newConvData: Omit<Convocacao, 'id'>) => {
    const newConv: Convocacao = {
      id: Date.now(),
      ...newConvData
    };
    setConvocacoes(prev => [newConv, ...prev]);
    logAction("Convocação Gerada", "Convocações", `Edital ${newConv.edital} – ${newConv.tipo}`, `${newConv.convocados.length} candidatos convocados para ${newConv.data}.`);
    showToast(`Convocação publicada para ${newConv.convocados.length} candidato(s)!`, 'success');
  };

  // --- ACTIONS: ADMINISTRAÇÃO ---
  const handleToggleUserStatus = (userId: number) => {
    setUsuarios(prev => prev.map(usr => {
      if (usr.id === userId) {
        const nextStatus = usr.status === 'Ativo' ? 'Inativo' : 'Ativo';
        logAction("Alteração Operador", "Administração", `Usuário ${usr.nome}`, `Status alterado de ${usr.status} para ${nextStatus}.`);
        showToast(`Operador ${usr.nome} marcado como ${nextStatus}!`, nextStatus === 'Ativo' ? 'success' : 'warning');
        return { ...usr, status: nextStatus };
      }
      return usr;
    }));
  };

  const handleAddUser = (newUserData: Omit<Usuario, 'id' | 'ultimoAcesso'>) => {
    const newUser: Usuario = {
      id: Date.now(),
      ...newUserData,
      ultimoAcesso: "Sem acessos"
    };
    setUsuarios(prev => [newUser, ...prev]);
    logAction("Cadastro de Operador", "Administração", `Operador ${newUser.nome}`, `Perfil cadastrado como ${newUser.perfil} vinculada a ${newUser.instituicao}.`);
    showToast(`Usuário ${newUser.nome} cadastrado com sucesso!`, 'success');
  };

  // Dynamic calculations for views
  const getBreadcrumbTitle = () => {
    switch(activeModule) {
      case 'dashboard': return 'Início';
      case 'editais': return 'Editais';
      case 'candidatos': return 'Candidatos';
      case 'avaliacoes': return 'Avaliações';
      case 'convocacoes': return 'Convocações';
      case 'auditoria': return 'Auditoria';
      case 'administracao': return 'Administração';
      default: return 'Início';
    }
  };

  // Form Submission handlers inside Modals
  const submitNewEdital = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    handleCreateEdital({
      numero: data.get('numero') as string,
      instituicao: data.get('instituicao') as string,
      realizadora: data.get('realizadora') as string,
      titulo: data.get('titulo') as string,
      abertura: data.get('abertura') as string,
      encerramento: data.get('encerramento') as string,
      vagas: Number(data.get('vagas') || 0),
      status: data.get('status') as string
    });
  };

  const submitNewCandidato = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    handleCreateCandidato({
      nome: data.get('nome') as string,
      cpf: data.get('cpf') as string,
      cargo: data.get('cargo') as string,
      edital: data.get('edital') as string,
      modalidade: data.get('modalidade') as string,
      nascimento: data.get('nascimento') as string,
      email: data.get('email') as string,
      telefone: data.get('telefone') as string,
      deficiencia: data.get('deficiencia') === 'on',
      racial: data.get('racial') as string
    });
  };

  // Menu navigation groups for sidebar
  const menuGroup1 = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editais', label: 'Editais', icon: FileText },
    { id: 'candidatos', label: 'Candidatos', icon: Users },
    { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardCheck },
    { id: 'convocacoes', label: 'Convocações', icon: BellRing }
  ];

  const menuGroup2 = [
    { id: 'auditoria', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'administracao', label: 'Administração', icon: Settings }
  ];

  const renderNavItem = (item: { id: string; label: string; icon: React.ComponentType<any> }) => {
    const isActive = activeModule === item.id;
    const IconComponent = item.icon;
    
    // Custom active & inactive state classes with exact CSS variables applied
    const activeClass = "bg-white/20 border-l-[3px] border-l-white text-white font-bold rounded-r-[var(--radius-md)] rounded-l-none";
    const inactiveClass = "text-white/85 hover:bg-white/12 hover:text-white transition-all duration-205 rounded-[var(--radius-md)]";
    
    // Exact padding style for items
    const paddingStyle = isSidebarCollapsed 
      ? "justify-center p-2.5 mx-auto"
      : isActive 
        ? "pl-[13px] pr-[16px] py-[10px]" 
        : "pl-[16px] pr-[16px] py-[10px]";

    return (
      <button
        key={item.id}
        onClick={() => handleModuleChange(item.id as ActiveModule)}
        className={`w-full flex items-center ${isSidebarCollapsed ? '' : 'gap-[14px]'} ${isActive ? activeClass : inactiveClass} ${paddingStyle} cursor-pointer relative group`}
        title={isSidebarCollapsed ? item.label : undefined}
        aria-label={`Módulo ${item.label}`}
      >
        <IconComponent className={`shrink-0 transition-opacity duration-200 ${isActive ? 'text-white opacity-100' : 'text-white/75 group-hover:text-white group-hover:opacity-100'}`} style={{ width: '18px', height: '18px' }} />
        
        {!isSidebarCollapsed && (
          <span className={`text-[13px] leading-none tracking-wide transition-opacity duration-200 ${isActive ? 'text-white font-bold' : 'text-white/85 font-medium group-hover:text-white'}`}>
            {item.label}
          </span>
        )}

        {/* Floating tooltip for collapsed sidebar */}
        {isSidebarCollapsed && (
          <div className="absolute left-[64px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white text-[11px] font-semibold rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  return (
    <div 
      className="min-h-screen text-[var(--color-text-primary)] bg-[var(--color-bg)] transition-all duration-250 lg:grid grid-cols-1 font-sans overflow-hidden"
      style={{
        gridTemplateColumns: isSidebarCollapsed ? '64px 1fr' : '240px 1fr'
      }}
    >
      
      {/* SIDEBAR (Esquerda) */}
      <aside 
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 bg-[var(--color-primary)] text-white transition-all duration-250 flex flex-col justify-between shadow-none shrink-0 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:left-auto lg:inset-y-auto w-full
          ${isSidebarCollapsed ? 'lg:w-[64px] w-[64px]' : 'lg:w-[240px] w-[240px]'} 
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Logo Brand Brand Section */}
          <div className="h-[60px] border-b border-white/15 flex items-center justify-between px-4 shrink-0">
            <div className={`flex items-center gap-[10px] ${isSidebarCollapsed ? 'mx-auto justify-center' : ''}`}>
              <div className="w-[36px] h-[36px] min-w-[36px] rounded-full bg-white flex items-center justify-center font-bold text-[var(--color-primary)] text-[14px]">
                SE
              </div>
              {!isSidebarCollapsed && (
                <span className="font-bold text-[15px] text-white tracking-tight">SelectPro</span>
              )}
            </div>
            
            {/* Collapse side-buttons */}
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-white/90 transition-colors cursor-pointer"
                aria-label="Recolher Sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)} 
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-white/90 transition-colors mx-auto cursor-pointer"
                aria-label="Expandir Sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links with custom separators */}
          <nav className="p-3 space-y-[6px]" id="sidebar-nav">
            {menuGroup1.map(renderNavItem)}
            
            <div className="my-[12px] border-t border-white/15 mx-[12px]" />
            
            {menuGroup2.map(renderNavItem)}
          </nav>
        </div>

        {/* Sidebar Footer operator info with conditional avatars etc */}
        <div className="p-[16px] border-t border-white/15 bg-black/10 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex flex-col gap-0.5">
              <p className="font-bold text-white text-[13px] truncate">Admin Geral</p>
              <p className="text-[11px] text-white/60 truncate">admin@selectpro.gov.br</p>
            </div>
          ) : (
            <div className="flex justify-center items-center relative group">
              <div className="w-[30px] h-[30px] rounded-full bg-white/20 text-white font-bold text-[12px] flex items-center justify-center cursor-help">
                AG
              </div>
              <div className="absolute left-[54px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white text-[11px] font-semibold rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                Admin Geral (admin@selectpro.gov.br)
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* CONTEÚDO PRINCIPAL (Direita) */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-250 min-h-screen lg:ml-0"
      >
        {/* HEADER FIXO */}
        <header 
          id="header"
          className="sticky top-0 z-20 h-[60px] bg-[var(--color-white)] border-b border-[var(--color-border)] flex items-center justify-between px-4 shadow-[var(--shadow-sm)] md:px-6 shrink-0"
        >
          {/* Esquerda: Hamburger e Breadcrumb */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
              aria-label="Alternar Menu Lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb breadcrumb */}
            <nav className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-2 font-medium">
              <span className="text-[var(--color-text-secondary)] font-medium">SelectPro</span>
              <span className="font-normal text-[var(--color-text-muted)]">›</span>
              <span className="font-bold text-[var(--color-primary)]">{getBreadcrumbTitle()}</span>
            </nav>
          </div>

          {/* Direita: Controles e Avatar */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle toggle */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all duration-200 cursor-pointer"
              title="Alternar Tema Claro/Escuro"
              aria-label="Botão de Alternar Tema"
            >
              {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Separador vertical */}
            <div className="h-[24px] w-[1px] bg-[var(--color-border-light)]" />

            {/* Notifications Alert badge dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(prev => !prev)}
                className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all duration-205 cursor-pointer"
                title="Mensagens e Alertas"
                aria-label="Sino de notificações"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[var(--color-accent)] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Notification simulated alerts dropdown */}
              {isNotificationDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsNotificationDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2.5 w-[320px] bg-[var(--color-white)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-40 py-2.5 text-xs animate-fade-in text-[var(--color-text-primary)]">
                    <div className="px-4 pb-2.5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-primary-light)]/40 rounded-t-[var(--radius-lg)]">
                      <span className="font-bold text-[13px]">Notificações</span>
                      <button 
                        onClick={() => {
                          showToast('Todas as notificações marcadas como lidas', 'success');
                          setIsNotificationDropdownOpen(false);
                        }}
                        className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="divide-y divide-[var(--color-border)] max-h-64 overflow-y-auto">
                      
                      {/* Item 1 não lido */}
                      <div className="p-[12px_16px] hover:bg-[var(--color-primary-light)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-primary-light)] relative flex gap-3">
                        <div className="text-[var(--color-primary)] mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)]">Inscrição de Candidato</p>
                          <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5 leading-normal">Novo candidato inscrito no Edital 01/2026.</p>
                          <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">Há 5 minutos</span>
                        </div>
                      </div>

                      {/* Item 2 não lido */}
                      <div className="p-[12px_16px] hover:bg-[var(--color-primary-light)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-primary-light)] relative flex gap-3">
                        <div className="text-[var(--color-warning)] mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)]">Prazo de Impugnação</p>
                          <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5 leading-normal">O prazo de recursos encerra em 24 horas.</p>
                          <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">Há 22 minutos</span>
                        </div>
                      </div>

                      {/* Item 3 lido */}
                      <div className="p-[12px_16px] hover:bg-[var(--color-primary-light)] relative flex gap-3">
                        <div className="text-[var(--color-primary)] mt-0.5">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)]">Novo Operador Ativo</p>
                          <p className="text-[var(--color-text-secondary)] text-[11px] mt-0.5 leading-normal">Avaliador Lucas ativou seu perfil de acesso.</p>
                          <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">Há 1 hora</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Separador vertical */}
            <div className="h-[24px] w-[1px] bg-[var(--color-border-light)]" />

            {/* Profile Avatar and names */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right text-xs">
                <p className="font-bold text-[13px] text-[var(--color-text-primary)]">Admin Geral</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">admin@selectpro.gov.br</p>
              </div>
              <div className="w-[36px] h-[36px] rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] font-bold text-[13px] border border-[var(--color-border)]">
                AS
              </div>
            </div>

          </div>
        </header>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (SCROLLÁVEL) */}
        <main className="flex-1 p-[16px] md:p-[28px_32px] overflow-y-auto bg-[var(--color-bg)] relative">
          
          {/* MODULE LOADING TRANSITION SPINNER */}
          {isModuleLoading ? (
            <div className="absolute inset-0 bg-[var(--color-bg)]/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin"></div>
              <p className="text-[var(--color-text-secondary)] font-bold text-xs mt-4 tracking-widest uppercase">Carregando painel...</p>
            </div>
          ) : null}

          {/* CONDITIONAL ROUTE RENDERING */}
          {activeModule === 'dashboard' && (
            <DashboardModule 
              editais={editais} 
              candidatos={candidatos} 
              convocacoes={convocacoes} 
              logs={logs}
              onNavigate={handleModuleChange}
            />
          )}

          {activeModule === 'editais' && (
            <EditaisModule 
              editais={editais}
              setEditais={setEditais}
              showToast={showToast}
              logAction={logAction}
              confirmAction={confirmAction}
            />
          )}

          {activeModule === 'candidatos' && (
            <CandidatosModule 
              candidatos={candidatos}
              editais={editais}
              onOpenCreateModal={() => setActiveModal({ type: 'create_candidato' })}
              onViewDetails={(c) => setActiveModal({ type: 'view_candidato', data: c })}
              onToggleStatus={(cand, nextS) => handleUpdateCandidatoStatus(cand.id, nextS)}
              setCandidatos={setCandidatos}
              setEditais={setEditais}
              showToast={showToast}
              logAction={logAction}
              confirmAction={confirmAction}
            />
          )}

          {activeModule === 'avaliacoes' && (
            <AvaliacoesModule 
              candidatos={candidatos}
              editais={editais}
              onSaveScores={handleSaveScores}
            />
          )}

          {activeModule === 'convocacoes' && (
            <ConvocacoesModule 
              convocacoes={convocacoes}
              editais={editais}
              candidatos={candidatos}
              onCreateConvocacao={handleCreateConvocacao}
              onViewDetails={(conv) => setActiveModal({ type: 'view_convocacao', data: conv })}
              presencas={presencas}
              setPresencas={setPresencas}
              setConvocacoes={setConvocacoes}
              showToast={showToast}
              logAction={logAction}
              confirmAction={confirmAction}
            />
          )}

          {activeModule === 'auditoria' && (
            <AuditoriaModule 
              logs={logs}
              logAction={logAction}
              showToast={showToast}
              confirmAction={confirmAction}
            />
          )}

          {activeModule === 'administracao' && (
            <AdministracaoModule 
              usuarios={usuarios}
              onToggleUserStatus={handleToggleUserStatus}
              onAddUser={handleAddUser}
              setUsuarios={setUsuarios}
              systemName={systemName}
              setSystemName={setSystemName}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              showToast={showToast}
              logAction={logAction}
              confirmAction={confirmAction}
            />
          )}

        </main>

        {/* RODAPÉ */}
        <footer className="bg-[var(--color-white)] border-t border-[var(--color-border)] py-[12px] px-[16px] md:px-[32px] flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 animate-fade-in">
          <div className="text-[11px] text-[var(--color-text-muted)] text-center md:text-left font-medium">
            SelectPro v1.0 | © 2026 | LGPD
          </div>
          <div className="flex justify-center gap-3 text-[11px]">
            <a 
              href="#lgpd" 
              onClick={(e) => { e.preventDefault(); showToast('Exibindo termos LGPD (v1.0)...', 'success'); }}
              className="text-[var(--color-primary)] font-semibold hover:underline"
            >
              LGPD Compliance
            </a>
            <span className="text-[var(--color-border)]">|</span>
            <a 
              href="#privacidade" 
              onClick={(e) => { e.preventDefault(); showToast('Exibindo Política de Privacidade...', 'success'); }}
              className="text-[var(--color-primary)] font-semibold hover:underline"
            >
              Política de Privacidade
            </a>
          </div>
        </footer>

      </div>

      {/* --- ALL OVERLAY MODALS --- */}
      {activeModal !== null && (
        <div className="sp-modal-overlay">
          {/* Click Backdrop Outside to Close */}
          <div className="fixed inset-0" onClick={() => setActiveModal(null)}></div>
          
          <div className="sp-modal-container max-h-[90vh] overflow-y-auto text-xs relative flex flex-col">
            
            {/* Modal Header */}
            <div className="sp-modal-header">
              <h3 className="sp-modal-title">
                {activeModal.type === 'create_edital' && 'Publicar Novo Edital'}
                {activeModal.type === 'create_candidato' && 'Cadastrar Candidato Manualmente'}
                {activeModal.type === 'view_candidato' && 'Dossiê do Candidato'}
                {activeModal.type === 'view_convocacao' && 'Call Notice Oficial'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="sp-modal-close"
                title="Fechar modal"
                aria-label="X de fechar modal"
              >
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            {/* Modal Contents based on identifier */}
            <div className="sp-modal-body">
              
              {/* MODAL: REGISTRAR EDITAL */}
              {activeModal.type === 'create_edital' && (
                <form onSubmit={submitNewEdital} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-numero" className="text-xs font-bold text-slate-500">Número do Edital *</label>
                      <input id="modal-ed-numero" type="text" name="numero" required placeholder="Ex: 05/2026" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-100" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-vagas" className="text-xs font-bold text-slate-500">Vagas Oferecidas *</label>
                      <input id="modal-ed-vagas" type="number" name="vagas" required placeholder="Ex: 15" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="modal-ed-titulo" className="text-xs font-bold text-slate-500">Descrição / Título do Processo Seletivo *</label>
                    <input id="modal-ed-titulo" type="text" name="titulo" required placeholder="Ex: Cargos Médicos e Técnicos em Saúde" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-instituicao" className="text-xs font-bold text-slate-500">Instituição Contratante *</label>
                      <select id="modal-ed-instituicao" name="instituicao" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-705 dark:text-slate-200">
                        <option value="HCPA">HCPA (Hospital de Clínicas)</option>
                        <option value="UFRGS">UFRGS</option>
                        <option value="UFMG">UFMG</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-realizadora" className="text-xs font-bold text-slate-500">Banca Realizadora *</label>
                      <select id="modal-ed-realizadora" name="realizadora" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-705 dark:text-slate-200">
                        <option value="FAURGS">FAURGS</option>
                        <option value="FUMARC">FUMARC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-abertura" className="text-xs font-bold text-slate-500">Abertura das Inscrições *</label>
                      <input id="modal-ed-abertura" type="date" name="abertura" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono text-slate-805 dark:text-slate-205" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-ed-encerramento" className="text-xs font-bold text-slate-500">Encerramento Inscrições *</label>
                      <input id="modal-ed-encerramento" type="date" name="encerramento" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono text-slate-805 dark:text-slate-205" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="modal-ed-status" className="text-xs font-bold text-slate-500">Status Inicial</label>
                    <select id="modal-ed-status" name="status" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Recurso">Fase de Recurso</option>
                      <option value="Convocação">Fase de Convocação</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md cursor-pointer">Registrar Processo</button>
                  </div>
                </form>
              )}

              {/* MODAL: MANUALLY CADET CANDIDATO */}
              {activeModal.type === 'create_candidato' && (
                <form onSubmit={submitNewCandidato} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="modal-cand-nome" className="text-xs font-bold text-slate-500">Nome Completo do Candidato *</label>
                    <input id="modal-cand-nome" type="text" name="nome" required placeholder="Ex: Douglas Souza de Almeida" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-cpf" className="text-xs font-bold text-slate-500">CPF do Candidato *</label>
                      <input id="modal-cand-cpf" type="text" name="cpf" required placeholder="Ex: 567.890.123-44" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono text-slate-800 dark:text-slate-100" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-nasc" className="text-xs font-bold text-slate-500">Data de Nascimento *</label>
                      <input id="modal-cand-nasc" type="date" name="nascimento" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono text-slate-805 dark:text-slate-205" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-email" className="text-xs font-bold text-slate-500">E-mail *</label>
                      <input id="modal-cand-email" type="email" name="email" required placeholder="Ex: d.souza@email.com" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-fone" className="text-xs font-bold text-slate-500">Telefone Contato *</label>
                      <input id="modal-cand-fone" type="text" name="telefone" required placeholder="Ex: (51) 98765-4321" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-edital" className="text-xs font-bold text-slate-500">Vincular ao Edital *</label>
                      <select id="modal-cand-edital" name="edital" required className="w-full border border-slate-25a dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-705 dark:text-slate-200">
                        {editais.map(ed => (
                          <option key={ed.id} value={ed.numero}>Edital {ed.numero}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-cargo" className="text-xs font-bold text-slate-500">Cargo Pretendido *</label>
                      <input id="modal-cand-cargo" type="text" name="cargo" required placeholder="Ex: Analista de TI I" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-modalidade" className="text-xs font-bold text-slate-500">Vaga Concorrida *</label>
                      <select id="modal-cand-modalidade" name="modalidade" required className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-705">
                        <option value="AC">Ampla Concorrência (AC)</option>
                        <option value="PcD">Pessoa com Deficiência (PcD)</option>
                        <option value="Negros">Cotas para Negros</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="modal-cand-racial" className="text-xs font-bold text-slate-500">Autodeclaração Racial</label>
                      <select id="modal-cand-racial" name="racial" className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                        <option value="Branca">Branca</option>
                        <option value="Preta">Preta</option>
                        <option value="Parda">Parda</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Indígena">Indígena</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input id="modal-cand-def" type="checkbox" name="deficiencia" className="accent-[#2563eb] h-4 w-4" />
                    <label htmlFor="modal-cand-def" className="text-xs font-bold text-slate-650 dark:text-slate-300">Portador de Deficiência Física declarada (PcD)?</label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md cursor-pointer">Registrar Inscrição</button>
                  </div>
                </form>
              )}

              {/* MODAL: VER DOSSIÊ CANDIDATO PROFILE */}
              {activeModal.type === 'view_candidato' && (() => {
                const c = activeModal.data as Candidato;
                const totalPesos = c.peso_escrita + c.peso_titulos;
                const finalScore = totalPesos > 0 ? ((c.notaEscrita * c.peso_escrita + c.notaTitulos * c.peso_titulos) / totalPesos).toFixed(2) : '0.00';
                
                // Calculate age dynamically
                const birthYear = new Date(c.nascimento).getFullYear();
                const calculatedAge = 2026 - birthYear; // App year of 2026 as per logs

                return (
                  <div className="space-y-4">
                    {/* Visual Card Header */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Inscrição nº {c.inscricao}</p>
                        <h4 className="text-base font-bold text-slate-805 dark:text-slate-105 mt-0.5">{c.nome}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cargo: {c.cargo}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        c.status === 'Homologado' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : c.status === 'Pendente' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-105 text-rose-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Personal metrics */}
                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 dark:border-slate-700/55 pb-3">
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">CPF do Candidato</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono mt-0.5">{c.cpf}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">Idade Apurada</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{calculatedAge} anos <span className="text-[10px] text-slate-400 font-normal">({c.nascimento.split('-').reverse().join('/')})</span></p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">E-mail de Contato</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate" title={c.email}>{c.email}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">Telefone</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{c.telefone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 dark:border-slate-700/55 pb-3">
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">Autodeclaração Racial</p>
                        <p className="font-semibold text-slate-750 dark:text-slate-305 mt-0.5">{c.racial}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">Cotas PCD</p>
                        <p className="font-semibold text-slate-750 dark:text-slate-305 mt-0.5">{c.deficiencia ? 'Declarada PcD (Sim)' : 'Não aplicável (Não)'}</p>
                      </div>
                    </div>

                    {/* Integrated Scores breakdown with formula */}
                    <div className="p-4 bg-blue-50/20 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Boletim de Desempenho Ponderado</p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-1">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Nota Escrita</p>
                          <p className="font-mono font-bold text-slate-800 dark:text-white mt-0.5">{c.notaEscrita.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">({c.peso_escrita}x)</span></p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Nota Títulos</p>
                          <p className="font-mono font-bold text-slate-800 dark:text-white mt-0.5">{c.notaTitulos.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">({c.peso_titulos}x)</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Média Geral</p>
                          <p className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm mt-0.5">{finalScore}</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-3 border-t border-blue-100 dark:border-blue-900/20 pt-2 font-light">
                        Mecanismo de cálculo: <code className="bg-slate-100 dark:bg-slate-820 p-1 rounded font-mono text-[9px]">(Escrita * {c.peso_escrita} + Títulos * {c.peso_titulos}) / {totalPesos}</code>
                      </p>
                    </div>

                    {/* Real-time Status Changers Buttons for Admins */}
                    <div className="pt-4 border-t border-slate-150 dark:border-slate-700/50 flex flex-wrap gap-2 justify-end">
                      {c.status === 'Pendente' ? (
                        <>
                          <button
                            onClick={() => handleUpdateCandidatoStatus(c.id, 'Indeferido')}
                            className="px-3 py-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Indeferir Inscrição
                          </button>
                          <button
                            onClick={() => handleUpdateCandidatoStatus(c.id, 'Homologado')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                          >
                            Homologar Inscrição
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateCandidatoStatus(c.id, 'Pendente')}
                          className="px-3 py-1.5 border border-slate-250 dark:border-slate-700 text-slate-750 dark:text-slate-350 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Reverter para Pendente
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* MODAL: VER CALL NOTICE CONVOCAÇÃO */}
              {activeModal.type === 'view_convocacao' && (() => {
                const conv = activeModal.data as Convocacao;
                // Fetch the names from candidates id list
                const matchedCandidatos = candidatos.filter(c => conv.convocados.includes(c.id));
                
                return (
                  <div className="space-y-4">
                    <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
                      
                      {/* Cabecalho Oficial */}
                      <div className="text-center space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] text-white flex items-center justify-center font-black mx-auto text-xs">
                          SP
                        </div>
                        <h4 className="text-xs font-black tracking-widest uppercase text-slate-800 dark:text-white">REPUBLICA FEDERATIVA DO BRASIL</h4>
                        <p className="text-[10px] text-slate-500 font-bold dark:text-slate-400">EDITAL CONVOCATÓRIO OFICIAL • SELECTPRO</p>
                      </div>

                      {/* Info Evento */}
                      <div className="space-y-2 text-xs">
                        <p><strong className="uppercase text-[10px] text-slate-400">Assunto:</strong> <span className="font-bold">{conv.tipo}</span></p>
                        <p><strong className="uppercase text-[10px] text-slate-400">Edital Seletivo:</strong> <span className="font-bold font-mono">Nº {conv.edital}</span></p>
                        <p><strong className="uppercase text-[10px] text-slate-400">Cargo Convocado:</strong> <span className="font-bold text-slate-700 dark:text-slate-300">{conv.cargo}</span></p>
                        <p><strong className="uppercase text-[10px] text-slate-400">Data e Local:</strong> <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{conv.data.split('-').reverse().join('/')} às {conv.hora}</span></p>
                        <p><strong className="uppercase text-[10px] text-slate-400">Localização física:</strong> <span className="font-bold text-slate-800 dark:text-slate-100">{conv.local}</span></p>
                      </div>

                      {/* Lista de Convocados nomes */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Candidatos especificamente Convocados ({matchedCandidatos.length}):</p>
                        
                        {matchedCandidatos.length === 0 ? (
                          <p className="text-[11px] text-slate-450 italic">Nenhum candidato convocado ou localizado.</p>
                        ) : (
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                            {matchedCandidatos.map((mc, index) => (
                              <div key={mc.id} className="py-1.5 flex justify-between font-medium">
                                <span className="text-slate-800 dark:text-slate-200">{index + 1}. {mc.nome}</span>
                                <span className="font-mono text-slate-400">Insc. {mc.inscricao}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Termosecondary guidelines alert clause */}
                      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                        * Os convocados deverão apresentar-se no local determinado com antecedência de 30 minutos munidos de documento de identidade oficial válido com foto.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                      <button 
                        onClick={() => {
                          showToast('Simulando impressão PDF da convocação...', 'success');
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer "
                        aria-label="Gerar PDF da Convocação"
                      >
                        Imprimir Call Notice
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DIALOG OVERLAY --- */}
      {confirmState && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="fixed inset-0" onClick={() => setConfirmState(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700/60 w-full max-w-sm z-56 p-5 relative animate-scale-up">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
                <i className="ti ti-alert-triangle text-xl animate-pulse"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">Confirmação Requerida</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">{confirmState.mensagem}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 text-[11px] font-bold">
              <button 
                onClick={() => setConfirmState(null)}
                className="px-3.5 py-1.5 border border-slate-205 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmState.callback}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING TOASTS NOTIFICATIONS STACK --- */}
      <div 
        id="toast-stack"
        className="sp-toast-container"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`sp-toast sp-toast-${t.tipo}`}
          >
            <div className="sp-toast-icon">
              {t.tipo === 'success' && <i className="ti ti-circle-check text-base"></i>}
              {t.tipo === 'error' && <i className="ti ti-circle-x text-base"></i>}
              {t.tipo === 'warning' && <i className="ti ti-alert-triangle text-base"></i>}
            </div>
            
            <div className="sp-toast-msg">
              <p className="font-bold">Notificação</p>
              <p className="opacity-90 mt-0.5 leading-normal">{t.mensagem}</p>
            </div>

            <button 
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              className="sp-toast-close"
              aria-label="Dispensar Notificação"
            >
              <i className="ti ti-x"></i>
            </button>
            <div className="sp-toast-progress"></div>
          </div>
        ))}
      </div>

    </div>
  );
}
