const core = require('cyberway-core-service');
const { MongoDB } = core.services;

module.exports = MongoDB.makeModel(
    'Community',
    {
        communityId: {
            type: String,
        },
        name: {
            type: String,
        },
        collectionPeriod: {
            type: Number,
        },
        moderationPeriod: {
            type: Number,
        },
        extraRewardPeriod: {
            type: Number,
        },
    },
    {
        index: [
            {
                fields: {
                    communityId: 1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
