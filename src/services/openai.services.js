const OpenAI = require('openai');
const fs = require('fs');
const { getKeysProviderAi } = require('../utils/ai.utils');
const config = require('../config/config');
const Credenciais = require('../models/Credenciais');




const readAudio = async (audio, channel, aiAgent) => {
  const apiKey = await getKeysProviderAi(channel, aiAgent);
  const credencial = await Credenciais.findById(config?.openai_credential_id)
  let key = apiKey || credencial?.keys?.apiKey;
  
  const openai = new OpenAI({ apiKey: apiKey || credencial?.keys?.apiKey });

  try {
    // Decodificar o áudio Base64 para um buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    // Escrever o buffer em um arquivo temporário
    const tempFilePath = `./${new Date() / 1000}.ogg`; // Você pode escolher o formato adequado
    fs.writeFileSync(tempFilePath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      language: "pt", // this is optional but helps the model
    });
    fs.unlinkSync(tempFilePath);
    return transcription.text;
  
  } catch (error) {
    console.error("Erro na trascricao: ");
    throw error;
  }
};



module.exports = {
  readAudio
}