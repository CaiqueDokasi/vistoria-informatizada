// =====================================================================
// Lista de vistorias (vistorias.html)
// =====================================================================

(() => {
// 1. Autenticação via AUTH (auth.js)
const usuario = AUTH.exigirAutenticacao();
if (!usuario) return;

const podeGerenciar = (usuario.permissoes || []).includes('GERENCIAR_VISTORIAS');

// Exibe nome do usuário
document.getElementById('nomeUsuario').textContent = `${usuario.nome} (${usuario.cargo})`;

// Mostra "Usuários" no menu só para Analista
if ((usuario.cargo || '').toLowerCase() === 'analista') {
  const linkU = document.getElementById('linkUsuarios');
  if (linkU) linkU.classList.remove('oculto');
}

// Mostra botão Nova Vistoria só para Analista
if (podeGerenciar) {
  document.getElementById('btnNova').classList.remove('oculto');
}

// Botão Sair
document.getElementById('btnSair').addEventListener('click', () => AUTH.logout());

// ---------------------------------------------------------------------
// 2. Funções de apoio
// ---------------------------------------------------------------------
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function formatarData(data) {
  if (!data) return '-';
  const [dia, hora] = data.split(' ');
  const [ano, mes, d] = dia.split('-');
  return `${d}/${mes}/${ano}${hora ? ' às ' + hora.slice(0, 5) : ''}`;
}

function mostrarMensagem(texto, tipo = 'erro') {
  const el = document.getElementById('mensagem');
  el.className = `alerta alerta-${tipo}`;
  el.textContent = texto;
  el.classList.remove('oculto');
}

// ---------------------------------------------------------------------
// 3. Buscar e mostrar as vistorias
// ---------------------------------------------------------------------
async function carregarVistorias() {
  const status = document.getElementById('filtroStatus').value;
  const endereco = document.getElementById('filtroEndereco').value.trim();

  const filtros = new URLSearchParams();
  if (status) filtros.append('status', status);
  if (endereco) filtros.append('endereco', endereco);

  document.getElementById('carregando').classList.remove('oculto');
  document.getElementById('listaVistorias').innerHTML = '';
  document.getElementById('vazio').classList.add('oculto');

  try {
    const resposta = await fetch('/api/vistorias?' + filtros);
    const vistorias = await resposta.json();

    if (!resposta.ok) throw new Error(vistorias.erro);

    mostrarVistorias(vistorias);
  } catch (erro) {
    mostrarMensagem('Não foi possível carregar as vistorias. ' + erro.message);
  } finally {
    document.getElementById('carregando').classList.add('oculto');
  }
}

function statusBadge(status) {
  return status === 'ABERTA'
    ? '<span class="badge badge-aberta">Aberta</span>'
    : '<span class="badge badge-finalizada">Finalizada</span>';
}

function mostrarVistorias(vistorias) {
  const lista = document.getElementById('listaVistorias');
  const totalEl = document.getElementById('totalVistorias');

  totalEl.textContent = vistorias.length === 1 ? '1 vistoria' : `${vistorias.length} vistorias`;

  if (vistorias.length === 0) {
    document.getElementById('vazio').classList.remove('oculto');
    return;
  }

  lista.innerHTML = `<div class="grade-vistorias">
    ${vistorias.map((v) => {
      const fotoHtml = v.foto
        ? `<img src="${escapar(v.foto)}" alt="Foto" class="card-vistoria-foto" onerror="this.style.display='none'">`
        : '<div class="card-vistoria-sem-foto">🏠</div>';

      const botoesAnalista = podeGerenciar
        ? `<a href="vistoria-form.html?id=${v.id}" class="btn btn-pequeno">✏️ Editar</a>
           <button class="btn btn-perigo btn-pequeno btn-excluir" data-id="${v.id}" data-endereco="${escapar(v.endereco)}">🗑️</button>`
        : '';

      return `
        <div class="card card-vistoria">
          ${fotoHtml}
          <div class="card-vistoria-conteudo">
            <div class="acoes-linha card-vistoria-cabecalho">
              <strong class="card-vistoria-codigo">#${String(v.id).padStart(4, '0')}</strong>
              ${statusBadge(v.status)}
            </div>
            <p class="card-vistoria-endereco">📍 ${escapar(v.endereco)}</p>
            <p class="subtitulo card-vistoria-descricao">${escapar(v.descricao)}</p>
            <p class="subtitulo card-vistoria-meta">📅 ${formatarData(v.data_criacao)} · 👤 ${escapar(v.responsavel || '-')}</p>
            <div class="acoes-linha">
              <a href="vistoria-detalhes.html?id=${v.id}" class="btn btn-primario btn-pequeno card-vistoria-detalhes">Ver detalhes</a>
              ${botoesAnalista}
            </div>
          </div>
        </div>`;
    }).join('')}
  </div>`;
}

// ---------------------------------------------------------------------
// 4. Filtros
// ---------------------------------------------------------------------
document.getElementById('btnFiltrar').addEventListener('click', carregarVistorias);
document.getElementById('filtroStatus').addEventListener('change', carregarVistorias);
document.getElementById('btnLimpar').addEventListener('click', () => {
  document.getElementById('filtroStatus').value = '';
  document.getElementById('filtroEndereco').value = '';
  carregarVistorias();
});

// ---------------------------------------------------------------------
// 5. Excluir vistoria
// ---------------------------------------------------------------------
let idParaExcluir = null;
const modalExcluir = document.getElementById('modalExcluir');

document.getElementById('listaVistorias').addEventListener('click', (ev) => {
  const botao = ev.target.closest('.btn-excluir');
  if (!botao) return;
  idParaExcluir = botao.dataset.id;
  document.getElementById('excluirCodigo').textContent = '#' + String(idParaExcluir).padStart(4, '0');
  document.getElementById('excluirEndereco').textContent = botao.dataset.endereco;
  modalExcluir.classList.remove('oculto');
});

document.getElementById('btnCancelarExcluir').addEventListener('click', () => {
  modalExcluir.classList.add('oculto');
});

document.getElementById('btnConfirmarExcluir').addEventListener('click', async () => {
  try {
    const resposta = await fetch('/api/vistorias/' + idParaExcluir, { method: 'DELETE' });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro);
    modalExcluir.classList.add('oculto');
    mostrarMensagem('Vistoria excluída com sucesso.', 'sucesso');
    carregarVistorias();
  } catch (erro) {
    modalExcluir.classList.add('oculto');
    mostrarMensagem('Não foi possível excluir. ' + erro.message);
  }
});

// 6. Mensagem de sucesso vinda do formulário
const aviso = sessionStorage.getItem('aviso');
if (aviso) {
  mostrarMensagem(aviso, 'sucesso');
  sessionStorage.removeItem('aviso');
}

carregarVistorias();
})();
