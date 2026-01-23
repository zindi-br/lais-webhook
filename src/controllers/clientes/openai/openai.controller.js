const Logs = require('../../../models/Logs');


exports.openaiWebhook = async (req, res, next) => {
    try {

        let dataLog = {
            date:new Date(),
            scope: {
                cliente_id:user.cliente_id,
                tipo:'openai_webhook_event',
                data: req.body
            }
        }

        await Logs.create(dataLog);

        res.status(200).json({ received: true });

    } catch (error) {
        res.status(400);
    }
    

}