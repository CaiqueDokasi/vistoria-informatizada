const { Router } = require('express');

const router = Router();

router.get('/status', (req, res) => res.json({ status: 'ok', sistema: 'Vistoria Informatizada' }));

router.use(require('./auth.routes'));
router.use(require('./usuarios.routes'));
router.use(require('./vistorias.routes'));
router.use(require('./ocorrencias.routes'));

module.exports = router;
