
const Usuarios = require('../models/Usuarios');
const { getRedis, setRedis } = require('../services/functions');


async function findUsersStandby() {
    let agg = [
        {
          $match: {
            userStandby: true,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]
    const data = await Usuarios.aggregate(agg);
    const mapIds = data.map((item) => item._id.toString());
    return mapIds;
}

const loadUsersStandby = async () => {
    let data;
    const productsFromCache = await getRedis(`usersStandby`);
    const isProductsFromCacheStale = !(await getRedis(`usersStandby:validation`));

    if (isProductsFromCacheStale) {
        const isRefatching = !!(await getRedis(`usersStandby:is-refetching`))
        if (!isRefatching) {
            await setRedis(`usersStandby:is-refatching`, "true", 3610)
            setTimeout(async () => {
                const products = await findUsersStandby();
                await setRedis(`usersStandby`, JSON.stringify(products))
                await setRedis(`usersStandby:validation`, 'true', 3600)
            }, 100);
        }
    }

    if (productsFromCache) {
        data =  JSON.parse(productsFromCache)
    } else {
        const response = await findUsersStandby();
        if(response){
            data = response;
        } else {
            data = [];
        }
    }
    return data;
}


const checkAndCacheMessage = async (session, chatId, msg) => {
    const key = `checkAndCacheMessage:${session}`;
    
    // Busca as mensagens existentes no cache
    const existingMessages = await getRedis(key);
    let messagesArray = [];
    
    if (existingMessages) {
        try {
            messagesArray = JSON.parse(existingMessages);
        } catch (error) {
            console.log('Erro ao fazer parse das mensagens do cache:', error);
            messagesArray = [];
        }
    }
    
    // Verifica se a mensagem já existe no array
    const messageExists = messagesArray.includes(msg);
    
    if (!messageExists) {
        // Se não existe, adiciona ao array e salva no cache
        messagesArray.push(msg);
        await setRedis(key, JSON.stringify(messagesArray), 86400); // 24 horas
        return {
            result: false,
            msgsSendeds: []
        }; // Mensagem não existia, foi inserida
    }
    
    return {
        result: true,
        msgsSendeds: messagesArray
    }; // Mensagem já existia no cache
}

// Registra no cache que uma mensagem foi enviada fora da janela de 24h e aguarda resposta
const setChatHealthPending = async (phone, clienteId, healthMessageId) => {
    const key = `chatHealthPending:${clienteId}:${phone}`;
    const data = {
        health_message_id: healthMessageId.toString(),
        created_at: Date.now()
    };
    // Expira em 48 horas (tempo razoável para aguardar resposta)
    await setRedis(key, JSON.stringify(data), 172800);
}

// Verifica se existe pendência de resposta para o phone/cliente
const getChatHealthPending = async (phone, clienteId) => {
    const key = `chatHealthPending:${clienteId}:${phone}`;
    const data = await getRedis(key);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Remove a pendência do cache após registrar a resposta
const clearChatHealthPending = async (phone, clienteId) => {
    const key = `chatHealthPending:${clienteId}:${phone}`;
    await setRedis(key, null, 1); // Expira imediatamente
}

module.exports = {
    loadUsersStandby,
    checkAndCacheMessage,
    setChatHealthPending,
    getChatHealthPending,
    clearChatHealthPending
}