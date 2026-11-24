// =====================================================================
// Cadastro e edição de vistoria (vistoria-form.html)
//   vistoria-form.html       -> cadastra uma nova vistoria
//   vistoria-form.html?id=5  -> edita a vistoria 5
// =====================================================================

// ---------------------------------------------------------------------
// 1. Usuário logado: só quem tem GERENCIAR_VISTORIAS (Analista) entra aqui
// ---------------------------------------------------------------------
const usuario = JSON.parse(localStorage.getItem('usuario'));

if (!usuario) {
  window.location.href = 'login.html';
  throw new Error('Usuário não logado');
}
if (!usuario.permissoes.includes('GERENCIAR_VISTORIAS')) {
  window.location.href = 'vistorias.html';
  throw new Error('Sem permissão');
}

document.getElementById('nomeUsuario').textContent = usuario.nome;
document.getElementById('cargoUsuario').textContent = usuario.cargo;

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
});

// ---------------------------------------------------------------------
// 2. Cadastro ou edição? Depende de ter "?id=" na URL
// ---------------------------------------------------------------------
const id = new URLSearchParams(window.location.search).get('id');
const editando = id !== null;

const campos = {
  endereco: document.getElementById('endereco'),
  descricao: document.getElementById('descricao'),
  operador: document.getElementById('operador'),
  status: document.getElementById('status'),
  urlFoto: document.getElementById('urlFoto')
};

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function mostrarMensagem(texto, tipo) {
  document.getElementById('mensagem').innerHTML = `
    <div class="alert alert-${tipo}">${escapar(texto)}</div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------------
// 3. Carrega os operadores no campo de seleção
// ---------------------------------------------------------------------
async function carregarOperadores() {
  const resposta = await fetch('/api/usuarios');
  const usuarios = await resposta.json();

  if (!resposta.ok) {
    throw new Error(usuarios.erro);
  }

  // Só usuários com o cargo Operador podem ser responsáveis
  const operadores = usuarios.filter((u) => u.cargo === 'Operador');

  campos.operador.innerHTML = '<option value="">Selecione...</option>' +
    operadores.map((o) => `<option value="${o.id}">${escapar(o.nome)}</option>`).join('');
}

// ---------------------------------------------------------------------
// 4. Na edição: busca a vistoria e preenche o formulário
// ---------------------------------------------------------------------
async function carregarVistoria() {
  const resposta = await fetch('/api/vistorias/' + id);
  const vistoria = await resposta.json();

  if (!resposta.ok) {
    throw new Error(vistoria.erro);
  }

  const codigo = '#' + String(vistoria.id).padStart(4, '0');
  document.title = `Editar vistoria ${codigo} - Vistoria Informatizada`;
  document.getElementById('titulo').textContent = 'Editar vistoria ' + codigo;
  document.getElementById('caminhoAtual').textContent = 'Editar ' + codigo;

  campos.endereco.value = vistoria.endereco;
  campos.descricao.value = vistoria.descricao;
  campos.operador.value = vistoria.id_operador_responsavel;
  campos.status.value = vistoria.status;

  // Mostra o campo status e as fotos que a vistoria já tem
  document.getElementById('grupoStatus').classList.remove('d-none');

  if (vistoria.fotos.length > 0) {
    document.getElementById('grupoFotos').classList.remove('d-none');
    document.getElementById('fotosAtuais').innerHTML = vistoria.fotos.map((f) => `
      <a href="${escapar(f.url_foto)}" target="_blank">
        <img src="${escapar(f.url_foto)}" class="miniatura img-thumbnail" alt="Foto da vistoria">
      </a>`).join('');
  }

  // Na edição, o link de foto serve para ADICIONAR mais uma foto
  document.getElementById('rotuloFoto').textContent = 'Adicionar nova foto (link)';
  document.getElementById('ajudaFoto').textContent =
    'Opcional. Deixe em branco para manter apenas as fotos atuais.';
}

// ---------------------------------------------------------------------
// 5. Pré-visualização da foto enquanto o link é digitado
// ---------------------------------------------------------------------
const preview = document.getElementById('previewFoto');

campos.urlFoto.addEventListener('input', () => {
  const link = campos.urlFoto.value.trim();
  if (link && campos.urlFoto.checkValidity()) {
    preview.src = link;
    preview.classList.remove('d-none');
  } else {
    preview.classList.add('d-none');
  }
});
preview.addEventListener('error', () => preview.classList.add('d-none'));

// ---------------------------------------------------------------------
// 6. Salvar
// ---------------------------------------------------------------------
document.getElementById('formVistoria').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;

  // Campos só com espaços contam como vazios
  campos.endereco.value = campos.endereco.value.trim();
  campos.descricao.value = campos.descricao.value.trim();

  // Mostra em vermelho os campos obrigatórios que estão vazios
  form.classList.add('was-validated');
  if (!form.checkValidity()) {
    return;
  }

  const botao = document.getElementById('btnSalvar');
  botao.disabled = true;
  botao.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

  const urlFoto = campos.urlFoto.value.trim();

  try {
    if (editando) {
      // PUT /api/vistorias/:id
      await enviar('PUT', '/api/vistorias/' + id, {
        idOperadorResponsavel: Number(campos.operador.value),
        descricao: campos.descricao.value,
        endereco: campos.endereco.value,
        status: campos.status.value
      });

      // Se informou uma nova foto, adiciona com POST /api/vistorias/:id/fotos
      if (urlFoto) {
        await enviar('POST', `/api/vistorias/${id}/fotos`, { urlFoto });
      }
      sessionStorage.setItem('aviso', 'Vistoria alterada com sucesso.');
    } else {
      // POST /api/vistorias
      await enviar('POST', '/api/vistorias', {
        idUsuarioCriador: usuario.id,
        idOperadorResponsavel: Number(campos.operador.value),
        descricao: campos.descricao.value,
        endereco: campos.endereco.value,
        urlFoto: urlFoto
      });
      sessionStorage.setItem('aviso', 'Vistoria cadastrada com sucesso.');
    }

    // Volta para a lista, que mostra o aviso de sucesso
    window.location.href = 'vistorias.html';
  } catch (erro) {
    mostrarMensagem('Não foi possível salvar. ' + erro.message, 'danger');
    botao.disabled = false;
    botao.innerHTML = '<i class="bi bi-check-lg"></i> Salvar';
  }
});

// Envia dados em JSON para a API e devolve a resposta
async function enviar(metodo, url, dados) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro);
  }
  return resultado;
}

// ---------------------------------------------------------------------
// 7. Ao abrir a página
// ---------------------------------------------------------------------
async function iniciar() {
  try {
    await carregarOperadores(); // primeiro a lista, para depois marcar o operador
    if (editando) {
      await carregarVistoria();
    }
  } catch (erro) {
    mostrarMensagem('Erro ao carregar os dados. ' + erro.message, 'danger');
    document.getElementById('btnSalvar').disabled = true;
  }
}

iniciar();
