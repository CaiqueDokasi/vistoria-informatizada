const { Router } = require('express');
const { autenticar, exigirPermissao } = require('../middlewares/auth');
const usuarios = require('../controllers/usuarios.controller');

const router = Router();

// Todas as rotas abaixo exigem login
router.use('/usuarios', autenticar);
router.use('/cargos', autenticar);

// Lista de operadores: usada pelo analista ao escolher o responsável da vistoria
router.get('/usuarios/operadores', exigirPermissao('GERENCIAR_VISTORIAS'), usuarios.listarOperadores);

// Gestão de usuários e cargos
router.get('/cargos', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.listarCargos);
router.get('/usuarios', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.listar);
router.get('/usuarios/:id', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.buscarPorId);
router.post('/usuarios', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.criar);
router.put('/usuarios/:id', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.atualizar);
router.delete('/usuarios/:id', exigirPermissao('GERENCIAR_USUARIOS'), usuarios.excluir);

module.exports = router;
