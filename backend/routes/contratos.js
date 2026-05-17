const express = require('express');

const routes = express.Router();

const { sql } = require('../db');



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

        // =============================
        // INSERE NO CTO
        // =============================

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



        // =============================
        // SP
        // =============================

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



        // =============================
        // SI
        // =============================

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



        // =============================
        // CS
        // =============================

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



        // =============================
        // SUCESSO
        // =============================

        res.json({

            mensagem:
                'Contrato cadastrado com sucesso!'

        });

    }


    // =============================
    // ERRO
    // =============================

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao cadastrar contrato'

        });

    }

});



module.exports = routes;
