/**
 * Lógica da tela de Login
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnEntrar = document.getElementById('btn-entrar');
  const alerta = document.getElementById('mensagem-alerta');
  const btnAnalista = document.getElementById('preencher-analista');
  const btnOperador = document.getElementById('preencher-operador');

  function mostrarAlerta(mensagem, tipo = 'danger') {
    if (!alerta) return;
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensagem;
    alerta.classList.remove('d-none');
  }

  function esconderAlerta() {
    if (!alerta) return;
    alerta.classList.add('d-none');
    alerta.textContent = '';
  }

  // Preenchimento rápido para testes
  if (btnAnalista) {
    btnAnalista.addEventListener('click', () => {
      if (emailInput) emailInput.value = 'analista@vistoria.com';
      if (senhaInput) senhaInput.value = '123456';
      esconderAlerta();
    });
  }

  if (btnOperador) {
    btnOperador.addEventListener('click', () => {
      if (emailInput) emailInput.value = 'operador@vistoria.com';
      if (senhaInput) senhaInput.value = '123456';
      esconderAlerta();
    });
  }

  // Redireciona para usuarios.html se enviar o formulário
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      esconderAlerta();

    const email = emailInput.value.trim() || 'analista@vistoria.com';
    const senha = senhaInput.value;

    try {
      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando...';

      let usuario = null;
      try {
        const resposta = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        if (resposta.ok) {
          usuario = await resposta.json();
        }
      } catch (e) {
        console.warn('API de login indisponível, utilizando modo de visualização local:', e);
      }

      // Se a API não respondeu ou deu erro, cria usuário local para visualização
      if (!usuario) {
        const isOperador = email.toLowerCase().includes('operador');
        usuario = {
          id: 1,
          nome: isOperador ? 'Operador (Visualização)' : 'Analista (Visualização)',
          email: email,
          cargo: isOperador ? 'Operador' : 'Analista'
        };
      }

      // Salva a sessão no localStorage
      AUTH.salvarUsuario(usuario);

      // Redireciona para a tela inicial
      window.location.href = '/vistorias.html';
    } catch (err) {
      console.error('Erro na requisição de login:', err);
      // Mesmo com erro, permite entrar para ver o design
      window.location.href = '/vistorias.html';
    }
  });
  }
});
