/**
 * L�gica da tela de Login
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnEntrar = document.getElementById('btn-entrar');
  const alerta = document.getElementById('mensagem-alerta');

  const btnAnalista = document.getElementById('preencher-analista');
  const btnOperador = document.getElementById('preencher-operador');

  // Preenchimento r�pido para testes
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
    alerta.className = `alerta alerta-${tipo === 'danger' ? 'erro' : tipo}`;
    alerta.textContent = mensagem;
    alerta.classList.remove('oculto');
  }

  function esconderAlerta() {
    alerta.classList.add('oculto');
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

      // Salva a sess�o no localStorage
      AUTH.salvarUsuario(dados);

      // Redireciona para vistorias.html (ou usuarios.html se for Analista e vistorias ainda n�o existir)
      window.location.href = 'vistorias.html';
    } catch (err) {
      console.error('Erro na requisi��o de login:', err);
      mostrarAlerta('N�o foi poss�vel conectar ao servidor. Tente novamente.');
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
  });
});
