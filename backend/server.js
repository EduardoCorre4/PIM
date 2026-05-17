const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { conectar } = require('./db');

const contratosRoutes = require('./routes/contratos');
const chamadosRoutes = require('./routes/chamados');
const gerenteRoutes = require('./routes/gerente');

const app = express();
const frontendPath = path.resolve(__dirname, '../frontend');
const frontendExiste = fs.existsSync(frontendPath);
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

if (frontendExiste) {
    app.use(express.static(frontendPath));
}

app.get('/', (req, res) => {
    if (frontendExiste) {
        res.sendFile(path.join(frontendPath, 'index.html'));
        return;
    }

    res.json({ ok: true, mensagem: 'Backend do Sistema de Contratos JKE online.' });
});

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/contratos', contratosRoutes);
app.use('/chamados', chamadosRoutes);
app.use('/gerente', gerenteRoutes);

async function iniciarServidor() {
    await conectar();

    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
}

iniciarServidor().catch((erro) => {
    console.error('Nao foi possivel iniciar o backend.');
    console.error(erro.message);
    process.exit(1);
});
