import React, { useState, useEffect } from 'react';
import { Usuario } from '../types';

interface AdministracaoModuleProps {
  usuarios: Usuario[];
  onToggleUserStatus: (userId: number) => void;
  onAddUser: (newUser: Omit<Usuario, 'id' | 'ultimoAcesso'>) => void;
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  systemName: string;
  setSystemName: (name: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  showToast: (mensagem: string, tipo: 'success' | 'error' | 'warning') => void;
  logAction: (acao: string, modulo: string, registro: string, detalhe: string) => void;
  confirmAction?: (mensagem: string, callback: () => void) => void;
}

interface Instituicao {
  id: string;
  nome: string;
  sigla: string;
  cnpj: string;
  responsavel: string;
  emailContato: string;
}

// Default matrix structure for permissions tab
const DEFAULT_PERMISSOES = {
  Administrador: {
    Editais: { visualizar: true, criar: true, editar: true, publicar: true },
    Candidatos: { visualizar: true, criar: true, editar: true, publicar: true },
    Avaliacoes: { visualizar: true, criar: true, editar: true, publicar: true },
    Convocacoes: { visualizar: true, criar: true, editar: true, publicar: true },
    Auditoria: { visualizar: true, criar: true, editar: true, publicar: true },
  },
  Gestor: {
    Editais: { visualizar: true, criar: true, editar: true, publicar: true },
    Candidatos: { visualizar: true, criar: true, editar: true, publicar: false },
    Avaliacoes: { visualizar: true, criar: false, editar: false, publicar: false },
    Convocacoes: { visualizar: true, criar: true, editar: true, publicar: false },
    Auditoria: { visualizar: true, criar: false, editar: false, publicar: false },
  },
  Avaliador: {
    Editais: { visualizar: true, criar: false, editar: false, publicar: false },
    Candidatos: { visualizar: true, criar: false, editar: false, publicar: false },
    Avaliacoes: { visualizar: true, criar: true, editar: true, publicar: false },
    Convocacoes: { visualizar: false, criar: false, editar: false, publicar: false },
    Auditoria: { visualizar: false, criar: false, editar: false, publicar: false },
  },
  Operador: {
    Editais: { visualizar: true, criar: false, editar: false, publicar: false },
    Candidatos: { visualizar: true, criar: true, editar: true, publicar: false },
    Avaliacoes: { visualizar: false, criar: false, editar: false, publicar: false },
    Convocacoes: { visualizar: true, criar: true, editar: true, publicar: true },
    Auditoria: { visualizar: true, criar: false, editar: false, publicar: false },
  },
  Leitura: {
    Editais: { visualizar: true, criar: false, editar: false, publicar: false },
    Candidatos: { visualizar: true, criar: false, editar: false, publicar: false },
    Avaliacoes: { visualizar: true, criar: false, editar: false, publicar: false },
    Convocacoes: { visualizar: true, criar: false, editar: false, publicar: false },
    Auditoria: { visualizar: true, criar: false, editar: false, guidebook: false },
  }
};

export default function AdministracaoModule({
  usuarios,
  onToggleUserStatus,
  onAddUser,
  setUsuarios,
  systemName,
  setSystemName,
  primaryColor,
  setPrimaryColor,
  isDarkMode,
  setIsDarkMode,
  showToast,
  logAction,
  confirmAction
}: AdministracaoModuleProps) {
  
  // Navigation internal tabs
  const [activeTab, setActiveTab] = useState<'usuarios' | 'instituicoes' | 'configuracoes' | 'permissoes'>('usuarios');

  // Filter and search
  const [searchUser, setSearchUser] = useState('');

  // Modals Controller
  const [modalType, setModalType] = useState<'create_user' | 'edit_user' | 'redefine_password' | 'toggle_status_confirm' | 'create_institution' | 'edit_institution' | null>(null);

  // Buffer objects for operations
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Instituicao | null>(null);

  // Refined temporary password buffer
  const [generatedTempPass, setGeneratedTempPass] = useState('');

  // Form states for New User
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState('Avaliador');
  const [userInstitution, setUserInstitution] = useState('HCPA');
  const [userTempPass, setUserTempPass] = useState('SelPro@2026');

  // Form states for Editing User
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfile, setEditProfile] = useState('');
  const [editInstitution, setEditInstitution] = useState('');

  // Institutions states representing HCPA and FAURGS
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>(() => {
    const saved = localStorage.getItem('selectpro_instituicoes');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', nome: 'Hospital de Clínicas de Porto Alegre', sigla: 'HCPA', cnpj: '87.020.517/0001-20', responsavel: 'Prof. Dra. Roberta Camargo', emailContato: 'contato.selecao@hcpa.edu.br' },
      { id: '2', nome: 'Fundação de Apoio da Universidade Federal do Rio Grande do Sul', sigla: 'FAURGS', cnpj: '91.234.567/0001-89', responsavel: 'Dr. Roberto Mendes', emailContato: 'faurgs.concursos@faurgs.br' }
    ];
  });

  // Save institutions to persistence
  useEffect(() => {
    localStorage.setItem('selectpro_instituicoes', JSON.stringify(instituicoes));
  }, [instituicoes]);

  // Form states for Institution
  const [instNome, setInstNome] = useState('');
  const [instSigla, setInstSigla] = useState('');
  const [instCnpj, setInstCnpj] = useState('');
  const [instResponsavel, setInstResponsavel] = useState('');
  const [instEmail, setInstEmail] = useState('');

  // Config parameters states
  const [configSystemName, setConfigSystemName] = useState(systemName);
  const [configPrimaryColor, setConfigPrimaryColor] = useState(primaryColor);
  const [configIsDark, setConfigIsDark] = useState(isDarkMode);

  const [escalaNotas, setEscalaNotas] = useState(() => {
    return localStorage.getItem('selectpro_escala_notas') || '0-10';
  });
  const [casasDecimais, setCasasDecimais] = useState(() => {
    return localStorage.getItem('selectpro_casas_decimais') || '2';
  });
  const [criteriosDesempate, setCriteriosDesempate] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectpro_criterios_desempate');
    if (saved) return JSON.parse(saved);
    return [
      "Maior idade (Estatuto do Idoso)",
      "Maior nota na Prova Escrita Objetiva",
      "Maior nota na Prova de Títulos",
      "Maior tempo de serviço público",
      "Sorteio público"
    ];
  });

  // Matrix-styled Permissions States
  const [permissoes, setPermissoes] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const saved = localStorage.getItem('selectpro_permissao_matriz');
    if (saved) return JSON.parse(saved);
    return DEFAULT_PERMISSOES;
  });

  // Helper dynamic classes depending on the active primary color
  const getPrimaryBg = () => {
    switch (primaryColor) {
      case 'verde': return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white';
      case 'roxo': return 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white';
      case 'vermelho': return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white';
      default: return 'bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-blue-800 text-white'; // azul
    }
  };

  const getPrimaryTextColor = () => {
    switch (primaryColor) {
      case 'verde': return 'text-emerald-600 dark:text-emerald-400';
      case 'roxo': return 'text-purple-600 dark:text-purple-400';
      case 'vermelho': return 'text-rose-600 dark:text-rose-400';
      default: return 'text-blue-600 dark:text-blue-400'; // azul
    }
  };

  const getPrimaryBorderColor = () => {
    switch (primaryColor) {
      case 'verde': return 'border-emerald-600';
      case 'roxo': return 'border-purple-600';
      case 'vermelho': return 'border-rose-600';
      default: return 'border-blue-600'; // azul
    }
  };

  const getPrimaryFocusRing = () => {
    switch (primaryColor) {
      case 'verde': return 'focus:ring-emerald-550 dark:focus:ring-emerald-600';
      case 'roxo': return 'focus:ring-purple-550 dark:focus:ring-purple-600';
      case 'vermelho': return 'focus:ring-rose-550 dark:focus:ring-rose-600';
      default: return 'focus:ring-blue-550 dark:focus:ring-blue-600'; // azul
    }
  };

  const shadowPrimaryColor = () => {
    switch (primaryColor) {
      case 'verde': return 'shadow-emerald-600/10';
      case 'roxo': return 'shadow-purple-600/10';
      case 'vermelho': return 'shadow-rose-600/10';
      default: return 'shadow-blue-600/10';
    }
  };

  // Keep live configuration buffers updated with props
  useEffect(() => {
    setConfigSystemName(systemName);
  }, [systemName]);

  useEffect(() => {
    setConfigPrimaryColor(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    setConfigIsDark(isDarkMode);
  }, [isDarkMode]);

  // Generate random temporary password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalPass = pass + "@2026";
    setUserTempPass(finalPass);
    showToast("Nova senha provisória gerada!", "success");
  };

  // ---------------- USER PROCESSORS ----------------

  // Confirm user status change (ti-power)
  const triggerStatusToggle = (user: Usuario) => {
    setSelectedUser(user);
    setModalType('toggle_status_confirm');
  };

  const confirmStatusToggle = () => {
    if (!selectedUser) return;
    onToggleUserStatus(selectedUser.id);
    setModalType(null);
    setSelectedUser(null);
  };

  // Open Edit User modal (ti-edit)
  const triggerEditUser = (user: Usuario) => {
    setSelectedUser(user);
    setEditName(user.nome);
    setEditEmail(user.email);
    setEditProfile(user.perfil);
    setEditInstitution(user.instituicao);
    setModalType('edit_user');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editName || !editEmail) {
      showToast("Por favor complete todos os campos de preenchimento obrigatório.", "error");
      return;
    }

    setUsuarios(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          nome: editName,
          email: editEmail,
          perfil: editProfile,
          instituicao: editInstitution
        };
      }
      return u;
    }));

    logAction("Alteração Operador", "Administração", `Usuário ${editName}`, `Dados cadastrais modificados (Perfil: ${editProfile}, Instituição: ${editInstitution}).`);
    showToast(`Cadastro de ${editName} atualizado com sucesso!`, "success");
    setModalType(null);
    setSelectedUser(null);
  };

  // Redefining password with toast (ti-lock)
  const triggerRedefinePassword = (user: Usuario) => {
    const freshPass = "Pass_" + Math.floor(1000 + Math.random() * 9000) + "@26";
    setGeneratedTempPass(freshPass);
    setSelectedUser(user);
    setModalType('redefine_password');
  };

  const confirmRedefinePassword = () => {
    if (!selectedUser) return;
    logAction("Redefinição de Senha", "Administração", `Usuário ${selectedUser.nome}`, `Senha provisória gerada pelo administrador.`);
    showToast(`Senha de ${selectedUser.nome} redefinida! Uma mensagem foi enviada ao e-mail ${selectedUser.email}.`, "success");
    setModalType(null);
    setSelectedUser(null);
  };

  // Register New User
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      showToast("Campos nome e e-mail são de preenchimento obrigatório.", "error");
      return;
    }

    onAddUser({
      nome: userName,
      email: userEmail,
      perfil: userProfile,
      instituicao: userInstitution,
      status: 'Ativo'
    });

    logAction("Cadastro de Operador", "Administração", `Operador ${userName}`, `Senha temporária: ${userTempPass}`);
    
    // Reset Form
    setUserName('');
    setUserEmail('');
    setUserProfile('Avaliador');
    setUserInstitution('HCPA');
    setUserTempPass('SelPro@2026');
    setModalType(null);
  };

  // Filtered list of users
  const filteredUsers = usuarios.filter(u => {
    const term = searchUser.toLowerCase();
    return u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.perfil.toLowerCase().includes(term) || u.instituicao.toLowerCase().includes(term);
  });


  // ---------------- INSTITUTION PROCESSORS ----------------

  const triggerCreateInstitution = () => {
    setInstNome('');
    setInstSigla('');
    setInstCnpj('');
    setInstResponsavel('');
    setInstEmail('');
    setModalType('create_institution');
  };

  const handleCreateInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instNome || !instSigla || !instCnpj) {
      showToast("Preencha as informações obrigatórias (Nome, Sigla e CNPJ).", "error");
      return;
    }

    const newInst: Instituicao = {
      id: Date.now().toString(),
      nome: instNome,
      sigla: instSigla,
      cnpj: instCnpj,
      responsavel: instResponsavel || 'Geral',
      emailContato: instEmail || 'contato@instituicao.org'
    };

    setInstituicoes(prev => [...prev, newInst]);
    logAction("Cadastro Instituição", "Administração", `Instituição ${instSigla}`, `Nome: ${instNome}, Responsável: ${instResponsavel}.`);
    showToast(`Instituição ${instSigla} cadastrada com sucesso!`, "success");
    setModalType(null);
  };

  const triggerEditInstitution = (inst: Instituicao) => {
    setSelectedInstitution(inst);
    setInstNome(inst.nome);
    setInstSigla(inst.sigla);
    setInstCnpj(inst.cnpj);
    setInstResponsavel(inst.responsavel);
    setInstEmail(inst.emailContato);
    setModalType('edit_institution');
  };

  const handleSaveEditInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    if (!instNome || !instSigla || !instCnpj) {
      showToast("Preencha as informações obrigatórias (Nome, Sigla e CNPJ).", "error");
      return;
    }

    setInstituicoes(prev => prev.map(i => {
      if (i.id === selectedInstitution.id) {
        return {
          ...i,
          nome: instNome,
          sigla: instSigla,
          cnpj: instCnpj,
          responsavel: instResponsavel,
          emailContato: instEmail
        };
      }
      return i;
    }));

    logAction("Alteração Instituição", "Administração", `Instituição ${instSigla}`, `Dados cadastrais de ${instSigla} atualizados.`);
    showToast(`Instituição ${instSigla} modificada com sucesso!`, "success");
    setModalType(null);
    setSelectedInstitution(null);
  };


  // ---------------- GENERAL CONFIG PROCESSORS ----------------

  const moveCriteria = (index: number, direction: 'up' | 'down') => {
    const list = [...criteriosDesempate];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setCriteriosDesempate(list);
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Apply Appearance configurations
    setSystemName(configSystemName);
    localStorage.setItem('selectpro_system_name', configSystemName);

    setPrimaryColor(configPrimaryColor);
    localStorage.setItem('selectpro_primary_color', configPrimaryColor);

    setIsDarkMode(configIsDark);
    localStorage.setItem('selectpro_theme', configIsDark ? 'dark' : 'light');

    // 2. Clear default parameters
    localStorage.setItem('selectpro_escala_notas', escalaNotas);
    localStorage.setItem('selectpro_casas_decimais', casasDecimais);
    localStorage.setItem('selectpro_criterios_desempate', JSON.stringify(criteriosDesempate));

    logAction("Configurações Atualizadas", "Administração", "Geral", `Cor primária: ${configPrimaryColor}, Tema: ${configIsDark ? 'Escuro' : 'Claro'}, Escala de notas: ${escalaNotas}.`);
    showToast("Configurações do sistema aplicadas com sucesso!", "success");
  };


  // ---------------- MATRIZ PERMISSIONS PROCESSORS ----------------

  const handlePermissionToggle = (perfil: string, modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'publicar') => {
    setPermissoes(prev => {
      const currentPerfil = prev[perfil] || {};
      const currentModulo = currentPerfil[modulo] || { visualizar: false, criar: false, editar: false, publicar: false };
      
      return {
        ...prev,
        [perfil]: {
          ...currentPerfil,
          [modulo]: {
            ...currentModulo,
            [acao]: !currentModulo[acao]
          }
        }
      };
    });
  };

  const handleSavePermissoes = () => {
    localStorage.setItem('selectpro_permissao_matriz', JSON.stringify(permissoes));
    logAction("Alteração de Permissões", "Administração", "Matriz de Perfis", "Novas regras de acesso gravadas para todos os perfis.");
    showToast("Matriz de permissões atualizada com sucesso!", "success");
  };

  return (
    <div className="space-y-6 animate-fade-in" id="administracao-module">
      
      {/* Title Header Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-slate-200 dark:border-slate-700/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-sans">
            <i className={`ti ti-settings ${getPrimaryTextColor()}`}></i>
            Administração do Sistema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de acessos, parametrizações técnicas, parametrização de logos de instituições e auditoria de perfis de usuário.
          </p>
        </div>
      </div>

      {/* Tabs list switch design */}
      <div className="flex border-b border-slate-200 dark:border-slate-705/85 overflow-x-auto gap-1">
        {[
          { id: 'usuarios', label: 'Usuários', icon: 'ti-users' },
          { id: 'instituicoes', label: 'Instituições', icon: 'ti-building' },
          { id: 'configuracoes', label: 'Configurações', icon: 'ti-adjustments' },
          { id: 'permissoes', label: 'Permissões', icon: 'ti-shield' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                isActive 
                ? `${getPrimaryBorderColor()} ${getPrimaryTextColor()} bg-slate-50/50 dark:bg-slate-800/40` 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              id={`tab-btn-${tab.id}`}
            >
              <i className={`ti ${tab.icon} text-sm`}></i>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- ACTIVE WINDOW CONTENT ---------------- */}

      {/* 1. ABA USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-usuarios">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-150 dark:border-slate-700/60 shadow-xs">
            {/* Search Input filter */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <i className="ti ti-search text-sm"></i>
              </span>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Filtrar operador por nome, e-mail ou perfil..."
                className={`w-full text-xs pl-9 pr-3 py-2 border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
              />
              {searchUser && (
                <button 
                  onClick={() => setSearchUser('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <i className="ti ti-x text-xs"></i>
                </button>
              )}
            </div>

            {/* Novo Usuário button clicker */}
            <button
              onClick={() => {
                setUserName('');
                setUserEmail('');
                setUserProfile('Avaliador');
                setUserInstitution('HCPA');
                setUserTempPass('SelPro@2026');
                setModalType('create_user');
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold shadow-xs transition-all text-xs cursor-pointer ${getPrimaryBg()}`}
              id="novo-usuario-btn"
            >
              <i className="ti ti-user-plus text-sm"></i>
              Novo Usuário
            </button>
          </div>

          {/* Users List Grid Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-150 dark:border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-905/60 border-b border-slate-150 dark:border-slate-700/60 text-slate-450 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th scope="col" className="p-4">Nome completo</th>
                    <th scope="col" className="p-4">E-mail corporativo</th>
                    <th scope="col" className="p-4">Perfil</th>
                    <th scope="col" className="p-4">Instituição</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4">Último Acesso</th>
                    <th scope="col" className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold italic">
                        Nenhum operador localizado com os parâmetros inseridos.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(usr => (
                      <tr 
                        key={usr.id} 
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-900/10 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{usr.nome}</td>
                        <td className="p-4 font-medium text-slate-500 dark:text-slate-400">{usr.email}</td>
                        <td className="p-4">
                          <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">
                            {usr.perfil}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-650 dark:text-slate-300">{usr.instituicao}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            usr.status === 'Ativo'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-720 dark:text-slate-400'
                          }`}>
                            {usr.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-450 dark:text-slate-500">{usr.ultimoAcesso}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2.5">
                            {/* Action ti-edit */}
                            <button
                              onClick={() => triggerEditUser(usr)}
                              className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 p-1 rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Editar operador"
                            >
                              <i className="ti ti-edit text-base"></i>
                            </button>

                            {/* Action ti-lock */}
                            <button
                              onClick={() => triggerRedefinePassword(usr)}
                              className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-1 rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Redefinir senha de acesso"
                            >
                              <i className="ti ti-lock text-base"></i>
                            </button>

                            {/* Action ti-power */}
                            <button
                              onClick={() => triggerStatusToggle(usr)}
                              className={`p-1 rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                usr.status === 'Ativo' 
                                ? 'text-slate-450 hover:text-rose-600 dark:hover:text-rose-450' 
                                : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                              }`}
                              title={usr.status === 'Ativo' ? "Inativar Operador" : "Ativar Operador"}
                            >
                              <i className="ti ti-power text-base"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA INSTITUICOES */}
      {activeTab === 'instituicoes' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-instituicoes">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-150 dark:border-slate-700/60 shadow-xs">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Configuração das Unidades Integradas e Bancas Examinadoras</p>
            </div>
            
            <button
              onClick={triggerCreateInstitution}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold shadow-xs transition-all text-xs cursor-pointer ${getPrimaryBg()}`}
            >
              <i className="ti ti-plus text-sm"></i>
              Nova Instituição
            </button>
          </div>

          {/* Cards list for Institutions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instituicoes.map(inst => (
              <div 
                key={inst.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/70 shadow-xs relative flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <div>
                  <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                    {/* Circle initials placeholder */}
                    <div className={`w-12 h-12 rounded-full ${
                      primaryColor === 'verde' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                      primaryColor === 'roxo' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300' :
                      primaryColor === 'vermelho' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' :
                      'bg-blue-50 text-[#1e3a5f] dark:bg-blue-950/30 dark:text-blue-300'
                    } flex items-center justify-center font-black text-sm border border-slate-100 dark:border-slate-700 shadow-inner`}>
                      {inst.sigla.substring(0, 3).toUpperCase()}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Unidade Cadastrada</span>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight mt-0.5 truncate" title={inst.nome}>{inst.nome}</h3>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">{inst.sigla}</p>
                    </div>
                  </div>

                  {/* Grid details fields */}
                  <div className="py-4 text-xs space-y-2 text-slate-600 dark:text-slate-400 font-sans">
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-400">CNPJ Corporativo:</span>
                      <span className="font-mono font-bold text-slate-750 dark:text-slate-300">{inst.cnpj}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-400">Responsável Legal:</span>
                      <span className="font-bold text-slate-755 dark:text-slate-205">{inst.responsavel}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-400">E-mail de Contato:</span>
                      <span className="font-medium text-slate-755 dark:text-slate-305 truncate underline max-w-[200px]" title={inst.emailContato}>{inst.emailContato}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                  <button
                    onClick={() => triggerEditInstitution(inst)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-720 ${getPrimaryTextColor()}`}
                    title="Editar informações desta instituição"
                  >
                    <i className="ti ti-edit"></i>
                    Editar Unidade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ABA CONFIGURACOES */}
      {activeTab === 'configuracoes' && (
        <form onSubmit={handleSaveConfigs} className="space-y-6 animate-fade-in" id="tab-window-configuracoes">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Seção Aparência */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/60 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-750/70 pb-2 flex items-center gap-1.5">
                <i className={`ti ti-palette ${getPrimaryTextColor()}`}></i>
                Seção Aparência do Sistema
              </h3>

              <div className="space-y-3">
                {/* ID Input nome do sistema */}
                <div className="space-y-1">
                  <label htmlFor="cfg-sysname" className="text-xs font-bold text-slate-500 dark:text-slate-400">Nome Principal do Sistema</label>
                  <input
                    id="cfg-sysname"
                    type="text"
                    required
                    value={configSystemName}
                    onChange={(e) => setConfigSystemName(e.target.value)}
                    className={`w-full border border-slate-250 dark:border-slate-720 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-lg p-2 text-xs outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                  />
                </div>

                {/* ID Select cor primária */}
                <div className="space-y-1">
                  <label htmlFor="cfg-color" className="text-xs font-bold text-slate-500 dark:text-slate-400">Gabarito de Cor Primária (Acentos)</label>
                  <select
                    id="cfg-color"
                    value={configPrimaryColor}
                    onChange={(e) => setConfigPrimaryColor(e.target.value)}
                    className="w-full border border-slate-205 dark:border-slate-720 bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="azul">Azul Clássico (SelectPro Default)</option>
                    <option value="verde">Verde Sustentável (Governamental)</option>
                    <option value="roxo">Roxo Royal (Inovação e Tecnologia)</option>
                    <option value="vermelho">Vermelho Escarlate (Corporativo)</option>
                  </select>
                </div>

                {/* Toggle tema padrão */}
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <label htmlFor="cfg-palette-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tema Padrão do Sistema</label>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Habilitar visualização de alta visibilidade dark mode</span>
                  </div>
                  
                  <button
                    id="cfg-palette-toggle"
                    type="button"
                    onClick={() => setConfigIsDark(!configIsDark)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${configIsDark ? (configPrimaryColor === 'verde' ? 'bg-emerald-600' : configPrimaryColor === 'roxo' ? 'bg-purple-600' : configPrimaryColor === 'vermelho' ? 'bg-rose-600' : 'bg-blue-600') : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${configIsDark ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                      {configIsDark ? (
                        <i className={`ti ti-moon text-[10px] ${getPrimaryTextColor()}`}></i>
                      ) : (
                        <i className="ti ti-sun text-[10px] text-amber-500"></i>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Seção Parâmetros Padrão */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/60 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-750/70 pb-2 flex items-center gap-1.5">
                <i className={`ti ti-adjustments-alt ${getPrimaryTextColor()}`}></i>
                Seção Parâmetros Padrão das Notas
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Select escala de notas */}
                  <div className="space-y-1">
                    <label htmlFor="cfg-escala" className="text-xs font-bold text-slate-500 dark:text-slate-400">Escala das Notas</label>
                    <select
                      id="cfg-escala"
                      value={escalaNotas}
                      onChange={(e) => setEscalaNotas(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-720 bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-200 rounded-lg p-2 text-xs outline-none"
                    >
                      <option value="0-10">Decimal de 0 a 10</option>
                      <option value="0-100">Percentual de 0 a 100</option>
                    </select>
                  </div>

                  {/* Select casas decimais */}
                  <div className="space-y-1">
                    <label htmlFor="cfg-casas" className="text-xs font-bold text-slate-500 dark:text-slate-400">Casas Decimais</label>
                    <select
                      id="cfg-casas"
                      value={casasDecimais}
                      onChange={(e) => setCasasDecimais(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-720 bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-200 rounded-lg p-2 text-xs outline-none"
                    >
                      <option value="1">1 casa decimal (Ex: 8.4)</option>
                      <option value="2">2 casas decimais (Ex: 8.45)</option>
                    </select>
                  </div>
                </div>

                {/* Drag simulado list */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Critérios de Desempate (Sequência Decrescente)</span>
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-705 p-3 space-y-2">
                    {criteriosDesempate.map((crit, index) => (
                      <div 
                        key={index}
                        className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 cursor-grab active:cursor-grabbing font-light" title="Clique nas setas para ordenar">
                            <i className="ti ti-grip-vertical"></i>
                          </span>
                          <span className="font-bold text-slate-400 text-[10px] font-mono">#{index + 1}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{crit}</span>
                        </div>

                        {/* Reordering indicators up and down */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCriteria(index, 'up')}
                            className={`p-1 rounded-sm cursor-pointer disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 ${index !== 0 ? getPrimaryTextColor() : 'text-slate-400'}`}
                            title="Mover Para Cima"
                          >
                            <i className="ti ti-chevron-up"></i>
                          </button>
                          <button
                            type="button"
                            disabled={index === criteriosDesempate.length - 1}
                            onClick={() => moveCriteria(index, 'down')}
                            className={`p-1 rounded-sm cursor-pointer disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 ${index !== criteriosDesempate.length - 1 ? getPrimaryTextColor() : 'text-slate-400'}`}
                            title="Mover Para Baixo"
                          >
                            <i className="ti ti-chevron-down"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Precedência na lista simula a prioridade decrescente de validação no processamento.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Submitting configurations bar */}
          <div className="flex justify-end p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/60 shadow-xs">
            <button
              type="submit"
              className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-black tracking-wide text-xs cursor-pointer shadow-md transition-all ${getPrimaryBg()} ${shadowPrimaryColor()}`}
              id="salvar-configuracoes-btn"
            >
              <i className="ti ti-checkbox"></i>
              Salvar Configurações
            </button>
          </div>

        </form>
      )}

      {/* 4. ABA PERMISSOES */}
      {activeTab === 'permissoes' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-permissoes">
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/60 p-4 shadow-xs">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Gerencie a matriz de controle de acessos (RBAC - Role Based Access Control) vinculados aos módulos operacionais do SelectPro.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/50 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-905/70 border-b border-slate-150 dark:border-slate-705 text-[10px] text-slate-450 dark:text-slate-400 font-black uppercase tracking-wider">
                    <th scope="col" className="p-4 w-40">Perfil de Operador</th>
                    <th scope="col" className="p-4 text-center">Módulo Editais</th>
                    <th scope="col" className="p-4 text-center">Módulo Candidatos</th>
                    <th scope="col" className="p-4 text-center">Módulo Avaliações</th>
                    <th scope="col" className="p-4 text-center">Módulo Convocações</th>
                    <th scope="col" className="p-4 text-center">Módulo Auditoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                  {Object.keys(permissoes).map(perfil => {
                    const modData = permissoes[perfil] || {};
                    return (
                      <tr key={perfil} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="p-4 valign-middle">
                          <strong className="text-slate-800 dark:text-slate-100 text-xs tracking-tight block">{perfil}</strong>
                          <span className="text-[9px] text-slate-400 leading-none">Nível de privilégios operacionais</span>
                        </td>
                        
                        {/* Modules column blocks loop */}
                        {['Editais', 'Candidatos', 'Avaliacoes', 'Convocacoes', 'Auditoria'].map(modKey => {
                          const actions = modData[modKey] || { visualizar: false, criar: false, editar: false, publicar: false };
                          return (
                            <td key={modKey} className="p-4 align-top border-l border-slate-50 dark:border-slate-700/40">
                              <div className="space-y-1.5 max-w-[140px] mx-auto text-[10px] font-sans">
                                {/* Checkbox Visualizar */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-905">
                                  <input
                                    type="checkbox"
                                    checked={actions.visualizar}
                                    onChange={() => handlePermissionToggle(perfil, modKey, 'visualizar')}
                                    className="rounded border-slate-300 dark:border-slate-600 accent-blue-600 h-3 w-3 cursor-pointer"
                                  />
                                  <span>Visualizar</span>
                                </label>

                                {/* Checkbox Criar */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-905">
                                  <input
                                    type="checkbox"
                                    checked={actions.criar}
                                    onChange={() => handlePermissionToggle(perfil, modKey, 'criar')}
                                    className="rounded border-slate-300 dark:border-slate-600 accent-blue-600 h-3 w-3 cursor-pointer"
                                  />
                                  <span>Criar</span>
                                </label>

                                {/* Checkbox Editar */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-905">
                                  <input
                                    type="checkbox"
                                    checked={actions.editar}
                                    onChange={() => handlePermissionToggle(perfil, modKey, 'editar')}
                                    className="rounded border-slate-300 dark:border-slate-600 accent-blue-600 h-3 w-3 cursor-pointer"
                                  />
                                  <span>Editar</span>
                                </label>

                                {/* Checkbox Publicar */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-905">
                                  <input
                                    type="checkbox"
                                    checked={actions.publicar}
                                    onChange={() => handlePermissionToggle(perfil, modKey, 'publicar')}
                                    className="rounded border-slate-300 dark:border-slate-600 accent-blue-600 h-3 w-3 cursor-pointer"
                                  />
                                  <span>Publicar</span>
                                </label>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submitting permissions footer */}
          <div className="flex justify-end p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700/60 shadow-xs">
            <button
              onClick={handleSavePermissoes}
              className={`flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-black tracking-wide text-xs cursor-pointer shadow-md transition-all ${getPrimaryBg()} ${shadowPrimaryColor()}`}
              id="salvar-permissoes-btn"
            >
              <i className="ti ti-shield-check"></i>
              Salvar Permissões
            </button>
          </div>

        </div>
      )}


      {/* ---------------- ACTIVE WINDOW OVERLAY MODALS ---------------- */}

      {/* 1. MODAL CADASTRAR NOVO USUÁRIO */}
      {modalType === 'create_user' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-create-user">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-205 dark:border-slate-700/60 w-full max-w-md z-55 overflow-hidden animate-scale-up text-xs font-sans">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <i className={`ti ti-user-plus ${getPrimaryTextColor()}`}></i>
                Adicionar Novo Usuário
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label htmlFor="modal-usr-nome" className="text-xs font-bold text-slate-500 dark:text-slate-450">Nome Completo *</label>
                <input
                  id="modal-usr-nome"
                  type="text"
                  required
                  placeholder="Ex: Douglas Souza de Almeida"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-usr-email" className="text-xs font-bold text-slate-500 dark:text-slate-450">E-mail Institucional *</label>
                <input
                  id="modal-usr-email"
                  type="email"
                  required
                  placeholder="Ex: d.souza@faurgs.br"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="modal-usr-profile" className="text-xs font-bold text-slate-500 dark:text-slate-450">Perfil de Acesso</label>
                  <select
                    id="modal-usr-profile"
                    value={userProfile}
                    onChange={(e) => setUserProfile(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-705 bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5 text-slate-755 dark:text-slate-200 outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Avaliador">Avaliador</option>
                    <option value="Operador">Operador (Colaborador)</option>
                    <option value="Leitura">Leitura (Auditoria)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-usr-inst" className="text-xs font-bold text-slate-500 dark:text-slate-450">Instituição Vinculada</label>
                  <select
                    id="modal-usr-inst"
                    value={userInstitution}
                    onChange={(e) => setUserInstitution(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-705 bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5 text-slate-755 dark:text-slate-200 outline-none"
                  >
                    {instituicoes.map(i => (
                      <option key={i.id} value={i.sigla}>{i.sigla} ({i.nome.length > 25 ? `${i.sigla}` : i.nome})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Preset field */}
              <div className="space-y-1">
                <label htmlFor="modal-usr-temppass" className="text-xs font-bold text-slate-400 dark:text-slate-450 flex items-center justify-between">
                  <span>Senha Temporária Inicial</span>
                  <button 
                    type="button" 
                    onClick={handleGeneratePassword}
                    className={`text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer ${getPrimaryTextColor()}`}
                  >
                    <i className="ti ti-refresh text-[9px]"></i>
                    Gerar Aleatória
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    id="modal-usr-temppass"
                    type="text"
                    required
                    value={userTempPass}
                    onChange={(e) => setUserTempPass(e.target.value)}
                    className="flex-1 border border-slate-250 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Esta senha deve ser repassada ao titular para a realização do primeiro login de homologação.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-bold shadow-xs cursor-pointer ${getPrimaryBg()}`}
                  id="salvar-novo-usuario-btn"
                >
                  Gravar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL EDITAR USUÁRIO (ti-edit) */}
      {modalType === 'edit_user' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-edit-user">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-205 dark:border-slate-700/60 w-full max-w-md z-55 overflow-hidden animate-scale-up text-xs font-sans">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <i className={`ti ti-edit ${getPrimaryTextColor()}`}></i>
                Editar Informações do Operador
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4">
              <div className="space-y-1">
                <label htmlFor="edit-usr-nome" className="text-xs font-bold text-slate-500 dark:text-slate-455">Nome Completo *</label>
                <input
                  id="edit-usr-nome"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-usr-email" className="text-xs font-bold text-slate-500 dark:text-slate-455">E-mail Institucional *</label>
                <input
                  id="edit-usr-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="edit-usr-profile" className="text-xs font-bold text-slate-500 dark:text-slate-455">Perfil de Acesso</label>
                  <select
                    id="edit-usr-profile"
                    value={editProfile}
                    onChange={(e) => setEditProfile(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-705 bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5 text-slate-755 dark:text-slate-200 outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Avaliador">Avaliador</option>
                    <option value="Operador">Operador (Colaborador)</option>
                    <option value="Leitura">Leitura (Auditoria)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-usr-inst" className="text-xs font-bold text-slate-500 dark:text-slate-455">Instituição Vinculada</label>
                  <select
                    id="edit-usr-inst"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-705 bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5 text-slate-755 dark:text-slate-200 outline-none"
                  >
                    {instituicoes.map(i => (
                      <option key={i.id} value={i.sigla}>{i.sigla} ({i.nome.length > 25 ? `${i.sigla}` : i.nome})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-bold shadow-xs cursor-pointer ${getPrimaryBg()}`}
                  id="salvar-edicao-usuario-btn"
                >
                  Gravar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL DE REDEFINIÇÃO DE SENHA (ti-lock) */}
      {modalType === 'redefine_password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-redefine-pass">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm z-55 overflow-hidden animate-scale-up text-xs font-sans">
            <div className="p-4 border-b border-slate-150 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase font-mono tracking-tight">
                <i className="ti ti-lock text-amber-500"></i>
                Redefinir Senha
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-955/35 flex items-center justify-center mx-auto border-2 border-dashed border-amber-300">
                  <i className="ti ti-key-off text-2xl text-amber-500 animate-pulse"></i>
                </div>
                <p className="font-bold text-[#1e3a5f] dark:text-slate-200">Redefinir as credenciais de {selectedUser.nome}?</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Uma nova senha temporária será gerada para este operador e disparada ao e-mail institucional.</p>
              </div>

              {/* Display generated passcode box */}
              <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-200 text-center space-y-1 dark:bg-slate-950/40">
                <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Nova senha temporária ativa:</p>
                <code className="text-sm font-mono font-black text-slate-900 dark:text-white px-2 py-0.5 rounded bg-amber-100/60 dark:bg-slate-900 block select-all">{generatedTempPass}</code>
                <p className="text-[9px] text-amber-600 font-light">Anote ou copie a senha acima para informar ao operador caso necessário.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3.5 py-1.5 border border-slate-250 dark:border-slate-705 text-slate-655 dark:text-slate-350 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar de volta
                </button>
                <button
                  type="button"
                  onClick={confirmRedefinePassword}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Confirmar e Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DIALOG CONFIRMACAO TI-POWER */}
      {modalType === 'toggle_status_confirm' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-status-confirm">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-150 w-full max-w-sm z-55 overflow-hidden animate-scale-up text-xs font-sans">
            <div className="p-4 border-b border-slate-150 dark:border-slate-700 pb-2.5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <i className="ti ti-alert-triangle text-rose-500"></i>
                Confirmar Alteração de Status
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-medium text-slate-700 dark:text-slate-300 leading-normal text-center">
                Deseja realmente alterar a situação do operador <strong className="text-slate-900 dark:text-white">{selectedUser.nome}</strong> para <strong className="p-1 px-1.5 rounded bg-slate-105 font-bold text-[10px] dark:bg-slate-700">{selectedUser.status === 'Ativo' ? 'Inativo' : 'Ativo'}</strong>?
              </p>
              {selectedUser.status === 'Ativo' && (
                <p className="text-[10px] text-rose-600 bg-rose-50/30 p-2 border border-rose-200/40 rounded dark:bg-rose-955/20 leading-relaxed font-light">
                  * Atenção: Ao inativar este operador, ele perderá acesso imediato a todas as funcionalidades de homologação, lançamento de notas e auditorias do SelectPro.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-150 dark:border-slate-700/60">
                <button
                  onClick={() => setModalType(null)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-655 dark:text-slate-350 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar de volta
                </button>
                <button
                  onClick={confirmStatusToggle}
                  className={`px-4 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    selectedUser.status === 'Ativo'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  id="confirm-alterar-status-btn"
                >
                  Sim, Alterar Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CADASTRO NOVA INSTITUICÃO */}
      {modalType === 'create_institution' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-create-inst">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-205 w-full max-w-md z-55 overflow-hidden animate-scale-up text-xs font-sans">
            
            <div className="p-4 border-b border-slate-150 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <i className={`ti ti-building ${getPrimaryTextColor()}`}></i>
                Adicionar Nova Instituição
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleCreateInstitution} className="p-5 space-y-4">
              <div className="space-y-1">
                <label htmlFor="modal-inst-nome" className="text-xs font-bold text-slate-500 dark:text-slate-450">Nome de Cadastro Integral *</label>
                <input
                  id="modal-inst-nome"
                  type="text"
                  required
                  placeholder="Ex: Empresa Pública de Seleção e Pesquisa Ltda."
                  value={instNome}
                  onChange={(e) => setInstNome(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label htmlFor="modal-inst-sigla" className="text-xs font-bold text-slate-500 dark:text-slate-450">Sigla *</label>
                  <input
                    id="modal-inst-sigla"
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Ex: EPSP"
                    value={instSigla}
                    onChange={(e) => setInstSigla(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center rounded-lg p-2 font-mono font-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label htmlFor="modal-inst-cnpj" className="text-xs font-bold text-slate-500 dark:text-slate-450">CNPJ Corporativo *</label>
                  <input
                    id="modal-inst-cnpj"
                    type="text"
                    required
                    placeholder="Ex: xx.xxx.xxx/xxxx-xx"
                    value={instCnpj}
                    onChange={(e) => setInstCnpj(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-inst-resp" className="text-xs font-bold text-slate-500 dark:text-slate-455">Responsável Legal (Unidade)</label>
                <input
                  id="modal-inst-resp"
                  type="text"
                  placeholder="Ex: Dr. Antenor de Moraes Ribeiro"
                  value={instResponsavel}
                  onChange={(e) => setInstResponsavel(e.target.value)}
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-inst-contact-email" className="text-xs font-bold text-slate-500 dark:text-slate-455">E-mail para Comunicados Oficiais</label>
                <input
                  id="modal-inst-contact-email"
                  type="email"
                  placeholder="Ex: concursos@instituicao.org"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar de volta
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-bold shadow-xs cursor-pointer ${getPrimaryBg()}`}
                  id="salvar-nova-instituicao-btn"
                >
                  Gravar Instituição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL EDITAR INSTITUICAO (Editar) */}
      {modalType === 'edit_institution' && selectedInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="modal-container-edit-inst">
          <div className="fixed inset-0" onClick={() => setModalType(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-205 w-full max-w-md z-55 overflow-hidden animate-scale-up text-xs font-sans">
            
            <div className="p-4 border-b border-slate-150 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-sm font-black text-slate-855 dark:text-slate-100 flex items-center gap-1.5 animate-pulse">
                <i className={`ti ti-edit ${getPrimaryTextColor()}`}></i>
                Editar Informações da Instituição ({selectedInstitution.sigla})
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <i className="ti ti-x text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditInstitution} className="p-5 space-y-4">
              <div className="space-y-1">
                <label htmlFor="edit-inst-nome" className="text-xs font-bold text-slate-500 dark:text-slate-450">Nome Integral de Cadastro *</label>
                <input
                  id="edit-inst-nome"
                  type="text"
                  required
                  value={instNome}
                  onChange={(e) => setInstNome(e.target.value)}
                  className={`w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 ${getPrimaryFocusRing()}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label htmlFor="edit-inst-sigla" className="text-xs font-bold text-slate-500 dark:text-slate-450">Sigla *</label>
                  <input
                    id="edit-inst-sigla"
                    type="text"
                    required
                    maxLength={10}
                    value={instSigla}
                    onChange={(e) => setInstSigla(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center rounded-lg p-2 font-mono font-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label htmlFor="edit-inst-cnpj" className="text-xs font-bold text-slate-500 dark:text-slate-450">CNPJ *</label>
                  <input
                    id="edit-inst-cnpj"
                    type="text"
                    required
                    value={instCnpj}
                    onChange={(e) => setInstCnpj(e.target.value)}
                    className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-inst-resp" className="text-xs font-bold text-slate-500 dark:text-slate-455">Responsável Legal</label>
                <input
                  id="edit-inst-resp"
                  type="text"
                  value={instResponsavel}
                  onChange={(e) => setInstResponsavel(e.target.value)}
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-inst-contact" className="text-xs font-bold text-slate-500 dark:text-slate-455">E-mail para Comunicados Oficiais</label>
                <input
                  id="edit-inst-contact"
                  type="email"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  className="w-full border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-655 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-720 cursor-pointer"
                >
                  Cancelar de volta
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg font-bold shadow-xs cursor-pointer ${getPrimaryBg()}`}
                  id="salvar-edicao-instituicao-btn"
                >
                  Gravar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
