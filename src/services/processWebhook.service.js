const { buscarDialogflow, validaIsMultisession, initServiceWebhook, delay, soNumeros } = require('../utils/functions');
const { getBuscarClienteById, getFluxo, setRedis, getRedis, registrarBarraBot, clearRedis } = require('./functions');
const { salvarMensagemWhatsapp } = require('./appHelper');
const { loadData, enviarAplicativo, loadWebhook, loadDataCliente, sendEventWebhook, loadWebhooks } = require('../helpers/webhook.helper');
const { alterarFotoPerfil, criarChat, verificarBarraBot, aposAvaliacao, callbackWhatsapp, enviarMensagemCanal, atualizarNovaMensagem, atualizarAtividade, verifyStandbyUser, createAiOrderLead } = require('../helpers/chat.helper');
const { webhookWppTextClientInit } = require('./webhook.service');
const { executeAutomate } = require('./automate.service');
const WhatsappMensagens = require('../models/WhatsappMensagens');
const mongoose = require('mongoose');
const { addLogs } = require('../helpers/logs.helper');
const { actionResendWebhook } = require('../actions/webhook.action');
const { checkAnalizeChat } = require('../helpers/aiAnalyze.helper');
const notasAvaliacoes = ["1", "2", "3", "4", "5"]
const typesMsgIgnores = ["e2e_notification", "protocol", "gp2", "groups_v4_invite", "unknown", "broadcast_notification"]
// models lais flow
const { v2LaisPonto } = require('./v2/v2_laisPonto');
const { v2LaisAiFlow } = require('./v2/v2_laisFlow');
const { v3LaisAiFlow } = require('./v3/v3_laisFlow');
const { webhookStudioFlow } = require('../helpers/studioFlow');
const { webhookLaisAiFlow } = require('../helpers/laisAiFlow.helper');
const { mainChatbotFlow } = require('./mainChatbotFlow');
const { processReadImage, processReadAudio } = require('../helpers/ai.helper');
const { sendMessageToFront } = require('./sendToFront.service');
const ChatHealthMessages = require('../models/ChatHealthMessages');
const { setChatHealthPending, getChatHealthPending, clearChatHealthPending } = require('../helpers/redis.helper');


async function processWebhookWhatsapp(data, session) {
    const message = data;
    const isLid = message?.isLid;
    const chatLid = message?.chatLid;
    const chatNumber = message?.chatNumber;

    if (!message.session) {
        message.session = session;
    }
    if (typesMsgIgnores.includes(data?.type)) return;
    if (data.isGroupMsg) return;
    const dataInit = await loadData(session);
    const { pod, config, projectId, clienteId, token, clientEmail, privateKeyFormat, urlWhatsapp, webhook_type, direcionamentoDireto, platform } = dataInit;
    const dataCliente = await loadDataCliente(clienteId);
    if (webhook_type === "api") return;
    const cliente_id_pai = await validaIsMultisession(dataCliente, clienteId);
    const webhooksMulti = await loadWebhooks(clienteId, session);
    const usuario = session ? session.substring(0, session.indexOf('-')) : "";
    // const data_webhooks = await loadWebhook(clienteId, session);

    const privateKey = privateKeyFormat;
    const isWebhookCustom = webhook_type === 'custom';

    const foto_perfil_contato = !message?.sender?.profilePicThumbObj?.eurl ? null : message?.sender?.profilePicThumbObj?.eurl;
    const nomeContato = message.pushname || message.sender?.pushname;
    const isMe = message.sender.isMe;
    const chatId = message.chatId; // Identifica a conversa
    const messageId = message.id;  // Identifica a mensagem única
    if (message.isGroupMsg || message.chatId.includes("@g.us")) return; // verifica se msg é de grupo
    //logsMessage(message, clienteId, message.session);

    if (webhook_type === "laisponto") {
        if (message.fromMe) return;
        await v2LaisPonto(message);
        return;
    }

    const respFindFirstMessage = await WhatsappMensagens.findOne({ chatId: message.chatId, fromMe: false, cliente_id: mongoose.Types.ObjectId(clienteId), type: { $ne: "ciphertext" } }).lean();
    const response_init = await initServiceWebhook(soNumeros(message.chatId), clienteId, message.fromMe);

    if (response_init.error) {
        addLogs("error_chat_webhook", response_init)
        return;
    }
    const findFirstMessage = !respFindFirstMessage ? true : false;

    const responseStatusChatbot = response_init?.data;
    if (responseStatusChatbot) {
        //atualizando atividade
        try {
            await atualizarAtividade(responseStatusChatbot._id, message);
        } catch (error) {
            console.log('Erro ao atualizar atividade', error);
        }
    }


    if (message.type === 'ciphertext' || message.type === 'notification_template') {
        const resultPendingMessage = await getRedis(`pendingMessages:${chatId}:${messageId}`);

        if (resultPendingMessage) {
            console.log('A segunda msg veio cripotgrafada tbm, seguindo com o codigo')
            message.body = "Olá";
            message.type = "chat";
        } else {
            console.log('MSG não existe em cache, salvando... >>', messageId)
            await setRedis(`pendingMessages:${chatId}:${messageId}`, true);
            await delay(7000);
            console.log('verificando se a msg existe em cache depois de 7 segundos...')
            const resultPendingMessage = await getRedis(`pendingMessages:${chatId}:${messageId}`);
            if (!resultPendingMessage) return;
            if (resultPendingMessage) {
                console.log('Segunda msg criptografada não chegou')
                await salvarMensagemWhatsapp(message, clienteId, responseStatusChatbot);
                await clearRedis(`pendingMessages:${chatId}:${messageId}`, null);
                let newData = {
                    ...data,
                    type: "chat",
                    body: "Olá",
                    resend: true,
                    reprocess: true
                }
                await actionResendWebhook(newData);
                return;
            }
        }
    } else {
        await salvarMensagemWhatsapp(message, clienteId, responseStatusChatbot);

        // Verifica flag no redis ou se é um reenvio explícito
        const resultPendingMessage = await getRedis(`pendingMessages:${chatId}:${messageId}`);

        if (resultPendingMessage || message.resend) {
            console.log('MSG criptografada chegou ou é resend')

            // Se tiver pendencia ou for resend, garantimos a remoção da versão ciphertext do banco
            // para evitar duplicidade (uma ciphertext salva pelo timeout e esta nova chat salva acima)
            if (message.type !== 'ciphertext') {
                console.log('apagando msg critografada anterior', messageId)
                await WhatsappMensagens.deleteOne({ id: messageId, type: 'ciphertext' });

                // Se ainda existir a flag no redis, limpamos para liberar a thread de espera (se houver)
                if (resultPendingMessage) {
                    await clearRedis(`pendingMessages:${chatId}:${messageId}`, null);
                }
            }
        }
    }

    if (responseStatusChatbot && !responseStatusChatbot?.ai_order_lead_id) {
        const response_order_lead = await createAiOrderLead({
            chat: responseStatusChatbot,
            channel: dataInit,
            persistCreate: true
        });
        if (response_order_lead) {
            await WhatsappMensagens.updateOne({ id: message.id }, { $set: { ai_order_lead_id: response_order_lead._id } });
            responseStatusChatbot.ai_order_lead_id = response_order_lead._id;
        }

    }

    ///// multi webhook send
    for (const webhookData of webhooksMulti) {
        if (webhookData?.events?.includes('wpp_text_client_init')) {
            webhookWppTextClientInit(message, webhookData, session, responseStatusChatbot)
        }
    }
    // enviando msg para front lais
    if (responseStatusChatbot) {
        sendMessageToFront(
            responseStatusChatbot,
            message,
            cliente_id_pai,
            isMe
        );

        if (message.type === "chat") {
            executeAutomate(cliente_id_pai, ["from.chat.contains"], {
                numero: responseStatusChatbot?.numeroCliente,
                nome: responseStatusChatbot?.nomeCliente,
                chatStatus: responseStatusChatbot.statusRoom,
                chatId: responseStatusChatbot._id,
                chatClientId: responseStatusChatbot.cliente_id,
                cliente_id: cliente_id_pai,
                messageText: message.body,
                messageType: message.type,
                sessao: session,
                usuariosIds: responseStatusChatbot.direciona_usuarios,
                setoresIds: responseStatusChatbot.direciona_setores,
                ai_order_lead_id: responseStatusChatbot.ai_order_lead_id,
                fromMe: message.fromMe
            });
        }
    }

    const responseCliente = await getBuscarClienteById(clienteId);
    const msgBoasVindas = config?.generalConfig?.msgs.welcome || responseCliente?.msgBoasVindas || "";

    //enviando dados para aplicativo
    enviarAplicativo(dataInit, data, cliente_id_pai);

    // verificando laisgo
    if (!message?.fromMe && message?.sender?.labels?.length > 0 && config?.laisGo?.status) {
        return;
    }

    if (config?.ai?.autoTranscribeImage && message.type === "image") {
        processReadImage(
            session,
            "66c54d127cae00f46db2e3ef", // id padrao
            clienteId,
            message.id,
            message
        )
    }
    if (config?.ai?.autoTranscribeAudio && ["audio", "ptt"].includes(message.type)) {
        processReadAudio(message, dataInit, clienteId, responseStatusChatbot, responseCliente)
    }


    // Monitoramento de mensagens enviadas pelo agente/plataforma/usuário
    if (message.fromMe) {
        const WINDOW_24_HOURS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
        const now = new Date();
        let shouldLog = false;
        let reason = '';
        let lastClientMsgDate = null;
        let hoursSinceLastClientMsg = null;

        if (!responseStatusChatbot) {
            // Chat não existe
            shouldLog = true;
            reason = 'chat_not_found';
        } else if (!responseStatusChatbot.lastDateMsgClient) {
            // Campo lastDateMsgClient não existe
            shouldLog = true;
            reason = 'no_last_client_message';
        } else {
            lastClientMsgDate = new Date(responseStatusChatbot.lastDateMsgClient);
            const timeDiff = now.getTime() - lastClientMsgDate.getTime();
            hoursSinceLastClientMsg = Math.round(timeDiff / (60 * 60 * 1000) * 100) / 100;

            if (timeDiff > WINDOW_24_HOURS) {
                // Fora da janela de 24 horas
                shouldLog = true;
                reason = 'outside_24h_window';
            }
        }

        if (shouldLog) {
            try {
                const phone = soNumeros(message.from || message.chatId);
                const healthMessage = await ChatHealthMessages.create({
                    chat_id: responseStatusChatbot?._id || null,
                    session: session,
                    phone: phone,
                    date: now,
                    cliente_id: mongoose.Types.ObjectId(clienteId),
                    message_id: message.id,
                    message_type: message.type,
                    timestamp: now.getTime(),
                    last_client_message_date: lastClientMsgDate,
                    hours_since_last_client_message: hoursSinceLastClientMsg,
                    reason: reason,
                    sent_outside_24h_window: reason === 'outside_24h_window'
                });

                // Se foi enviado fora da janela de 24h, registra no Redis para monitorar resposta
                if (reason === 'outside_24h_window') {
                    await setChatHealthPending(phone, clienteId, healthMessage._id);
                }
            } catch (error) {
                console.log('Erro ao registrar chat_health_messages:', error);
            }
        }

        return;
    }

    // Verifica se é uma resposta do cliente a uma mensagem enviada fora da janela de 24h
    try {
        const phone = soNumeros(message.from || message.chatId);
        let pendingHealth = await getChatHealthPending(phone, clienteId);
        let healthMessageId = null;
        let createdAt = null;

        if (pendingHealth && pendingHealth.health_message_id) {
            // Encontrou no Redis
            healthMessageId = pendingHealth.health_message_id;
            createdAt = new Date(pendingHealth.created_at);
        } else {
            // Fallback: busca no banco (caso Redis tenha expirado)
            const pendingFromDb = await ChatHealthMessages.findOne({
                phone: phone,
                cliente_id: mongoose.Types.ObjectId(clienteId),
                sent_outside_24h_window: true,
                client_responded: false
            }).sort({ date: -1 }).lean();

            if (pendingFromDb) {
                healthMessageId = pendingFromDb._id;
                createdAt = new Date(pendingFromDb.date);
            }
        }

        if (healthMessageId) {
            const now = new Date();
            const responseTimeMinutes = Math.round((now.getTime() - createdAt.getTime()) / (60 * 1000));

            // Atualiza o registro no banco marcando que o cliente respondeu
            await ChatHealthMessages.updateOne(
                { _id: mongoose.Types.ObjectId(healthMessageId) },
                {
                    $set: {
                        client_responded: true,
                        client_response_date: now,
                        client_response_message_id: message.id,
                        response_time_minutes: responseTimeMinutes
                    }
                }
            );

            // Remove a pendência do cache (se existir)
            await clearChatHealthPending(phone, clienteId);
        }
    } catch (error) {
        console.log('Erro ao verificar resposta chat_health_messages:', error);
    }

    if (config?.ai?.modules?.aiAnalysisChat.status && config?.ai?.modules?.aiAnalysisChat.operation.includes("durante")) {
        await checkAnalizeChat({ channelConfig: config, chat: responseStatusChatbot, client: responseCliente, cliente_id_pai: cliente_id_pai })
    }

    if (webhook_type === 'dialogflow_basic') {

        if (!responseStatusChatbot) {
            if (message.type === "chat") {  /// se for msg texto
                if (message.body.length > 200) {  /// se msg for muito grande
                    //await callbackWhatsapp(urlWhatsapp, message.from, msgBoasVindas, token, session); // chama msg de saudação

                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: msgBoasVindas,
                        session: session,
                        canal: platform,
                        sendTyping: {
                            delay: 30
                        },
                        variationMsg: true
                    })
                    await criarChat(
                        "Geral",
                        true,
                        soNumeros(message.from),
                        clienteId,
                        "",
                        "",
                        nomeContato,
                        foto_perfil_contato,
                        message.body,
                        {
                            clienteId: cliente_id_pai,
                            messageText: message.body,
                            messageType: message.type,
                            session: session
                        },
                        findFirstMessage,
                        dataInit,
                        {
                            chatNotExist: true,
                            isLid: isLid,
                            chatLid: chatLid,
                            chatNumber: chatNumber
                        }
                    );
                    await registrarBarraBot(session, soNumeros(message.from)) /// registra para barrar bot

                } else {
                    const barra_bot = await verificarBarraBot(session, soNumeros(message.from)); // registra para barrar bot
                    if (barra_bot) return; // se for bot finaliza
                    if (!barra_bot) {
                        const response_df = await buscarDialogflow(session, message, token, usuario, projectId, privateKey, clientEmail, pod, platform);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1 segundo
                        for (const webhookData of webhooksMulti) {
                            if (webhookData && webhookData.events && webhookData.events.includes('whatsapp.dialogflow.payload')) {
                                let data_evento = {
                                    "event": "whatsapp.dialogflow.payload",
                                    "payload": {
                                        "session": session,
                                        "message": message,
                                        "response_df": response_df,
                                        "clienteId": clienteId,
                                        "cliente_id_pai": cliente_id_pai
                                    }
                                }
                                sendEventWebhook(data_evento, webhookData.url, webhookData.method)
                            }
                        }

                        await registrarBarraBot(session, soNumeros(message.from)); /// registra para barrar bot
                    }
                    const responseCallFluxo = await getFluxo(message.body, cliente_id_pai, soNumeros(message.from), responseStatusChatbot?._id); /// busca fluxo do usuario se messagem digita tem no banco para retornar fluxo;
                    if (responseCallFluxo) {
                        try {
                            await criarChat(
                                "Pendente",
                                false,
                                soNumeros(message.from),
                                clienteId,
                                responseCallFluxo.direciona_usuarios || [],
                                responseCallFluxo.direciona_setores || [],
                                nomeContato,
                                foto_perfil_contato,
                                message.body,
                                {
                                    clienteId: cliente_id_pai,
                                    messageText: message.body,
                                    messageType: message.type,
                                    session: session
                                },
                                findFirstMessage,
                                dataInit,
                                {
                                    chatNotExist: true,
                                    isLid: isLid,
                                    chatLid: chatLid,
                                    chatNumber: chatNumber
                                }
                            ); /// cadastra cliente no banco de dados    
                        } catch (error) {
                            console.log('error', error)
                        }


                    } else {

                        try {
                            await criarChat(
                                "Geral",
                                true,
                                soNumeros(message.from),
                                clienteId,
                                "",
                                "",
                                nomeContato,
                                foto_perfil_contato,
                                message.body,
                                {
                                    clienteId: cliente_id_pai,
                                    messageText: message.body,
                                    messageType: message.type,
                                    session: session
                                },
                                findFirstMessage,
                                dataInit,
                                {
                                    chatNotExist: true,
                                    isLid: isLid,
                                    chatLid: chatLid,
                                    chatNumber: chatNumber
                                }
                            )
                        }
                        catch (error) {
                            console.log('error', error)

                        }


                    }
                }
            } else { /// se for msg diferente de texto
                // await callbackWhatsapp(urlWhatsapp, message.from, msgBoasVindas, token, session); // retorna msg saudação

                await enviarMensagemCanal({
                    phone: soNumeros(message.from),
                    message: msgBoasVindas,
                    session: session,
                    canal: platform,
                    sendTyping: {
                        delay: 30
                    },
                    variationMsg: true
                })
                await criarChat(
                    "Geral",
                    true,
                    soNumeros(message.from),
                    clienteId,
                    "",
                    "",
                    nomeContato,
                    foto_perfil_contato,
                    message.body,
                    {
                        clienteId: cliente_id_pai,
                        messageText: message.body,
                        messageType: message.type,
                        session: session
                    },
                    findFirstMessage,
                    dataInit,
                    {
                        chatNotExist: true,
                        isLid: isLid,
                        chatLid: chatLid,
                        chatNumber: chatNumber
                    }
                ) /// cadastra cliente no banco de dados
                await registrarBarraBot(session, soNumeros(message.from)); /// registra para barrar bot
            }


        } else {
            alterarFotoPerfil(responseStatusChatbot, message)
            if (responseStatusChatbot.chatbot) { // verifica se chatbot é true

                if (responseStatusChatbot.statusRoom !== 'Atendendo') {
                    if (responseStatusChatbot.statusRoom === 'Pendente') return // se esta com status pendente igonra
                    if (message.type === "chat") { /// se é chat
                        if (message.body.length > 200) { // verifica se msg é muito grande
                            // await callbackWhatsapp(urlWhatsapp, message.from, msgBoasVindas, token, session); // retorna msg saudação
                            await criarChat(
                                "Geral",
                                true,
                                soNumeros(message.from),
                                clienteId,
                                [],
                                [],
                                nomeContato,
                                foto_perfil_contato,
                                message.body,
                                {
                                    clienteId: cliente_id_pai,
                                    messageText: message.body,
                                    messageType: message.type,
                                    session: session
                                },
                                findFirstMessage,
                                dataInit
                            );
                            await enviarMensagemCanal({
                                phone: soNumeros(message.from),
                                message: msgBoasVindas,
                                session: session,
                                canal: platform,
                                sendTyping: {
                                    delay: 30
                                },
                                variationMsg: true
                            })
                            await registrarBarraBot(session, soNumeros(message.from)) // registra para barrar bot
                        } else {
                            const barra_bot = await verificarBarraBot(session, soNumeros(message.from));
                            if (barra_bot) return;
                            const response_df = await buscarDialogflow(session, message, token, usuario, projectId, privateKey, clientEmail, pod, platform);
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1 segundo

                            for (const webhookData of webhooksMulti) {
                                if (webhookData && webhookData.events && webhookData.events.includes('whatsapp.dialogflow.payload')) {
                                    let data_evento = {
                                        "event": "whatsapp.dialogflow.payload",
                                        "payload": {
                                            "session": session,
                                            "message": message,
                                            "response_df": response_df,
                                            "clienteId": clienteId,
                                            "cliente_id_pai": cliente_id_pai
                                        }
                                    }
                                    sendEventWebhook(data_evento, webhookData.url, webhookData.method)
                                }
                            }

                            await registrarBarraBot(session, soNumeros(message.from))
                            const responseCallFluxo = await getFluxo(message.body, cliente_id_pai, soNumeros(message.from), responseStatusChatbot?._id);

                            if (responseCallFluxo) {
                                await criarChat(
                                    "Pendente",
                                    false,
                                    soNumeros(message.from),
                                    clienteId,
                                    responseCallFluxo.direciona_usuarios || [],
                                    responseCallFluxo.direciona_setores || [],
                                    nomeContato,
                                    foto_perfil_contato,
                                    message.body,
                                    {
                                        clienteId: cliente_id_pai,
                                        messageText: message.body,
                                        messageType: message.type,
                                        session: session
                                    },
                                    findFirstMessage,
                                    dataInit
                                );
                            } else {
                                await criarChat(
                                    "Geral",
                                    true,
                                    soNumeros(message.from),
                                    clienteId,
                                    [],
                                    [],
                                    nomeContato,
                                    foto_perfil_contato,
                                    message.body,
                                    {
                                        clienteId: cliente_id_pai,
                                        messageText: message.body,
                                        messageType: message.type,
                                        session: session
                                    },
                                    findFirstMessage,
                                    dataInit
                                );
                            }
                        }

                    } else {
                        //  // retorna msg saudação


                        setTimeout(async () => {
                            await enviarMensagemCanal(
                                {
                                    phone: soNumeros(message.from),
                                    message: msgBoasVindas,
                                    session: session,
                                    canal: platform,
                                    sendTyping: {
                                        delay: 30
                                    },
                                    variationMsg: true
                                });
                        }, 4000);
                        await criarChat(
                            "Geral",
                            true,
                            soNumeros(message.from),
                            clienteId,
                            [],
                            [],
                            nomeContato,
                            foto_perfil_contato,
                            message.body,
                            {
                                clienteId: cliente_id_pai,
                                messageText: message.body,
                                messageType: message.type,
                                session: session
                            },
                            findFirstMessage,
                            dataInit
                        );
                        await registrarBarraBot(session, soNumeros(message.from));
                    }
                }

            } else {  // contato não está com chatbot true;
                if (responseStatusChatbot.statusRoom === "Avaliando") {
                    if (notasAvaliacoes.includes(message.body)) {
                        await aposAvaliacao(
                            soNumeros(message.chatId),
                            message.body,
                            responseStatusChatbot.direciona_usuarios.length > 0 ? responseStatusChatbot.direciona_usuarios[0] : null,
                            responseStatusChatbot._id,
                            clienteId,
                            responseStatusChatbot.output_pesquisa,
                            responseStatusChatbot.fv_lead_id,
                            webhooksMulti,
                            isWebhookCustom,
                            session,
                            {
                                clienteId: cliente_id_pai,
                                messageText: message.body,
                                messageType: message.type
                            }
                        );
                        await enviarMensagemCanal({
                            phone: responseStatusChatbot.numeroCliente,
                            message: "Agradecemos sua participação!",
                            session: session,
                            canal: platform
                        })
                        await enviarMensagemCanal({
                            phone: responseStatusChatbot.numeroCliente,
                            message: "👋 Até logo",
                            session: session,
                            canal: platform
                        })
                    } else {
                        await aposAvaliacao(
                            soNumeros(
                                message.chatId),
                            message.body,
                            responseStatusChatbot.direciona_usuarios.length > 0 ? responseStatusChatbot.direciona_usuarios[0] : null,
                            responseStatusChatbot._id,
                            clienteId,
                            responseStatusChatbot.output_pesquisa,
                            responseStatusChatbot.fv_lead_id,
                            webhooksMulti,
                            isWebhookCustom,
                            session,
                            {
                                clienteId: cliente_id_pai,
                                messageText: message.body,
                                messageType: message.type
                            }
                        );
                        if (msgBoasVindas !== "") {
                            await enviarMensagemCanal({
                                phone: responseStatusChatbot.numeroCliente,
                                message: msgBoasVindas,
                                session: session,
                                canal: platform,
                                sendTyping: {
                                    delay: 30
                                },
                                variationMsg: true
                            })
                        }
                    }
                } else if (responseStatusChatbot.statusRoom == 'Atendendo') {

                    if (responseStatusChatbot.direciona_usuarios.length > 0) {
                        verifyStandbyUser(responseStatusChatbot.direciona_usuarios[0], responseStatusChatbot, session);
                        //await actionEnviarSocketUsuario(responseStatusChatbot.direciona_usuarios[0], { data: message });
                    }
                }

            }
        }


    } else if (webhook_type === "flowbuilder") {

        webhookStudioFlow(
            clienteId,
            foto_perfil_contato,
            session,
            responseStatusChatbot,
            dataCliente,
            message,
            webhooksMulti,
            dataInit,
            nomeContato,
            cliente_id_pai,
            findFirstMessage
        )
    } else if (webhook_type === "laisai") {

        webhookLaisAiFlow(
            clienteId,
            foto_perfil_contato,
            session,
            responseStatusChatbot,
            dataCliente,
            message,
            webhooksMulti,
            dataInit,
            nomeContato,
            cliente_id_pai

        );
    } else if (webhook_type === "laisai_v2") {
        v2LaisAiFlow(
            clienteId,
            foto_perfil_contato,
            session,
            responseStatusChatbot,
            dataCliente,
            message,
            webhooksMulti,
            dataInit,
            nomeContato,
            cliente_id_pai,
            findFirstMessage
        );
    } else if (webhook_type === "laisai_v3") {

        v3LaisAiFlow({
            clienteId: clienteId,
            fotoPerfil: foto_perfil_contato,
            session: session,
            responseChat: responseStatusChatbot,
            responseClient: dataCliente,
            message: message,
            dataWebhooks: webhooksMulti,
            responseChannel: dataInit,
            nomeContato: nomeContato,
            clientePaiId: cliente_id_pai,
            findFirstMessage: findFirstMessage,
            isAgentFlow: false
        });
    } else if (webhook_type === "lais_agents") {

        v3LaisAiFlow({
            clienteId: clienteId,
            fotoPerfil: foto_perfil_contato,
            session: session,
            responseChat: responseStatusChatbot,
            responseClient: dataCliente,
            message: message,
            dataWebhooks: webhooksMulti,
            responseChannel: dataInit,
            nomeContato: nomeContato,
            clientePaiId: cliente_id_pai,
            findFirstMessage: findFirstMessage,
            isAgentFlow: true
        });

    } else if (webhook_type === "chatbot") {
        mainChatbotFlow({
            clienteId: clienteId,
            foto_perfil_contato: foto_perfil_contato,
            session: session,
            responseChat: responseStatusChatbot,
            responseClient: dataCliente,
            message: message,
            dataWebhooks: webhooksMulti,
            responseChannel: dataInit,
            nomeContato: nomeContato,
            clientePaiId: cliente_id_pai,
            findFirstMessage: findFirstMessage,
        });
    } else if (webhook_type === "direct") {

        if (message.fromMe) return;
        alterarFotoPerfil(responseStatusChatbot, message);
        if (responseStatusChatbot) {
            if (responseStatusChatbot.statusRoom === 'Pendente') return;

            if (responseStatusChatbot.statusRoom === 'Atendendo') {
                // Removido a verificação desnecessária de !responseStatusChatbot 
                // pois já foi verificado anteriormente que responseStatusChatbot existe
                atualizarNovaMensagem(responseStatusChatbot._id, message)
                if (responseStatusChatbot.direciona_usuarios.length > 0) {
                    verifyStandbyUser(responseStatusChatbot.direciona_usuarios[0], responseStatusChatbot, session);
                }
                return; // Importante: retorna aqui para evitar processamento adicional
            } else if (responseStatusChatbot.statusRoom === "Avaliando") {

                if (notasAvaliacoes.includes(message.body)) {
                    await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseStatusChatbot._id, clienteId, responseStatusChatbot.output_pesquisa, responseStatusChatbot.fv_lead_id, webhooksMulti, isWebhookCustom, session,
                        {
                            clienteId: cliente_id_pai,
                            messageText: message.body,
                            messageType: message.type
                        });
                    await enviarMensagemCanal({
                        phone: responseStatusChatbot.numeroCliente,
                        message: "Agradecemos sua participação!",
                        session: session,
                        canal: platform,
                        sendTyping: {
                            delay: 30
                        },
                        variationMsg: false
                    })
                    await enviarMensagemCanal({
                        phone: responseStatusChatbot.numeroCliente,
                        message: "👋 Até logo",
                        session: session,
                        canal: platform,
                        sendTyping: {
                            delay: 30
                        },
                        variationMsg: false
                    })
                } else {
                    await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseStatusChatbot._id, clienteId, responseStatusChatbot.output_pesquisa, responseStatusChatbot.fv_lead_id, webhooksMulti, isWebhookCustom, session);
                    if (direcionamentoDireto.mensagem_apos_cadastro !== "") {
                        console.log('DIRECT:enviando mensagem apos cadastro - cod:3', soNumeros(message.chatId), responseStatusChatbot.statusRoom)
                        await enviarMensagemCanal({
                            phone: responseStatusChatbot.numeroCliente,
                            message: direcionamentoDireto.mensagem_apos_cadastro,
                            session: session,
                            canal: platform
                        })
                    }
                }
                return;
            } else if (responseStatusChatbot.statusRoom === "Geral" || responseStatusChatbot.statusRoom === "Finalizado") {
                // Se chegou aqui, significa que não está Pendente nem Atendendo
                try {
                    await criarChat(
                        direcionamentoDireto.statusRoom,
                        false,
                        soNumeros(message.chatId),
                        clienteId,
                        direcionamentoDireto.direciona_usuario || [],
                        direcionamentoDireto.direciona_setor || [],
                        nomeContato,
                        message.sender.profilePicThumbObj ? message.sender.profilePicThumbObj.eurl : "",
                        message.body,
                        {
                            clienteId: cliente_id_pai,
                            messageText: message.body,
                            messageType: message.type,
                            session: session
                        },
                        findFirstMessage,
                        dataInit
                    );
                    if (direcionamentoDireto.mensagem_apos_cadastro !== "" && responseStatusChatbot.statusRoom !== 'Atendendo') {
                        console.log('DIRECT:enviando mensagem apos cadastro - cod:0', soNumeros(message.chatId))
                        await enviarMensagemCanal({
                            phone: soNumeros(message.from),
                            message: direcionamentoDireto.mensagem_apos_cadastro,
                            session: session,
                            canal: platform,
                            sendTyping: {
                                delay: 30
                            },
                            variationMsg: false
                        })
                    }
                } catch (error) {
                    console.log('Erro ao criar novo chat webhook direct', error)
                }
            }

        } else {

            try {
                await criarChat(
                    direcionamentoDireto.statusRoom,
                    false,
                    soNumeros(message.from),
                    clienteId,
                    direcionamentoDireto.direciona_usuario || [],
                    direcionamentoDireto.direciona_setor || [],
                    nomeContato,
                    message.sender.profilePicThumbObj ? message.sender.profilePicThumbObj.eurl : "",
                    message.body,
                    {
                        clienteId: cliente_id_pai,
                        messageText: message.body,
                        messageType: message.type,
                        session: session
                    },
                    findFirstMessage,
                    dataInit,
                    {
                        chatNotExist: true,
                        isLid: isLid,
                        chatLid: chatLid,
                        chatNumber: chatNumber
                    }
                );

                setTimeout(async () => {
                    if (direcionamentoDireto.mensagem_apos_cadastro !== "") {
                        console.log('DIRECT:enviando mensagem apos cadastro - cod:1', soNumeros(message.chatId))
                        await enviarMensagemCanal({
                            phone: soNumeros(message.from),
                            message: direcionamentoDireto.mensagem_apos_cadastro,
                            session: session,
                            canal: platform,
                            sendTyping: {
                                delay: 30
                            },
                            variationMsg: false
                        })
                    }
                }, 4000);

            } catch (error) {
                console.log('Erro ao criar novo chat webhook direct cod: 23987', error)
            }

        }
    }
}

module.exports = {
    processWebhookWhatsapp
}