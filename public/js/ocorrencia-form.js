// Lógica da tela de Cadastro / Edição de Ocorrência (ocorrencia-form.html)

let idEdicao = null;
let idVistoriaPadrao = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!iniciarBarraUsuario()) return;

  iniciarFormulario();
});

async function iniciarFormulario() {
  const parametros = new URLSearchParams(window.location.search);
  idEdicao = parametros.get('id');
  idVistoriaPadrao = parametros.get('idVistoria');

  atualizarLinksVoltar(idVistoriaPadrao);
  verificarPermissaoFormulario();

  await carregarVistoriasSelect();

  if (idEdicao) {
    document.getElementById('tituloFormulario').textContent = `Editar Ocorrência #${idEdicao}`;
    document.getElementById('btnSalvar').textContent = 'Salvar alterações';
    await carregarOcorrenciaParaEdicao(idEdicao);
  }

  document.getElementById('formOcorrencia').addEventListener('submit', aoEnviarFormulario);
  document.getElementById('btnAdicionarFoto').addEventListener('click', adicionarFoto);
}

function atualizarLinksVoltar(idVistoria) {
  const destino = idVistoria ? `vistoria-detalhes.html?id=${idVistoria}` : 'vistoria-detalhes.html';
  document.getElementById('btnVoltar').href = destino;
  document.getElementById('btnCancelar').href = destino;
}

// Verifica se o perfil atual pode registrar ocorrências (RF08 - Operador)
function verificarPermissaoFormulario() {
  const podeRegistrar = temPermissao('REGISTRAR_OCORRENCIAS');
  const btnSalvar = document.getElementById('btnSalvar');

  if (!podeRegistrar) {
    mostrarMensagem(
      'avisoPermissao',
      'Apenas usuários com perfil Operador podem cadastrar ou alterar ocorrências.',
      'info'
    );
    btnSalvar.disabled = true;
  } else {
    mostrarMensagem('avisoPermissao', '');
    btnSalvar.disabled = false;
  }
}

// Preenche o campo de vistoria usando GET /api/vistorias
async function carregarVistoriasSelect() {
  const select = document.getElementById('idVistoria');

  try {
    const resposta = await fetch('/api/vistorias');
    if (!resposta.ok) {
      throw new Error('Não foi possível carregar as vistorias.');
    }

    const vistorias = await resposta.json();
    select.innerHTML = '<option value="">Selecione uma vistoria...</option>';

    vistorias.forEach((v) => {
      const opcao = document.createElement('option');
      opcao.value = v.id;
      opcao.textContent = `#${v.id} - ${v.endereco} (${v.status})`;
      select.appendChild(opcao);
    });

    if (idVistoriaPadrao) {
      select.value = idVistoriaPadrao;
    } else if (!idEdicao && vistorias.length > 0) {
      select.value = String(vistorias[0].id);
      atualizarLinksVoltar(select.value);
    }

    select.addEventListener('change', () => {
      atualizarLinksVoltar(select.value);
    });
  } catch (erro) {
    select.innerHTML = '<option value="">Erro ao carregar vistorias</option>';
    mostrarMensagem('mensagemFeedback', erro.message);
  }
}

// Carrega os dados da ocorrência ao editar: GET /api/ocorrencias/:id
async function carregarOcorrenciaParaEdicao(id) {
  try {
    const resposta = await fetch(`/api/ocorrencias/${id}`);
    const oc = await resposta.json();

    if (!resposta.ok) {
      throw new Error(oc.erro || 'Ocorrência não encontrada.');
    }

    const selectVistoria = document.getElementById('idVistoria');
    selectVistoria.value = String(oc.id_vistoria);
    selectVistoria.disabled = true; // A rota PUT altera apenas classificação e descrição
    atualizarLinksVoltar(oc.id_vistoria);

    document.getElementById('classificacao').value = oc.classificacao;
    document.getElementById('descricao').value = oc.descricao;

    // No backend atual, PUT /api/ocorrencias/:id altera classificação e descrição
    document.getElementById('grupoFoto').classList.add('oculto');

    if (temPermissao('REGISTRAR_OCORRENCIAS')) {
      document.getElementById('secaoAdicionarFoto').classList.remove('oculto');
    }
    renderizarFotos(oc.fotos || []);
  } catch (erro) {
    document.getElementById('btnSalvar').disabled = true;
    mostrarMensagem('mensagemFeedback', erro.message);
  }
}

function renderizarFotos(fotos) {
  const divFotos = document.getElementById('fotosExistentes');
  divFotos.classList.remove('oculto');

  const itens = fotos.map((foto) => {
    const idFoto = Number(foto.id);
    const acaoRemover = temPermissao('REGISTRAR_OCORRENCIAS') && Number.isSafeInteger(idFoto)
      ? `<button type="button" class="btn btn-perigo btn-pequeno" data-remover-foto="${idFoto}">Remover</button>`
      : '';

    return `
      <div class="foto-item">
        <img src="${escaparHtml(foto.url_foto)}" alt="Foto da ocorrência" onerror="this.style.display='none'">
        <span><a href="${escaparHtml(foto.url_foto)}" target="_blank" rel="noopener">Abrir imagem</a></span>
        ${acaoRemover}
      </div>
    `;
  });

  divFotos.innerHTML = `
    <label>Fotos da ocorrência</label>
    ${itens.length
      ? `<div class="galeria-fotos">${itens.join('')}</div>`
      : '<p class="subtitulo">Nenhuma foto cadastrada para esta ocorrência.</p>'}
  `;

  divFotos.querySelectorAll('[data-remover-foto]').forEach((botao) => {
    botao.addEventListener('click', () => removerFoto(botao.dataset.removerFoto));
  });
}

async function adicionarFoto() {
  if (!idEdicao || !temPermissao('REGISTRAR_OCORRENCIAS')) {
    mostrarMensagem('mensagemFeedback', 'Você não tem permissão para adicionar fotos.');
    return;
  }

  const campoUrl = document.getElementById('novaUrlFoto');
  const urlFoto = campoUrl.value.trim();
  const botao = document.getElementById('btnAdicionarFoto');

  if (!urlFoto) {
    mostrarMensagem('mensagemFeedback', 'Informe o link da foto.');
    return;
  }
  if (!campoUrl.reportValidity()) return;

  botao.disabled = true;
  try {
    const resposta = await fetch(`/api/ocorrencias/${idEdicao}/fotos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlFoto })
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao adicionar foto.');
    }

    campoUrl.value = '';
    await carregarFotosOcorrencia();
    mostrarMensagem('mensagemFeedback', 'Foto adicionada com sucesso!', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagemFeedback', erro.message);
  } finally {
    botao.disabled = false;
  }
}

async function removerFoto(idFoto) {
  if (!temPermissao('REGISTRAR_OCORRENCIAS')) {
    mostrarMensagem('mensagemFeedback', 'Você não tem permissão para remover fotos.');
    return;
  }
  if (!confirm('Deseja realmente remover esta foto?')) return;

  try {
    const resposta = await fetch(`/api/ocorrencias/${idEdicao}/fotos/${idFoto}`, {
      method: 'DELETE'
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao remover foto.');
    }

    await carregarFotosOcorrencia();
    mostrarMensagem('mensagemFeedback', 'Foto removida com sucesso!', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagemFeedback', erro.message);
  }
}

async function carregarFotosOcorrencia() {
  const resposta = await fetch(`/api/ocorrencias/${idEdicao}`);
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Não foi possível carregar as fotos.');
  }
  renderizarFotos(dados.fotos || []);
}

// Envia POST /api/ocorrencias (novo) ou PUT /api/ocorrencias/:id (edição)
async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  mostrarMensagem('mensagemFeedback', '');

  if (!temPermissao('REGISTRAR_OCORRENCIAS')) {
    mostrarMensagem('mensagemFeedback', 'Você não tem permissão para registrar ocorrências.');
    return;
  }

  const idVistoria = document.getElementById('idVistoria').value;
  const classificacao = document.getElementById('classificacao').value;
  const descricao = document.getElementById('descricao').value.trim();
  const urlFoto = document.getElementById('urlFoto').value.trim();
  const usuario = obterUsuarioAtual();
  const btnSalvar = document.getElementById('btnSalvar');

  if (!idVistoria || !classificacao || !descricao) {
    mostrarMensagem('mensagemFeedback', 'Preencha vistoria, classificação e descrição.');
    return;
  }

  btnSalvar.disabled = true;

  try {
    let resposta;

    if (idEdicao) {
      resposta = await fetch(`/api/ocorrencias/${idEdicao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classificacao, descricao })
      });
    } else {
      resposta = await fetch('/api/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idVistoria: Number(idVistoria),
          idUsuarioCriador: usuario.id,
          classificacao,
          descricao,
          urlFoto: urlFoto || ''
        })
      });
    }

    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao salvar ocorrência.');
    }

    mostrarMensagem(
      'mensagemFeedback',
      idEdicao ? 'Ocorrência atualizada com sucesso!' : 'Ocorrência cadastrada com sucesso!',
      'sucesso'
    );

    setTimeout(() => {
      window.location.href = `vistoria-detalhes.html?id=${idVistoria}`;
    }, 800);
  } catch (erro) {
    btnSalvar.disabled = false;
    mostrarMensagem('mensagemFeedback', erro.message);
  }
}
