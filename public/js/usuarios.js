/**
 * Lógica da tela de Gestão de Usuários (Exclusivo Analista)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Valida se o usuário tem perfil de Analista
  const usuarioLogado = AUTH.exigirCargo(['Analista']);
  if (!usuarioLogado) return;

  // 2. Renderiza a barra de navegação superior
  AUTH.renderNavbar('usuarios');

  // Elementos do DOM
  const tabelaCorpo = document.getElementById('tabela-usuarios-corpo');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const alertaFeedback = document.getElementById('alerta-feedback');
  const inputBusca = document.getElementById('input-busca');

  // Modais e formulários
  const modalUsuarioBackdrop = document.getElementById('modal-usuario-backdrop');
  const formUsuario = document.getElementById('form-usuario');
  const modalUsuarioTitulo = document.getElementById('modal-usuario-titulo');
  const modalErro = document.getElementById('modal-erro');
  const inputId = document.getElementById('usuario-id');
  const inputNome = document.getElementById('usuario-nome');
  const inputEmail = document.getElementById('usuario-email');
  const inputSenha = document.getElementById('usuario-senha');
  const selectCargo = document.getElementById('usuario-cargo');
  const btnSalvarUsuario = document.getElementById('btn-salvar-usuario');

  // Modal Exclusão
  const modalExclusaoBackdrop = document.getElementById('modal-exclusao-backdrop');
  const exclusaoNome = document.getElementById('exclusao-nome');
  const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');

  let listaUsuarios = [];
  let listaCargos = [];
  let usuarioParaExcluir = null;

  // Feedback global na página
  function mostrarFeedback(mensagem, tipo = 'success') {
    alertaFeedback.className = `alert alert-${tipo}`;
    alertaFeedback.textContent = mensagem;
    alertaFeedback.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      alertaFeedback.classList.add('d-none');
    }, 5000);
  }

  function mostrarErroModal(mensagem) {
    modalErro.textContent = mensagem;
    modalErro.classList.remove('d-none');
  }

  function esconderErroModal() {
    modalErro.textContent = '';
    modalErro.classList.add('d-none');
  }

  // Controle dos modais
  function abrirModalUsuario(titulo = 'Novo Usuário') {
    esconderErroModal();
    modalUsuarioTitulo.textContent = titulo;
    modalUsuarioBackdrop.classList.add('show');
  }

  function fecharModalUsuario() {
    modalUsuarioBackdrop.classList.remove('show');
    formUsuario.reset();
    inputId.value = '';
    esconderErroModal();
  }

  function abrirModalExclusao(usuario) {
    usuarioParaExcluir = usuario;
    exclusaoNome.textContent = `${usuario.nome} (${usuario.email})`;
    modalExclusaoBackdrop.classList.add('show');
  }

  function fecharModalExclusao() {
    usuarioParaExcluir = null;
    modalExclusaoBackdrop.classList.remove('show');
  }

  // Eventos de fechar modal
  document.getElementById('btn-fechar-modal-x').addEventListener('click', fecharModalUsuario);
  document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModalUsuario);
  document.getElementById('btn-fechar-exclusao-x').addEventListener('click', fecharModalExclusao);
  document.getElementById('btn-cancelar-exclusao').addEventListener('click', fecharModalExclusao);

  // Fechar ao clicar fora do conteúdo
  modalUsuarioBackdrop.addEventListener('click', (e) => {
    if (e.target === modalUsuarioBackdrop) fecharModalUsuario();
  });
  modalExclusaoBackdrop.addEventListener('click', (e) => {
    if (e.target === modalExclusaoBackdrop) fecharModalExclusao();
  });

  // 3. Buscar cargos da API
  async function carregarCargos() {
    try {
      const res = await fetch('/api/cargos');
      if (!res.ok) throw new Error('Falha ao carregar lista de cargos');
      listaCargos = await res.json();

      selectCargo.innerHTML = '<option value="">Selecione um cargo...</option>';
      listaCargos.forEach((cargo) => {
        const opt = document.createElement('option');
        opt.value = cargo.id;
        opt.textContent = cargo.nome;
        selectCargo.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      mostrarFeedback('Não foi possível obter a lista de cargos.', 'danger');
    }
  }

  // 4. Buscar usuários da API
  async function carregarUsuarios() {
    estadoCarregando.classList.remove('d-none');
    tabelaCorpo.innerHTML = '';
    estadoVazio.classList.add('d-none');

    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Falha ao buscar usuários');
      listaUsuarios = await res.json();
      renderizarTabela(listaUsuarios);
    } catch (err) {
      console.error(err);
      mostrarFeedback('Erro ao conectar ao servidor para carregar usuários.', 'danger');
    } finally {
      estadoCarregando.classList.add('d-none');
    }
  }

  // 5. Renderizar tabela de usuários
  function renderizarTabela(usuarios) {
    tabelaCorpo.innerHTML = '';

    if (usuarios.length === 0) {
      estadoVazio.classList.remove('d-none');
      return;
    }
    estadoVazio.classList.add('d-none');

    usuarios.forEach((user) => {
      const tr = document.createElement('tr');
      const isAnalista = (user.cargo || '').toLowerCase() === 'analista';
      const badgeClass = isAnalista ? 'badge-analista' : 'badge-operador';
      const ehProprioUsuario = user.id === usuarioLogado.id;

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-weight: 500;">#${user.id}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(user.nome)}</div>
          ${ehProprioUsuario ? '<span style="font-size: 0.75rem; color: var(--primary);">(Você)</span>' : ''}
        </td>
        <td style="color: var(--text-muted);">${escapeHtml(user.email)}</td>
        <td>
          <span class="badge ${badgeClass}">${escapeHtml(user.cargo)}</span>
        </td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button
              type="button"
              class="btn btn-sm btn-outline btn-editar"
              data-id="${user.id}"
              title="Editar dados"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger btn-excluir"
              data-id="${user.id}"
              ${ehProprioUsuario ? 'disabled title="Você não pode excluir sua própria conta"' : 'title="Excluir usuário"'}
            >
              Excluir
            </button>
          </div>
        </td>
      `;

      // Evento de Editar
      tr.querySelector('.btn-editar').addEventListener('click', () => {
        editarUsuario(user);
      });

      // Evento de Excluir
      if (!ehProprioUsuario) {
        tr.querySelector('.btn-excluir').addEventListener('click', () => {
          abrirModalExclusao(user);
        });
      }

      tabelaCorpo.appendChild(tr);
    });
  }

  // Prepara formulário para edição
  function editarUsuario(user) {
    inputId.value = user.id;
    inputNome.value = user.nome;
    inputEmail.value = user.email;
    inputSenha.value = '';
    inputSenha.placeholder = 'Digite uma nova senha para o usuário';
    inputSenha.required = true;
    document.getElementById('senha-ajuda').textContent = 'O backend requer confirmação ou nova senha para alterar o cadastro.';
    selectCargo.value = user.id_cargo;

    abrirModalUsuario(`Editar Usuário #${user.id}`);
  }

  // Prepara formulário para novo usuário
  document.getElementById('btn-novo-usuario').addEventListener('click', () => {
    formUsuario.reset();
    inputId.value = '';
    inputSenha.placeholder = 'Mínimo 6 caracteres';
    inputSenha.required = true;
    document.getElementById('senha-ajuda').textContent = 'Digite a senha de acesso inicial do usuário.';
    abrirModalUsuario('Novo Usuário');
  });

  // Filtro de busca em tempo real
  inputBusca.addEventListener('input', () => {
    const termo = inputBusca.value.trim().toLowerCase();
    if (!termo) {
      renderizarTabela(listaUsuarios);
      return;
    }

    const filtrados = listaUsuarios.filter((u) => {
      const nomeMatch = (u.nome || '').toLowerCase().includes(termo);
      const emailMatch = (u.email || '').toLowerCase().includes(termo);
      const cargoMatch = (u.cargo || '').toLowerCase().includes(termo);
      return nomeMatch || emailMatch || cargoMatch;
    });

    renderizarTabela(filtrados);
  });

  // 6. Submissão do formulário (Criar ou Atualizar)
  formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderErroModal();

    const id = inputId.value;
    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    const idCargo = Number(selectCargo.value);

    if (!nome || !email || !idCargo) {
      mostrarErroModal('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!senha) {
      mostrarErroModal('Por favor, informe a senha de acesso.');
      return;
    }

    const corpo = { nome, email, senha, idCargo };
    const ehEdicao = Boolean(id);
    const url = ehEdicao ? `/api/usuarios/${id}` : '/api/usuarios';
    const metodo = ehEdicao ? 'PUT' : 'POST';

    try {
      btnSalvarUsuario.disabled = true;
      btnSalvarUsuario.textContent = 'Salvando...';

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });

      const dados = await res.json();

      if (!res.ok) {
        mostrarErroModal(dados.erro || 'Falha ao salvar usuário.');
        btnSalvarUsuario.disabled = false;
        btnSalvarUsuario.textContent = 'Salvar Usuário';
        return;
      }

      fecharModalUsuario();
      mostrarFeedback(ehEdicao ? 'Usuário atualizado com sucesso!' : 'Novo usuário cadastrado com sucesso!');
      await carregarUsuarios();
    } catch (err) {
      console.error(err);
      mostrarErroModal('Erro de comunicação com o servidor.');
    } finally {
      btnSalvarUsuario.disabled = false;
      btnSalvarUsuario.textContent = 'Salvar Usuário';
    }
  });

  // 7. Confirmação de exclusão
  btnConfirmarExclusao.addEventListener('click', async () => {
    if (!usuarioParaExcluir) return;

    try {
      btnConfirmarExclusao.disabled = true;
      btnConfirmarExclusao.textContent = 'Excluindo...';

      const res = await fetch(`/api/usuarios/${usuarioParaExcluir.id}`, {
        method: 'DELETE'
      });

      const dados = await res.json();

      if (!res.ok) {
        mostrarFeedback(dados.erro || 'Falha ao excluir o usuário.', 'danger');
        fecharModalExclusao();
        return;
      }

      fecharModalExclusao();
      mostrarFeedback('Usuário excluído com sucesso!');
      await carregarUsuarios();
    } catch (err) {
      console.error(err);
      mostrarFeedback('Erro ao conectar ao servidor para excluir.', 'danger');
    } finally {
      btnConfirmarExclusao.disabled = false;
      btnConfirmarExclusao.textContent = 'Sim, Excluir';
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Inicialização
  await Promise.all([carregarCargos(), carregarUsuarios()]);
});
