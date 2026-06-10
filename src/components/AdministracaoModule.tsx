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
    Auditoria: { visualizar: true, criar: false, editar: false, publicar: false },
  }
};

const PROFILE_OPTIONS = [
  'Administrador Geral',
  'Gestor de Edital',
  'Avaliador',
  'Operador de Convocação',
  'Leitura',
];

const getProfileBadgeClass = (perfil: string): string => {
  const p = perfil.toLowerCase();
  if (p.includes('administrador')) return 'sp-badge-profile sp-badge-profile-admin';
  if (p.includes('gestor'))        return 'sp-badge-profile sp-badge-profile-gestor';
  if (p.includes('avaliador'))     return 'sp-badge-profile sp-badge-profile-avaliador';
  if (p.includes('leitura'))       return 'sp-badge-profile sp-badge-profile-leitura';
  return 'sp-badge-profile sp-badge-profile-operador';
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

  const [activeTab, setActiveTab] = useState<'usuarios' | 'instituicoes' | 'configuracoes' | 'permissoes'>('usuarios');
  const [searchUser, setSearchUser] = useState('');
  const [modalType, setModalType] = useState<
    'create_user' | 'edit_user' | 'redefine_password' | 'toggle_status_confirm' |
    'create_institution' | 'edit_institution' | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Instituicao | null>(null);
  const [generatedTempPass, setGeneratedTempPass] = useState('');

  // New user form
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState('Avaliador');
  const [userInstitution, setUserInstitution] = useState('HCPA');
  const [userTempPass, setUserTempPass] = useState('SelPro@2026');

  // Edit user form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProfile, setEditProfile] = useState('');
  const [editInstitution, setEditInstitution] = useState('');

  const [instituicoes, setInstituicoes] = useState<Instituicao[]>(() => {
    const saved = localStorage.getItem('selectpro_instituicoes');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', nome: 'Hospital de Clínicas de Porto Alegre', sigla: 'HCPA', cnpj: '87.020.517/0001-20', responsavel: 'Prof. Dra. Roberta Camargo', emailContato: 'contato.selecao@hcpa.edu.br' },
      { id: '2', nome: 'Fundação de Apoio da Universidade Federal do Rio Grande do Sul', sigla: 'FAURGS', cnpj: '91.234.567/0001-89', responsavel: 'Dr. Roberto Mendes', emailContato: 'faurgs.concursos@faurgs.br' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('selectpro_instituicoes', JSON.stringify(instituicoes));
  }, [instituicoes]);

  // Institution form
  const [instNome, setInstNome] = useState('');
  const [instSigla, setInstSigla] = useState('');
  const [instCnpj, setInstCnpj] = useState('');
  const [instResponsavel, setInstResponsavel] = useState('');
  const [instEmail, setInstEmail] = useState('');

  // Config states
  const [configSystemName, setConfigSystemName] = useState(systemName);
  const [configPrimaryColor, setConfigPrimaryColor] = useState(primaryColor);
  const [configIsDark, setConfigIsDark] = useState(isDarkMode);
  const [escalaNotas, setEscalaNotas] = useState(() => localStorage.getItem('selectpro_escala_notas') || '0-10');
  const [casasDecimais, setCasasDecimais] = useState(() => localStorage.getItem('selectpro_casas_decimais') || '2');
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

  const [permissoes, setPermissoes] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const saved = localStorage.getItem('selectpro_permissao_matriz');
    if (saved) return JSON.parse(saved);
    return DEFAULT_PERMISSOES;
  });

  useEffect(() => { setConfigSystemName(systemName); }, [systemName]);
  useEffect(() => { setConfigPrimaryColor(primaryColor); }, [primaryColor]);
  useEffect(() => { setConfigIsDark(isDarkMode); }, [isDarkMode]);

  // Password generator
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setUserTempPass(pass + "@2026");
    showToast("Nova senha provisória gerada!", "success");
  };

  // User actions
  const triggerStatusToggle = (user: Usuario) => { setSelectedUser(user); setModalType('toggle_status_confirm'); };
  const confirmStatusToggle = () => {
    if (!selectedUser) return;
    onToggleUserStatus(selectedUser.id);
    setModalType(null);
    setSelectedUser(null);
  };

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
    if (!selectedUser || !editName || !editEmail) {
      showToast("Por favor complete todos os campos obrigatórios.", "error");
      return;
    }
    setUsuarios(prev => prev.map(u => u.id === selectedUser.id
      ? { ...u, nome: editName, email: editEmail, perfil: editProfile, instituicao: editInstitution }
      : u
    ));
    logAction("Alteração Operador", "Administração", `Usuário ${editName}`, `Perfil: ${editProfile}, Instituição: ${editInstitution}.`);
    showToast(`Cadastro de ${editName} atualizado com sucesso!`, "success");
    setModalType(null);
    setSelectedUser(null);
  };

  const triggerRedefinePassword = (user: Usuario) => {
    setGeneratedTempPass("Pass_" + Math.floor(1000 + Math.random() * 9000) + "@26");
    setSelectedUser(user);
    setModalType('redefine_password');
  };

  const confirmRedefinePassword = () => {
    if (!selectedUser) return;
    logAction("Redefinição de Senha", "Administração", `Usuário ${selectedUser.nome}`, `Senha provisória gerada pelo administrador.`);
    showToast(`Senha de ${selectedUser.nome} redefinida e enviada para ${selectedUser.email}.`, "success");
    setModalType(null);
    setSelectedUser(null);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      showToast("Nome e e-mail são obrigatórios.", "error");
      return;
    }
    onAddUser({ nome: userName, email: userEmail, perfil: userProfile, instituicao: userInstitution, status: 'Ativo' });
    logAction("Cadastro de Operador", "Administração", `Operador ${userName}`, `Senha temporária: ${userTempPass}`);
    setUserName(''); setUserEmail(''); setUserProfile('Avaliador'); setUserInstitution('HCPA'); setUserTempPass('SelPro@2026');
    setModalType(null);
  };

  const filteredUsers = usuarios.filter(u => {
    const term = searchUser.toLowerCase();
    return u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) ||
      u.perfil.toLowerCase().includes(term) || u.instituicao.toLowerCase().includes(term);
  });

  // Institution actions
  const triggerCreateInstitution = () => {
    setInstNome(''); setInstSigla(''); setInstCnpj(''); setInstResponsavel(''); setInstEmail('');
    setModalType('create_institution');
  };

  const handleCreateInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instNome || !instSigla || !instCnpj) {
      showToast("Preencha Nome, Sigla e CNPJ.", "error");
      return;
    }
    const newInst: Instituicao = {
      id: Date.now().toString(), nome: instNome, sigla: instSigla, cnpj: instCnpj,
      responsavel: instResponsavel || 'Geral', emailContato: instEmail || 'contato@instituicao.org'
    };
    setInstituicoes(prev => [...prev, newInst]);
    logAction("Cadastro Instituição", "Administração", `Instituição ${instSigla}`, `Nome: ${instNome}, Responsável: ${instResponsavel}.`);
    showToast(`Instituição ${instSigla} cadastrada com sucesso!`, "success");
    setModalType(null);
  };

  const triggerEditInstitution = (inst: Instituicao) => {
    setSelectedInstitution(inst);
    setInstNome(inst.nome); setInstSigla(inst.sigla); setInstCnpj(inst.cnpj);
    setInstResponsavel(inst.responsavel); setInstEmail(inst.emailContato);
    setModalType('edit_institution');
  };

  const handleSaveEditInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution || !instNome || !instSigla || !instCnpj) {
      showToast("Preencha Nome, Sigla e CNPJ.", "error");
      return;
    }
    setInstituicoes(prev => prev.map(i => i.id === selectedInstitution.id
      ? { ...i, nome: instNome, sigla: instSigla, cnpj: instCnpj, responsavel: instResponsavel, emailContato: instEmail }
      : i
    ));
    logAction("Alteração Instituição", "Administração", `Instituição ${instSigla}`, `Dados de ${instSigla} atualizados.`);
    showToast(`Instituição ${instSigla} modificada com sucesso!`, "success");
    setModalType(null);
    setSelectedInstitution(null);
  };

  // Config actions
  const moveCriteria = (index: number, direction: 'up' | 'down') => {
    const list = [...criteriosDesempate];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setCriteriosDesempate(list);
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemName(configSystemName);
    localStorage.setItem('selectpro_system_name', configSystemName);
    setPrimaryColor(configPrimaryColor);
    localStorage.setItem('selectpro_primary_color', configPrimaryColor);
    setIsDarkMode(configIsDark);
    localStorage.setItem('selectpro_theme', configIsDark ? 'dark' : 'light');
    localStorage.setItem('selectpro_escala_notas', escalaNotas);
    localStorage.setItem('selectpro_casas_decimais', casasDecimais);
    localStorage.setItem('selectpro_criterios_desempate', JSON.stringify(criteriosDesempate));
    logAction("Configurações Atualizadas", "Administração", "Geral", `Cor: ${configPrimaryColor}, Tema: ${configIsDark ? 'Escuro' : 'Claro'}, Escala: ${escalaNotas}.`);
    showToast("Configurações aplicadas com sucesso!", "success");
  };

  const handlePermissionToggle = (perfil: string, modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'publicar') => {
    setPermissoes(prev => ({
      ...prev,
      [perfil]: {
        ...(prev[perfil] || {}),
        [modulo]: {
          ...(prev[perfil]?.[modulo] || { visualizar: false, criar: false, editar: false, publicar: false }),
          [acao]: !prev[perfil]?.[modulo]?.[acao]
        }
      }
    }));
  };

  const handleSavePermissoes = () => {
    localStorage.setItem('selectpro_permissao_matriz', JSON.stringify(permissoes));
    logAction("Alteração de Permissões", "Administração", "Matriz de Perfis", "Novas regras de acesso gravadas.");
    showToast("Matriz de permissões atualizada com sucesso!", "success");
  };

  const closeModal = () => { setModalType(null); setSelectedUser(null); setSelectedInstitution(null); };

  return (
    <div className="space-y-6 animate-fade-in" id="administracao-module">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <i className="ti ti-settings text-[var(--color-primary)]"></i>
            Administração do Sistema
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Controle de acessos, parametrizações técnicas, instituições e perfis de usuário.
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="sp-tabs-container">
        {[
          { id: 'usuarios', label: 'Usuários', icon: 'ti-users' },
          { id: 'instituicoes', label: 'Instituições', icon: 'ti-building' },
          { id: 'configuracoes', label: 'Configurações', icon: 'ti-adjustments' },
          { id: 'permissoes', label: 'Permissões', icon: 'ti-shield' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`sp-tab ${activeTab === tab.id ? 'sp-tab-active' : ''}`}
            id={`tab-btn-${tab.id}`}
          >
            <i className={`ti ${tab.icon} text-sm`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA USUÁRIOS ── */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-usuarios">

          {/* Barra de busca e ação */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-white)] p-4 rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
            <div className="sp-search-container flex-1 max-w-md">
              <span className="sp-search-icon"><i className="ti ti-search text-sm"></i></span>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Filtrar por nome, e-mail ou perfil..."
                className="sp-search-input"
              />
              {searchUser && (
                <button onClick={() => setSearchUser('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <i className="ti ti-x text-xs"></i>
                </button>
              )}
            </div>
            <button
              onClick={() => { setUserName(''); setUserEmail(''); setUserProfile('Avaliador'); setUserInstitution('HCPA'); setUserTempPass('SelPro@2026'); setModalType('create_user'); }}
              className="sp-btn sp-btn-primary gap-2"
              id="novo-usuario-btn"
            >
              <i className="ti ti-user-plus text-sm"></i>
              Novo Usuário
            </button>
          </div>

          {/* Tabela de usuários */}
          <div className="sp-table-container">
            <div className="overflow-x-auto">
              <table className="sp-table" id="table-usuarios-adm">
                <thead>
                  <tr>
                    <th scope="col">Nome Completo</th>
                    <th scope="col">E-mail Corporativo</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Instituição</th>
                    <th scope="col">Status</th>
                    <th scope="col">Último Acesso</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--color-text-muted)] font-bold italic">
                        Nenhum operador localizado com os parâmetros inseridos.
                      </td>
                    </tr>
                  ) : filteredUsers.map(usr => (
                    <tr key={usr.id}>
                      <td className="font-bold text-[var(--color-text-primary)]">{usr.nome}</td>
                      <td className="text-[var(--color-text-secondary)]">{usr.email}</td>
                      <td>
                        <span className={getProfileBadgeClass(usr.perfil)}>
                          {usr.perfil}
                        </span>
                      </td>
                      <td className="font-semibold text-[var(--color-text-secondary)]">{usr.instituicao}</td>
                      <td>
                        <span className={`sp-badge ${usr.status === 'Ativo' ? 'sp-badge-ativo' : 'sp-badge-inativo'}`}>
                          {usr.status}
                        </span>
                      </td>
                      <td className="font-mono text-[11px] text-[var(--color-text-muted)]">{usr.ultimoAcesso}</td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => triggerEditUser(usr)}
                            className="sp-btn-icon sp-btn-icon-edit"
                            title="Editar operador"
                          >
                            <i className="ti ti-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => triggerRedefinePassword(usr)}
                            className="sp-btn-icon"
                            title="Redefinir senha"
                            style={{ '--hover-color': 'var(--color-warning)' } as React.CSSProperties}
                          >
                            <i className="ti ti-lock text-sm"></i>
                          </button>
                          <button
                            onClick={() => triggerStatusToggle(usr)}
                            className={`sp-btn-icon ${usr.status === 'Ativo' ? 'sp-btn-icon-delete' : 'sp-btn-icon-view'}`}
                            title={usr.status === 'Ativo' ? "Inativar operador" : "Ativar operador"}
                          >
                            <i className="ti ti-power text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA INSTITUIÇÕES ── */}
      {activeTab === 'instituicoes' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-instituicoes">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-white)] p-4 rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
            <p className="text-sm font-bold text-[var(--color-text-secondary)]">
              Configuração das Unidades Integradas e Bancas Examinadoras
            </p>
            <button onClick={triggerCreateInstitution} className="sp-btn sp-btn-primary gap-2">
              <i className="ti ti-plus text-sm"></i>
              Nova Instituição
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instituicoes.map(inst => (
              <div key={inst.id} className="sp-card flex flex-col justify-between hover:shadow-[var(--shadow-md)]">
                <div>
                  <div className="flex items-start gap-3.5 pb-4 border-b border-[var(--color-border-light)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-black text-sm border border-[var(--color-border)]">
                      {inst.sigla.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Unidade Cadastrada</span>
                      <h3 className="font-extrabold text-sm text-[var(--color-text-primary)] mt-0.5 truncate" title={inst.nome}>{inst.nome}</h3>
                      <p className="font-mono text-xs text-[var(--color-text-secondary)] font-bold tracking-widest uppercase">{inst.sigla}</p>
                    </div>
                  </div>
                  <div className="py-4 text-xs space-y-2">
                    <p className="flex justify-between">
                      <span className="font-semibold text-[var(--color-text-muted)]">CNPJ Corporativo:</span>
                      <span className="font-mono font-bold text-[var(--color-text-primary)]">{inst.cnpj}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-[var(--color-text-muted)]">Responsável Legal:</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{inst.responsavel}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-[var(--color-text-muted)]">E-mail de Contato:</span>
                      <span className="font-medium text-[var(--color-primary)] truncate max-w-[200px]" title={inst.emailContato}>{inst.emailContato}</span>
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--color-border-light)] flex justify-end">
                  <button
                    onClick={() => triggerEditInstitution(inst)}
                    className="sp-btn sp-btn-secondary gap-1.5 text-xs"
                    title="Editar informações desta instituição"
                  >
                    <i className="ti ti-edit text-sm"></i>
                    Editar Unidade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA CONFIGURAÇÕES ── */}
      {activeTab === 'configuracoes' && (
        <form onSubmit={handleSaveConfigs} className="space-y-6 animate-fade-in" id="tab-window-configuracoes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Aparência */}
            <div className="sp-card space-y-4">
              <h3 className="text-sm font-black text-[var(--color-text-primary)] border-b border-[var(--color-border-light)] pb-2 flex items-center gap-1.5">
                <i className="ti ti-palette text-[var(--color-primary)]"></i>
                Aparência do Sistema
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="cfg-sysname">Nome Principal do Sistema</label>
                  <input id="cfg-sysname" type="text" required value={configSystemName}
                    onChange={(e) => setConfigSystemName(e.target.value)} className="w-full sp-input" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cfg-color">Cor Primária</label>
                  <select id="cfg-color" value={configPrimaryColor} onChange={(e) => setConfigPrimaryColor(e.target.value)} className="w-full sp-input">
                    <option value="azul">Azul Clássico</option>
                    <option value="verde">Verde Institucional</option>
                    <option value="roxo">Roxo</option>
                    <option value="vermelho">Vermelho</option>
                  </select>
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <label htmlFor="cfg-palette-toggle" className="block">Tema do Sistema</label>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Ativar modo escuro</span>
                  </div>
                  <button
                    id="cfg-palette-toggle"
                    type="button"
                    onClick={() => setConfigIsDark(!configIsDark)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${configIsDark ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${configIsDark ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                      <i className={`text-[10px] ${configIsDark ? 'ti ti-moon text-[var(--color-primary)]' : 'ti ti-sun text-amber-500'}`}></i>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Parâmetros */}
            <div className="sp-card space-y-4">
              <h3 className="text-sm font-black text-[var(--color-text-primary)] border-b border-[var(--color-border-light)] pb-2 flex items-center gap-1.5">
                <i className="ti ti-adjustments-alt text-[var(--color-primary)]"></i>
                Parâmetros das Notas
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="cfg-escala">Escala das Notas</label>
                    <select id="cfg-escala" value={escalaNotas} onChange={(e) => setEscalaNotas(e.target.value)} className="w-full sp-input">
                      <option value="0-10">0 a 10</option>
                      <option value="0-100">0 a 100</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cfg-casas">Casas Decimais</label>
                    <select id="cfg-casas" value={casasDecimais} onChange={(e) => setCasasDecimais(e.target.value)} className="w-full sp-input">
                      <option value="1">1 casa (8.4)</option>
                      <option value="2">2 casas (8.45)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Critérios de Desempate
                  </span>
                  <div className="bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] p-3 space-y-2">
                    {criteriosDesempate.map((crit, index) => (
                      <div key={index} className="bg-[var(--color-white)] rounded-md border border-[var(--color-border-light)] p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-text-muted)] cursor-grab"><i className="ti ti-grip-vertical"></i></span>
                          <span className="font-bold text-[var(--color-text-muted)] text-[10px] font-mono">#{index + 1}</span>
                          <span className="font-semibold text-[var(--color-text-primary)]">{crit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={index === 0} onClick={() => moveCriteria(index, 'up')}
                            className="p-1 rounded-sm cursor-pointer disabled:opacity-20 hover:bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                            <i className="ti ti-chevron-up"></i>
                          </button>
                          <button type="button" disabled={index === criteriosDesempate.length - 1} onClick={() => moveCriteria(index, 'down')}
                            className="p-1 rounded-sm cursor-pointer disabled:opacity-20 hover:bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                            <i className="ti ti-chevron-down"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-4 sp-card">
            <button type="submit" className="sp-btn sp-btn-primary gap-2" id="salvar-configuracoes-btn">
              <i className="ti ti-checkbox"></i>
              Salvar Configurações
            </button>
          </div>
        </form>
      )}

      {/* ── ABA PERMISSÕES ── */}
      {activeTab === 'permissoes' && (
        <div className="space-y-4 animate-fade-in" id="tab-window-permissoes">
          <div className="sp-card">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Gerencie a matriz de controle de acessos (RBAC) vinculados aos módulos operacionais do SelectPro.
            </p>
          </div>

          <div className="sp-table-container">
            <div className="overflow-x-auto">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '160px' }}>Perfil</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Editais</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Candidatos</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Avaliações</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Convocações</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Auditoria</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(permissoes).map(perfil => {
                    const modData = permissoes[perfil] || {};
                    return (
                      <tr key={perfil}>
                        <td>
                          <strong className="text-[var(--color-text-primary)] text-xs block">{perfil}</strong>
                          <span className="text-[9px] text-[var(--color-text-muted)]">Nível de privilégios</span>
                        </td>
                        {['Editais', 'Candidatos', 'Avaliacoes', 'Convocacoes', 'Auditoria'].map(modKey => {
                          const actions = modData[modKey] || { visualizar: false, criar: false, editar: false, publicar: false };
                          return (
                            <td key={modKey} style={{ verticalAlign: 'top' }}>
                              <div className="space-y-1.5 max-w-[140px] mx-auto text-[10px]">
                                {(['visualizar', 'criar', 'editar', 'publicar'] as const).map(acao => (
                                  <label key={acao} className="flex items-center gap-1.5 cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] normal-case tracking-normal font-normal" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                                    <input type="checkbox" checked={actions[acao]} onChange={() => handlePermissionToggle(perfil, modKey, acao)}
                                      className="rounded border-slate-300 accent-[var(--color-primary)] h-3 w-3 cursor-pointer" />
                                    <span>{acao.charAt(0).toUpperCase() + acao.slice(1)}</span>
                                  </label>
                                ))}
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

          <div className="flex justify-end p-4 sp-card">
            <button onClick={handleSavePermissoes} className="sp-btn sp-btn-primary gap-2" id="salvar-permissoes-btn">
              <i className="ti ti-shield-check"></i>
              Salvar Permissões
            </button>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════
          MODAIS
          ════════════════════════════════════════════════ */}

      {/* MODAL 1 — Cadastrar Novo Usuário */}
      {modalType === 'create_user' && (
        <div className="sp-modal-overlay" id="modal-container-create-user">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container" style={{ maxWidth: '480px' }}>

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-user-plus" style={{ color: 'var(--color-primary)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Adicionar Novo Usuário</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit}>
              <div className="sp-modal-body space-y-4">

                <div className="space-y-1.5">
                  <label htmlFor="modal-usr-nome">Nome Completo *</label>
                  <input id="modal-usr-nome" type="text" required placeholder="Ex: Douglas Souza de Almeida"
                    value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-usr-email">E-mail Institucional *</label>
                  <input id="modal-usr-email" type="email" required placeholder="Ex: d.souza@faurgs.br"
                    value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-usr-profile">Perfil de Acesso</label>
                    <select id="modal-usr-profile" value={userProfile} onChange={(e) => setUserProfile(e.target.value)} className="w-full sp-input">
                      {PROFILE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="modal-usr-inst">Instituição Vinculada</label>
                    <select id="modal-usr-inst" value={userInstitution} onChange={(e) => setUserInstitution(e.target.value)} className="w-full sp-input">
                      {instituicoes.map(i => <option key={i.id} value={i.sigla}>{i.sigla}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-usr-temppass" style={{ marginBottom: 0 }}>Senha Temporária</label>
                    <button type="button" onClick={handleGeneratePassword}
                      className="text-[10px] font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
                      style={{ color: 'var(--color-primary)' }}>
                      <i className="ti ti-refresh text-[9px]"></i>
                      Gerar Aleatória
                    </button>
                  </div>
                  <input id="modal-usr-temppass" type="text" required value={userTempPass}
                    onChange={(e) => setUserTempPass(e.target.value)} className="w-full sp-input font-mono font-bold" />
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Repasse esta senha ao titular para o primeiro login.
                  </p>
                </div>

              </div>
              <div className="sp-modal-footer">
                <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
                <button type="submit" className="sp-btn sp-btn-primary" id="salvar-novo-usuario-btn">
                  Gravar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 — Editar Usuário */}
      {modalType === 'edit_user' && selectedUser && (
        <div className="sp-modal-overlay" id="modal-container-edit-user">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container" style={{ maxWidth: '480px' }}>

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-edit" style={{ color: 'var(--color-primary)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Editar Informações do Operador</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditUser}>
              <div className="sp-modal-body space-y-4">

                <div className="space-y-1.5">
                  <label htmlFor="edit-usr-nome">Nome Completo *</label>
                  <input id="edit-usr-nome" type="text" required value={editName}
                    onChange={(e) => setEditName(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-usr-email">E-mail Institucional *</label>
                  <input id="edit-usr-email" type="email" required value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-usr-profile">Perfil de Acesso</label>
                    <select id="edit-usr-profile" value={editProfile} onChange={(e) => setEditProfile(e.target.value)} className="w-full sp-input">
                      {PROFILE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-usr-inst">Instituição Vinculada</label>
                    <select id="edit-usr-inst" value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} className="w-full sp-input">
                      {instituicoes.map(i => <option key={i.id} value={i.sigla}>{i.sigla}</option>)}
                    </select>
                  </div>
                </div>

              </div>
              <div className="sp-modal-footer">
                <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
                <button type="submit" className="sp-btn sp-btn-primary" id="salvar-edicao-usuario-btn">
                  Gravar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 — Redefinir Senha */}
      {modalType === 'redefine_password' && selectedUser && (
        <div className="sp-modal-overlay" id="modal-container-redefine-pass">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container sp-modal-container-sm">

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-lock" style={{ color: 'var(--color-warning)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Redefinir Senha</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <div className="sp-modal-body space-y-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto border-2 border-dashed border-amber-300">
                  <i className="ti ti-key-off text-2xl text-amber-500"></i>
                </div>
                <p className="font-bold text-[var(--color-text-primary)]">Redefinir credenciais de {selectedUser.nome}?</p>
                <p className="text-[var(--color-text-muted)] text-[11px]">
                  Uma nova senha temporária será enviada ao e-mail institucional.
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-center space-y-1">
                <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Nova senha temporária:</p>
                <code className="text-sm font-mono font-black text-slate-900 px-2 py-0.5 rounded bg-amber-100 block select-all">
                  {generatedTempPass}
                </code>
                <p className="text-[9px] text-amber-600">Copie a senha para informar ao operador se necessário.</p>
              </div>
            </div>

            <div className="sp-modal-footer">
              <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
              <button type="button" onClick={confirmRedefinePassword}
                className="sp-btn" style={{ backgroundColor: 'var(--color-warning)', color: '#1a2e1f', fontWeight: 700 }}>
                Confirmar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4 — Confirmar Alteração de Status */}
      {modalType === 'toggle_status_confirm' && selectedUser && (
        <div className="sp-modal-overlay" id="modal-container-status-confirm">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container sp-modal-container-sm">

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-alert-triangle" style={{ color: 'var(--color-danger)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Confirmar Alteração de Status</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <div className="sp-modal-body space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)] text-center leading-relaxed">
                Deseja alterar o status de <strong className="text-[var(--color-text-primary)]">{selectedUser.nome}</strong> para{' '}
                <strong className="px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[10px]">
                  {selectedUser.status === 'Ativo' ? 'Inativo' : 'Ativo'}
                </strong>?
              </p>
              {selectedUser.status === 'Ativo' && (
                <div className="sp-alert sp-alert-danger text-xs">
                  <i className="sp-alert-icon ti ti-info-circle"></i>
                  <span className="sp-alert-text">
                    Este operador perderá acesso imediato a todas as funcionalidades do SelectPro.
                  </span>
                </div>
              )}
            </div>

            <div className="sp-modal-footer">
              <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
              <button type="button" onClick={confirmStatusToggle}
                className={`sp-btn ${selectedUser.status === 'Ativo' ? 'sp-btn-danger' : 'sp-btn-primary'}`}
                id="confirm-alterar-status-btn">
                Sim, Alterar Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5 — Nova Instituição */}
      {modalType === 'create_institution' && (
        <div className="sp-modal-overlay" id="modal-container-create-inst">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container" style={{ maxWidth: '480px' }}>

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-building" style={{ color: 'var(--color-primary)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Adicionar Nova Instituição</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleCreateInstitution}>
              <div className="sp-modal-body space-y-4">

                <div className="space-y-1.5">
                  <label htmlFor="modal-inst-nome">Nome de Cadastro Integral *</label>
                  <input id="modal-inst-nome" type="text" required placeholder="Ex: Empresa Pública de Seleção"
                    value={instNome} onChange={(e) => setInstNome(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-inst-sigla">Sigla *</label>
                    <input id="modal-inst-sigla" type="text" required maxLength={10} placeholder="Ex: EPSP"
                      value={instSigla} onChange={(e) => setInstSigla(e.target.value)}
                      className="w-full sp-input text-center font-mono font-black" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="modal-inst-cnpj">CNPJ *</label>
                    <input id="modal-inst-cnpj" type="text" required placeholder="xx.xxx.xxx/xxxx-xx"
                      value={instCnpj} onChange={(e) => setInstCnpj(e.target.value)} className="w-full sp-input font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-inst-resp">Responsável Legal</label>
                  <input id="modal-inst-resp" type="text" placeholder="Ex: Dr. Antenor de Moraes Ribeiro"
                    value={instResponsavel} onChange={(e) => setInstResponsavel(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-inst-contact-email">E-mail para Comunicados</label>
                  <input id="modal-inst-contact-email" type="email" placeholder="Ex: concursos@instituicao.org"
                    value={instEmail} onChange={(e) => setInstEmail(e.target.value)} className="w-full sp-input" />
                </div>

              </div>
              <div className="sp-modal-footer">
                <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
                <button type="submit" className="sp-btn sp-btn-primary" id="salvar-nova-instituicao-btn">
                  Gravar Instituição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6 — Editar Instituição */}
      {modalType === 'edit_institution' && selectedInstitution && (
        <div className="sp-modal-overlay" id="modal-container-edit-inst">
          <div className="fixed inset-0" onClick={closeModal}></div>
          <div className="sp-modal-container" style={{ maxWidth: '480px' }}>

            <div className="sp-modal-header">
              <div className="flex items-center gap-2">
                <i className="ti ti-edit" style={{ color: 'var(--color-primary)', fontSize: '16px' }}></i>
                <h3 className="sp-modal-title">Editar Instituição — {selectedInstitution.sigla}</h3>
              </div>
              <button onClick={closeModal} className="sp-modal-close" aria-label="Fechar modal">
                <i className="ti ti-x text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditInstitution}>
              <div className="sp-modal-body space-y-4">

                <div className="space-y-1.5">
                  <label htmlFor="edit-inst-nome">Nome Integral *</label>
                  <input id="edit-inst-nome" type="text" required value={instNome}
                    onChange={(e) => setInstNome(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-inst-sigla">Sigla *</label>
                    <input id="edit-inst-sigla" type="text" required maxLength={10} value={instSigla}
                      onChange={(e) => setInstSigla(e.target.value)}
                      className="w-full sp-input text-center font-mono font-black" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="edit-inst-cnpj">CNPJ *</label>
                    <input id="edit-inst-cnpj" type="text" required value={instCnpj}
                      onChange={(e) => setInstCnpj(e.target.value)} className="w-full sp-input font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-inst-resp">Responsável Legal</label>
                  <input id="edit-inst-resp" type="text" value={instResponsavel}
                    onChange={(e) => setInstResponsavel(e.target.value)} className="w-full sp-input" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-inst-contact">E-mail para Comunicados</label>
                  <input id="edit-inst-contact" type="email" value={instEmail}
                    onChange={(e) => setInstEmail(e.target.value)} className="w-full sp-input" />
                </div>

              </div>
              <div className="sp-modal-footer">
                <button type="button" onClick={closeModal} className="sp-btn sp-btn-secondary">Cancelar</button>
                <button type="submit" className="sp-btn sp-btn-primary" id="salvar-edicao-instituicao-btn">
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
