const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;

const { Logger } = core.utils;

const env = require('../../data/env');
const Mosaic = require('../../models/Mosaic');
const Gem = require('../../models/Gem');
const { calculateTracery } = require('../../utils/mosaic');

class Gallery extends BasicController {
    constructor({ connector }) {
        super({ connector });

        setTimeout(async () => {
            await this._fetchPointsPrices();
        }, 500);

        setInterval(async () => {
            await this._fetchPointsPrices();
        }, env.GLS_FETCH_POINTS_PRICES_INTERVAL);
    }

    async getState({ userId, permlink }, { userId: authUserId }) {
        const { mosaics } = await this.getStateBulk(
            { posts: [{ userId, permlink }] },
            { userId: authUserId }
        );

        const mosaic = mosaics[0];

        if (!mosaic) {
            throw {
                code: 404,
                message: 'Tracery for this post is not found',
            };
        }

        return {
            mosaic,
        };
    }

    async getStateBulk({ posts }, { userId }) {
        const traceryContentIdMap = new Map();

        for (const { userId, permlink } of posts) {
            traceryContentIdMap.set(calculateTracery(userId, permlink), { userId, permlink });
        }

        const aggregation = [
            {
                $match: { tracery: { $in: [...traceryContentIdMap.keys()] } },
            },
            {
                $project: {
                    topCount: 1,
                    reward: 1,
                    displayReward: 1,
                    collectionEnd: 1,
                    tracery: 1,
                    _id: 0,
                },
            },
            {
                $limit: posts.length,
            },
        ];

        const mosaics = await Mosaic.aggregate(aggregation);

        for (const mosaic of mosaics) {
            if (userId) {
                const gems = await Gem.find(
                    { 'contentId.userId': userId, tracery: mosaic.tracery },
                    { reward: 1 },
                    { lean: true }
                );

                mosaic.userClaimableReward = gems.reduce(
                    (totalReward, { reward }) => totalReward + reward,
                    0
                );

                const [rewardAmount, symbol] = mosaic.reward.split(' ');

                if (parseFloat(rewardAmount) && this.pointsPrices) {
                    const cmn = parseFloat(rewardAmount / this.pointsPrices.prices[symbol]).toFixed(
                        4
                    );

                    // TODO get from price feed
                    const usd = parseFloat(cmn * env.COMMUN_PRICE).toFixed(2);

                    mosaic.convertedReward = {
                        cmn,
                        usd,
                    };
                }
            }

            const [rewardAmount, symbol] = mosaic.reward.split(' ');

            if (parseFloat(rewardAmount) && this.pointsPrices) {
                const cmn = parseFloat(rewardAmount / this.pointsPrices.prices[symbol]).toFixed(4);

                // TODO get from price feed
                const usd = parseFloat(cmn * env.COMMUN_PRICE).toFixed(2);

                mosaic.convertedReward = {
                    cmn,
                    usd,
                };
            }

            mosaic.isClosed = Date.now() - mosaic.collectionEnd >= 0;
            mosaic.contentId = traceryContentIdMap.get(mosaic.tracery);
        }

        return {
            mosaics,
        };
    }

    async _fetchPointsPrices() {
        try {
            this.pointsPrices = await this.callService('facade', 'wallet.getPointsPrices', {});
            Logger.info('Points price fetched', new Date(this.pointsPrices.timestamp));
        } catch (err) {
            Logger.error('Points price fetch failed:', err.message);
        }
    }
}

module.exports = Gallery;
