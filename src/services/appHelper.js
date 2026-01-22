const Chats = require('../models/Chats'); 
const WhatsappMensagens = require('../models/WhatsappMensagens');
const mongoose = require('../models/mongoose')

const limparCamposComCifrao = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => limparCamposComCifrao(item));
  }

  const novoObj = {};
  for (const [chave, valor] of Object.entries(obj)) {
    // Remove campos que começam com $ ou contêm $ em qualquer posição
    if (!chave.startsWith('$') && !chave.includes('$')) {
      // Se o valor é um objeto, aplica recursivamente a limpeza
      if (valor && typeof valor === 'object') {
        novoObj[chave] = limparCamposComCifrao(valor);
      } else {
        novoObj[chave] = valor;
      }
    }
  }
  return novoObj;
}

const verificarEnvioPush = async (clienteId, numeroCliente) => {

  try {

    const response1 = await Chats.aggregate([
      {
        $match: {
          cliente_id: mongoose.Types.ObjectId(clienteId),
          numeroCliente: numeroCliente,
          statusRoom: "Atendendo",
        },
      },
      {
        $unwind: {
          path: "$direciona_usuarios",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "usuarios",
          localField: "direciona_usuarios",
          foreignField: "_id",
          as: "a",
        },
      },
      {
        $unwind: {
          path: "$a",
        },
      },
      {
        $project: {
          _id: 0,
          playerId: {
            $ifNull: ["$a.onesignal_player_id", null]
          }
        },
      },
    ]);
    if (response1?.length == 0) return null;

    return response1[0];

  } catch (error) {
    console.log('Erro ao buscar playerId do cliente: ', error)
  }
}


const salvarMensagemWhatsapp = async (event, clienteId, chat) => {
  const ticketId = chat?.ticket_active_id;
  const userId = chat?.direciona_usuarios?.length > 0 ? chat?.direciona_usuarios[0] : null;
  const aiOrderLeadId = chat?.ai_order_lead_id;

  // verificar se  existe @lid no caht ID
  const isLid = event?.chatId.includes('@lid');

  let number = event?.chatId.split('@')[0];
  if(isLid) {
    number = event?.chatId.split('@')[0]; 
  }

  // Limpar campos com $ antes de criar o novo objeto
  const eventLimpo = limparCamposComCifrao(event);

  const newObj = {
    ...eventLimpo,
    cliente_id: clienteId,
    ticketId: ticketId,
    userId: userId,
    ai_order_lead_id: aiOrderLeadId,
    isLid: isLid,
    chatLid: isLid ? event?.chatId : null,
    chatNumber: number || null
  };

  try {
    if (event.from === 'status@broadcast') return;
    await WhatsappMensagens(newObj).save();
  } catch (error) {
    console.error('Erro ao salvar mensagem', newObj, error)
  }
}

const editarAck = async (event) => {
  let id = event?.id._serialized;
  try {
    await WhatsappMensagens.updateOne({ id: id }, { ack: event.ack });
  } catch (error) {
    console.log('Erro ao atualizar ack mensagem', error)
  }
}

const atualizarExclusaoMensagem = async (event) => {
  let id = event?.refId;
  try {
    const response = await WhatsappMensagens.updateOne({ id: id }, { isDeleted: true });
  } catch (error) {
    console.log('Erro ao atualizar onrevoked mensagem', error)
  }
}


module.exports = {
  verificarEnvioPush,
  salvarMensagemWhatsapp,
  editarAck,
  atualizarExclusaoMensagem,
  limparCamposComCifrao
};

