const core = require('cyberway-core-service');
const BasicService = core.services.Basic;
const CommunityModel = require('../models/Community');

class Community extends BasicService {
    constructor({ forkService, ...args }) {
        super(args);
        this._forkService = forkService;
    }

    async handleCreate({ commun_code: communityId, community_name: name }) {
        const newCommunity = await CommunityModel.create({ communityId, name });

        await this.registerForkChanges({
            type: 'create',
            // todo: migrate to new fork service
            Model: { className: 'Community' },
            documentId: newCommunity._id,
        });
    }

    async handleSetSysParams({
        commun_code: communityId,
        community_name: name,
        collection_period: collectionPeriod,
        moderation_period: moderationPeriod,
        extra_reward_period: extraRewardPeriod,
    }) {
        const data = {};
        if (name !== null) {
            data.name = name;
        }

        if (collectionPeriod !== null) {
            data.collectionPeriod = collectionPeriod;
        }

        if (moderationPeriod !== null) {
            data.moderationPeriod = moderationPeriod;
        }

        if (extraRewardPeriod !== null) {
            data.extraRewardPeriod = extraRewardPeriod;
        }

        const previousModel = await CommunityModel.findOneAndUpdate(
            { communityId },
            { $set: data }
        );

        if (!previousModel) {
            return;
        }

        await this.registerForkChanges({
            type: 'update',
            // todo: migrate to new fork service
            Model: { className: 'Community' },
            documentId: previousModel._id,
            data: {
                $set: {
                    name: previousModel.name,
                    collectionPeriod: previousModel.collectionPeriod,
                    moderationPeriod: previousModel.moderationPeriod,
                    extraRewardPeriod: previousModel.extraRewardPeriod,
                },
            },
        });
    }

    async registerForkChanges(changes) {
        if (this._forkService) {
            await this._forkService.registerChanges(changes);
        }
    }
}

module.exports = Community;
