/**
 * Lógica da tela de Login
 */

document.addEventListener('DOMContentLoaded', () => {
  // Se já estiver logado, redireciona diretamente
  const usuarioLogado = AUTH.getUsuario();
  if (usuarioLogado) {
    window.location.href = '/vistorias.html';
    return;
  }

  const form = document.getElementById('form-login');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnEntrar = document.getElementById('btn-entrar');
  const alerta = document.getElementById('mensagem-alerta');

  const btnAnalista = document.getElementById('preencher-analista');
  const btnOperador = document.getElementById('preencher-operador');

  // Preenchimento rápido para testes
  if (btnAnalista) {
    btnAnalista.addEventListener('click', () => {
      emailInput.value = 'analista@vistoria.com';
      senhaInput.value = '123456';
      esconderAlerta();
    });
  }

  if (btnOperador) {
    btnOperador.addEventListener('click', () => {
      emailInput.value = 'operador@vistoria.com';
      senhaInput.value = '123456';
      esconderAlerta();
    });
  }

  function mostrarAlerta(mensagem, tipo = 'danger') {
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensagem;
    alerta.classList.remove('d-none');
  }

  function esconderAlerta() {
    alerta.classList.add('d-none');
    alerta.textContent = '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderAlerta();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      mostrarAlerta('Por favor, informe o e-mail e a senha.');
      return;
    }

    try {
      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando...';

      const resposta = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        mostrarAlerta(dados.erro || 'Falha ao autenticar. Verifique seus dados.');
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
        return;
      }

      // Salva a sessão no localStorage
      AUTH.salvarUsuario(dados);

      // Redireciona para vistorias.html (ou usuarios.html se for Analista e vistorias ainda não existir)
      window.location.href = '/vistorias.html';
    } catch (err) {
      console.error('Erro na requisição de login:', err);
      mostrarAlerta('Não foi possível conectar ao servidor. Tente novamente.');
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
  });
});
