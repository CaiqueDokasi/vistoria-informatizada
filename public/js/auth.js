/**
 * Vistoria Informatizada - Módulo de Autenticação e Sessão (CSS/JS Puro)
 * Compartilhado por todas as telas do sistema.
 */

const AUTH = {
  STORAGE_KEY: 'usuarioLogado',

  // Usuário padrão com permissões de Analista para visualização livre do design
  DEFAULT_USER: {
    id: 1,
    nome: 'Usuário Convidado (Preview)',
    email: 'analista@vistoria.com',
    cargo: 'Analista'
  },

  /**
   * Retorna os dados do usuário autenticado ou usuário de teste/preview
   */
  getUsuario() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.DEFAULT_USER;
    } catch (e) {
      console.error('Erro ao ler usuário do localStorage', e);
      return this.DEFAULT_USER;
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
    window.location.href = '/login.html';
  },

  /**
   * Guarda de rota: desativado para permitir navegação livre
   */
  exigirAutenticacao() {
    return this.getUsuario();
  },

  /**
   * Guarda de cargo: desativado para permitir navegação livre
   */
  exigirCargo(cargosPermitidos = []) {
    return this.getUsuario();
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
          <a href="/vistorias.html" class="navbar-brand">
            <span class="navbar-brand-icon">V</span>
            <span>Vistoria Informatizada</span>
          </a>

          <ul class="navbar-menu">
            <li>
              <a href="/vistorias.html" class="${paginaAtiva === 'vistorias' ? 'active' : ''}">Vistorias</a>
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
