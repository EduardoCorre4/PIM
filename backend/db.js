require('dotenv').config();

const sql = require('mssql');

const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const intervaloReconexaoMs = process.env.DB_RETRY_DELAY_MS
    ? Number(process.env.DB_RETRY_DELAY_MS)
    : 5000;
const maxTentativas = process.env.DB_MAX_RETRIES
    ? Number(process.env.DB_MAX_RETRIES)
    : 30;

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        instanceName: process.env.DB_INSTANCE || undefined,
        trustServerCertificate: true
    }
};

if (dbPort) {
    config.port = dbPort;
}

async function conectar() {
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
        try {
            await sql.connect(config);
            console.log('Conectado ao SQL Server');
            return;
        }
        catch (erro) {
            console.error(`Tentativa ${tentativa}/${maxTentativas} de conexao com o SQL Server falhou.`);
            console.error(erro.message);

            if (tentativa === maxTentativas) {
                throw erro;
            }

            await new Promise((resolve) => {
                setTimeout(resolve, intervaloReconexaoMs);
            });
        }
    }
}

module.exports = {
    sql,
    conectar
};
