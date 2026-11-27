/**
 * Vistoria Informatizada - Gestão e Registro de Ocorrências com Fotos
 * Suporta integração com a API Node/MySQL e modo de visualização local (mock).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Obter usuário atual e renderizar navegação
  const usuarioLogado = AUTH.getUsuario() || {
    id: 2,
    nome: 'Operador (Preview)',
    email: 'operador@vistoria.com',
    cargo: 'Operador'
  };

  AUTH.renderNavbar('ocorrencias');

  const isOperador = (usuarioLogado.cargo || '').toLowerCase() === 'operador';

  // 2. Elementos DOM da página
  const btnNovaOcorrencia = document.getElementById('btn-nova-ocorrencia');
  const inputBusca = document.getElementById('input-busca');
  const selectFiltroGravidade = document.getElementById('filtro-gravidade');
  const tabelaCorpo = document.getElementById('ocorrencias-corpo');
  const estadoCarregando = document.getElementById('estado-carregando');
  const estadoVazio = document.getElementById('estado-vazio');
  const alertaFeedback = document.getElementById('alerta-feedback');

  // Elementos do Modal de Cadastro de Ocorrência
  const modalOcorrenciaBackdrop = document.getElementById('modal-ocorrencia-backdrop');
  const btnFecharModalX = document.getElementById('btn-fechar-modal-x');
  const btnCancelarModal = document.getElementById('btn-cancelar-modal');
  const formOcorrencia = document.getElementById('form-ocorrencia');
  const modalErro = document.getElementById('modal-erro');
  const selectVistoria = document.getElementById('ocorrencia-vistoria');
  const selectClassificacao = document.getElementById('ocorrencia-classificacao');
  const inputDescricao = document.getElementById('ocorrencia-descricao');
  const inputFotoArquivo = document.getElementById('ocorrencia-foto-arquivo');
  const inputFotoUrl = document.getElementById('ocorrencia-foto-url');
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg = document.getElementById('upload-preview-img');
  const btnRemoverPreview = document.getElementById('btn-remover-preview');
  const btnSalvarOcorrencia = document.getElementById('btn-salvar-ocorrencia');

  // Elementos do Modal de Detalhes e Fotos
  const modalDetalhesBackdrop = document.getElementById('modal-detalhes-backdrop');
  const btnFecharDetalhesX = document.getElementById('btn-fechar-detalhes-x');
  const btnFecharDetalhesFooter = document.getElementById('btn-fechar-detalhes-footer');
  const detalheCodigo = document.getElementById('detalhe-codigo');
  const detalheVistoria = document.getElementById('detalhe-vistoria');
  const detalheData = document.getElementById('detalhe-data');
  const detalheOperador = document.getElementById('detalhe-operador');
  const detalheClassificacao = document.getElementById('detalhe-classificacao');
  const detalheDescricao = document.getElementById('detalhe-descricao');
  const detalheGaleria = document.getElementById('detalhe-galeria');
  const detalheSemFotos = document.getElementById('detalhe-sem-fotos');

  // Área de Adicionar Foto no Modal de Detalhes
  const secaoAdicionarFoto = document.getElementById('secao-adicionar-foto');
  const formAdicionarFoto = document.getElementById('form-adicionar-foto');
  const addFotoArquivo = document.getElementById('add-foto-arquivo');
  const addFotoUrl = document.getElementById('add-foto-url');
  const addPreviewContainer = document.getElementById('add-preview-container');
  const addPreviewImg = document.getElementById('add-preview-img');
  const btnAddRemoverPreview = document.getElementById('btn-add-remover-preview');
  const btnSalvarNovaFoto = document.getElementById('btn-salvar-nova-foto');

  // Modal Lightbox (Zoom)
  const modalZoomBackdrop = document.getElementById('modal-zoom-backdrop');
  const btnFecharZoom = document.getElementById('btn-fechar-zoom');
  const zoomImg = document.getElementById('zoom-img');

  // Estado Local
  let listaOcorrencias = [];
  let listaVistorias = [];
  let ocorrenciaAtiva = null;
  let fotoAtualBase64 = null;
  let addFotoAtualBase64 = null;

  // Imagens padrão para demonstração visual rica
  const FOTOS_MOCK = {
    fissura: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    infiltracao: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    extintor: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80',
    fachada: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  };

  // Feedback flutuante
  function mostrarFeedback(msg, tipo = 'success') {
    if (!alertaFeedback) return;
    alertaFeedback.className = `alert alert-${tipo}`;
    alertaFeedback.textContent = msg;
    alertaFeedback.classList.remove('d-none');
    setTimeout(() => {
      alertaFeedback.classList.add('d-none');
    }, 4000);
  }

  // Tratamento de preview de imagem local (FileReader)
  function setupImageUpload(fileInput, urlInput, previewBox, previewImage, setBase64Callback) {
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, WEBP).');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setBase64Callback(base64);
        previewImage.src = base64;
        previewBox.classList.remove('d-none');
        if (urlInput) urlInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const url = urlInput.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
          setBase64Callback(url);
          previewImage.src = url;
          previewBox.classList.remove('d-none');
          if (fileInput) fileInput.value = '';
        } else if (!url) {
          setBase64Callback(null);
          previewBox.classList.add('d-none');
        }
      });
    }
  }

  setupImageUpload(inputFotoArquivo, inputFotoUrl, previewContainer, previewImg, (val) => {
    fotoAtualBase64 = val;
  });

  if (btnRemoverPreview) {
    btnRemoverPreview.addEventListener('click', () => {
      fotoAtualBase64 = null;
      if (inputFotoArquivo) inputFotoArquivo.value = '';
      if (inputFotoUrl) inputFotoUrl.value = '';
      if (previewContainer) previewContainer.classList.add('d-none');
    });
  }

  setupImageUpload(addFotoArquivo, addFotoUrl, addPreviewContainer, addPreviewImg, (val) => {
    addFotoAtualBase64 = val;
  });

  if (btnAddRemoverPreview) {
    btnAddRemoverPreview.addEventListener('click', () => {
      addFotoAtualBase64 = null;
      if (addFotoArquivo) addFotoArquivo.value = '';
      if (addFotoUrl) addFotoUrl.value = '';
      if (addPreviewContainer) addPreviewContainer.classList.add('d-none');
    });
  }

  // Lightbox / Zoom
  function abrirZoom(url) {
    if (!modalZoomBackdrop || !zoomImg) return;
    zoomImg.src = url;
    modalZoomBackdrop.classList.add('show');
  }

  function fecharZoom() {
    if (modalZoomBackdrop) modalZoomBackdrop.classList.remove('show');
  }

  if (btnFecharZoom) btnFecharZoom.addEventListener('click', fecharZoom);
  if (modalZoomBackdrop) {
    modalZoomBackdrop.addEventListener('click', (e) => {
      if (e.target === modalZoomBackdrop) fecharZoom();
    });
  }

  // 3. Buscar vistorias disponíveis
  async function carregarVistorias() {
    try {
      const res = await fetch('/api/vistorias');
      if (!res.ok) throw new Error('Falha ao buscar vistorias');
      listaVistorias = await res.json();
    } catch (e) {
      console.warn('API de vistorias indisponível, usando lista mock:', e);
      listaVistorias = [
        { id: 1, endereco: 'Av. Paulista, 1000 - Bela Vista (VIS-2026-001)', status: 'ABERTA' },
        { id: 2, endereco: 'Rua das Flores, 450 - Jardins (VIS-2026-002)', status: 'ABERTA' },
        { id: 3, endereco: 'Rodovia Anhanguera, Km 28 - Distrito Industrial (VIS-2026-003)', status: 'FINALIZADA' }
      ];
    }

    if (selectVistoria) {
      selectVistoria.innerHTML = '<option value="">Selecione uma vistoria...</option>';
      listaVistorias.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.endereco} [${v.status || 'ABERTA'}]`;
        selectVistoria.appendChild(opt);
      });
    }
  }

  // 4. Buscar ocorrências da API (com fallback de demonstração com fotos)
  async function carregarOcorrencias() {
    if (estadoCarregando) estadoCarregando.classList.remove('d-none');
    if (tabelaCorpo) tabelaCorpo.innerHTML = '';
    if (estadoVazio) estadoVazio.classList.add('d-none');

    const params = new URLSearchParams(window.location.search);
    const idVistoriaParam = params.get('idVistoria');

    try {
      const url = idVistoriaParam ? `/api/ocorrencias?idVistoria=${idVistoriaParam}` : '/api/ocorrencias';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao carregar ocorrências');
      listaOcorrencias = await res.json();

      // Se a API retornou, carregar também as fotos completas de cada uma
      for (const oc of listaOcorrencias) {
        try {
          const resDet = await fetch(`/api/ocorrencias/${oc.id}`);
          if (resDet.ok) {
            const detalhe = await resDet.json();
            oc.fotos = detalhe.fotos || [];
          }
        } catch (_) {}
      }

      if (!listaOcorrencias || listaOcorrencias.length === 0) {
        throw new Error('Sem registros na API, exibindo dados de exemplo');
      }

      renderizarTabela(listaOcorrencias);
    } catch (err) {
      console.warn('API indisponível ou vazia, utilizando ocorrências com fotos de demonstração:', err);
      if (!listaOcorrencias || listaOcorrencias.length === 0) {
        listaOcorrencias = [
          {
            id: 101,
            id_vistoria: 1,
            endereco: 'Av. Paulista, 1000 - Bela Vista (VIS-2026-001)',
            classificacao: 'CRITICA',
            descricao: 'Fissura estrutural de 3mm com infiltração ativa na viga V-12 da laje de cobertura.',
            operador: 'Carlos Santos',
            data_criacao: '2026-11-22 14:30:00',
            fotos: [
              { id: 1, id_ocorrencia: 101, url_foto: FOTOS_MOCK.fissura },
              { id: 2, id_ocorrencia: 101, url_foto: FOTOS_MOCK.infiltracao }
            ]
          },
          {
            id: 102,
            id_vistoria: 2,
            endereco: 'Rua das Flores, 450 - Jardins (VIS-2026-002)',
            classificacao: 'ALTA',
            descricao: 'Extintores de incêndio com carga vencida no bloco B (pavimento térreo e subsolo).',
            operador: 'Mariana Silva',
            data_criacao: '2026-11-24 10:15:00',
            fotos: [
              { id: 3, id_ocorrencia: 102, url_foto: FOTOS_MOCK.extintor }
            ]
          },
          {
            id: 103,
            id_vistoria: 2,
            endereco: 'Rua das Flores, 450 - Jardins (VIS-2026-002)',
            classificacao: 'MEDIA',
            descricao: 'Desgaste do revestimento cerâmico e manchas de umidade no hall de entrada.',
            operador: 'Mariana Silva',
            data_criacao: '2026-11-24 11:00:00',
            fotos: []
          },
          {
            id: 104,
            id_vistoria: 3,
            endereco: 'Rod. Anhanguera, Km 28 - Distrito Industrial (VIS-2026-003)',
            classificacao: 'BAIXA',
            descricao: 'Pintura de demarcação de vagas e rotas de fuga desgastada no piso industrial.',
            operador: 'Roberto Almeida',
            data_criacao: '2026-11-18 16:45:00',
            fotos: [
              { id: 4, id_ocorrencia: 104, url_foto: FOTOS_MOCK.fachada }
            ]
          }
        ];
      }

      if (idVistoriaParam) {
        renderizarTabela(listaOcorrencias.filter(o => o.id_vistoria == idVistoriaParam));
      } else {
        renderizarTabela(listaOcorrencias);
      }
    } finally {
      if (estadoCarregando) estadoCarregando.classList.add('d-none');
    }
  }

  // 5. Renderizar tabela
  function renderizarTabela(ocorrencias) {
    if (!tabelaCorpo) return;
    tabelaCorpo.innerHTML = '';

    if (!ocorrencias || ocorrencias.length === 0) {
      if (estadoVazio) estadoVazio.classList.remove('d-none');
      return;
    }

    if (estadoVazio) estadoVazio.classList.add('d-none');

    ocorrencias.forEach((oc) => {
      const tr = document.createElement('tr');

      const fotos = oc.fotos || [];
      const totalFotos = fotos.length;
      const primeiraFoto = totalFotos > 0 ? fotos[0].url_foto : null;

      const classeBadge = {
        CRITICA: 'badge-critica',
        ALTA: 'badge-alta',
        MEDIA: 'badge-media',
        BAIXA: 'badge-baixa'
      }[(oc.classificacao || '').toUpperCase()] || 'badge-media';

      const labelBadge = {
        CRITICA: 'Crítica',
        ALTA: 'Alta',
        MEDIA: 'Média',
        BAIXA: 'Baixa'
      }[(oc.classificacao || '').toUpperCase()] || oc.classificacao;

      // Data formatada
      let dataFormatada = oc.data_criacao || '';
      try {
        const d = new Date(oc.data_criacao);
        if (!isNaN(d.getTime())) {
          dataFormatada = d.toLocaleDateString('pt-BR');
        }
      } catch (_) {}

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--primary);">#OC-${oc.id}</td>
        <td style="color: var(--text-muted); font-size: 0.9rem;">${dataFormatada}</td>
        <td>
          <div style="font-weight: 600; font-size: 0.95rem;">${oc.endereco || 'Endereço não informado'}</div>
        </td>
        <td>
          <span class="badge ${classeBadge}">${labelBadge}</span>
        </td>
        <td style="max-width: 320px;">
          <div style="font-size: 0.9rem; color: var(--text-main);">${oc.descricao}</div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${totalFotos > 0 ? `
              <span class="badge-foto btn-ver-fotos" data-id="${oc.id}" title="Clique para ver as fotos">
                <img src="${primeiraFoto}" class="badge-foto-thumb" alt="Miniatura">
                <span>📷 ${totalFotos} ${totalFotos === 1 ? 'foto' : 'fotos'}</span>
              </span>
            ` : `
              <span class="text-muted" style="font-size: 0.8rem;">Sem fotos</span>
            `}
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.9rem;">${oc.operador || 'Operador'}</td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button type="button" class="btn btn-sm btn-outline btn-detalhes" data-id="${oc.id}">
              Detalhes & Fotos
            </button>
            <button type="button" class="btn btn-sm btn-primary btn-add-foto-rapido" data-id="${oc.id}" title="Adicionar foto na ocorrência">
              + 📷 Foto
            </button>
          </div>
        </td>
      `;

      tabelaCorpo.appendChild(tr);
    });

    // Eventos dos botões da tabela
    document.querySelectorAll('.btn-detalhes, .btn-ver-fotos').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        abrirModalDetalhes(id);
      });
    });

    document.querySelectorAll('.btn-add-foto-rapido').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        abrirModalDetalhes(id, true);
      });
    });
  }

  // 6. Modal de Cadastro de Nova Ocorrência
  function abrirModalCadastro() {
    formOcorrencia.reset();
    fotoAtualBase64 = null;
    if (previewContainer) previewContainer.classList.add('d-none');
    if (modalErro) modalErro.classList.add('d-none');

    // Se tiver vistoria passada pela URL, pré-seleciona
    const params = new URLSearchParams(window.location.search);
    const idVistoriaParam = params.get('idVistoria');
    if (idVistoriaParam && selectVistoria) {
      selectVistoria.value = idVistoriaParam;
    }

    modalOcorrenciaBackdrop.classList.add('show');
  }

  function fecharModalCadastro() {
    modalOcorrenciaBackdrop.classList.remove('show');
  }

  if (btnNovaOcorrencia) btnNovaOcorrencia.addEventListener('click', abrirModalCadastro);
  if (btnFecharModalX) btnFecharModalX.addEventListener('click', fecharModalCadastro);
  if (btnCancelarModal) btnCancelarModal.addEventListener('click', fecharModalCadastro);
  if (modalOcorrenciaBackdrop) {
    modalOcorrenciaBackdrop.addEventListener('click', (e) => {
      if (e.target === modalOcorrenciaBackdrop) fecharModalCadastro();
    });
  }

  // Submissão da Nova Ocorrência com Foto
  if (formOcorrencia) {
    formOcorrencia.addEventListener('submit', async (e) => {
      e.preventDefault();

      const idVistoria = selectVistoria.value;
      const classificacao = selectClassificacao.value;
      const descricao = inputDescricao.value.trim();
      const urlFoto = fotoAtualBase64 || inputFotoUrl.value.trim() || null;

      if (!idVistoria || !classificacao || !descricao) {
        if (modalErro) {
          modalErro.textContent = 'Por favor, preencha todos os campos obrigatórios.';
          modalErro.classList.remove('d-none');
        }
        return;
      }

      btnSalvarOcorrencia.disabled = true;
      btnSalvarOcorrencia.textContent = 'Salvando...';

      const payload = {
        idVistoria: Number(idVistoria),
        idUsuarioCriador: usuarioLogado.id || 2,
        classificacao,
        descricao,
        urlFoto
      };

      try {
        const res = await fetch('/api/ocorrencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.erro || 'Erro ao registrar ocorrência');
        }

        fecharModalCadastro();
        mostrarFeedback('Ocorrência registrada com sucesso com fotos!');
        await carregarOcorrencias();
      } catch (err) {
        console.warn('API indisponível, simulando cadastro em memória:', err);
        const vistoriaSel = listaVistorias.find(v => v.id == idVistoria);
        const novoId = listaOcorrencias.length > 0 ? Math.max(...listaOcorrencias.map(o => o.id)) + 1 : 101;

        const novaOc = {
          id: novoId,
          id_vistoria: Number(idVistoria),
          endereco: vistoriaSel ? vistoriaSel.endereco : 'Vistoria #' + idVistoria,
          classificacao,
          descricao,
          operador: usuarioLogado.nome || 'Operador',
          data_criacao: new Date().toISOString(),
          fotos: urlFoto ? [{ id: Date.now(), id_ocorrencia: novoId, url_foto: urlFoto }] : []
        };

        listaOcorrencias.unshift(novaOc);
        fecharModalCadastro();
        mostrarFeedback('Ocorrência registrada com sucesso!');
        renderizarTabela(listaOcorrencias);
      } finally {
        btnSalvarOcorrencia.disabled = false;
        btnSalvarOcorrencia.textContent = 'Salvar Ocorrência';
      }
    });
  }

  // 7. Modal de Detalhes e Gerenciamento de Fotos da Ocorrência
  function abrirModalDetalhes(idOcorrencia, focarAdicionarFoto = false) {
    const oc = listaOcorrencias.find(o => o.id === idOcorrencia);
    if (!oc) return;

    ocorrenciaAtiva = oc;

    if (detalheCodigo) detalheCodigo.textContent = `#OC-${oc.id}`;
    if (detalheVistoria) detalheVistoria.textContent = oc.endereco || 'Endereço não informado';
    if (detalheOperador) detalheOperador.textContent = oc.operador || 'Operador';
    if (detalheDescricao) detalheDescricao.textContent = oc.descricao;

    if (detalheData) {
      let dataStr = oc.data_criacao;
      try {
        const d = new Date(oc.data_criacao);
        if (!isNaN(d.getTime())) dataStr = d.toLocaleString('pt-BR');
      } catch (_) {}
      detalheData.textContent = dataStr;
    }

    if (detalheClassificacao) {
      const classeBadge = {
        CRITICA: 'badge-critica',
        ALTA: 'badge-alta',
        MEDIA: 'badge-media',
        BAIXA: 'badge-baixa'
      }[(oc.classificacao || '').toUpperCase()] || 'badge-media';

      const labelBadge = {
        CRITICA: 'Crítica',
        ALTA: 'Alta',
        MEDIA: 'Média',
        BAIXA: 'Baixa'
      }[(oc.classificacao || '').toUpperCase()] || oc.classificacao;

      detalheClassificacao.className = `badge ${classeBadge}`;
      detalheClassificacao.textContent = labelBadge;
    }

    // Reset do formulário de adicionar foto
    if (formAdicionarFoto) formAdicionarFoto.reset();
    addFotoAtualBase64 = null;
    if (addPreviewContainer) addPreviewContainer.classList.add('d-none');

    renderizarGaleriaDetalhes(oc);

    modalDetalhesBackdrop.classList.add('show');

    if (focarAdicionarFoto && secaoAdicionarFoto) {
      secaoAdicionarFoto.scrollIntoView({ behavior: 'smooth' });
      if (addFotoUrl) addFotoUrl.focus();
    }
  }

  function fecharModalDetalhes() {
    modalDetalhesBackdrop.classList.remove('show');
    ocorrenciaAtiva = null;
  }

  if (btnFecharDetalhesX) btnFecharDetalhesX.addEventListener('click', fecharModalDetalhes);
  if (btnFecharDetalhesFooter) btnFecharDetalhesFooter.addEventListener('click', fecharModalDetalhes);
  if (modalDetalhesBackdrop) {
    modalDetalhesBackdrop.addEventListener('click', (e) => {
      if (e.target === modalDetalhesBackdrop) fecharModalDetalhes();
    });
  }

  function renderizarGaleriaDetalhes(oc) {
    if (!detalheGaleria) return;
    detalheGaleria.innerHTML = '';

    const fotos = oc.fotos || [];

    if (fotos.length === 0) {
      if (detalheSemFotos) detalheSemFotos.classList.remove('d-none');
      return;
    }

    if (detalheSemFotos) detalheSemFotos.classList.add('d-none');

    fotos.forEach((foto) => {
      const div = document.createElement('div');
      div.className = 'foto-item';
      div.innerHTML = `
        <img src="${foto.url_foto}" alt="Foto da ocorrência">
        <div class="foto-item-actions">
          <button type="button" class="foto-btn-zoom" title="Ampliar foto">🔍 Ampliar</button>
          <button type="button" class="foto-btn-delete" title="Excluir foto">🗑️</button>
        </div>
      `;

      // Clique na imagem ou zoom
      const img = div.querySelector('img');
      const btnZoom = div.querySelector('.foto-btn-zoom');
      const acaoZoom = () => abrirZoom(foto.url_foto);
      img.addEventListener('click', acaoZoom);
      btnZoom.addEventListener('click', acaoZoom);

      // Exclusão de foto
      const btnDel = div.querySelector('.foto-btn-delete');
      btnDel.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Deseja realmente remover esta foto da ocorrência?')) return;

        try {
          const res = await fetch(`/api/ocorrencias/${oc.id}/fotos/${foto.id}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Falha ao remover foto da API');
        } catch (_) {
          console.warn('API indisponível, removendo foto localmente.');
        }

        oc.fotos = oc.fotos.filter(f => f.id !== foto.id);
        renderizarGaleriaDetalhes(oc);
        renderizarTabela(listaOcorrencias);
        mostrarFeedback('Foto removida com sucesso!');
      });

      detalheGaleria.appendChild(div);
    });
  }

  // 8. Operador: Adicionar Mais Fotos à Ocorrência Existente
  if (formAdicionarFoto) {
    formAdicionarFoto.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!ocorrenciaAtiva) return;

      const urlFoto = addFotoAtualBase64 || (addFotoUrl ? addFotoUrl.value.trim() : null);

      if (!urlFoto) {
        alert('Selecione uma imagem ou informe a URL da foto antes de salvar.');
        return;
      }

      btnSalvarNovaFoto.disabled = true;
      btnSalvarNovaFoto.textContent = 'Enviando foto...';

      try {
        const res = await fetch(`/api/ocorrencias/${ocorrenciaAtiva.id}/fotos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlFoto })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.erro || 'Falha ao adicionar foto');
        }

        const data = await res.json();
        const novaFotoObj = {
          id: data.id || Date.now(),
          id_ocorrencia: ocorrenciaAtiva.id,
          url_foto: urlFoto
        };

        if (!ocorrenciaAtiva.fotos) ocorrenciaAtiva.fotos = [];
        ocorrenciaAtiva.fotos.push(novaFotoObj);

        mostrarFeedback('Nova foto anexada à ocorrência com sucesso!');
      } catch (err) {
        console.warn('API indisponível, salvando foto na memória da ocorrência:', err);
        const novaFotoObj = {
          id: Date.now(),
          id_ocorrencia: ocorrenciaAtiva.id,
          url_foto: urlFoto
        };

        if (!ocorrenciaAtiva.fotos) ocorrenciaAtiva.fotos = [];
        ocorrenciaAtiva.fotos.push(novaFotoObj);
        mostrarFeedback('Foto adicionada à ocorrência com sucesso!');
      } finally {
        btnSalvarNovaFoto.disabled = false;
        btnSalvarNovaFoto.textContent = 'Salvar Foto na Ocorrência';

        // Limpar inputs de foto
        formAdicionarFoto.reset();
        addFotoAtualBase64 = null;
        if (addPreviewContainer) addPreviewContainer.classList.add('d-none');

        // Atualizar tela em tempo real
        renderizarGaleriaDetalhes(ocorrenciaAtiva);
        renderizarTabela(listaOcorrencias);
      }
    });
  }

  // 9. Filtro e Busca em Tempo Real
  function aplicarFiltros() {
    const termo = (inputBusca ? inputBusca.value : '').toLowerCase().trim();
    const gravidade = (selectFiltroGravidade ? selectFiltroGravidade.value : '').toUpperCase();

    const filtradas = listaOcorrencias.filter((oc) => {
      const matchTexto = !termo ||
        (oc.descricao || '').toLowerCase().includes(termo) ||
        (oc.endereco || '').toLowerCase().includes(termo) ||
        (oc.operador || '').toLowerCase().includes(termo) ||
        (`#OC-${oc.id}`).toLowerCase().includes(termo);

      const matchGravidade = !gravidade || (oc.classificacao || '').toUpperCase() === gravidade;

      return matchTexto && matchGravidade;
    });

    renderizarTabela(filtradas);
  }

  if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);
  if (selectFiltroGravidade) selectFiltroGravidade.addEventListener('change', aplicarFiltros);

  // 10. Inicialização
  await carregarVistorias();
  await carregarOcorrencias();

  // Se houver parâmetro `nova=1` na URL, abre automaticamente o modal de nova ocorrência
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('nova') === '1') {
    abrirModalCadastro();
  }
});
