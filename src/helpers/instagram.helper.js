const InstagramMensagens = require('../models/MensagensInstragam');



const addMsgInstagramToDatabase = async (newObjMessage) => {
    await InstagramMensagens(newObjMessage).save();   
}


module.exports = {
    addMsgInstagramToDatabase
}