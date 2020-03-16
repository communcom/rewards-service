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
            Model: CommunityModel,
            documentId: newCommunity.toObject()._id,
        });
    }

    async handleSetSysParams({
        commun_code: communityId,
        community_name: name,
        collection_period: collectionPeriod,
        moderation_period: moderationPeriod,
        extra_reward_period: extraRewardPeriod,
        blockTime,
        blockNum,
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
            Model: CommunityModel,
            documentId: previousModel._id,
            data: {
                $set: {
                    ...previousModel,
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
