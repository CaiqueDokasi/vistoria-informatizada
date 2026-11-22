// Upload de fotos com multer: os arquivos vão para a pasta /uploads
// e no banco salvamos apenas o caminho (ex.: /uploads/1700000000000-123.jpg)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PASTA_UPLOADS = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

const armazenamento = multer.diskStorage({
  destination: PASTA_UPLOADS,
  filename: (req, arquivo, cb) => {
    const extensao = path.extname(arquivo.originalname).toLowerCase();
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    cb(null, nomeUnico);
  }
});

const upload = multer({
  storage: armazenamento,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB por foto
  fileFilter: (req, arquivo, cb) => {
    if (arquivo.mimetype.startsWith('image/')) return cb(null, true);
    const erro = new Error('Apenas imagens são permitidas.');
    erro.status = 400;
    cb(erro);
  }
});

// Aceita até 5 fotos no campo "fotos" do formulário (multipart/form-data)
const uploadFotos = upload.array('fotos', 5);

// Converte os arquivos recebidos em URLs para salvar no banco
function urlsDasFotos(req) {
  return (req.files || []).map((arquivo) => `/uploads/${arquivo.filename}`);
}

// Apaga do disco os arquivos de uma lista de URLs (ignora erros)
function removerArquivos(urls) {
  for (const url of urls) {
    fs.unlink(path.join(PASTA_UPLOADS, path.basename(url)), () => {});
  }
}

module.exports = { uploadFotos, urlsDasFotos, removerArquivos };
