/**
 * Lógica da tela de Gestão de Usuários (usuarios.html) — sem Bootstrap
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Valida cargo Analista
  const usuarioLogado = AUTH.exigirCargo(['Analista']);
  if (!usuarioLogado) return;

  // 2. Exibe nome no header e botão Sair
  const nomeEl = document.getElementById('nomeUsuarioHeader');
  if (nomeEl) nomeEl.textContent = `${usuarioLogado.nome} (${usuarioLogado.cargo})`;
  document.getElementById('btnSair').addEventListener('click', () => AUTH.logout());

  // Elementos DOM
  const tabelaCorpo = document.getElementById('tabela-usuarios-corpo');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const alertaFeedback = document.getElementById('alerta-feedback');
  const inputBusca = document.getElementById('input-busca');

  // Modal criar/editar
  const modalBackdrop = document.getElementById('modal-usuario-backdrop');
  const formUsuario = document.getElementById('form-usuario');
  const modalTitulo = document.getElementById('modal-usuario-titulo');
  const modalErro = document.getElementById('modal-usuario-erro');
  const inputId = document.getElementById('usuario-id');
  const inputNome = document.getElementById('usuario-nome');
  const inputEmail = document.getElementById('usuario-email');
  const inputSenha = document.getElementById('usuario-senha');
  const selectCargo = document.getElementById('usuario-cargo');
  const btnSalvar = document.getElementById('btn-salvar-usuario');
  const btnCancelar = document.getElementById('btn-cancelar-usuario');

  // Modal exclusão
  const modalExcluirBackdrop = document.getElementById('modal-excluir-backdrop');
  const modalExcluirTexto = document.getElementById('modal-excluir-texto');
  const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
  const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');

  let listaUsuarios = [];
  let listaCargos = [];
  let usuarioParaExcluir = null;

  // --- Feedback ---
  function mostrarFeedback(mensagem, tipo = 'sucesso') {
    alertaFeedback.className = `alerta alerta-${tipo}`;
    alertaFeedback.textContent = mensagem;
    alertaFeedback.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => alertaFeedback.classList.add('oculto'), 5000);
  }

  // --- Modal criar/editar ---
  function abrirModal(titulo) {
    modalTitulo.textContent = titulo;
    modalErro.classList.add('oculto');
    modalBackdrop.classList.add('ativo');
  }

  function fecharModal() {
    modalBackdrop.classList.remove('ativo');
    formUsuario.reset();
  }

  btnCancelar.addEventListener('click', fecharModal);

  function mostrarErroModal(msg) {
    modalErro.textContent = msg;
    modalErro.classList.remove('oculto');
  }

  // --- Modal exclusão ---
  function abrirModalExclusao(user) {
    usuarioParaExcluir = user;
    modalExcluirTexto.textContent = `Deseja excluir o usuário "${user.nome}"? Esta ação não pode ser desfeita.`;
    modalExcluirBackdrop.classList.add('ativo');
  }

  function fecharModalExclusao() {
    modalExcluirBackdrop.classList.remove('ativo');
    usuarioParaExcluir = null;
  }

  btnCancelarExclusao.addEventListener('click', fecharModalExclusao);

  // --- Escape para fechar modais ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fecharModal(); fecharModalExclusao(); }
  });

  // --- Carregar cargos ---
  async function carregarCargos() {
    const res = await fetch('/api/cargos');
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao carregar cargos.');
    listaCargos = dados;
    selectCargo.innerHTML = listaCargos.map(
      (c) => `<option value="${c.id}">${c.nome}</option>`
    ).join('');
  }

  // --- Carregar usuários ---
  async function carregarUsuarios() {
    estadoCarregando.classList.remove('oculto');
    tabelaCorpo.innerHTML = '';
    estadoVazio.classList.add('oculto');

    try {
      const res = await fetch('/api/usuarios');
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Erro ao carregar usuários.');

      listaUsuarios = dados;
      renderizarTabela(listaUsuarios);
    } catch (erro) {
      mostrarFeedback(`Não foi possível carregar os usuários. ${erro.message}`, 'erro');
    } finally {
      estadoCarregando.classList.add('oculto');
    }
  }

  function escapar(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function badgeCargo(cargo) {
    const c = (cargo || '').toLowerCase();
    if (c === 'analista') return `<span class="badge-analista">${escapar(cargo)}</span>`;
    return `<span class="badge-operador">${escapar(cargo)}</span>`;
  }

  // --- Renderizar tabela ---
  function renderizarTabela(lista) {
    if (lista.length === 0) {
      tabelaCorpo.innerHTML = '';
      estadoVazio.classList.remove('oculto');
      return;
    }
    estadoVazio.classList.add('oculto');

    tabelaCorpo.innerHTML = '';
    lista.forEach((user) => {
      const ehProprio = user.id === usuarioLogado.id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${escapar(user.nome)}</td>
        <td>${escapar(user.email)}</td>
        <td>${badgeCargo(user.cargo)}</td>
        <td class="cabecalho-acoes">
          <div class="acoes-linha acoes-finalizadas">
            <button class="btn btn-pequeno btn-editar">✏️ Editar</button>
            ${!ehProprio ? `<button class="btn btn-perigo btn-pequeno btn-excluir">🗑️ Excluir</button>` : ''}
          </div>
        </td>`;

      tr.querySelector('.btn-editar').addEventListener('click', () => editarUsuario(user));
      const btnEx = tr.querySelector('.btn-excluir');
      if (btnEx) btnEx.addEventListener('click', () => abrirModalExclusao(user));

      tabelaCorpo.appendChild(tr);
    });
  }

  // --- Editar ---
  function editarUsuario(user) {
    inputId.value = user.id;
    inputNome.value = user.nome;
    inputEmail.value = user.email;
    inputSenha.value = '';
    inputSenha.placeholder = 'Nova senha (obrigatório)';
    document.getElementById('senha-ajuda').textContent = 'Informe a nova senha para alterar.';
    selectCargo.value = user.id_cargo;
    abrirModal(`Editar Usuário #${user.id}`);
  }

  // --- Novo ---
  document.getElementById('btn-novo-usuario').addEventListener('click', () => {
    formUsuario.reset();
    inputId.value = '';
    inputSenha.placeholder = 'Mínimo 6 caracteres';
    document.getElementById('senha-ajuda').textContent = 'Senha de acesso inicial do usuário.';
    abrirModal('Novo Usuário');
  });

  // --- Filtro de busca ---
  inputBusca.addEventListener('input', () => {
    const termo = inputBusca.value.trim().toLowerCase();
    if (!termo) { renderizarTabela(listaUsuarios); return; }
    const filtrados = listaUsuarios.filter((u) =>
      (u.nome || '').toLowerCase().includes(termo) ||
      (u.email || '').toLowerCase().includes(termo) ||
      (u.cargo || '').toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
  });

  // --- Submissão do form ---
  formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalErro.classList.add('oculto');

    const id = inputId.value;
    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    const idCargo = Number(selectCargo.value);

    if (!nome || !email || !idCargo || !senha) {
      mostrarErroModal('Preencha todos os campos obrigatórios.');
      return;
    }

    const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
    const metodo = id ? 'PUT' : 'POST';

    try {
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Salvando...';
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, idCargo })
      });
      const dados = await res.json();
      if (!res.ok) { mostrarErroModal(dados.erro || 'Falha ao salvar.'); return; }

      fecharModal();
      mostrarFeedback(id ? 'Usuário atualizado com sucesso!' : 'Novo usuário cadastrado!');
      await carregarUsuarios();
    } catch (err) {
      mostrarErroModal('Erro de comunicação com o servidor.');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar Usuário';
    }
  });

  // --- Confirmar exclusão ---
  btnConfirmarExclusao.addEventListener('click', async () => {
    if (!usuarioParaExcluir) return;
    try {
      btnConfirmarExclusao.disabled = true;
      btnConfirmarExclusao.textContent = 'Excluindo...';
      const res = await fetch(`/api/usuarios/${usuarioParaExcluir.id}`, { method: 'DELETE' });
      const dados = await res.json();
      if (!res.ok) { mostrarFeedback(dados.erro || 'Falha ao excluir.', 'erro'); return; }
      fecharModalExclusao();
      mostrarFeedback('Usuário excluído com sucesso!');
      await carregarUsuarios();
    } catch (err) {
      mostrarFeedback('Erro ao conectar ao servidor.', 'erro');
    } finally {
      btnConfirmarExclusao.disabled = false;
      btnConfirmarExclusao.textContent = 'Sim, Excluir';
    }
  });

  // Inicialização
  try {
    await Promise.all([carregarCargos(), carregarUsuarios()]);
  } catch (erro) {
    mostrarFeedback(`Não foi possível carregar os cargos. ${erro.message}`, 'erro');
  }
});
