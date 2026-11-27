// Funções compartilhadas entre as telas do sistema

// Obtém o usuário logado do localStorage — redireciona para login se não houver nenhum
function obterUsuarioAtual() {
  const salvo = localStorage.getItem('usuarioLogado');
  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch (erro) {
      localStorage.removeItem('usuarioLogado');
    }
  }
  window.location.href = 'login.html';
  return null;
}

// Verifica se o usuário atual possui uma permissão específica
function temPermissao(permissao) {
  const usuario = obterUsuarioAtual();
  return Boolean(usuario && Array.isArray(usuario.permissoes) && usuario.permissoes.includes(permissao));
}

// Preenche a barra superior com a sessão autenticada
function iniciarBarraUsuario() {
  const nomeEl = document.getElementById('nomeUsuarioLogado');
  const usuario = obterUsuarioAtual();
  if (!usuario) return false;

  if (nomeEl) {
    nomeEl.textContent = `${usuario.nome} (${usuario.cargo})`;
  }

  // Botão Sair
  const btnSair = document.getElementById('btnSair');
  if (btnSair) {
    btnSair.addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });
  }

  // Link Usuários só para Analista
  const linkUsuarios = document.getElementById('linkUsuarios');
  if (linkUsuarios && (usuario.cargo || '').toLowerCase() === 'analista') {
    linkUsuarios.classList.remove('oculto');
  }

  return true;
}

// Formata "2026-11-22 10:30:00" para "22/11/2026 10:30"
function formatarData(textoData) {
  if (!textoData) return '-';
  const partes = textoData.split(' ');
  const data = partes[0].split('-');
  if (data.length !== 3) return textoData;
  const hora = partes[1] ? ' ' + partes[1].slice(0, 5) : '';
  return `${data[2]}/${data[1]}/${data[0]}${hora}`;
}

// Retorna o texto e a classe CSS do selo de classificação da ocorrência
function infoClassificacao(classificacao) {
  const mapa = {
    BAIXA: { texto: 'Baixa', classe: 'badge-baixa' },
    MEDIA: { texto: 'Média', classe: 'badge-media' },
    ALTA: { texto: 'Alta', classe: 'badge-alta' },
    CRITICA: { texto: 'Crítica', classe: 'badge-critica' }
  };
  return mapa[classificacao] || { texto: classificacao || '-', classe: 'badge-baixa' };
}

// Retorna o texto e a classe CSS do selo de status da vistoria
function infoStatus(status) {
  if (status === 'FINALIZADA') {
    return { texto: 'Finalizada', classe: 'badge-finalizada' };
  }
  return { texto: 'Aberta', classe: 'badge-aberta' };
}

// Evita que caracteres especiais quebrem o HTML ao exibir textos vindos do banco
function escaparHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Exibe ou oculta uma caixa de mensagem na tela
function mostrarMensagem(idElemento, texto, tipo = 'erro') {
  const el = document.getElementById(idElemento);
  if (!el) return;
  if (!texto) {
    el.className = 'alerta oculto';
    el.textContent = '';
    return;
  }
  el.className = `alerta alerta-${tipo}`;
  el.textContent = texto;
}

// Gera o HTML da galeria de fotos (usado em vistorias e ocorrências)
function gerarHtmlGaleriaFotos(fotos, mensagemVazia) {
  if (!fotos || fotos.length === 0) {
    return `<p class="subtitulo">${escaparHtml(mensagemVazia)}</p>`;
  }

  return `
    <div class="galeria-fotos">
      ${fotos.map((foto) => `
        <div class="foto-item">
          <img src="${escaparHtml(foto.url_foto)}" alt="Foto" onerror="this.style.display='none'">
          <span><a href="${escaparHtml(foto.url_foto)}" target="_blank" rel="noopener">Abrir imagem</a></span>
        </div>
      `).join('')}
    </div>
  `;
}

// Busca os detalhes e fotos de uma ocorrência (GET /api/ocorrencias/:id) e mostra na caixa
async function exibirDetalheOcorrencia(idOcorrencia, idCaixa = 'detalheOcorrencia') {
  const caixa = document.getElementById(idCaixa);
  if (!caixa) return;

  caixa.classList.remove('oculto');
  caixa.innerHTML = '<p>Carregando detalhes da ocorrência...</p>';

  try {
    const resposta = await fetch(`/api/ocorrencias/${idOcorrencia}`);
    const oc = await resposta.json();

    if (!resposta.ok) {
      throw new Error(oc.erro || 'Erro ao carregar ocorrência.');
    }

    const cls = infoClassificacao(oc.classificacao);
    const htmlFotos = gerarHtmlGaleriaFotos(oc.fotos, 'Nenhuma foto anexada nesta ocorrência.');

    caixa.innerHTML = `
      <div class="acoes-linha card-titulo">
        <strong>Ocorrência #${oc.id} — <span class="badge ${cls.classe}">${cls.texto}</span></strong>
        <button type="button" class="btn btn-pequeno" onclick="document.getElementById('${idCaixa}').classList.add('oculto')">Fechar</button>
      </div>
      <p><strong>Data:</strong> ${formatarData(oc.data_criacao)}</p>
      <p class="descricao-detalhe-ocorrencia"><strong>Descrição:</strong> ${escaparHtml(oc.descricao)}</p>
      ${htmlFotos}
    `;
  } catch (erro) {
    caixa.innerHTML = `<p class="alerta alerta-erro">${escaparHtml(erro.message)}</p>`;
  }
}
