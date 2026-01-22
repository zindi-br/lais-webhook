'use strict';

const moment = require('moment'); // require

const dialogflow = require('dialogflow');
const crypto = require('crypto');
const Promise = require('bluebird');
const randomBytes = Promise.promisify(crypto.randomBytes);
const axios = require('axios');
const { buscarDialogflow, soNumeros, initService } = require('../../../utils/functions');
const { initialize } = require('passport');
const config = require('../../../config/config')
const pdf2base64 = require('pdf-to-base64');


exports.home = (req, res, next) => {
    const { event, payload } = req.body;
    const { message, response_df, session } = payload;

    /// funções actions whatsapp
    const actionEnviarArquivoBase64Whatsapp = (querys, data) => {
        return axios({
            method: "post",
            url: `https://api.lais.app/api/v1/chats/canais/enviar-arquivo-base64${querys}`,
            data,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
    };

    const actionEnviarMensagemWhatsapp = (querys, data) => {
        return axios({
            method: "post",
            url: `https://api.lais.app/api/v1/chats/canais/enviar-mensagem${querys}`,
            data

        });
    };


    /// funções personalizadas

    async function buscarBoletoPorCpf(cpf) {
        let responseLink;
        try {
            let response = await axios.post(`https://api.lais.app/api/v1/custom/rac/buscar-cobranca-rac`, { cpf: cpf });
            responseLink = response.data
        } catch (error) {
            console.log('erro ao buscar cpf', error);
        }
        return responseLink;
    }

    function validaLink(link) {
        if (link.includes("FaturaHtml-flSegundaVia")) {
            return link.replace('FaturaHtml-flSegundaVia', 'SegundaVia-original')
        } else {
            console.log('nao converte')
            return link;
        }
    }

    async function downloadPDF(pdfUrl, phone, filename, pod) {
        try {
            if (pdfUrl) {
                let response = await pdf2base64(pdfUrl);
                let data = {
                    base64: "data:application/pdf;base64," + response,
                    phone: phone,
                    filename: filename
                }
                let querys = `?sessao=${session}&canal=whatsapp`
                await actionEnviarArquivoBase64Whatsapp(querys, data);
            }
        } catch (error) {
            console.log('Erro ao executar downloadPdf', error);
        }

    }

    ////////////////////////////// vem do functions

    async function convertUrlToBase64(url) {
        try {
            const res = await axios.get(url, {
                responseType: "text",
                responseEncoding: "base64",
            })
            return res.data;
        } catch (error) {
            console.log('error', error)
        }

    }



    async function initBuscaBoleto() {

        const mensagemCPfNaoEncontrado = "Não houve resultados.\nSe o cpf foi digitado corretamente, não há boleto aberto.\n\nPara tentar novamente digite *1*";



        if (payload.response_df.intent.displayName === "001 - fallback" || payload.response_df.intent.displayName === "001 - fallback - fallback" || payload.response_df.intent.displayName === "001") {
            console.log('payload.response_df.intent.displayName', payload.response_df.intent.displayName)
            if (payload.response_df.queryText.length === 11) {

                let buscaBoleto = await buscarBoletoPorCpf(payload.response_df.queryText);
                if (buscaBoleto.length > 0) {

                    for (let item of buscaBoleto.map(item => item)) {
                        let data = {
                            cpf: item.st_cpf_con,
                            data_vencimento: moment(new Date(item.dt_vencimento_recb)).format('DD/MM/YYYY'),
                            link_segundavia: item.link_segundavia
                        }

                        const boletoBase64 = await downloadPDF(validaLink(data.link_segundavia), soNumeros(message.chatId));
                        if (boletoBase64) {
                                let data = {
                                base64: "data:application/pdf;base64," + boletoBase64,
                                phone: soNumeros(message.chatId),
                                filename: `${data.cpf} - ${data.data_vencimento}`
                            }
                            let querys = `?sessao=${session}&canal=whatsapp`
                            await actionEnviarArquivoBase64Whatsapp(querys, data);
                        }
                    }
                } else {
                    let data = {
                        phone: soNumeros(message.chatId),
                        message:mensagemCPfNaoEncontrado
                    }
                    let querys = `?sessao=${session}&canal=whatsapp`
                    await actionEnviarMensagemWhatsapp(querys, data);
                    console.log('erro ao buscar link boleto');
                }

            } else if (payload.response_df.queryText.length === 14) {

                let buscaBoleto = await buscarBoletoPorCpf(payload.response_df.queryText);
                if (buscaBoleto.length > 0) {

                    for (const item of buscaBoleto.map(item => item)) {
                        let data = {
                            cpf: item.st_cpf_con,
                            data_vencimento: moment(new Date(item.dt_vencimento_recb)).format('DD/MM/YYYY'),
                            link_segundavia: item.link_segundavia
                        }
 
                        const boletoBase64 = await downloadPDF(validaLink(data.link_segundavia), soNumeros(message.chatId));
                        if (boletoBase64) {
                            let data = {
                            base64: "data:application/pdf;base64," + boletoBase64,
                            phone: soNumeros(message.chatId),
                            filename: `${data.cpf} - ${data.data_vencimento}`
                        }
                        let querys = `?sessao=${session}&canal=whatsapp`
                        await actionEnviarArquivoBase64Whatsapp(querys, data);
                    }

                    }

                } else {
                    let data = {
                        phone: soNumeros(message.chatId),
                        message:mensagemCPfNaoEncontrado
                    }
                    let querys = `?sessao=${session}&canal=whatsapp`
                    await actionEnviarMensagemWhatsapp(querys, data);
                    console.log('erro ao buscar link boleto');
                }
            } else {
                if (payload.response_df.queryText === "1") {

                } else {
                    let data = {
                        phone: soNumeros(message.chatId),
                        message:"Digite um CPF válido com 11 digitos e SEM pontução."
                    }
                    let querys = `?sessao=${session}&canal=whatsapp`
                    await actionEnviarMensagemWhatsapp(querys, data);
                }
            }

        }

    }


    if (event === 'whatsapp.dialogflow.payload') {
        initBuscaBoleto()
    }

    


};


























