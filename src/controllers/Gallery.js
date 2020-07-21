const core = require('cyberway-core-service');
const { Service } = core.services;
const Mosaic = require('../models/Mosaic');
const Gem = require('../models/Gem');
const { calculateTracery } = require('../utils/mosaic');

class Gallery extends Service {
    constructor({ forkService, ...args }) {
        super(args);
        this._forkService = forkService;
    }

    async handlePostCreate({ message_id: messageId, commun_code: communityId }) {
        const { author: userId, permlink } = messageId;
        const tracery = calculateTracery(userId, permlink);

        await Gem.update(
            { tracery },
            {
                $set: {
                    contentId: {
                        userId,
                        permlink,
                        communityId,
                    },
                },
            }
        );
    }

    async handleGemState({
        tracery,
        owner,
        creator,
        points: frozenPoints,
        pledge_points: pledgePoints,
        damn,
        shares,
        blockTime,
        blockNum,
    }) {
        const communityId = pledgePoints.split(' ')[1];

        const data = {
            tracery,
            owner,
            creator,
            frozenPoints,
            pledgePoints,
            damn,
            shares,
            communityId,
        };

        const previousModel = await Gem.findOneAndUpdate(
            { tracery, owner },
            { $set: data },
            { lean: true }
        );

        if (previousModel) {
            await this.registerForkChanges({
                type: 'update',
                // todo: migrate to new fork service
                Model: { className: 'Gem' },
                documentId: previousModel._id,
                data: {
                    $set: {
                        creator: previousModel.creator,
                        frozenPoints: previousModel.frozenPoints,
                        pledgePoints: previousModel.pledgePoints,
                        damn: previousModel.damn,
                        shares: previousModel.shares,
                        communityId: previousModel.communityId,
                    },
                },
            });
        } else {
            const newModel = await Gem.create({ ...data, blockTime, blockNum });

            await this.registerForkChanges({
                type: 'create',
                // todo: migrate to new fork service
                Model: { className: 'Gem' },
                documentId: newModel._id,
            });
        }
    }

    async handleGemChop({ tracery, owner }) {
        const previousModel = await Gem.findOneAndUpdate(
            { tracery, owner },
            {
                $set: {
                    isChopped: true,
                    isClaimable: false,
                },
            }
        );

        if (!previousModel) {
            return;
        }

        await this.registerForkChanges({
            type: 'update',
            // todo: migrate to new fork service
            Model: { className: 'Gem' },
            documentId: previousModel._id,
            data: {
                $set: {
                    isChopped: false,
                    isClaimable: true,
                },
            },
        });
    }

    async handleTop({ tracery }) {
        const previousModel = await Mosaic.findOneAndUpdate(
            { tracery },
            { $inc: { topCount: 1 } },
            { upsert: true }
        );

        if (!previousModel) {
            return;
        }

        await this.registerForkChanges({
            type: 'update',
            // todo: migrate to new fork service
            Model: { className: 'Mosaic' },
            documentId: previousModel._id,
            data: {
                $inc: {
                    topCount: -1,
                },
            },
        });
    }

    async handleMosaicState(state) {
        const { tracery } = state;

        const collectionEnd = state.collection_end_date + 'Z';

        let displayReward;
        if (new Date(collectionEnd) > Date.now()) {
            displayReward = state.reward;
        }

        const previousModel = await Mosaic.findOneAndUpdate(
            {
                tracery,
            },
            {
                $set: {
                    tracery,
                    collectionEnd,
                    gemCount: state.gem_count,
                    shares: state.shares,
                    damnShares: state.damn_shares,
                    reward: state.reward,
                    banned: state.banned,
                    displayReward,
                },
            }
        );

        if (previousModel) {
            await this.registerForkChanges({
                type: 'update',
                // todo: migrate to new fork service
                Model: { className: 'Mosaic' },
                documentId: previousModel._id,
                data: {
                    $set: {
                        collectionEnd: previousModel.collectionEnd,
                        gemCount: previousModel.gemCount,
                        shares: previousModel.shares,
                        damnShares: previousModel.damnShares,
                        reward: previousModel.reward,
                        banned: previousModel.banned,
                        // do not change display reward if it hasn't been changed
                        displayReward: displayReward ? previousModel.displayReward : undefined,
                    },
                },
            });
        } else {
            const newModel = await Mosaic.create({
                tracery,
                collectionEnd: state.collection_end_date,
                gemCount: state.gem_count,
                shares: state.shares,
                damnShares: state.damn_shares,
                reward: state.reward,
                banned: state.banned,
            });

            await this.registerForkChanges({
                type: 'create',
                // todo: migrate to new fork service
                Model: { className: 'Mosaic' },
                documentId: newModel._id,
            });
        }
    }

    async registerForkChanges(changes) {
        if (this._forkService) {
            await this._forkService.registerChanges(changes);
        }
    }
}

module.exports = Gallery;
