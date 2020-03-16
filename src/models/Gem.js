const core = require('cyberway-core-service');
const { MongoDB } = core.services;
const { MongoBigNum } = core.types;

module.exports = MongoDB.makeModel(
    'Gem',
    {
        tracery: {
            type: String,
            required: true,
        },
        owner: {
            type: String,
        },
        creator: {
            type: String,
        },
        frozenPoints: {
            type: String,
        },
        pledgePoints: {
            type: String,
        },
        communityId: {
            type: String,
        },
        damn: {
            type: Boolean,
        },
        shares: {
            type: MongoBigNum,
        },
        isClaimable: {
            type: Boolean,
            default: false,
        },
        isChopped: {
            type: Boolean,
            default: false,
        },
        blockTime: {
            type: Date,
            required: true,
        },
        blockNum: {
            type: Number,
            required: true,
        },
        reward: {
            type: Number,
            default: 0,
        },
    },
    {
        index: [
            {
                fields: {
                    tracery: 1,
                    owner: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    owner: 1,
                    isClaimable: 1,
                },
            },
            {
                fields: {
                    blockTime: -1,
                    isChopped: -1,
                },
            },
            {
                fields: {
                    isChopped: -1,
                    isClaimable: -1,
                },
            },
            {
                fields: {
                    owner: 1,
                },
            },
        ],
    }
);
