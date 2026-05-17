const express = require('express');

const routes = express.Router();

const { sql } = require('../db');



// ========================================
// CADASTRAR CONTRATO
// ========================================

routes.post('/cadastrar', async (req, res) => {

    try {

        const {

            nome,
            tipo_cto,
            inicio_contrato,
            fim_contrato,
            valor_contrato,

            sla_horas,
            suporte_24h,

            quantidade_usuarios,
            possui_backup,

            nivel_seguranca,
            monitoramento

        } = req.body;


        // ========================================
        // INSERE NA TABELA CTO
        // ========================================

        const resultado = await sql.query`

            INSERT INTO CTO (

                empresa,
                tipo_contrato,
                data_inicio,
                data_fim,
                valor,
                status_contrato

            )

            OUTPUT INSERTED.id_cto

            VALUES (

                ${nome},
                ${tipo_cto},
                ${inicio_contrato},
                ${fim_contrato},
                ${valor_contrato},
                'ATIVO'

            )

        `;


        const id_cto =
            resultado.recordset[0].id_cto;


        // ========================================
        // CONTRATO SP
        // ========================================

        if (tipo_cto === 'SP') {

            await sql.query`

                INSERT INTO SP (

                    id_cto,
                    sla_horas,
                    suporte_24h

                )

                VALUES (

                    ${id_cto},
                    ${sla_horas},
                    ${suporte_24h ? 1 : 0}

                )

            `;

        }


        // ========================================
        // CONTRATO SI
        // ========================================

        else if (tipo_cto === 'SI') {

            await sql.query`

                INSERT INTO SI (

                    id_cto,
                    quantidade_usuarios,
                    possui_backup

                )

                VALUES (

                    ${id_cto},
                    ${quantidade_usuarios},
                    ${possui_backup ? 1 : 0}

                )

            `;

        }


        // ========================================
        // CONTRATO CS
        // ========================================

        else if (tipo_cto === 'CS') {

            await sql.query`

                INSERT INTO CS (

                    id_cto,
                    nivel_seguranca,
                    monitoramento

                )

                VALUES (

                    ${id_cto},
                    ${nivel_seguranca},
                    ${monitoramento ? 1 : 0}

                )

            `;

        }


        // ========================================
        // SUCESSO
        // ========================================

        res.json({

            mensagem:
                'Contrato cadastrado com sucesso!',

            id_cto

        });

    }


    // ========================================
    // ERRO
    // ========================================

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao cadastrar contrato'

        });

    }

});



// ========================================
// LISTAR CONTRATOS
// ========================================

routes.get('/', async (req, res) => {

    try {

        const resultado = await sql.query`

            SELECT

                id_cto,
                empresa,
                tipo_contrato,
                status_contrato

            FROM CTO

            ORDER BY id_cto DESC

        `;

        res.json(resultado.recordset);

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao buscar contratos'

        });

    }

});

routes.get('/empresa/:nome', async (req, res) => {

    try {

        const nome =
            req.params.nome;

        const resultado = await sql.query`

            SELECT
                id_cto,
                tipo_contrato

            FROM CTO

            WHERE empresa = ${nome}
            AND status_contrato = 'ATIVO'

        `;

        res.json(resultado.recordset);

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao buscar empresa'

        });

    }

});


// ========================================
// BUSCAR CONTRATO POR ID
// ========================================

routes.get('/:id', async (req, res) => {

    try {

        const id =
            req.params.id;


        const resultado = await sql.query`

            SELECT
                *
            FROM CTO

            WHERE id_cto = ${id}

        `;


        if (resultado.recordset.length === 0) {

            return res.status(404).json({

                erro:
                    'Contrato não encontrado'

            });

        }


        res.json(resultado.recordset[0]);

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao buscar contrato'

        });

    }

});



module.exports = routes;