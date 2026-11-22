const { Router } = require('express');
const { autenticar, exigirPermissao } = require('../middlewares/auth');
const { uploadFotos } = require('../middlewares/upload');
const ocorrencias = require('../controllers/ocorrencias.controller');

const router = Router();

router.use('/ocorrencias', autenticar);

// Ocorrências de uma vistoria específica
router.get('/vistorias/:id/ocorrencias', autenticar, exigirPermissao('VISUALIZAR_OCORRENCIAS'), ocorrencias.listarPorVistoria);
router.post('/vistorias/:id/ocorrencias', autenticar, exigirPermissao('REGISTRAR_OCORRENCIAS'), uploadFotos, ocorrencias.criar);

// Histórico geral de ocorrências
router.get('/ocorrencias', exigirPermissao('VISUALIZAR_OCORRENCIAS'), ocorrencias.listar);
router.get('/ocorrencias/:id', exigirPermissao('VISUALIZAR_OCORRENCIAS'), ocorrencias.buscarPorId);
router.put('/ocorrencias/:id', exigirPermissao('REGISTRAR_OCORRENCIAS'), ocorrencias.atualizar);
router.delete('/ocorrencias/:id', exigirPermissao('REGISTRAR_OCORRENCIAS'), ocorrencias.excluir);

module.exports = router;
