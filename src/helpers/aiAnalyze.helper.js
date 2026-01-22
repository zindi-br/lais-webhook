const { v2_actionAnaliseAtendimento } = require("../actions/ai.action");
const {
  incrementChatMessageCount,
  getRedis,
  clearRedis,
} = require("../services/functions");

async function checkAnalizeChat({ channelConfig, chat, cliente_id_pai }) {
  if (!chat?._id) return null;
  await incrementChatMessageCount(chat._id);
  const count = await getRedis(`chatmsgcount:${chat._id}`);

  if (count >= channelConfig?.ai?.modules?.aiAnalysisChat?.numberMsgs) {
    try {
      let data = {
        chat_id: chat._id,
        cliente_id: cliente_id_pai,
      };
      const response = await v2_actionAnaliseAtendimento(data);
      if (response.status === 200) {
        await clearRedis(`chatmsgcount:${chat._id}`);
        console.log("analise chat solicitada com sucesso");
      }
      // função para deletar chave do redis
    } catch (err) {
      console.log("erro ao solicitar analise chat", err);
    }
  }
}

module.exports = {
  checkAnalizeChat,
};

