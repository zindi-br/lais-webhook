const {  enviarMensagemCanal, criarChat, enviarMensagemArquivoCanal, aposAvaliacao, enviarMensagemAudioVoz, verifyStandbyUser } = require("../../helpers/chat.helper");
const { soNumeros } = require("../../utils/functions");
const LaisPontoSessoes = require("../../models/ponto/LaisPontoSessoes");
const LaisPontoRegistros = require("../../models/ponto/LaisPontoRegistros");
const LaisPontoColaboradores = require("../../models/ponto/LaisPontoColaboradores");
const { verificarRaio } = require("../../helpers/laisponto.helper");
const LaisPontoEmpresas = require("../../models/ponto/LaisPontoEmpresas");
const LaisPontoLogs = require("../../models/ponto/LaisPontoLogs");

const addRegistry = async (colaboradorId, ultimoRegistro, radius) => {
  let data = {
    colaborador_id:colaboradorId,
    "status": ultimoRegistro?.status === "entrada" ? "saida" : "entrada",
    "deleted": false,
    "date": new Date(),
    "history": [],
    "legacy": null,
    "lastModify": null,
    "type": "whatsapp",
    "type_create":"system",
    "loc": {
      "lat":radius.lat,
      "lng":radius.lng
    }
  }
  console.log('data', data);
 const response = await LaisPontoRegistros(data).save();
 // add history 

  const history = {
    date: new Date(),
    action: "add"
  }
  await LaisPontoRegistros.updateOne(
    { _id: response._id },
    {
      $set: { last_modify: new Date() },
      $push: { history: history }
    }
  );

}

const addLog = async (empresaId, colaboradorId, data, type) => {
  let dataLog = {
    empresa_id: empresaId,
    colaborador_id: colaboradorId,
    scope: data,
    type:type
  }
  await LaisPontoLogs(dataLog).save();
}



async function addRegistroPonto(message) {
  
  const numeroContato = soNumeros(message.chatId)
  const colaborador = await LaisPontoColaboradores.findOne({whatsapp: numeroContato});
  const sessao = await LaisPontoSessoes.findOne({colaborador_id: colaborador._id});
  const empresa = await LaisPontoEmpresas.findOne({_id: colaborador.empresa_id});
  const ultimoRegistro = await LaisPontoRegistros.findOne({colaborador_id: colaborador._id});

  let radius = empresa?.config?.radius;

  if(colaborador?.override_company_settings) {
    radius = colaborador?.config?.radius;
  }

  async function updateStage(id, stage) {
    await LaisPontoSessoes.updateOne(
      { _id: id },
      {
        $set: { stage: stage }
      }
    );
  }

  if(!sessao) {
    await enviarMensagemCanal({
      phone: numeroContato, 
      message: "Envie sua localização no whatsapp", 
      session: message.session, 
      canal: "whatsapp"
    });
    return;
  }
  console.log(message?.loc?.length)

  if(message?.loc?.length > 1) {
    await enviarMensagemCanal({
      phone: numeroContato, 
      message: "Envie sua localização *atual* no whatsapp.", 
      session: message.session, 
      canal: "whatsapp"
    });
    return;
  }


  if(message.type === "location" && sessao.stage === "start" || sessao.stage === "registry_complete" || sessao.stage === "validate_loc_error") {

    try {

      const { lat, lng } = message;

      if(colaborador?.config?.checkRadius) {
        const verify = verificarRaio(radius?.lat, radius?.lng, lat, lng, radius.radius_value);
        if(!verify) {
          await addLog(empresa._id, colaborador._id, {lat, lng}, "location_error");
          await enviarMensagemCanal({
            phone: numeroContato, 
            message: "*Localização inválida*, envie novamente dentro da área permitida.", 
            session: message.session, 
            canal: "whatsapp"
          });
          await updateStage(sessao._id, "validate_loc_error");
          return;
        }
      }
      await addRegistry(colaborador._id, ultimoRegistro, {lat, lng});
      await enviarMensagemCanal({
        phone: numeroContato, 
        message: "*Ponto batido com sucesso*", 
        session: message.session, 
        canal: "whatsapp"
      });
      await updateStage(sessao._id, "registry_complete");
      return

    } catch (error) {
      console.log('error', error);
    }
  }


  if(sessao.stage === "registry_complete" || sessao.stage === "start") {
    await enviarMensagemCanal({
      phone: numeroContato, 
      message: "Envie sua localização", 
      session: message.session, 
      canal: "whatsapp"
    });
  }

  
}



const v2LaisPonto = async (message) => {
    //salvarMensagemWhatsapp(message, null, null);
    await addRegistroPonto(message);
}

module.exports = {
    v2LaisPonto
}
