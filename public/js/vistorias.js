// =====================================================================
// Lista de vistorias (vistorias.html)
// =====================================================================

(() => {
// ---------------------------------------------------------------------
// 1. Usuário logado (auth.js)
// ---------------------------------------------------------------------
const usuario = AUTH.exigirAutenticacao();
if (!usuario) return;

// O Analista tem a permissão GERENCIAR_VISTORIAS (incluir, editar e excluir)
const podeGerenciar = (usuario.permissoes || []).includes('GERENCIAR_VISTORIAS');

// Nome e cargo no menu superior
const cargo = usuario.cargo || '';
document.getElementById('nomeUsuario').textContent = usuario.nome;
const badgeCargo = document.getElementById('cargoUsuario');
badgeCargo.textContent = cargo;
badgeCargo.classList.add('badge-' + cargo.toLowerCase());

if (cargo.toLowerCase() === 'analista') {
  document.getElementById('linkUsuarios').classList.remove('oculto');
}
if (podeGerenciar) {
  document.getElementById('btnNova').classList.remove('oculto');
}

document.getElementById('btnSair').addEventListener('click', () => AUTH.logout());

// ---------------------------------------------------------------------
// 2. Funções de apoio
// ---------------------------------------------------------------------

// Evita que um texto digitado vire código HTML na página
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// "2026-11-22 10:30:00" -> "22/11/2026"
function formatarData(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split(' ')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

// Código da vistoria: ano de abertura + número. Ex.: VIS-2026-001
function codigoVistoria(v) {
  const ano = (v.data_criacao || '').slice(0, 4);
  return `VIS-${ano}-${String(v.id).padStart(3, '0')}`;
}

function badgeStatus(status) {
  return status === 'ABERTA'
    ? '<span class="badge badge-aberta">Aberta</span>'
    : '<span class="badge badge-finalizada">Finalizada</span>';
}

function mostrarMensagem(texto, tipo = 'erro') {
  const el = document.getElementById('mensagem');
  el.className = `alerta alerta-${tipo}`;
  el.textContent = texto;
}

// ---------------------------------------------------------------------
// 3. Buscar as vistorias na API
// O status é filtrado pela API; a busca por texto é feita aqui na página.
// ---------------------------------------------------------------------
let vistorias = [];

async function carregarVistorias() {
  const status = document.getElementById('filtroStatus').value;

  document.getElementById('carregando').classList.remove('oculto');

  try {
    const resposta = await fetch('/api/vistorias' + (status ? '?status=' + status : ''));
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro);

    vistorias = dados;
    mostrarVistorias();
  } catch (erro) {
    mostrarMensagem('Não foi possível carregar as vistorias. ' + erro.message);
  } finally {
    document.getElementById('carregando').classList.add('oculto');
  }
}

// ---------------------------------------------------------------------
// 4. Mostrar os cartões
// ---------------------------------------------------------------------
const cores = ['capa-azul', 'capa-verde', 'capa-cinza'];

function mostrarVistorias() {
  const busca = document.getElementById('filtroBusca').value.trim().toLowerCase();

  // Procura o texto no endereço, no código e no nome do responsável
  const filtradas = vistorias.filter((v) =>
    [v.endereco, codigoVistoria(v), v.responsavel]
      .some((campo) => (campo || '').toLowerCase().includes(busca))
  );

  document.getElementById('vazio').classList.toggle('oculto', filtradas.length > 0);

  document.getElementById('listaVistorias').innerHTML = filtradas.map((v) => {
    // Capa: a foto da vistoria, ou uma cor com o início do endereço
    const titulo = escapar(v.endereco.split(' - ')[0]);
    const foto = v.foto
      ? `<img src="${escapar(v.foto)}" alt="Foto do local" onerror="this.remove()">`
      : '';

    // Editar e Excluir só para o Analista
    const botoesAnalista = podeGerenciar
      ? `<a href="vistoria-form.html?id=${v.id}" class="btn btn-pequeno">Editar</a>
         <button type="button" class="btn btn-pequeno btn-perigo btn-excluir" title="Excluir"
                 data-id="${v.id}" data-codigo="${codigoVistoria(v)}"
                 data-endereco="${escapar(v.endereco)}">🗑️</button>`
      : '';

    return `
      <article class="cartao-vistoria">
        <div class="cartao-capa ${cores[v.id % cores.length]}">
          🏢 ${titulo}
          ${foto}
          ${badgeStatus(v.status)}
        </div>
        <div class="cartao-corpo">
          <span class="cartao-codigo">${codigoVistoria(v)}</span>
          <h2 class="cartao-endereco">${escapar(v.endereco)}</h2>
          <p class="cartao-descricao">${escapar(v.descricao)}</p>
          <div class="cartao-meta">
            <span>👤 Resp: ${escapar(v.responsavel || '-')}</span>
            <span>📅 ${formatarData(v.data_criacao)}</span>
          </div>
          <div class="cartao-acoes">
            <a href="vistoria-detalhes.html?id=${v.id}" class="btn btn-primario btn-pequeno">Ver detalhes</a>
            ${botoesAnalista}
          </div>
        </div>
      </article>`;
  }).join('');
}

// ---------------------------------------------------------------------
// 5. Filtros
// ---------------------------------------------------------------------
document.getElementById('filtroBusca').addEventListener('input', mostrarVistorias);
document.getElementById('filtroStatus').addEventListener('change', carregarVistorias);

// ---------------------------------------------------------------------
// 6. Excluir vistoria (com confirmação)
// ---------------------------------------------------------------------
const modalExcluir = document.getElementById('modalExcluir');
let idParaExcluir = null;

// Os botões são criados depois, então o clique é tratado na lista
document.getElementById('listaVistorias').addEventListener('click', (evento) => {
  const botao = evento.target.closest('.btn-excluir');
  if (!botao) return;

  idParaExcluir = botao.dataset.id;
  document.getElementById('excluirCodigo').textContent = botao.dataset.codigo;
  document.getElementById('excluirEndereco').textContent = botao.dataset.endereco;
  modalExcluir.classList.remove('oculto');
});

document.getElementById('btnCancelarExcluir').addEventListener('click', () => {
  modalExcluir.classList.add('oculto');
});

document.getElementById('btnConfirmarExcluir').addEventListener('click', async () => {
  modalExcluir.classList.add('oculto');
  try {
    const resposta = await fetch('/api/vistorias/' + idParaExcluir, { method: 'DELETE' });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro);

    mostrarMensagem('Vistoria excluída com sucesso.', 'sucesso');
    carregarVistorias();
  } catch (erro) {
    mostrarMensagem('Não foi possível excluir a vistoria. ' + erro.message);
  }
});

// ---------------------------------------------------------------------
// 7. Aviso vindo do formulário (ex.: "Vistoria cadastrada")
// ---------------------------------------------------------------------
const aviso = sessionStorage.getItem('aviso');
if (aviso) {
  mostrarMensagem(aviso, 'sucesso');
  sessionStorage.removeItem('aviso');
}

carregarVistorias();
})();
