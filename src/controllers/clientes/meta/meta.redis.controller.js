'use strict';
const axios = require('axios');
// models
const Clientes = require('../../../models/Clientes');
const Canais = require('../../../models/Canais');
const Chats = require('../../../models/Chats');
const Fluxos = require('../../../models/Fluxos');
const mongoose = require('../../../models/mongoose');
const Sentry = require("@sentry/node");

//utils 
const { buscarDialogflow, buscarDialogflowMeta, soNumeros, initService } = require('../../../utils/functions');
const { sendToMeta, getBuscarClienteById, getFluxo, setRedis, getRedis } = require('../../../services/functions');
const config = require('../../../config/config');
const { addMsgInstagramToDatabase } = require('../../../helpers/instagram.helper');
const { webhookMetaInstagram } = require('../../../helpers/webhookMetaInstagram');

require('dotenv/config');


exports.webHookMetaPush = async (req, res, next) => {
    const { entry } = req.body;
    const instagramRootId = entry[0].id
    const responseCanal = await Canais.findOne({ "config.meta.instagram.instagramUserId": instagramRootId });
    const content = entry[0];
    const isMe = content?.messaging[0].sender?.id === instagramRootId
    const isRead = content?.messaging[0].read;
    let instagramUserId = !isMe ? content?.messaging[0].sender.id : content?.messaging[0].recipient.id;

    let newObjMessage = {
        cliente_id: responseCanal.cliente_id,
        id: content?.id,
        instagramUserId,
        timestamp: content?.time,
        date: new Date(content?.time).toISOString(),
        message: {
            ...content?.messaging[0],
            isFile: content?.messaging[0].message?.attachments ? true : false,
            isMe: content?.messaging[0].sender?.id === instagramRootId
        }
    }

    const isDeleted = newObjMessage.message.is_deleted;

    //ENVIANDO MENSAGEM PARA O BANCO DE DADOS
    if (!isRead && !isDeleted) {
        addMsgInstagramToDatabase(newObjMessage)
    }

    webhookMetaInstagram(responseCanal, newObjMessage);

    res.status(200).send('ok');

};



exports.webhookMetaVerificacao = (req, res, next) => {
    let queryValue = req.query
    console.log('queryValue', queryValue)
    res.status(200).send(queryValue['hub.challenge']);
};


exports.webhookMeta = async (req, res, next) => {

    let event = req.body.entry[0].messaging[0];
    if (!event) return null; // 
    await initWebhook(event);

    //    if(req.body.object === 'page') {
    //        console.log('event facebook')
    //    } else if(req.body.object === 'instagram') {
    //        console.log('event instagram')
    //    }

};


exports.auth = async (req, res, next) => {
    const { code, state } = req.query;
    const clientId = '1130925304811273';
    const clientSecret = '418ce2f45b75dd8ca59a2a1f84561e59';
    const redirectUri = 'https://webhook-beta.lais.app/webhook/v1/auth';

    const updateChannel = async (accessTokenUser) => {
        try {
           

            try {
                const responseAccounts = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?access_token=${accessTokenUser}`);
                const accounts = responseAccounts.data.data;
                console.log('accounts', accounts)
                const findAccount = accounts[0].access_token
                const responseInfo = await axios.get(`https://graph.facebook.com/v20.0/me?fields=instagram_business_account&access_token=${findAccount}`);

                console.log('responseInfo', responseInfo.data.instagram_business_account.id)

               
                await Canais.updateOne({ _id: state }, { $set: { 
                    'config.meta.instagram.accessTokenUser': accessTokenUser,
                    'config.meta.instagram.accessToken': findAccount,
                    'config.meta.instagram.instagramUserId': responseInfo.data.instagram_business_account.id,
                    'status_connection_whatsapp': 'conectado'
                }  });

            } catch (error) {
                console.log('erro ao atualizar canal', error)
            }

         
        } catch (err) {
            console.log('erro ao atualizar canal', err)
        }
    }



    try {
        const response = await axios({
            url: 'https://graph.facebook.com/v20.0/oauth/access_token',
            method: 'get',
            params: {
                client_id: clientId,
                redirect_uri: redirectUri,
                client_secret: clientSecret,
                code: req.query.code
            }
        });
        const accessTokenUser = response.data.access_token;
        console.log('accessTokenUser', accessTokenUser)
        updateChannel(accessTokenUser);

        //res.redirect('https://beta.lais.app/dashboard/configuracoes/canais');
        res.redirect(`https://beta.lais.app/dashboard/configuracoes/pageList?channel=${state}`);
    } catch (error) {
        console.error("Error exchanging code for token:", JSON.stringify(error));
        res.send('error')
    }



};


