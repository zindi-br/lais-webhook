'use strict';
//utils 
const { validaIsMultisession, soNumeros } = require('../../../utils/functions');
const { editarAck, atualizarExclusaoMensagem } = require('../../../services/appHelper');
const { actionEnviarSocketUsuarioFront } = require('../../../actions/socket.actions');
const { loadData, loadDataCliente, } = require('../../../helpers/webhook.helper');
const { enviarMensagemCanal, atualizatStatusConexaoCanal } = require('../../../helpers/chat.helper');

const { actionEnviarMsgTelegram, helper_enviarAlertaResponsavel } = require('../../../helpers/admin.helper');
const Config = require('../../../models/Config');
const { processWebhookWhatsapp } = require('../../../services/processWebhook.service');
const { processAndTransformMessageWhatsapp } = require('../../../utils/message.utils');
const typesMsgIgnores = ["e2e_notification", "protocol", "gp2", "groups_v4_invite", "unknown", "broadcast_notification"]



exports.home = async (req, res) => {
    const data = req.body
    const session = data.session;

    async function initStatusEvent(dataEvent) {
        const dataInit = await loadData(session);
        const { clienteId } = dataInit;
        const dataCliente = await loadDataCliente(clienteId);
        const cliente_id_pai = await validaIsMultisession(dataCliente, clienteId);

        const globalConfig = await Config.findOne({ name_config: "global" });

        let isSentinela = true;
        if (globalConfig) {
            isSentinela = globalConfig.config.alertas.sentinela;
        }

        if (dataEvent.event === 'qrcode') {
            let data = {
                to: cliente_id_pai,
                whoTo: "clienteId",
                action: "qrcodeEvent",
                scope: dataEvent
            };
            try {
                actionEnviarSocketUsuarioFront(data);
            } catch (error) {
                console.log('Erro ao enviar socket qrcode para device', error)
            }
        }

        if (dataEvent.event === 'status-find') {
            console.log('status-find', dataEvent)
            let data = {
                to: clienteId,
                whoTo: "clienteId",
                action: "statusFindEvent",
                scope: dataEvent
            };
            let list = ["notLogged", "browserClose", "desconnectedMobile", "autocloseCalled", "logoutsession"];

            try {
                const response_channel = await Canais.findOne({ sessao: session });

                if (list.includes(dataEvent.status)) {
                    await atualizatStatusConexaoCanal(dataEvent.session, 'desconectado')
                }

                if (dataEvent.status === "desconnectedMobile") {

                    if (!isSentinela) return;
                    let msg = `**${response_channel.nome}(${session})** está com o Qrcode desconectado`
                    actionEnviarMsgTelegram("lais", msg);
                    helper_enviarAlertaResponsavel(
                        cliente_id_pai,
                        `*${response_channel.nome}* (${dataCliente.numero}) está com o Qrcode desconectado. Conecte novamente na plataforma\n\nhttps://rebrand.ly/colhendoqrcode`,
                        globalConfig
                    );
                }

                if (dataEvent.status === "browserClose") {
                    if (!isSentinela) return;
                    let msg = `**${response_channel.nome}(${session})** foi fechada`
                    actionEnviarMsgTelegram("lais", msg);
                }

                // if (dataEvent.status === "notLogged") {
                //     if (!isSentinela) return;
                //     let msg = `**${response_channel.nome}(${session})** foi iniciada a sessão e o Qrcode está pendente pra leitura`
                //     actionEnviarMsgTelegram("lais", msg);
                //     helper_enviarAlertaResponsavel(
                //         cliente_id_pai,
                //         `*${response_channel.nome}* (${dataCliente.numero}) está com o Qrcode desconectado. Conecte novamente na plataforma\n\nhttps://rebrand.ly/colhendoqrcode`,
                //         globalConfig
                //     )
                // }

                if (dataEvent.status === "inChat") {
                    if (response_channel?.status_connection_whatsapp === "desconectado") {
                        actionEnviarSocketUsuarioFront(data);
                    }
                    setTimeout(() => {
                        atualizatStatusConexaoCanal(dataEvent.session, "conectado")
                    }, 5000);
                }



            } catch (error) {
                console.log('Erro ao enviar socket qrcode para device', error)
            }
        }
    }


    async function initCallFunction() {
        const dataInit = await loadData(session);
        let platform = dataInit?.platform;
        if (dataInit?.config?.incomingcall?.status) {
            try {
                let messageIncomingcall = dataInit.config?.incomingcall?.message;
                await enviarMensagemCanal({
                    phone: soNumeros(data.peerJid),
                    message: messageIncomingcall,
                    session: session,
                    canal: platform
                });
            } catch (error) {
                console.log(error)
            }
        }
    }


    if (!data.platform) {
        res.status(400).json({ status: 'error', msg: 'platform is null' });
        return;
    }

    if (data.platform === "whatsapp") {
        try {
            switch (data.event) {
                case 'received-message':
                    if (data.type === 'gp2') return res.status(200).json({ status: 'ok' });

                    if (data.to === data.from || data.from === "status@broadcast" || typesMsgIgnores.includes(data.type)) {
                        res.status(200).json({ status: 'ok' });
                        return;
                    }
                    console.log(data)
                    let msgTransformed = processAndTransformMessageWhatsapp(data);
                    await processWebhookWhatsapp(msgTransformed, session);
                    res.status(200).json({ status: 'ok' });
                    return;

                case 'onrevokedmessage':
                    atualizarExclusaoMensagem(data);
                    break;

                case 'status-find':
                case 'qrcode':
                    initStatusEvent(data);
                    break;

                case 'onack':
                    editarAck(data);
                    break;

                case 'incomingcall':
                    initCallFunction();
                    break;

                default:
                    console.log(`Unhandled event type: ${data.event}`);
                    res.status(400).json({ status: 'error', msg: 'Unhandled event type' });
                    return;
            }
            res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error(`Error handling event ${data.event}:`, error);
            res.status(500).json({ status: 'error', msg: 'Internal server error' });
        }
    }

    if (data.platform === "whatsapp_business") {
        try {
            processWebhookWhatsapp(data, session);
            res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error(`Error handling event ${data.event}:`, error);
            res.status(500).json({ status: 'error', msg: 'Internal server error' });
        }
    }
};



