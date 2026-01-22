const { actionEnviarSocketUsuarioFront } = require("../actions/socket.actions");
const { createChat, verifyStandbyUserInstagram, enviarMensagemCanal, atualizarNovaMensagem, v2_enviarMensagemCanal, atualizarAtividade } = require("../helpers/chat.helper");
const { getBuscarClienteById } = require("./functions");

const notasAvaliacoes = ["1", "2", "3", "4", "5"]


const oldFlowForInstagram = async (
    chat,
    webhookType,
    channel,
    message,
    client,
    webhooks,
    clienteIdPai,
    isMe,
    isFile,
    instagramUserId,
) => {

    const session = channel?.sessao; // VERIFICAR AQUI
    const responseCliente = await getBuscarClienteById(client?._id);
    const msgBoasVindas = responseCliente.config.msgBoasVindas;
    const dataDirectConfig = channel?.config?.direcionamento_direto;
    let platform = channel?.platform;


    if (chat) {
        
        //alterarFotoPerfil(chat, message)
        if (chat.statusRoom === 'Pendente') return;
        if (chat.statusRoom == 'Atendendo') {
            if (chat.direciona_usuarios.length > 0) {
                let data = {
                    to: clienteIdPai,
                    whoTo: "clienteId",
                    action: "newMessageInstagram",
                    scope: {
                        lista_atualizar: ["Atendendo"],
                        message: message,
                        usuario_id: chat.direciona_usuarios[0],
                    }
                };
                try {
                    actionEnviarSocketUsuarioFront(data)
                    // actionEnviarSocketUsuario(responseChat.direciona_usuarios[0], { data: message });
                    if (message.message.isMe) {
                        atualizarAtividade(chat._id, message.message.message.text)
                    } else {
                        if (message.message.isFile) {
                            atualizarNovaMensagem(chat._id, '📎 Arquivo')
                        } else {
                            atualizarNovaMensagem(chat._id, message.message.message.text)
                        }
                    }
                } catch (error) {
                    console.log('Erro ao enviar socket para devices', error)
                }
            }

            if (chat.direciona_usuarios.length > 0) {
                verifyStandbyUserInstagram(chat.direciona_usuarios[0], chat, session);
            }

        } else if (!chat.chatbot && chat.statusRoom === "Avaliando") {
            if (notasAvaliacoes.includes(message.body)) {
                // inserir função similirar a função de avaliação para instagram
                await v2_enviarMensagemCanal({userId:instagramUserId, message:"Agradecemos sua participação!"},session, "instagram")
                await v2_enviarMensagemCanal({userId:instagramUserId, message:"👋 Até logo"}, session, "instagram")
            } else {
                // inserir função similirar a função de avaliação para instagram
                if (msgBoasVindas !== "") {
                    await v2_enviarMensagemCanal({userId:instagramUserId, message:msgBoasVindas}, session, platform)
                }
            }
        } else {
            if (!isMe && chat.statusRoom === "Geral" || chat.statusRoom === "Finalizado") {
                console.log('inserindo chat para geral')
                let scope = {
                    cliente_id: client._id,
                    "instagramUser.id": instagramUserId,
                    statusRoom: "Pendente",
                    chatbot: true,
                    direciona_usuarios: dataDirectConfig?.direciona_usuario || [],
                    direciona_setores: dataDirectConfig?.direciona_setor || [],
                    canal: platform,
                }
                await createChat(scope)
                if (webhookType === "direct" && msgBoasVindas !== "") {
                    await v2_enviarMensagemCanal({userId:instagramUserId, message:msgBoasVindas}, session, platform);
                }
            }

        }
    } else {
        let scope = {
            cliente_id: client._id,
            "instagramUser.id": instagramUserId,
            statusRoom: "Pendente",
            chatbot: true,
            direciona_usuarios: dataDirectConfig?.direciona_usuario || [],
            direciona_setores: dataDirectConfig?.direciona_setor || [],
            canal: platform,
        }
        console.log('nao tem chat, criar chat...')
        await createChat(scope)
        if (webhookType === "direct" && msgBoasVindas !== "") {
            await v2_enviarMensagemCanal({userId:instagramUserId, message:msgBoasVindas}, session, "instagram");
        }
    }
}

module.exports = {
    oldFlowForInstagram
}