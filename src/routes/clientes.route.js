'use strict';

module.exports = app => {


    const meta = require("../controllers/clientes/meta/meta.redis.controller");
    const metaWhatasppPlatform = require("../controllers/clientes/meta/whatsappBusinness.controller");
    const root = require("../controllers/clientes/root/root.redis.controller");
    const openai = require("../controllers/clientes/openai/openai.controller");

    //custom

    const conad = require("../controllers/clientes/custom/conad.controller");
    const rac = require("../controllers/clientes/custom/rac.controller");
    
    var router = require("express").Router();

    router.get("/meta", meta.webhookMetaVerificacao); 
    router.post("/meta", meta.webHookMetaPush); 
    router.post("/meta/whatsappBusinness", metaWhatasppPlatform.whatsappBusinnessController); 
    router.get("/meta/whatsappBusinness", metaWhatasppPlatform.subscribeWhatsappBusinnessController); 
    router.post("/clientes/root", root.home); 
    router.post("/meta-init", meta.webHookMetaPush); 
    router.post("/openai", openai.openaiWebhook); 

    //custom
    router.post("/clientes/custom/conad", conad.home); 
    router.post("/clientes/custom/rac", rac.home); 

    
    router.get("/auth", meta.auth); 

    app.use("/webhook/v1", router);
};
