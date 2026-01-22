const { createAiOrderLead } = require("../helpers/chat.helper")



const testfunction = async (req, res) => {
    const {action, session, scope} = req.body;
    
    if(action == "createAiOrderLead"){
        await createAiOrderLead(req.body.scope);
    }

    res.json({message: "ok"});

}

module.exports = {
    testfunction
}