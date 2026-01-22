const { actionEnviarSocketUsuario } = require("../actions/socket.actions");
const { atualizarAtividade, atualizarNovaMensagem } = require("../helpers/chat.helper");
const { actionEnviarSocketUsuarioFront } = require("../actions/socket.actions");
const { Sentry } = require("@sentry/node");

// enviando msg para front lais
const sendMessageToFront = async (chat, message, clientePaiId, isMe) => {

    let listaStatus = [
        "Geral",
        "Pendente",
        "Avaliando",
        "Finalizado"
    ]

    if (chat.statusRoom === 'Atendendo') {
        if (chat.direciona_usuarios.length > 0) {

            try {
                let data = {
                    to: clientePaiId,
                    whoTo: "clienteId",
                    action: "newMessage",
                    scope: {
                        lista_atualizar: ["Atendendo"],
                        message: message,
                        chat_id: chat._id,
                        usuario_id: chat.direciona_usuarios[0],
                    }
                };
                await actionEnviarSocketUsuarioFront(data);

                if (isMe) {
                    atualizarAtividade(chat._id, message)
                } else {
                    atualizarNovaMensagem(chat._id, message)
                }
            } catch (error) {
                console.log('Erro ao enviar socket web para front', error);
                Sentry.withScope(scope => {
                    scope.setTag("section", "actionEnviarSocketUsuarioFront");
                    scope.setLevel("error");
                    scope.setExtra("chat", chat);
                    scope.setExtra("message", message);
                    Sentry.captureException(error);
                });
            }

            if (chat.direciona_usuarios.length > 0) {
                actionEnviarSocketUsuario(chat.direciona_usuarios[0], { data: message });
            }

        }
    } else if (chat.statusRoom === 'Pendente') {
        if (!isMe) {
            await atualizarNovaMensagem(chat._id, message)
        }
    }

    if (!listaStatus.includes(chat.statusRoom)) return;

    let data = {
        to: clientePaiId,
        whoTo: "clienteId",
        action: "newMessage",
        scope: {
            lista_atualizar: [chat.statusRoom],
            message: message,
            chat_id: chat._id,
        }
    };
    try {
        actionEnviarSocketUsuarioFront(data);
        actionEnviarSocketUsuario(chat.direciona_usuarios[0], { data: message });

        if (isMe) {
            atualizarAtividade(chat._id, message);
        } else {
            atualizarNovaMensagem(chat._id, message);
        }
    } catch (error) {
        console.log('Erro ao enviar socket para devices', error);
    }
};


module.exports = {
    sendMessageToFront
}