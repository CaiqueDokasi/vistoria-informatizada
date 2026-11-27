// Lógica da tela de Histórico de Ocorrências (ocorrencias.html)

let listaAtual = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!iniciarBarraUsuario()) return;

  iniciarHistorico();
});

async function iniciarHistorico() {
  atualizarBotaoNovaOcorrencia();
  await carregarFiltroVistorias();

  const idVistoriaUrl = new URLSearchParams(window.location.search).get('idVistoria');
  if (idVistoriaUrl) {
    document.getElementById('filtroVistoria').value = idVistoriaUrl;
  }

  await buscarOcorrencias();

  document.getElementById('filtroVistoria').addEventListener('change', buscarOcorrencias);
  document.getElementById('filtroClassificacao').addEventListener('change', renderizarTabela);
  document.getElementById('btnLimparFiltros').addEventListener('click', () => {
    document.getElementById('filtroVistoria').value = '';
    document.getElementById('filtroClassificacao').value = '';
    buscarOcorrencias();
  });
}

function atualizarBotaoNovaOcorrencia() {
  const btn = document.getElementById('btnNovaOcorrencia');
  if (temPermissao('REGISTRAR_OCORRENCIAS')) {
    btn.classList.remove('oculto');
  } else {
    btn.classList.add('oculto');
  }
}

// Preenche o dropdown de vistorias para filtrar na API (?idVistoria=)
async function carregarFiltroVistorias() {
  const select = document.getElementById('filtroVistoria');

  try {
    const resposta = await fetch('/api/vistorias');
    if (!resposta.ok) return;

    const vistorias = await resposta.json();
    vistorias.forEach((v) => {
      const opcao = document.createElement('option');
      opcao.value = v.id;
      opcao.textContent = `#${v.id} - ${v.endereco}`;
      select.appendChild(opcao);
    });
  } catch (erro) {
    // Se falhar, o histórico geral continua funcionando normalmente
  }
}

// Busca ocorrências no backend: GET /api/ocorrencias ou GET /api/ocorrencias?idVistoria=X
async function buscarOcorrencias() {
  mostrarMensagem('mensagemErro', '');
  document.getElementById('detalheOcorrencia').classList.add('oculto');

  const idVistoria = document.getElementById('filtroVistoria').value;
  const url = idVistoria ? `/api/ocorrencias?idVistoria=${idVistoria}` : '/api/ocorrencias';

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Não foi possível buscar o histórico.');
    }

    listaAtual = dados;
    renderizarTabela();
  } catch (erro) {
    listaAtual = [];
    renderizarTabela();
    mostrarMensagem('mensagemErro', 'Erro ao carregar ocorrências: ' + erro.message);
  }
}

function renderizarTabela() {
  const tbody = document.getElementById('tabelaOcorrencias');
  const totalEl = document.getElementById('totalRegistros');
  const filtroCls = document.getElementById('filtroClassificacao').value;
  const podeRegistrar = temPermissao('REGISTRAR_OCORRENCIAS');

  const filtradas = filtroCls
    ? listaAtual.filter((oc) => oc.classificacao === filtroCls)
    : listaAtual;

  totalEl.textContent = `${filtradas.length} registro(s)`;

  if (filtradas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Nenhuma ocorrência encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = filtradas.map((oc) => {
    const cls = infoClassificacao(oc.classificacao);
    const botoesOperador = podeRegistrar
      ? `
        <a class="btn btn-pequeno" href="ocorrencia-form.html?id=${oc.id}&idVistoria=${oc.id_vistoria}">Editar</a>
        <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirOcorrencia(${oc.id})">Excluir</button>
      `
      : '';

    return `
      <tr>
        <td>${formatarData(oc.data_criacao)}</td>
        <td>
          <a href="vistoria-detalhes.html?id=${oc.id_vistoria}">
            #${oc.id_vistoria} - ${escaparHtml(oc.endereco)}
          </a>
        </td>
        <td><span class="badge ${cls.classe}">${cls.texto}</span></td>
        <td>${escaparHtml(oc.descricao)}</td>
        <td>${escaparHtml(oc.operador)}</td>
        <td>
          <div class="acoes-linha">
            <button type="button" class="btn btn-pequeno" onclick="exibirDetalheOcorrencia(${oc.id})">Ver foto</button>
            ${botoesOperador}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function excluirOcorrencia(idOcorrencia) {
  if (!confirm('Deseja realmente excluir esta ocorrência?')) {
    return;
  }

  try {
    const resposta = await fetch(`/api/ocorrencias/${idOcorrencia}`, {
      method: 'DELETE'
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Erro ao excluir ocorrência.');
    }

    await buscarOcorrencias();
  } catch (erro) {
    mostrarMensagem('mensagemErro', erro.message);
  }
}
