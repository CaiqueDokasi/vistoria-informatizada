const { Router } = require('express');
const { autenticar } = require('../middlewares/auth');
const auth = require('../controllers/auth.controller');

const router = Router();

router.post('/auth/login', auth.login);
router.get('/auth/me', autenticar, auth.me);

module.exports = router;
