const axios = require("axios");
const Clientes = require("../models/Clientes");
const Usuarios = require("../models/Usuarios");
const Config = require("../models/Config");
const { enviarMensagemCanal } = require("./chat.helper");
const { soNumeros } = require("../utils/functions");

const actionEnviarMsgTelegram = async (target, mensagem) => {
    const dataConfig = await Config.findOne({name_config:"global"}).lean();
    if(!dataConfig?.config?.alertas?.telegram) return;

    const configs = [
        {
            name: 'lais',
            id: "-4571527600",
            token: '7219632192:AAGY-cStj_oHTsheA6-Zu0erNy1SzEEzkX8'
        },
        {
            name: 'joao',
            id: "-4500742060",
            token: "7703003280:AAFkIC-OUngek0woy95TeS126kIN_v64EW4"
        }
    ];

    const config = configs.filter(config => config.name === target)[0] || configs[1];
    
    return axios({
        method: "post",
        url: `https://api.telegram.org/bot${config.token}/sendMessage`,
        data: { 
            chat_id: config.id,
            text: mensagem 
        }
    });
};


const helper_enviarAlertaResponsavel = async (clienteId, msg, config) => {
    const find_users = await Usuarios.find({cliente_id:clienteId, status:true, descontinuado:false, rules:{$in:['alertas']}});

    for(const user of find_users){
        if(!user || user?.telefone?.length < 9) return;
        try {
            await enviarMensagemCanal({
                phone: soNumeros(user.telefone), 
                message: msg, 
                session: config?.config?.alertas?.sessao, 
                canal: "whatsapp"
            })
        } catch(err) {
          console.log('erro ao enviar de alerta ao responsavel', clienteId, user.telefone, err)
        }
    }

};


module.exports = {
    actionEnviarMsgTelegram,
    helper_enviarAlertaResponsavel
}