//const dialogflow = require('@google-cloud/dialogflow');
const dialogflow = require('dialogflow');
const axios = require('axios');
const config = require('../config/config');
const Sentry = require("@sentry/node");
const { actionStatusChatbot } = require('../actions/chat.action');
const Chats = require('../models/Chats');
const { enviarMensagemCanal } = require('../helpers/chat.helper');


async function detectIntent(
    projectId,
    sessionId,
    query,
    contexts,
    languageCode,
    privateKey,
    clientEmail
) {

    // dialogflow
    const credentials = {
        "private_key": privateKey,
        "client_email": clientEmail
    };

    const sessionClient = new dialogflow.SessionsClient({
        projectId: "conad-fdkp",
        credentials,
    });

    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };

    if (contexts && contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
        };
    }

    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}


async function executeQueries(projectId, sessionId, queries, languageCode, privateKey, clientEmail) {
    let context;
    let intentResponse;

    for (const query of queries) {
        try {
            if (query == null) {
            } else {
                intentResponse = await detectIntent(projectId, sessionId, query, context, languageCode, privateKey, clientEmail);
                return intentResponse.queryResult;
            }
            // return `${intentResponse.queryResult.fulfillmentText}`;
        } catch (error) {
            console.log(error);
            Sentry.captureException(error);
        }
    }


}

function soNumeros(string) {
    var numbers = string.replace(/[^0-9]/g, '');
    return numbers;
}

async function getStatusChatbot(numeroClienteProps, clienteIdProps) {

    let status;
    try {
        const { data } = await axios.post(`${config.urlBackend}/chats/chat/status-chatbot`, { numeroCliente: numeroClienteProps, clienteId: clienteIdProps });
        status = data.chat;
    } catch (error) {
        console.log('erro na consulta de status de chatbot', error);
    }
    return status;
}

async function getFluxoByRecebe(recebe, clienteId) {
    let fluxo;
    try {
        const { data } = await axios.post(`${config.urlBackend}/chats/chat/status-chatbot`, { numeroCliente: numeroClienteProps, clienteId: clienteIdProps });
        fluxo = data.fluxo;
    } catch (error) {
        console.log('erro na consulta de status de chatbot', error);
        Sentry.captureException(error);
    } finally {

    }
    return fluxo;
}




async function buscarDialogflow(session, message, token, usuario, projectId, privateKey, clientEmail, pod, platform = "whatsapp") {
    const textoResposta = await executeQueries(projectId, message.from, [message.body], 'pt-BR', privateKey, clientEmail);

    const maxMessages = Math.min(textoResposta.fulfillmentMessages.length, 10); // Limita a 10 mensagens

    for (let i = 0; i < maxMessages; i++) {
        await enviarMensagemCanal({
            phone: soNumeros(message.from),
            message: textoResposta.fulfillmentMessages[i].text.text.toString(),
            session: session,
            canal:platform,
            sendTyping: {
                delay: 30
            },
            variationMsg: true
        });
    }
    return textoResposta;
}


async function initService(numeroClienteProps, clienteIdProps) {
    let status;
    try {
        const { data } = await axios.post(`${config.urlBackend}/chats/chat/status-chatbot`, { numeroCliente: numeroClienteProps, clienteId: clienteIdProps });
        status = data.chat;
    } catch (error) {
        console.log('erro na consulta de status de chatbot', error);
    }
    return status;
}

// Constantes para validação
const NUMERO_MIN_LENGTH = 5;
const NUMERO_LENGTH_WITH_PREFIX_1 = 13;
const NUMERO_LENGTH_WITH_PREFIX_2 = 12;
const PREFIX_LENGTH_1 = 5;
const PREFIX_LENGTH_2 = 4;

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} error - Indica se houve erro
 * @property {Object|null} data - Dados do chat ou null
 */

/**
 * Inicializa o serviço de webhook para um cliente
 * @param {string} numeroCliente - Número do cliente
 * @param {string} clienteId - ID do cliente
 * @returns {Promise<ServiceResponse>}
 */
async function initServiceWebhook(numeroCliente, clienteId) {
    // Validação inicial dos parâmetros
    if (!numeroCliente || !clienteId) {
        console.error('Parâmetros inválidos:', { numeroCliente, clienteId });
        return { error: true, data: null };
    }

    if (numeroCliente.length < NUMERO_MIN_LENGTH) {
        console.error('Número do cliente muito curto:', numeroCliente);
        return { error: true, data: null };
    }

    /**
     * Valida e formata o número do cliente
     * @param {string} valor 
     * @returns {string}
     */
    function validaNumero(valor) {
        switch (valor.length) {
            case NUMERO_LENGTH_WITH_PREFIX_1:
                return valor.substr(PREFIX_LENGTH_1);
            case NUMERO_LENGTH_WITH_PREFIX_2:
                return valor.substr(PREFIX_LENGTH_2);
            default:
                return valor;
        }
    }

    try {
        const numeroValidado = validaNumero(numeroCliente);

        if (!numeroValidado) {
            console.error('Número de cliente inválido após validação:', numeroCliente);
            return { error: true, data: null };
        }

        // Buscar chat existente com índice otimizado
        const chat = await Chats.findOne({
            numeroCliente: { $regex: `.*${numeroValidado}.*` },
            cliente_id: clienteId
        }).lean();

        if (!chat) {
            return { error: false, data: null };
        }

        // Se o número não precisa ser atualizado, retorna o chat atual
        if (chat.numeroCliente === numeroCliente) {
            return { error: false, data: chat };
        }

        // Log da atualização do número
        console.log('Atualizando número do chat:', {
            numeroAntigo: chat.numeroCliente,
            numeroNovo: numeroCliente,
            chatId: chat._id
        });

        try {
            const chatAtualizado = await Chats.updateOne(
                { _id: chat._id, cliente_id: clienteId },
                {
                    $set: {
                        numeroCliente,
                        lastUpdate: new Date()
                    }
                },
                { new: true, lean: true }
            );

            if (!chatAtualizado) {
                console.error('Falha ao atualizar o chat:', { chatId: chat._id });
                return { error: true, data: chat };
            }

            return { error: false, data: chatAtualizado };
        } catch (error) {
            console.error('Erro ao atualizar o chat:', { error, chatId: chat._id });
            return { error: true, data: chat };
        }
    } catch (error) {
        console.error('Erro em initServiceWebhook:', { error, numeroCliente, clienteId });
        return { error: true, data: null };
    }
}

async function alterarMensagemLida(chatId) {
    let chat;
    try {
        const { data } = await axios.post(`${config.urlBackend}/chats/chat/mensagemLida/${chatId}`);
        chat = data.chat;
    } catch (error) {
        Sentry.captureException(e);
    }
    return chat;
}


async function callFluxo(recebe, clienteId) {
    let fluxo;
    try {
        const { data } = await axios.post(`${config.urlBackend}/clientes/cliente/fluxos/buscarFluxoByRecebe`, { recebe: recebe, clienteId: clienteId });
        fluxo = data.fluxo;
    } catch (error) {
        console.log('erro na consulta de status de chatbot', error);
        Sentry.captureException(e);
    }
    return fluxo;
}

async function callbackWhatsapp(url, phone, message, token, session) {
    try {
        let response = await axios.post(`${url}/${session}/send-message`, {
            message: message,
            phone: soNumeros(phone),
        }, { headers: { Authorization: `Bearer ${token}` } });

    } catch (error) {
        console.log('erro ao fazer requisição apos validação');
        Sentry.captureException(e);
    }
}

function mascararTel(v) {
    if (!v) return null
    let cropped = v.slice(2)

    cropped = cropped.replace(/\D/g, "");
    cropped = cropped.replace(/^(\d{2})(\d)/g, "($1) $2");
    cropped = cropped.replace(/(\d)(\d{4})$/, "$1-$2");
    return cropped;
}

function getExtensao(mimeType) {
    switch (mimeType) {
        case "audio/mp3":
        case "audio/mpeg":
            return ".mp3";

        case "audio/ogg":
            return ".oga";

        case "video/ogg":
            return ".ogv";

        case "audio/m4a":
            return ".m4a";

        case "audio/amr":
            return ".amr";

        case "audio/wav":
            return ".wav";

        case "video/mp4":
            return ".mp4";

        case "video/3gpp":
        case "audio/3gpp":
            return ".3gp"

        case "video/3gpp2":
        case "audio/3gpp2":
            return ".3g2"

        case "video/mpeg":
            return ".mpeg"

        case "video/quicktime":
            return ".mov";

        case "image/jpeg":
            return ".jpg";

        case "image/bmp":
            return ".bmp"

        case "image/png":
            return ".png";

        case "image/tiff":
            return ".tiff"

        case "image/webp":
            return ".webp"

        case "image/gif":
            return ".gif";

        case "text/plain":
            return ".txt";

        case "application/pdf":
            return ".pdf";

        case "application/vnd.ms-powerpoint":
            return ".ppt";

        case "application/msword":
            return ".doc";

        case "application/vnd.ms-excel":
            return ".xls";

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return ".docx";

        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            return ".pptx";

        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            return ".xlsx";

        default:
            return "";
    }
}

const convertUrlToBase64 = async (url) => {

    try {
        const response = await axios.get(url, {
            responseType: "text",
            responseEncoding: "base64",
        })

        return response.data
    } catch (error) {
        console.log('error', error)
    }



}

async function validaIsMultisession(dataCliente, clienteId) {

    if (!dataCliente) return clienteId;
    if (dataCliente.multiSession === 1) {
        if (!dataCliente.isHub) {

            return dataCliente.cliente_pai_id;
        } else {
            return clienteId;
        }
    } else {
        return clienteId;
    }

}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    alterarMensagemLida,
    soNumeros,
    buscarDialogflow,
    getStatusChatbot,
    initService,
    callFluxo,
    callbackWhatsapp,
    mascararTel,
    getExtensao,
    convertUrlToBase64,
    validaIsMultisession,
    initServiceWebhook,
    delay
};

