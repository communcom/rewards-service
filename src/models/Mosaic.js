const core = require('cyberway-core-service');
const { MongoDB } = core.services;

module.exports = MongoDB.makeModel(
    'Mosaic',
    {
        tracery: {
            type: String,
            required: true,
        },
        collectionEnd: {
            type: Date,
        },
        gemCount: {
            type: Number,
        },
        shares: {
            type: Number,
        },
        damnShares: {
            type: Number,
        },
        reward: {
            type: String,
        },
        displayReward: {
            type: String,
        },
        banned: {
            type: Boolean,
        },
        topCount: {
            type: Number,
            default: 0,
        },
    },
    {
        index: [
            {
                fields: {
                    tracery: 1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
