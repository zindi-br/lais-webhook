const { v2_actionTextToSpeech, v2_actionAnalyzeImage } = require("../actions/ai.action");
const WhatsappMensagens = require("../models/WhatsappMensagens");
const { refineAudioToText } = require("./gpt.helper");

async function textToSpeech(text, voz, clienteId) {
    try {
        let data = {
            "voice":voz || "cFylwQo5ufGYUNyRS167",
            "text":text,
            "cliente_id":clienteId
        }
        const response = await v2_actionTextToSpeech(data);
        if(response.status === 200) {
            return response.data.data;
        }
    } catch(error) {
        console.log('Erro ao converter texto em áudio', error) 
        return null;
    }
    
}


async function processReadImage(
    session,
    credentialId,
    clienteId,
    messageWppId,
    message
) {
    const res = await WhatsappMensagens.findOne({ id: messageWppId }).lean();
    if (res) {
        if (res?.transcribeImage) {
            return res.transcribeImage;
        } else {

            try {
                let data = {
                    scope: {
                        credentialId: credentialId,
                        url: null,
                        prompt: "descreva a imagem detalhadamente, prescreva o que voce consegue ver",
                        clienteId: clienteId,
                        messageWppId: messageWppId,
                        session:session,
                        message: message
                    }
                }

                const responseTranscribe = await v2_actionAnalyzeImage(data);
                let messageTranscript = ` Trancrição de foto enviada: ${responseTranscribe?.data }`;
                if (responseTranscribe.status === 200) {
                    await WhatsappMensagens.updateOne({ id: messageWppId }, { 
                        transcribeImage: messageTranscript
                    });
  
                    return responseTranscribe;
                }
            } catch (error) {
                console.log('Erro ao analisar imagem', error);
            }

        }
    }
}

async function processReadAudio(message, channel, aiAgent) {
    const res = await refineAudioToText(message, channel, aiAgent);
    return res;
}


module.exports = {
    textToSpeech,
    processReadImage,
    processReadAudio
}