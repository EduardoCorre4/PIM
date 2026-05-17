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

module.exports = router;
