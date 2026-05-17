const express = require('express');
const router = express.Router();

const { sql } = require('../db');

router.post('/abrir', async (req, res) => {

    try {

        const {
            id_cto,
            titulo,
            descricao,
            prioridade
        } = req.body;

        await sql.query`

            INSERT INTO CHAMADO (
                id_cto,
                titulo,
                descricao,
                prioridade,
                status_chamado
            )

            VALUES (
                ${id_cto},
                ${titulo},
                ${descricao},
                ${prioridade},
                'ABERTO'
            )

        `;


        res.json({
            mensagem: 'Chamado aberto com sucesso!'
        });

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro: 'Erro ao abrir chamado'
        });
    }

});

// ========================================
// LISTAR CHAMADOS POR STATUS
// ========================================

router.get('/status/:status', async (req, res) => {

    try {

        const status =
            req.params.status;

        const resultado = await sql.query`

            SELECT

                id_chamado,
                id_cto,
                titulo,
                prioridade,
                status_chamado

            FROM CHAMADO

            WHERE status_chamado = ${status}

            ORDER BY id_chamado DESC

        `;

        res.json(resultado.recordset);

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao buscar chamados'

        });

    }

});

module.exports = router;
