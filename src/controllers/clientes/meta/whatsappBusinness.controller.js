
const { processWboWebhook } = require('../../../services/whatsappBusinness.service');
const Canais = require('../../../models/Canais');
const GrossEventsWhatsapp = require('../../../models/GrossEventsWhatsapp');


exports.whatsappBusinnessController = async (req, res, next) => {
  const phoneNumberId = req.body.entry?.[0]?.changes[0]?.value?.metadata?.phone_number_id;

  const responseCanal = await Canais.findOne({
    "config.meta.whatsappBusinness.fromNumberId": phoneNumberId
  });
    // salvnado o webhook completo
    let grossEvent = {
      ...req.body,
      date: new Date()
    };
    if(responseCanal) {
      grossEvent.cliente_id = responseCanal?.cliente_id;
    }
    await GrossEventsWhatsapp(grossEvent).save();

  processWboWebhook(req.body, responseCanal?.sessao, responseCanal?.cliente_id);
  res.sendStatus(200);
};


exports.subscribeWhatsappBusinnessController = async (req, res, next) => {
  const WEBHOOK_VERIFY_TOKEN = "blue_panda";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
};
