const mongoose = require('mongoose');
const AiAgents = require('../../models/AiAgents');

const getDataAiAgent = async (id, isCache) => {
    let agg = [
        {
            $match: {
                _id: mongoose.Types.ObjectId(id)
            }
        },
        {
            $addFields: {
                "config.generalConfig.credential_id": {
                    $cond: {
                        if: { $eq: [{ $type: "$config.generalConfig.credential_id" }, "string"] },
                        then: { $toObjectId: "$config.generalConfig.credential_id" },
                        else: "$config.generalConfig.credential_id"
                    }
                },
                "config.generalConfig.voice_id": {
                    $cond: {
                        if: { $eq: [{ $type: "$config.generalConfig.voice_id" }, "string"] },
                        then: { $toObjectId: "$config.generalConfig.voice_id" },
                        else: "$config.generalConfig.voice_id"
                    }
                }
            }
        },
        {
            $lookup: {
                from: "credenciais",
                localField: "config.generalConfig.credential_id",
                foreignField: "_id",
                as: "a"
            }
        },
        {
            $unwind: {
                path: "$a",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "ai_voices",
                localField: "config.generalConfig.voice_id",
                foreignField: "_id",
                as: "b"
            }
        },
        {
            $unwind: {
                path: "$b",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                config: 1,
                credential: "$a",
                voices: "$b",
                name: 1,
                status: 1,
                cliente_id: 1
            }
        }
    ];

    const response = await AiAgents.aggregate(agg);
    if (response.length == 0) return null;
    return response[0];

}



module.exports = {
    getDataAiAgent
  };
  
  