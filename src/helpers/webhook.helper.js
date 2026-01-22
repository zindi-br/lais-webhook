const { actionDownloadMediaWhatsapp, actionUploadS3 } = require('../actions/chat.action');
const { actionEnviarOneSignal } = require('../actions/notificacoes.action');
const Canais = require('../models/Canais');
const ForcaVendasAvaliacoes = require('../models/ForcaVendasAvaliacoes');
const Webhooks = require('../models/Webhooks');
const { verificarEnvioPush } = require('../services/appHelper');
const { getRedis, setRedis } = require('../services/functions');
const { getExtensao } = require('../utils/functions');
const FormData = require("form-data");
const mongoose = require('../models/mongoose');
const ChatsAvaliacoes = require('../models/ChatsAvaliacoes');
const Clientes = require('../models/Clientes');
const { default: axios } = require('axios');
const { captureRejections } = require('stream');

const initAvaliacao = async (tipo, data) => {
    if(tipo === 'forca_vendas'){
        try {
            await ForcaVendasAvaliacoes(data).save()
        } catch (error) {
            console.log(error)
        }
    } else if(tipo === 'chat_padrao') {
        try {
            await ChatsAvaliacoes(data).save()

        } catch (error) {
            console.log('Erro ao cadastrar Avaliação Chat', error)
        }
    }
}


const uploadArquivoS3 = async (sessao, idMessage, clienteId) => {

    try {
        const query = `?sessao=${sessao}&msgId=${idMessage}&canal=whatsapp`;

        const { data: responseMediaBase64 } = await actionDownloadMediaWhatsapp(query);

        const bufferMedia = Buffer.from(responseMediaBase64.data.base64, "base64");
        const { mimetype } = responseMediaBase64.data;

        const extensao = getExtensao(mimetype);
        const filename = `${idMessage}${extensao}`;

        const formData = new FormData();
        formData.append("file", bufferMedia, { filename: filename, contentType: mimetype });

        const queryUpload = `?path=chats/clientes/${clienteId}`;
        const response = await actionUploadS3(formData, queryUpload);

    } catch (error) {
        console.error(error);
    }
};

function soNumeros(string) {
    var numbers = string.replace(/[^0-9]/g, '');
    return numbers;
}


function mascararTel(v) {
    if (!v) return null
    let cropped = v.slice(2)

    cropped = cropped.replace(/\D/g, "");
    cropped = cropped.replace(/^(\d{2})(\d)/g, "($1) $2");
    cropped = cropped.replace(/(\d)(\d{4})$/, "$1-$2");
    return cropped;
}

const enviarAplicativo = async (dataInit, dataChat, clienteId) => {
        if (dataInit.config?.aplicativo?.status) {
            const response1A = await verificarEnvioPush(clienteId, soNumeros(dataChat.chatId));

            if (response1A) {
                if (response1A.playerId) {
                    let dataOneSignal = {
                        "titulo": mascararTel(soNumeros(dataChat.chatId)),
                        "message": dataChat.type === "chat" ? dataChat.body : "Arquivo",
                        "playerId": response1A.playerId
                    }
                    try {
                        await actionEnviarOneSignal(dataOneSignal)
                    } catch (error) {
                        console.log('erro ao enviar onesignal', error)
                    }
                }
            }
        }

}

async function buscarDadosCanal(session) {
    const res = await Canais.findOne({ sessao: session });
    return res;
}

async function buscarDadosClientes(id) {
    const res = await Clientes.findOne({ _id: id });
    return res;
}

async function buscarWebhooks(clienteId) {
    const res = await Webhooks.findOne({ cliente_id: mongoose.Types.ObjectId(clienteId) });
    return res;
}

async function buscarWebhooksMulti(clienteId) {
    const res = await Webhooks.find({ cliente_id: mongoose.Types.ObjectId(clienteId) });
    return res;
}


async function loadData(session) {
    let dataCanal;
   
    const productsFromCache = await getRedis(session);
    const isProductsFromCacheStale = !(await getRedis(`${session}:validation`));

    if (isProductsFromCacheStale) {
        const isRefatching = !!(await getRedis(`${session}:is-refetching`))
        if (!isRefatching) {
            await setRedis(`${session}:is-refatching`, "true", 3610)
            setTimeout(async () => {
                const products = await buscarDadosCanal(session);
                await setRedis(session, JSON.stringify(products))
                await setRedis(`${session}:validation`, 'true', 3600)
            }, 100);
        }
    }

    if (productsFromCache) {
        dataCanal = JSON.parse(productsFromCache);
    } else {
        const responseDataCanal = await buscarDadosCanal(session);
        dataCanal = responseDataCanal;
    }

    const chatSource = dataCanal?.config?.chat_source_db;
    const pod = dataCanal?.pod;
    const config = dataCanal?.config;
    const projectId = dataCanal?.config.dialogflow.projectId;
    const clienteId = dataCanal?.cliente_id;
    const token = dataCanal?.config.token;
    const clientEmail = dataCanal?.config.dialogflow.clientEmail;
    const privateKey = dataCanal?.config.dialogflow.privateKey;
    const webhook_type = dataCanal?.webhook_type;
    const urlWhatsapp = `https://z${pod}.zindi.com.br`;
    const platform = dataCanal?.platform;
    let privateKeyFormat = privateKey && privateKey.replace(/\\n/g, '\n')
    let direcionamentoDireto = dataCanal?.config.direcionamento_direto

    return { pod, projectId, clienteId, token, clientEmail, privateKeyFormat, urlWhatsapp, webhook_type, direcionamentoDireto, config, chatSource, platform };
}




async function loadWebhook(clienteId, session) {
    let dataWebhook;
    const productsFromCache = await getRedis(`${session}:webhook`);
    const isProductsFromCacheStale = !(await getRedis(`${session}:validation:webhook`));

    if (isProductsFromCacheStale) {
        const isRefatching = !!(await getRedis(`${session}:is-refetching:webhook`))
        if (!isRefatching) {
            await setRedis(`${session}:is-refatching:webhook`, "true", 3610)
            setTimeout(async () => {
                const products = await buscarWebhooks(clienteId);
                await setRedis(`${session}:webhook`, JSON.stringify(products))
                await setRedis(`${session}:validation:webhook`, 'true', 3600)
            }, 100);
        }
    }

    if (productsFromCache) {
        let webhooksParse = JSON.parse(productsFromCache)
        dataWebhook =  webhooksParse ? webhooksParse: [];
    } else {
        const responseDataCanal = await buscarWebhooks(clienteId);
        if(responseDataCanal){
            dataWebhook = responseDataCanal;
        } else {
            dataWebhook = [];
        }
    }
    return dataWebhook;
}

async function loadWebhooks(clienteId, session) {
    let dataWebhook;
    const productsFromCache = await getRedis(`${session}:webhooks`);
    const isProductsFromCacheStale = !(await getRedis(`${session}:validation:webhooks`));

    if (isProductsFromCacheStale) {
        const isRefatching = !!(await getRedis(`${session}:is-refetching:webhooks`))
        if (!isRefatching) {
            await setRedis(`${session}:is-refatching:webhooks`, "true", 3610)
            setTimeout(async () => {
                const products = await buscarWebhooksMulti(clienteId);

                await setRedis(`${session}:webhooks`, JSON.stringify(products))
                await setRedis(`${session}:validation:webhooks`, 'true', 3600)
            }, 100);
        }
    }

    if (!productsFromCache) {
        const responseDataCanal = await buscarWebhooksMulti(clienteId);
        if(responseDataCanal){

            dataWebhook = responseDataCanal;
        } else {
            dataWebhook = [];
        }
    }


    if (productsFromCache && productsFromCache.length > 0) {
        let webhooksParse = JSON.parse(productsFromCache)
        dataWebhook =  webhooksParse ? webhooksParse: [];
    } else {
        try {
            const responseDataCanal = await buscarWebhooksMulti(clienteId);
            if(responseDataCanal){
    
                dataWebhook = responseDataCanal;
            } else {
                dataWebhook = [];
            }
        } catch (error) {
           console.log('Erro ao buscar webhooks no db', error)
        }
      
    }
    return dataWebhook;
}


async function loadDataCliente(clienteId) {
    let dataReturn;
    const productsFromCache = await getRedis(`${clienteId}:data`);
    const isProductsFromCacheStale = !(await getRedis(`${clienteId}:data`));

    if (isProductsFromCacheStale) {
        const isRefatching = !!(await getRedis(`${clienteId}:is-refetching:data`))
        if (!isRefatching) {
            await setRedis(`${clienteId}:is-refatching:data`, "true", 3610)
            setTimeout(async () => {
                const products = await buscarDadosClientes(clienteId);
                await setRedis(`${clienteId}:data`, JSON.stringify(products))
                await setRedis(`${clienteId}:validation:data`, 'true', 3600)
            }, 100);
        }
    }

    if (productsFromCache) {
        let dataParse = JSON.parse(productsFromCache)
        dataReturn =  dataParse
    } else {
        const responseDataCanal = await buscarDadosClientes(clienteId);
        
        dataReturn = responseDataCanal;
    }
    return dataReturn;
}

async function sendEventWebhook(event, url, metodo) {
    try {
        let data = {
            method: metodo,
            url: url,
            data: event
        };
        const response = await axios(data);
        return response.data
    } catch (error) {
        console.log('cod_erro:30')
    }
}

module.exports = {
    initAvaliacao,
    uploadArquivoS3,
    enviarAplicativo,
    loadData,
    loadWebhook,
    loadWebhooks,
    loadDataCliente,
    sendEventWebhook
}