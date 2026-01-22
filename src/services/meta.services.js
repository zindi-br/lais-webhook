const { v2_actionGetInfoUserInstagram } = require("../actions/meta.action");
const Chats = require("../models/Chats");


// BUSCANDO INFOMRAÇÕES DO USUARIO NO INSTAGRAM
const getInfoInstagramUser = async (instagramUserId, sessao) => {
    try {
        let querys = `?sessao=${sessao}&canal=instagram`
        const response = await v2_actionGetInfoUserInstagram(instagramUserId, querys);
        if(response.status === 200 && response.data){
            return response.data.data;
        }
    
    } catch (error) {
        console.log('erro ao fazer requisição apos validação', error);
    }
}


// BUSCANDO INFOMRAÇÕES DO USUARIO NO INSTAGRAM
const getInfoInstagramUserAndUpdate = async (instagramUserId, sessao, chat) => {

    const updateInfoUser = async (data) => {
        await Chats.updateOne({ _id: chat._id }, { $set: {"instagramUser.profile": data, fotoPerfil:data.profile_pic} });
        console.log('Informações do usuario atualizadas com sucesso');
    }

    try {
        let querys = `?sessao=${sessao}&canal=instagram`
        const response = await v2_actionGetInfoUserInstagram(instagramUserId, querys);
        console.log('responseInfoPerfil', response.data.data)
        if(response.status === 200 && response.data){
            const dataInsert = response.data.data;
            updateInfoUser(dataInsert)
        }
    
    } catch (error) {
        console.log('erro ao fazer requisição apos validação', error);
    }
}


// BUSCANDO INFOMRAÇÕES DO USUARIO NO INSTAGRAM
const updateDateLastMessageInstagram = async (chatId) => {
    await Chats.updateOne({ _id: chatId }, { $set: {"instagramUser.lastDateMessageUser": new Date()} });
}
       

module.exports = {
    getInfoInstagramUser,
    getInfoInstagramUserAndUpdate,
    updateDateLastMessageInstagram
  };
