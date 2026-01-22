require('dotenv/config');
const axios = require('axios');
const { soNumeros } = require('../utils/functions');

const Redis = require('ioredis');

const Clientes = require('../models/Clientes');
const Canais = require('../models/Canais');
const Fluxos = require('../models/Fluxos');
const CrmCampanhas = require('../models/CrmCampanhas');
const CrmCampanhasEventos = require('../models/CrmCamapanhaEventos');
const mongoose = require('../models/mongoose')


const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

const setRedis = async (key, value, ex) => {
    if (ex) {
        await redis.set(`${key}`, `${value}`, 'EX', ex);
    } else {
        await redis.set(`${key}`, `${value}`);
    }
}
const getRedis = async (key) => {
    const res = await redis.get(`${key}`);
    return res;
}

const clearRedis = async (key) => {
    await redis.del(`${key}`);
}

const registrarBarraBot = async (sessao, numero) => {
    const res = await redis.incr(`barrabot:${sessao}:${numero}`);
    await redis.expire(`barrabot:${sessao}:${numero}`, 120);
    return res;
}

const incrDelayAi = async (sessao, numero) => {
    const res = await redis.incr(`checkdelayai:${sessao}:${numero}`);
    await redis.expire(`barracheckdelayaibot:${sessao}:${numero}`, 10);
    return res;
}

const saveMessageToRedis = async (key, message) => {
    await redis.rpushAsync(key, message);
};

const getMessagesFromRedis = async (chatId) => {
    const key = `messages:${chatLines}`;
    const messages = await redis.lrangeAsync(key, 0, -1);
    return messages;
};

const clearMessagesFromRedis = async (chatId) => {
    const key = `messages:${chatId}`;
    await redis.delAsync(key);
};

const clearRedisMessage = async (chatIdMessage) => {
    redis.getAsync(`timeout:${chatIdMessage}`);
}


const getBuscarClienteById = async (id) => {
    try {
        const res = await Clientes.findById(id)
        return res;
    } catch (error) {
        console.log('erro', error)
    }
}

// Função auxiliar para verificar se a mensagem se encaixa nas chaves da campanha
const verificarChavesCampanha = (mensagem, keys) => {
    if (!keys || keys.length === 0) return false;
    
    for (const key of keys) {
        if (key.type === 'exact') {
            // Verificação exata (case insensitive)
            if (mensagem.toLowerCase().trim() === key.value.toLowerCase().trim()) {
                return true;
            }
        } else if (key.type === 'contain') {
            // Verificação se contém (case insensitive)
            if (mensagem.toLowerCase().includes(key.value.toLowerCase())) {
                return true;
            }
        }
    }
    return false;
};

const getFluxo = async (recebe, clienteId, phone, chatId) => {
    let idFormat = mongoose.Types.ObjectId(clienteId);

    // obter fluxo do cliente em fluxos/direcionamentos

    const res = await Fluxos.aggregate([
        { $match: { cliente_id: idFormat, recebe: recebe, status: true } },
        {
            $project: {
                direciona_setores: 1,
                direciona_usuarios: 1,
                recebe: 1,
            }
        }
    ]);

    // buscar campanhas e verificar se a mensagem se encaixa nas regras
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);


    const campanhas = await CrmCampanhas.find({
        cliente_id: idFormat, 
        status: 'active', 
        deleted: false,
        start_date: { $lte: fimDia },
        end_date: { $gte: inicioDia }
    });

    if(campanhas.length > 0){
        if(!recebe) {
            return
        }
        
        for(const campanha of campanhas){
            // Verificar se a mensagem recebida se encaixa nas chaves da campanha
            if (verificarChavesCampanha(recebe, campanha.config.keys)) {
                // inserir evento
                await CrmCampanhasEventos({
                    campaign_id: campanha._id,
                    type: 'message_match',
                    date: new Date(),
                    chat_id: chatId,
                    phone: phone,
                    cliente_id: clienteId
                }).save();
            }
            
           }
    }

    if (res.length > 0) {
        return res[0];
    } else {
        return null
    }

}


function logsMessage(message, clienteId, sessao) {
    if(message.fromMe){
        console.log('Numero:', message.to, '>>' ,'Mensagem:', message.type === "chat" ? message.body : "Arquivo", '>>', 'Sessão:', sessao, '>>', 'ClienteId:', clienteId, '\n', '-----------------------------------')
    } else {
        console.log('Numero:', message.to, '>>' ,'Mensagem:', message.type === "chat" ? message.body : "Arquivo", '>>', 'Sessão:', sessao, '>>', 'ClienteId:', clienteId, '\n', '-----------------------------------')
    }

}

const incrementChatMessageCount = async (chat) => {
    if (!chat || !chat._id) return;
    const key = `chatmsgcount:${chat._id}`;
    console.log('inserindo count key', key)
    await redis.incr(key);
};

module.exports = {
    getBuscarClienteById,
    getFluxo,
    setRedis,
    getRedis,
    registrarBarraBot,
    logsMessage,
    incrDelayAi,
    saveMessageToRedis,
    getMessagesFromRedis,
    clearMessagesFromRedis,
    clearRedisMessage,
    clearRedis,
    incrementChatMessageCount
};
