const axios = require('axios');
const Config = require('../config/config');

const v2_actionGetInfoUserInstagram = (instagramUserId, querys) => {
    return axios({
        method: "get",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/meta/user/${instagramUserId}${querys ? querys : ''}`
    });
}

const v2_actionGetMediaWhatsappBusiness = (mediaId, querys) => {
    return axios({
        method: "get",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/chats/canais/wb/media-by-url/${mediaId}${querys ? querys : ''}`
    });
}





module.exports = {
    v2_actionGetInfoUserInstagram,
    v2_actionGetMediaWhatsappBusiness
  };
