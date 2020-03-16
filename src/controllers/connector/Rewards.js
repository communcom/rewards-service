const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const Gem = require('../../models/Gem');

class Rewards extends BasicController {
    constructor({ connector }) {
        super({ connector });
    }

    async getUsersWithRewards({ limit, offset }) {
        const [groupOfUsersWithRewards] = await Gem.aggregate([
            { $match: { isClaimable: true } },
            { $limit: limit },
            { $skip: offset },
            { $project: { userId: '$owner' } },
            {
                $group: {
                    _id: null,
                    userIds: { $addToSet: '$userId' },
                },
            },
        ]);

        let userIds = [];
        if (groupOfUsersWithRewards && groupOfUsersWithRewards.userIds) {
            userIds = groupOfUsersWithRewards.userIds;
        }
        return { userIds };
    }

    async getUsersRewards({ userId, limit, offset }) {
        const rewards = await Gem.find(
            { owner: userId, isClaimable: true },
            {
                _id: false,
                reward: true,
                tracery: true,
                contentId: true,
            },
            { lean: true, limit, offset }
        );

        return {
            rewards,
        };
    }
}

module.exports = Rewards;
