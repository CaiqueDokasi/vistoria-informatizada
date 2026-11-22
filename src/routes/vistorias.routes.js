const { Router } = require('express');
const { autenticar, exigirPermissao } = require('../middlewares/auth');
const { uploadFotos } = require('../middlewares/upload');
const vistorias = require('../controllers/vistorias.controller');

const router = Router();

router.use('/vistorias', autenticar);

// Analista e operador podem visualizar
router.get('/vistorias', exigirPermissao('VISUALIZAR_VISTORIAS'), vistorias.listar);
router.get('/vistorias/:id', exigirPermissao('VISUALIZAR_VISTORIAS'), vistorias.buscarPorId);

// Somente analista pode incluir, alterar e excluir
router.post('/vistorias', exigirPermissao('GERENCIAR_VISTORIAS'), uploadFotos, vistorias.criar);
router.put('/vistorias/:id', exigirPermissao('GERENCIAR_VISTORIAS'), vistorias.atualizar);
router.delete('/vistorias/:id', exigirPermissao('GERENCIAR_VISTORIAS'), vistorias.excluir);
router.post('/vistorias/:id/fotos', exigirPermissao('GERENCIAR_VISTORIAS'), uploadFotos, vistorias.adicionarFotos);

module.exports = router;
