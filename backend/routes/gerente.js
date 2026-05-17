const express = require('express');

const router = express.Router();

const { sql } = require('../db');



/* =======================================
   ATUALIZAR CONTRATO
======================================= */

router.put('/contrato/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const {

            status_contrato,
            data_fim

        } = req.body;

        await sql.query`

            UPDATE CTO

            SET

                status_contrato = ${status_contrato},
                data_fim = ${data_fim}

            WHERE id_cto = ${id}

        `;



        res.json({

            mensagem:
                'Contrato atualizado!'

        });

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao atualizar contrato'

        });

    }

});



/* =======================================
   ATUALIZAR CONFIGURACOES DO CONTRATO
======================================= */

router.put('/configuracoes/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const {
            tipo,
            sla_horas,
            suporte_24h,
            quantidade_usuarios,
            possui_backup,
            nivel_seguranca,
            monitoramento
        } = req.body;

        if (tipo === 'SP') {

            await sql.query`

                UPDATE SP

                SET

                    sla_horas = ${sla_horas},
                    suporte_24h = ${suporte_24h ? 1 : 0}

                WHERE id_cto = ${id}

            `;
        }

        else if (tipo === 'SI') {

            await sql.query`

                UPDATE SI

                SET

                    quantidade_usuarios = ${quantidade_usuarios},
                    possui_backup = ${possui_backup ? 1 : 0}

                WHERE id_cto = ${id}

            `;
        }

        else if (tipo === 'CS') {

            await sql.query`

                UPDATE CS

                SET

                    nivel_seguranca = ${nivel_seguranca},
                    monitoramento = ${monitoramento ? 1 : 0}

                WHERE id_cto = ${id}

            `;
        }

        else {

            return res.status(400).json({
                erro: 'Tipo de contrato invalido'
            });
        }


        res.json({
            mensagem: 'Configuracoes atualizadas!'
        });

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar configuracoes'
        });

    }

});



/* =======================================
   ATUALIZAR CHAMADO
======================================= */

router.put('/chamado/:id', async (req, res) => {

    try {

        const id = req.params.id;

        const {

            status_chamado

        } = req.body;

        await sql.query`

            UPDATE CHAMADO

            SET

                status_chamado = ${status_chamado}

            WHERE id_chamado = ${id}

        `;



        res.json({

            mensagem:
                'Chamado atualizado!'

        });

    }

    catch (erro) {

        console.log(erro);

        res.status(500).json({

            erro:
                'Erro ao atualizar chamado'

        });

    }

});



module.exports = router;
