// =====================================================================
// Cadastro e edição de vistoria (vistoria-form.html)
// =====================================================================

(() => {
// 1. Autenticação: só Analista pode entrar aqui
const usuario = AUTH.exigirCargo(['Analista']);
if (!usuario) return;

// Nome e cargo no menu superior
document.getElementById('nomeUsuario').textContent = usuario.nome;
const badgeCargo = document.getElementById('cargoUsuario');
badgeCargo.textContent = usuario.cargo;
badgeCargo.classList.add('badge-' + (usuario.cargo || '').toLowerCase());

// Mostra "Usuários" no menu
const linkU = document.getElementById('linkUsuarios');
if (linkU) linkU.classList.remove('oculto');

// Botão Sair
document.getElementById('btnSair').addEventListener('click', () => AUTH.logout());

// 2. Cadastro ou edição?
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

function mostrarMensagem(texto, tipo = 'erro') {
  const el = document.getElementById('mensagem');
  el.className = `alerta alerta-${tipo}`;
  el.textContent = texto;
  el.classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 3. Carrega lista de operadores no select
async function carregarOperadores() {
  const resposta = await fetch('/api/usuarios');
  const usuarios = await resposta.json();
  if (!resposta.ok) throw new Error(usuarios.erro);

  const operadores = usuarios.filter((u) => u.cargo === 'Operador');
  campos.operador.innerHTML = '<option value="">Selecione...</option>' + operadores.map(
    (u) => `<option value="${u.id}">${escapar(u.nome)}</option>`
  ).join('');
}

// 4. Carrega dados da vistoria (edição)
async function carregarVistoria() {
  const resposta = await fetch('/api/vistorias/' + id);
  const vistoria = await resposta.json();
  if (!resposta.ok) throw new Error(vistoria.erro);

  // Código no mesmo formato da lista. Ex.: VIS-2026-001
  const codigo = `VIS-${vistoria.data_criacao.slice(0, 4)}-${String(vistoria.id).padStart(3, '0')}`;
  document.title = `Editar ${codigo} - Vistoria Informatizada`;
  document.getElementById('titulo').textContent = 'Editar Vistoria';
  document.getElementById('subtitulo').textContent = `${codigo} · Responsável: ${vistoria.responsavel}`;
  document.getElementById('caminhoAtual').textContent = 'Editar ' + codigo;

  campos.endereco.value = vistoria.endereco;
  campos.descricao.value = vistoria.descricao;
  campos.operador.value = vistoria.id_operador_responsavel;
  campos.status.value = vistoria.status;

  document.getElementById('grupoStatus').classList.remove('oculto');

  if (vistoria.fotos && vistoria.fotos.length > 0) {
    document.getElementById('grupoFotos').classList.remove('oculto');
    document.getElementById('fotosAtuais').innerHTML = vistoria.fotos.map((f) =>
      `<a href="${escapar(f.url_foto)}" target="_blank" rel="noopener">
         <img src="${escapar(f.url_foto)}" class="miniatura-vistoria" alt="Foto">
       </a>`
    ).join('');
  }

  document.getElementById('rotuloFoto').textContent = 'Adicionar nova foto (link)';
  document.getElementById('ajudaFoto').textContent = 'Opcional. Deixe em branco para manter apenas as fotos atuais.';
}

// 5. Pré-visualização da foto
const preview = document.getElementById('previewFoto');
campos.urlFoto.addEventListener('input', () => {
  const link = campos.urlFoto.value.trim();
  if (link) {
    preview.src = link;
    preview.classList.remove('oculto');
  } else {
    preview.classList.add('oculto');
  }
});
preview.addEventListener('error', () => preview.classList.add('oculto'));

// 6. Salvar
document.getElementById('formVistoria').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  campos.endereco.value = campos.endereco.value.trim();
  campos.descricao.value = campos.descricao.value.trim();

  // Marca em vermelho os campos obrigatórios vazios
  const obrigatorios = [campos.endereco, campos.descricao, campos.operador];
  obrigatorios.forEach((c) => c.classList.toggle('campo-invalido', !c.value));
  if (obrigatorios.some((c) => !c.value)) {
    mostrarMensagem('Preencha todos os campos obrigatórios.');
    return;
  }

  const botao = document.getElementById('btnSalvar');
  botao.disabled = true;
  botao.textContent = 'Salvando...';

  const urlFoto = campos.urlFoto.value.trim();

  try {
    if (editando) {
      await enviar('PUT', '/api/vistorias/' + id, {
        idOperadorResponsavel: Number(campos.operador.value),
        descricao: campos.descricao.value,
        endereco: campos.endereco.value,
        status: campos.status.value
      });
      if (urlFoto) {
        await enviar('POST', `/api/vistorias/${id}/fotos`, { urlFoto });
      }
      sessionStorage.setItem('aviso', 'Vistoria alterada com sucesso.');
    } else {
      await enviar('POST', '/api/vistorias', {
        idUsuarioCriador: usuario.id,
        idOperadorResponsavel: Number(campos.operador.value),
        descricao: campos.descricao.value,
        endereco: campos.endereco.value,
        urlFoto: urlFoto
      });
      sessionStorage.setItem('aviso', 'Vistoria cadastrada com sucesso.');
    }
    window.location.href = 'vistorias.html';
  } catch (erro) {
    mostrarMensagem('Não foi possível salvar. ' + erro.message);
    botao.disabled = false;
    botao.textContent = 'Salvar vistoria';
  }
});

async function enviar(metodo, url, dados) {
  const resposta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.erro);
  return resultado;
}

// 7. Iniciar
async function iniciar() {
  try {
    await carregarOperadores();
    if (editando) await carregarVistoria();
  } catch (erro) {
    mostrarMensagem('Erro ao carregar dados. ' + erro.message);
    document.getElementById('btnSalvar').disabled = true;
  }
}

iniciar();
})();
