const Campaigns = require("../../models/Campaigns")
const Traces = require("../../models/Traces");
const TracesItems = require("../../models/TracesItems");
const mongoose = require('mongoose');






async function initCampaingn(clienteId, number, message, chatId) {

    const campaingnsActives = await Campaigns.find({
        status: true,
        deleted: false
    })

    const findTraces = async (campaignId) => {
    
        return await Traces.find({
            content: message,
            campaign_id: campaignId,
            status: true,
            deleted: false
        });
    }

    const addTraceItem = async (trace) => {
        let data = {
            trace_id: trace._id,
            chat_id: chatId,
            campaign_id: trace.campaign_id,
            cliente_id: clienteId,
            number: number,
            date: new Date()
        }
        return await TracesItems(data).save();
    }

    if (campaingnsActives.length > 0) {

        for (const campaing of campaingnsActives) {
            const traces = await findTraces(campaing._id)
            if (traces.length > 0) {
                for (const trace of traces) {
                    const findTraceExist = await TracesItems.findOne({
                        trace_id: mongoose.Types.ObjectId(trace._id),
                        number: number,
                        campaign_id: mongoose.Types.ObjectId(trace.campaign_id)
                    });
                    if(!findTraceExist) addTraceItem(trace);


                }
            }
        }

    }
}

module.exports = {
    initCampaingn
}