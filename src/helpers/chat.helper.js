const { load } = require("dotenv");
const { actionCriarChat, actionAlterarFotoPerfil, actionEnviarMensagemWhatsapp, actionAvaliarChat, actionEnviarArquivoBase64Whatsapp, actionEnviarDigitando, v1_actionEnviarVozWhatsapp, v1_actionEnviarArquivoBuffer } = require("../actions/chat.action");
const FormData = require("form-data");
const { actionEnviarMensagemCanalDiscord } = require("../actions/notificacoes.action");
const { actionDispararCustomWebhook } = require("../actions/webhook.action");
const Canais = require("../models/Canais");
const ForcaVendasLead = require("../models/ForcaVendasLead");
const { getRedis } = require("../services/functions");
const { initAvaliacao, sendEventWebhook } = require("./webhook.helper");
const { loadUsersStandby, checkAndCacheMessage } = require("./redis.helper");
const Usuarios = require("../models/Usuarios");
const Chats = require("../models/Chats");
const Clientes = require("../models/Clientes");
const AiOrdersLeads = require("../models/AiOrdersLeads");
const { checkMsgToInsert } = require("../utils/message.utils");
const WhatsappMensagens = require("../models/WhatsappMensagens");
const { actionEnviarMsgTelegram } = require("./admin.helper");
const { executeAutomate } = require("../services/automate.service");
const mongoose = require("mongoose");
const { verifyLeadAndSaveCrmLead } = require("../services/ai.service");
const { addLogs } = require("./logs.helper");
const { simulateTyping } = require("../utils/chat.utils");
const { variationMsgWithAi } = require("../functions/ai.functions");

async function criarChat(
    statusRoomProps,
    chatbotProps,
    numeroClienteProps,
    clienteIdProps,
    direcionaUsuariosProps,
    direcionaSetoresProps,
    nomeClienteProps,
    fotoPerfilProps,
    lastMessageProps,
    scopeAutomate,
    firstMessage,
    channel,
    propsGeneral
) {
    try {
        let data = {
            statusRoom: statusRoomProps,
            chatbot: chatbotProps,
            numeroCliente: numeroClienteProps,
            clienteId: clienteIdProps,
            direcionaUsuarios: direcionaUsuariosProps,
            direcionaSetores: direcionaSetoresProps,
            nomeCliente: nomeClienteProps,
            fotoPerfil: fotoPerfilProps,
            lastMessage: lastMessageProps,
            novaMensagem: "sim",
            lastDateMsgClient: new Date(),
            scope: {
                isLid: propsGeneral?.isLid,
            chatLid: propsGeneral?.chatLid,
            chatNumber: propsGeneral?.chatNumber
            }
        }
        const res = await actionCriarChat(data);
        if (res.status === 200) {
            if (scopeAutomate) {
                try {
                    const chat = res.data;
                    if (scopeAutomate) {
                        if (firstMessage) {
                            executeAutomate(scopeAutomate.clienteId, ["from.chat.firstMessage"], {
                                numero: chat?.numeroCliente,
                                nome: chat?.nomeCliente,
                                chatStatus: chat?.statusRoom,
                                chatId: chat?._id,
                                chatClientId: chat?.cliente_id,
                                usuariosIds: chat?.direciona_usuarios,
                                setoresIds: chat?.direciona_setores,
                                cliente_id: scopeAutomate.clienteId,
                            });
                        }


                        if (propsGeneral?.chatNotExist && scopeAutomate?.messageType === 'chat') {
                           executeAutomate(scopeAutomate.clienteId, ["from.chat.contains"], {
                                ...scopeAutomate,
                                numero: chat?.numeroCliente,
                                nome: chat?.nomeCliente,
                                chatStatus: chat?.statusRoom,
                                chatId: chat?._id,
                                chatClientId: chat?.cliente_id,
                                usuariosIds: chat?.direciona_usuarios,
                                setoresIds: chat?.direciona_setores,
                                cliente_id: scopeAutomate.clienteId,
                                ai_order_lead_id: chat?.ai_order_lead_id,
                                fromMe: false
                            });
                        }
                    }

                } catch (error) {
                    console.log('Erro ao enviar automacao', error);
                }
            }
            await createAiOrderLead({chat: res.data, channel: channel, persistCreate: true});

            return res.data;
        }
    } catch (error) {
        addLogs('error:criarChatWebhook', {
            error: error?.message,
            errorData: error?.response?.data,
            dataSend: {
                statusRoom: statusRoomProps,
                chatbot: chatbotProps,
                numeroCliente: numeroClienteProps,
                clienteId: clienteIdProps,
                direcionaUsuarios: direcionaUsuariosProps,
                direcionaSetores: direcionaSetoresProps,
                nomeCliente: nomeClienteProps,
                fotoPerfil: fotoPerfilProps,
                lastMessage: lastMessageProps,
                novaMensagem: "sim"
            }
          });
        console.log('Erro ao criar chat', error);
    }
}


async function alterarFotoPerfil(chat, message) {
    const foto_perfil_contato = !message?.sender?.profilePicThumbObj?.eurl ? null : message?.sender?.profilePicThumbObj?.eurl;
    let chatId = message.chatId;
    let numeroId = chat?.numeroCliente + "@c.us";

    if (chatId === numeroId) {
        try {
            await Chats.updateOne({ _id: chat._id }, {
                $set: {
                    fotoPerfil: foto_perfil_contato,
                    dataUltimaAtualizacaoFoto: new Date()
                }
            });
        } catch (error) {
            console.log('Erro alterar foto de perfil', error);
        }
    }
}

async function verificarBarraBot(session, numero) {
    try {
        const query = `barrabot:${session}:${numero}`;
        const response = await getRedis(query);
        if (!response) return false;
        if (response && Number(response) < 21) {
            return false;
        };
        console.log('BOT_SISTEMA', session, numero)
        try {
            await actionEnviarMsgTelegram('joao', `BOT NO SISTEMA \n\nNumero: ${numero}\nSessão: ${session}\n\n${response}`,);
        } catch (error) {
            console.log('Erro ao enviar msg telegram', error)
        }
        return true;
    } catch (error) {
        await actionEnviarMsgTelegram('joao', `Erro ao buscar barrabot\n\nNumero: ${numero}\nSessão: ${session}`,);
    }
}


async function checkDelayMsgs(session, numero) {
    try {
        const query = `checkdelayai:${session}:${numero}`;
        const response = await getRedis(query)
        return response;
    } catch (error) {
        console.error(error)
    }
}


async function enviarMensagemCanal(props) {
    const { phone, message, session, canal, sendTyping, variationMsg } = props;
    let platform = canal;

    try {
        let querys = `?sessao=${session}&canal=${canal}`;
        let body = {
            phone: phone,
            message: message
        }

        if(variationMsg) {
            const isCached = await checkAndCacheMessage(session, phone, message);
            if(isCached?.result) {
                const variationMsg = await variationMsgWithAi(message, isCached?.msgsSendeds);
                body.message = variationMsg;
            }
        }

        if (sendTyping) {
            await enviarDigitando({phone, value:true, session, platform});
            await simulateTyping(body.message, sendTyping.delay);
        }

        // enviando mensagem
        await actionEnviarMensagemWhatsapp(querys, body);
        
        if(sendTyping) {
            try {
                await enviarDigitando({phone, value:false, session, platform});
            } catch (error) {
                await enviarDigitando({phone, value:false, session, platform});
                console.log('Erro ao enviar: enviarDigitando', error);
            }
        }

    } catch (error) {
        // add logs

        await enviarDigitando({phone, value:false, session, platform});
        console.log('Erro ao enviar: actionEnviarMensagemWhatsapp', error);
    }
}

async function v2_enviarMensagemCanal(scope, session, canal) {
    try {
        let querys = `?sessao=${session}&canal=${canal}`;
        await actionEnviarMensagemWhatsapp(querys, scope);
    } catch (error) {
        console.log('Erro ao enviar msg:v2_enviarMensagemCanal');
    }
}

async function enviarMensagemArquivoCanal(phone, base64, session, canal) {
    try {
        let querys = `?sessao=${session}&canal=whatsapp`;
        let body = {
            phone: phone,
            base64: base64,
            filename: base64
        };
        await actionEnviarArquivoBase64Whatsapp(querys, body);
    } catch (error) {
        console.log('Erro ao enviar: enviarMensagemArquivoCanal', );
    }
}

async function enviarMensagemAudioVoz(phone, message, session, canal) {
    if(canal === "whatsapp_business") {
        try {
           
            // Remover prefixo data URI se existir (ex: data:audio/ogg;base64,)
            let base64Data = message;
            if (message.includes(',')) {
                base64Data = message.split(',')[1];
            }
            
            // Converter base64 para buffer
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Criar FormData
            const formData = new FormData();
            const filename = `${new Date().getTime()}_audio.ogg`;
            formData.append("filename", filename);
            formData.append("file", buffer, { filename: filename, contentType: 'audio/ogg' });
            formData.append("phone", phone);
            formData.append("isVoice", "true");
            
            let querys = `?sessao=${session}&canal=${canal}`;

           
            await v1_actionEnviarArquivoBuffer(querys, formData);
        } catch (error) {
            console.log('Erro ao enviar: enviarMensagemAudioVoz whatsapp_business', error);
        }
    } else if(canal === "whatsapp") {
        try {
            let querys = `?sessao=${session}&canal=${canal}`;
            let body = {
                phone: phone,
                url: message
            }
            console.log('enviando audio', querys, body);
            await v1_actionEnviarVozWhatsapp(querys, body);
        } catch (error) {
            console.log('Erro ao enviar: enviarMensagemAudioVoz');
        }
    } 

}



async function aposAvaliacao(
    numeroClienteProps,
    notaProps,
    usuarioProps,
    idProps,
    clienteId,
    outputPesquisa,
    leadFvId,
    dataWebhook,
    isWebhookCustom,
    session,
    scopeAutomate
) {

    try {
        if (dataWebhook) {
            for (const webhook of dataWebhook) {
                if (webhook?.events?.includes('whatsapp.after_resposta_pesquisa')) {
                    let usuario;
                    if (usuarioProps) {
                        const responseUsuario = await Usuarios.findOne({ _id: usuarioProps });
                        usuario = responseUsuario;
                    }
                    let event = {
                        event: 'whatsapp.after_resposta_pesquisa',
                        data: {
                            sessao: session,
                            numero_contato: numeroClienteProps,
                            nota_avaliacao: notaProps,
                            usuario: usuario?.nomeFantasia || "",
                            clienteId: clienteId
                        }
                    };
                    sendEventWebhook(event, webhook.url, webhook.method)
                }
            }
        }

        await actionAvaliarChat({
            numeroCliente: numeroClienteProps,
            nota: notaProps,
            usuario: usuarioProps,
            id: idProps,
            clienteId: clienteId
        })

        await Chats.updateOne({ _id: mongoose.Types.ObjectId(idProps) }, { $set: { ai_order_lead_id:null } });


        let notasAvaliacoes = ["1", "2", "3", "4", "5"]
        if (!notasAvaliacoes.includes(notaProps)) return;

        const buscar_dados_chat = await Chats.findOne({ numeroCliente: numeroClienteProps, cliente_id: clienteId });

        if(scopeAutomate) {
            executeAutomate(scopeAutomate.clienteId, ["from.chat.feedback"], {
                numero: buscar_dados_chat.numeroCliente,
                nome: buscar_dados_chat.nomeCliente,
                chatStatus: "Finalizado",
                chatId: buscar_dados_chat._id,
                chatClientId: buscar_dados_chat.cliente_id,
                cliente_id: scopeAutomate.clienteId,
                messageText: scopeAutomate.messageText,
                messageType: scopeAutomate.messageType,
                chatFeedback: scopeAutomate.messageText,
                sessao: session,
                usuariosIds: buscar_dados_chat?.direciona_usuarios,
                setoresIds: buscar_dados_chat?.direciona_setores
            });
        }



        if (outputPesquisa === 'forca_vendas') {
            const buscar_dados_fv = await ForcaVendasLead.findOne({ _id: leadFvId });
            let data = {
                "date": new Date(),
                "nota": notaProps,
                "usuario_id": buscar_dados_fv.usuario_id,
                "cliente_id": clienteId,
                "lead_fv_id": leadFvId
            }
            await initAvaliacao('forca_vendas', data);
        } else {
            if (buscar_dados_chat.direciona_usuarios.length > 0) {
                let data = {
                    "date": new Date(),
                    "nota": notaProps,
                    "usuario_id": buscar_dados_chat.direciona_usuarios[0],
                    "cliente_id": clienteId,
                    "chat_id": buscar_dados_chat._id,
                    ...(buscar_dados_chat.ticket_active_id && { "ticket_id": buscar_dados_chat.ticket_active_id })
                }
                await initAvaliacao('chat_padrao', data);
            }
        }

    } catch (error) {
        console.log(error)
    }
    return;
}

async function atualizarNovaMensagem(chatId, message) {
    const dateNow = new Date();
    if (!message) return;

    const isQueue = message.isQueue;
    if (isQueue) {
        const lastMessage = await WhatsappMensagens.findOne({ chatId: chatId, session: message.session }).sort({ t: -1 });
        // verificar se message.t é maior que lastMessage.t
        if (lastMessage && message.t < lastMessage.t) {
            return;
        }
    }

    try {
        await Chats.updateOne({ _id: chatId }, {
            $set: {
                novaMensagem: "sim",
                lastMessage: checkMsgToInsert(message),
                lastUpdate: dateNow,
                dataUltimaMensagem: dateNow,
                lastMessageWpp: {
                    type: message.type,
                    message: checkMsgToInsert(message),
                    fromMe: message.fromMe,
                    timestamp: new Date(message.timestamp * 1000).toISOString(),
                    ack: message.ack,
                    id: message.id
                }
            }
        });
    } catch (error) {

    }
};

async function atualizarAtividade(chatId, message) {
    const dateNow = new Date();

    const isQueue = message.isQueue;
    if (isQueue) {
        const lastMessage = await WhatsappMensagens.findOne({ chatId: chatId, session: message.session }).sort({ t: -1 });
        // verificar se message.t é maior que lastMessage.t
        if (lastMessage && message.t < lastMessage.t) {
            return;
        }
    }

    try {
        let fieldsUpdate = {
            lastUpdate: dateNow,
            lastMessage: checkMsgToInsert(message),
            dataUltimaMensagem: dateNow,
            lastMessageWpp: {
                type: message.type,
                message: checkMsgToInsert(message),
                fromMe: message.fromMe,
                timestamp: new Date(message.timestamp * 1000).toISOString(),
                ack: message.ack,
                id: message.id
            }
        }

        // validando lid
        if(message.lid) {
            fieldsUpdate.isLid = message.isLid;
            fieldsUpdate.chatLid = message.chatLid;
            fieldsUpdate.chatNumber = message.chatNumber;
        }
        
        if (message.fromMe) {
            fieldsUpdate.lastDateMsgAgent = dateNow;
        } else {
            fieldsUpdate.lastDateMsgClient = dateNow;
        }
        await Chats.updateOne({ _id: chatId }, {
            $set: fieldsUpdate
        });
    } catch (error) {
        console.log('Erro ao atualizar atividade 10', error);
    }
};


async function atualizatStatusConexaoCanal(sessao, status) {
    try {
        await Canais.updateOne({ sessao: sessao }, { $set: { status_connection_whatsapp: status } });
        await Clientes.updateOne({ sessao: sessao }, { $set: { sentinela: status === "conectado" ? true : false } });
    } catch (error) {
        console.log('Erro ao alterar status de conexão do canal')
    }
};

async function verifyStandbyUser(usuarioId, chat, session) {
    try {
        const response = await loadUsersStandby(usuarioId, session);
        if (response) {
            if (response.includes(usuarioId.toString())) {
                const responseUser = await Usuarios.findOne({ _id: usuarioId });
                setTimeout(async () => {
                    await enviarMensagemCanal({
                        phone: chat.numeroCliente, 
                        message: responseUser?.config?.messageStandby, 
                        session: session, 
                        canal: chat?.platform || "whatsapp"
                    });
                }, 5000);
                // send message santdby
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function verifyStandbyUserInstagram(usuarioId, chat, session) {
    try {
        const response = await loadUsersStandby(usuarioId, session);
        if (response) {
            if (response.includes(usuarioId)) {
                const responseUser = await Usuarios.findOne({ _id: usuarioId });
                setTimeout(async () => {
                 //   await enviarMensagemCanal(chat?.instagramUser.id, responseUser?.config?.messageStandby, session, "instagram");
                }, 5000);
                // send message santdby
            }
        }
    } catch (error) {
        console.log(error)
    }
}

async function enviarDigitando({phone, value, session, platform}) {
    if(platform === "whatsapp_business") return;
    try {
        let querys = `?sessao=${session}&canal=whatsapp`;
        let body = {
            phone: phone,
            value: value
        };
        await actionEnviarDigitando(querys, body);
    } catch (error) {
        console.log('Erro ao enviar: enviarDigitando', error?.response?.data || error?.message);
    }
}


// buscar informaçoes do chat

async function getInfoChat(scope) {
    const response = await Chats.findOne(scope);
    return response;
}

async function createChat(scope) {
    let data = {
        "historico": [],
        "numeroCliente": "",
        "lastUpdate": new Date(),
        "dataCriacao": new Date(),
        "isCheckMsgSend": false,
        "funil_id": null,
        "contato_id": null,
        "notas": [],
        ...scope
    }
    await Chats(data).save();
}


async function createAiOrderLead(props) {

    const {chat, channel, persistCreate} = props;

    // verificando se o chat já existe ai_order_lead cadstrado
    if (!persistCreate) {
        const isAiOrderEnable = channel?.config?.ai?.modules?.sales.status;
        if (!isAiOrderEnable) return;
    }

    if (chat?.ai_order_lead_id) {
        await AiOrdersLeads.updateOne({ _id: chat.ai_order_lead_id }, { $set: { lastMessage: new Date() } });
        if(channel) {
            verifyLeadAndSaveCrmLead({chat: chat, aiOrderLeadId: chat?.ai_order_lead_id, channel: channel});
        }
        return;
    }

    if(!chat) return;

    let data = {
        "cliente_id": chat?.cliente_id,
        "createAt": new Date(),
        "lastMessage": new Date(),
        "status": "draft",
        "orderDate": null,
        "chatId": chat?._id
    }
    const response = await AiOrdersLeads(data).save();
    await Chats.updateOne({ _id: chat._id }, { $set: { ai_order_lead_id: response._id } });

    // enviando para verificar se regra de lead imobiliario esta ativo
     verifyLeadAndSaveCrmLead({chat: chat, aiOrderLeadId: chat?.ai_order_lead_id, channel: channel});

    return response;

}



module.exports = {
    criarChat,
    alterarFotoPerfil,
    verificarBarraBot,
    enviarMensagemCanal,
    enviarMensagemArquivoCanal,
    aposAvaliacao,
    atualizarNovaMensagem,
    atualizarAtividade,
    atualizatStatusConexaoCanal,
    verifyStandbyUser,
    verifyStandbyUserInstagram,
    enviarDigitando,
    getInfoChat,
    createChat,
    v2_enviarMensagemCanal,
    checkDelayMsgs,
    createAiOrderLead,
    enviarMensagemAudioVoz
}