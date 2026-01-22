
 function getModelByType(type){
    let model = "gpt4o"
    switch(type){
        case 'basic':
            model = 'gpt4o-mini';
            break;
        case 'advanced':
            model = 'gpt4o';
            break;
    }
    return model;
 }

const getKeysProviderAi = async (channel, aiAgent) => {
    let keys;
 
     if(!aiAgent) {
        keys = channel?.config?.ai?.openai?.apiKey
     } else {
        keys = aiAgent?.credential?.keys?.apiKey
     }
     return keys;
}


module.exports = {
    getModelByType,
    getKeysProviderAi
};
