// =====================================================================
// Lista de vistorias (vistorias.html)
// =====================================================================

// ---------------------------------------------------------------------
// 1. Usuário logado
// O login guarda os dados do usuário no localStorage com a chave "usuarioLogado".
// Se não houver ninguém logado, volta para a tela de login.
// ---------------------------------------------------------------------
const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

if (!usuario) {
  window.location.href = 'login.html';
  throw new Error('Usuário não logado'); // para o restante do script
}

// O Analista tem a permissão GERENCIAR_VISTORIAS (incluir, editar e excluir)
const podeGerenciar = usuario.permissoes.includes('GERENCIAR_VISTORIAS');

document.getElementById('nomeUsuario').textContent = usuario.nome;
document.getElementById('cargoUsuario').textContent = usuario.cargo;

if (podeGerenciar) {
  document.getElementById('btnNova').classList.remove('d-none');
}

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'login.html';
});

// ---------------------------------------------------------------------
// 2. Funções de apoio
// ---------------------------------------------------------------------

// Evita que um texto digitado pelo usuário vire código HTML na página
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// "2026-11-22 10:30:00" -> "22/11/2026 às 10:30"
function formatarData(data) {
  const [dia, hora] = data.split(' ');
  const [ano, mes, d] = dia.split('-');
  return `${d}/${mes}/${ano} às ${hora.slice(0, 5)}`;
}

// Mostra uma mensagem colorida no topo da lista
function mostrarMensagem(texto, tipo) {
  document.getElementById('mensagem').innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show">
      ${escapar(texto)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// ---------------------------------------------------------------------
// 3. Buscar e mostrar as vistorias
// ---------------------------------------------------------------------
async function carregarVistorias() {
  const status = document.getElementById('filtroStatus').value;
  const endereco = document.getElementById('filtroEndereco').value.trim();

  // Monta os filtros da URL: /api/vistorias?status=ABERTA&endereco=Rua
  const filtros = new URLSearchParams();
  if (status) filtros.append('status', status);
  if (endereco) filtros.append('endereco', endereco);

  document.getElementById('carregando').classList.remove('d-none');
  document.getElementById('listaVistorias').innerHTML = '';
  document.getElementById('vazio').classList.add('d-none');

  try {
    const resposta = await fetch('/api/vistorias?' + filtros);
    const vistorias = await resposta.json();

    if (!resposta.ok) {
      throw new Error(vistorias.erro);
    }

    mostrarVistorias(vistorias);
  } catch (erro) {
    mostrarMensagem('Não foi possível carregar as vistorias. ' + erro.message, 'danger');
  } finally {
    document.getElementById('carregando').classList.add('d-none');
  }
}

function mostrarVistorias(vistorias) {
  const lista = document.getElementById('listaVistorias');

  document.getElementById('totalVistorias').textContent =
    vistorias.length === 1 ? '1 vistoria' : `${vistorias.length} vistorias`;

  if (vistorias.length === 0) {
    document.getElementById('vazio').classList.remove('d-none');
    return;
  }

  // Cria um cartão para cada vistoria
  lista.innerHTML = vistorias.map((v) => {
    // Se o link da foto estiver quebrado (onerror), troca pelo quadro cinza
    const semFoto = `<div class="sem-foto card-img-top d-flex align-items-center justify-content-center">
                       <i class="bi bi-building"></i>
                     </div>`;
    const foto = v.foto
      ? `<img src="${escapar(v.foto)}" class="card-img-top foto" alt="Foto do local"
             onerror="this.replaceWith(document.getElementById('modeloSemFoto').content.cloneNode(true))">`
      : semFoto;

    const badge = v.status === 'ABERTA'
      ? '<span class="badge text-bg-warning">Aberta</span>'
      : '<span class="badge text-bg-success">Finalizada</span>';

    // Botões Editar e Excluir só para quem pode gerenciar (Analista)
    const botoesAnalista = podeGerenciar
      ? `<a href="vistoria-form.html?id=${v.id}" class="btn btn-outline-secondary btn-sm" title="Editar">
           <i class="bi bi-pencil"></i> Editar
         </a>
         <button class="btn btn-outline-danger btn-sm btn-excluir" title="Excluir"
                 data-id="${v.id}" data-endereco="${escapar(v.endereco)}">
           <i class="bi bi-trash"></i>
         </button>`
      : '';

    return `
      <div class="col-sm-6 col-lg-4">
        <div class="card card-vistoria h-100">
          ${foto}
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-bold text-primary">#${String(v.id).padStart(4, '0')}</span>
              ${badge}
            </div>
            <h2 class="h6 card-title">
              <i class="bi bi-geo-alt text-muted"></i> ${escapar(v.endereco)}
            </h2>
            <p class="card-text text-muted small descricao-curta">${escapar(v.descricao)}</p>
            <ul class="list-unstyled small mb-3 mt-auto">
              <li><i class="bi bi-calendar3"></i> Aberta em ${formatarData(v.data_criacao)}</li>
              <li><i class="bi bi-person"></i> Responsável: ${escapar(v.responsavel)}</li>
            </ul>
            <div class="d-flex gap-2">
              <a href="vistoria-detalhes.html?id=${v.id}" class="btn btn-primary btn-sm flex-fill">
                <i class="bi bi-eye"></i> Ver detalhes
              </a>
              ${botoesAnalista}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ---------------------------------------------------------------------
// 4. Filtros
// ---------------------------------------------------------------------
document.getElementById('formFiltros').addEventListener('submit', (evento) => {
  evento.preventDefault(); // não recarrega a página
  carregarVistorias();
});

// Trocar o status já filtra, sem precisar clicar em Filtrar
document.getElementById('filtroStatus').addEventListener('change', carregarVistorias);

document.getElementById('btnLimpar').addEventListener('click', () => {
  document.getElementById('formFiltros').reset();
  carregarVistorias();
});

// ---------------------------------------------------------------------
// 5. Excluir vistoria (com janela de confirmação)
// ---------------------------------------------------------------------
const modalExcluir = new bootstrap.Modal(document.getElementById('modalExcluir'));
let idParaExcluir = null;

// Os botões Excluir são criados depois, então o clique é tratado na lista
document.getElementById('listaVistorias').addEventListener('click', (evento) => {
  const botao = evento.target.closest('.btn-excluir');
  if (!botao) return;

  idParaExcluir = botao.dataset.id;
  document.getElementById('excluirCodigo').textContent = '#' + String(idParaExcluir).padStart(4, '0');
  document.getElementById('excluirEndereco').textContent = botao.dataset.endereco;
  modalExcluir.show();
});

document.getElementById('btnConfirmarExcluir').addEventListener('click', async () => {
  try {
    const resposta = await fetch('/api/vistorias/' + idParaExcluir, { method: 'DELETE' });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro);
    }

    modalExcluir.hide();
    mostrarMensagem('Vistoria excluída com sucesso.', 'success');
    carregarVistorias();
  } catch (erro) {
    modalExcluir.hide();
    mostrarMensagem('Não foi possível excluir a vistoria. ' + erro.message, 'danger');
  }
});

// ---------------------------------------------------------------------
// 6. Mensagem vinda do formulário (ex.: "Vistoria cadastrada")
// ---------------------------------------------------------------------
const aviso = sessionStorage.getItem('aviso');
if (aviso) {
  mostrarMensagem(aviso, 'success');
  sessionStorage.removeItem('aviso');
}

// Ao abrir a página, carrega a lista
carregarVistorias();
