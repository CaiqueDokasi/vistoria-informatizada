/**
 * Vistoria Informatizada - Módulo de Autenticação e Sessão (CSS/JS Puro)
 * Compartilhado por todas as telas do sistema.
 */

const AUTH = {
  STORAGE_KEY: 'usuarioLogado',

  /**
   * Retorna os dados do usuário autenticado ou null
   */
  getUsuario() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erro ao ler usuário do localStorage', e);
      return null;
    }
  },

  /**
   * Salva os dados do usuário após o login
   */
  salvarUsuario(usuario) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usuario));
  },

  /**
   * Remove o usuário da sessão
   */
  removerUsuario() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /**
   * Finaliza a sessão e redireciona para a tela de login
   */
  logout() {
    this.removerUsuario();
    window.location.href = 'login.html';
  },

  /**
   * Guarda de rota: exige que haja um usuário logado.
   * Se não houver, redireciona para a tela de login.
   */
  exigirAutenticacao() {
    const usuario = this.getUsuario();
    if (!usuario) {
      window.location.href = 'login.html';
      return null;
    }
    return usuario;
  },

  /**
   * Guarda de cargo: exige que o usuário tenha um dos cargos permitidos.
   * Exemplo: AUTH.exigirCargo(['Analista'])
   */
  exigirCargo(cargosPermitidos = []) {
    const usuario = this.exigirAutenticacao();
    if (!usuario) return null;

    const lista = Array.isArray(cargosPermitidos) ? cargosPermitidos : [cargosPermitidos];
    const cargoUsuario = (usuario.cargo || '').toLowerCase();
    const permitido = lista.some(c => c.toLowerCase() === cargoUsuario);

    if (!permitido) {
      alert(`Acesso negado: seu cargo (${usuario.cargo}) não tem permissão para acessar esta página.`);
      window.location.href = 'vistorias.html';
      return null;
    }

    return usuario;
  },

  /**
   * Renderiza dinamicamente a barra de navegação no elemento #navbar-container
   * @param {string} paginaAtiva 'vistorias' | 'ocorrencias' | 'usuarios'
   */
  renderNavbar(paginaAtiva = '') {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    const usuario = this.getUsuario();
    if (!usuario) return;

    const isAnalista = (usuario.cargo || '').toLowerCase() === 'analista';
    const roleBadgeClass = isAnalista ? 'badge-analista' : 'badge-operador';

    container.innerHTML = `
      <nav class="navbar">
        <div class="container navbar-inner">
          <a href="vistorias.html" class="navbar-brand">
            <span class="navbar-brand-icon">V</span>
            <span>Vistoria Informatizada</span>
          </a>

          <ul class="navbar-menu">
            <li>
              <a href="vistorias.html" class="${paginaAtiva === 'vistorias' ? 'active' : ''}">Vistorias</a>
            </li>
            <li>
              <a href="/ocorrencias.html" class="${paginaAtiva === 'ocorrencias' ? 'active' : ''}">Ocorrências</a>
            </li>
            ${isAnalista ? `
              <li>
                <a href="/usuarios.html" class="${paginaAtiva === 'usuarios' ? 'active' : ''}">Usuários</a>
              </li>
            ` : ''}
          </ul>

          <div class="navbar-user">
            <div class="user-badge">
              <span class="user-badge-name">${usuario.nome || usuario.email}</span>
              <span class="badge ${roleBadgeClass}">${usuario.cargo || 'Usuário'}</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline" id="btn-logout-nav" title="Encerrar sessão">
              Sair
            </button>
          </div>
        </div>
      </nav>
    `;

    // Event listener do botão Sair
    const btnLogout = document.getElementById('btn-logout-nav');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.logout());
    }
  }
};

window.AUTH = AUTH;
