// Lógica da tela de Detalhes da Vistoria (vistoria-detalhes.html)

let idVistoriaAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!iniciarBarraUsuario()) return;

  iniciarTela();
});

async function iniciarTela() {
  const parametros = new URLSearchParams(window.location.search);
  const idUrl = parametros.get('id');

  await carregarListaVistorias(idUrl);
}

// Busca todas as vistorias para preencher o seletor do topo
async function carregarListaVistorias(idInicial) {
  const seletor = document.getElementById('seletorVistoria');

  try {
    const resposta = await fetch('/api/vistorias');
    if (!resposta.ok) {
      throw new Error('Não foi possível buscar a lista de vistorias.');
    }

    const vistorias = await resposta.json();
    seletor.innerHTML = '';

    if (vistorias.length === 0) {
      seletor.innerHTML = '<option value="">Nenhuma vistoria cadastrada</option>';
      mostrarMensagem('mensagemErro', 'Nenhuma vistoria encontrada no banco de dados.', 'info');
      return;
    }

    vistorias.forEach((v) => {
      const opcao = document.createElement('option');
      opcao.value = v.id;
      opcao.textContent = `#${v.id} - ${v.endereco} (${v.status})`;
      seletor.appendChild(opcao);
    });

    // Usa o id da URL se existir; caso contrário, abre a primeira vistoria
    const idEscolhido = idInicial || String(vistorias[0].id);
    seletor.value = idEscolhido;

    seletor.addEventListener('change', () => {
      if (seletor.value) {
        carregarDetalhesVistoria(seletor.value);
      }
    });

    await carregarDetalhesVistoria(idEscolhido);
  } catch (erro) {
    seletor.innerHTML = '<option value="">Erro ao carregar</option>';
    mostrarMensagem('mensagemErro', 'Erro ao conectar com o servidor: ' + erro.message);
  }
}

// Busca os detalhes completos de uma vistoria: GET /api/vistorias/:id
async function carregarDetalhesVistoria(id) {
  idVistoriaAtual = id;
  mostrarMensagem('mensagemErro', '');
  document.getElementById('detalheOcorrencia').classList.add('oculto');

  try {
    const resposta = await fetch(`/api/vistorias/${id}`);
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || 'Vistoria não encontrada.');
    }

    preencherDadosVistoria(dados);
    preencherFotosVistoria(dados.fotos || []);
    preencherOcorrencias(dados.ocorrencias || []);
    atualizarBotoesPermissao();
  } catch (erro) {
    document.getElementById('secaoDados').classList.add('oculto');
    document.getElementById('secaoFotos').classList.add('oculto');
    document.getElementById('secaoOcorrencias').classList.add('oculto');
    mostrarMensagem('mensagemErro', erro.message);
  }
}

function preencherDadosVistoria(vistoria) {
  document.getElementById('vistoriaId').textContent = vistoria.id;
  document.getElementById('vistoriaData').textContent = formatarData(vistoria.data_criacao);
  document.getElementById('vistoriaResponsavel').textContent = vistoria.responsavel || '-';
  document.getElementById('vistoriaEndereco').textContent = vistoria.endereco || '-';
  document.getElementById('vistoriaDescricao').textContent = vistoria.descricao || '-';

  const statusInfo = infoStatus(vistoria.status);
  const badgeStatus = document.getElementById('vistoriaStatus');
  badgeStatus.textContent = statusInfo.texto;
  badgeStatus.className = `badge ${statusInfo.classe}`;

  document.getElementById('secaoDados').classList.remove('oculto');
}

function preencherFotosVistoria(fotos) {
  const container = document.getElementById('listaFotos');
  container.innerHTML = gerarHtmlGaleriaFotos(fotos, 'Nenhuma foto cadastrada para esta vistoria.');
  document.getElementById('secaoFotos').classList.remove('oculto');
}

function preencherOcorrencias(ocorrencias) {
  const container = document.getElementById('listaOcorrencias');
  const totalEl = document.getElementById('totalOcorrencias');
  const podeRegistrar = temPermissao('REGISTRAR_OCORRENCIAS');

  totalEl.textContent = `${ocorrencias.length} encontrada(s)`;

  if (ocorrencias.length === 0) {
    container.innerHTML = '<p class="subtitulo">Nenhuma ocorrência registrada nesta vistoria.</p>';
    document.getElementById('secaoOcorrencias').classList.remove('oculto');
    return;
  }

  container.innerHTML = `
    <div class="tabela-responsiva">
      <table>
        <thead>
          <tr>
            <th>Classificação</th>
            <th>Data</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${ocorrencias.map((oc) => {
            const cls = infoClassificacao(oc.classificacao);
            const botoesOperador = podeRegistrar
              ? `
                <a class="btn btn-pequeno" href="ocorrencia-form.html?id=${oc.id}&idVistoria=${idVistoriaAtual}">Editar</a>
                <button type="button" class="btn btn-perigo btn-pequeno" onclick="excluirOcorrencia(${oc.id})">Excluir</button>
              `
              : '';

            return `
              <tr>
                <td><span class="badge ${cls.classe}">${cls.texto}</span></td>
                <td>${formatarData(oc.data_criacao)}</td>
                <td>${escaparHtml(oc.descricao)}</td>
                <td>
                  <div class="acoes-linha">
                    <button type="button" class="btn btn-pequeno" onclick="exibirDetalheOcorrencia(${oc.id})">Ver foto</button>
                    ${botoesOperador}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('secaoOcorrencias').classList.remove('oculto');
}

// Exibe o botão "+ Nova ocorrência" apenas para quem tem permissão (Operador)
function atualizarBotoesPermissao() {
  const btnNova = document.getElementById('btnNovaOcorrencia');
  if (!btnNova) return;

  if (temPermissao('REGISTRAR_OCORRENCIAS') && idVistoriaAtual) {
    btnNova.href = `ocorrencia-form.html?idVistoria=${idVistoriaAtual}`;
    btnNova.classList.remove('oculto');
  } else {
    btnNova.classList.add('oculto');
  }
}

// Exclui uma ocorrência: DELETE /api/ocorrencias/:id
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
      throw new Error(dados.erro || 'Não foi possível excluir a ocorrência.');
    }

    await carregarDetalhesVistoria(idVistoriaAtual);
  } catch (erro) {
    mostrarMensagem('mensagemErro', erro.message);
  }
}
