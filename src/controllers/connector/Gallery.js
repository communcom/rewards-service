const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const env = require('../../data/env');
const Mosaic = require('../../models/Mosaic');
const { calculateTracery } = require('../../utils/mosaic');

class Gallery extends BasicController {
    constructor({ connector }) {
        super({ connector });
    }

    async getState({ userId, permlink }) {
        const { mosaics } = await this.getStateBulk({ posts: [{ userId, permlink }] });

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

    async getStateBulk({ posts }) {
        const traceryContentIdMap = new Map();

        for (const { userId, permlink } of posts) {
            traceryContentIdMap.set(calculateTracery(userId, permlink), { userId, permlink });
        }

        const mosaics = await Mosaic.aggregate([
            {
                $match: { tracery: { $in: [...traceryContentIdMap.keys()] } },
            },
            {
                $project: {
                    topCount: 1,
                    reward: 1,
                    collectionEnd: 1,
                    tracery: 1,
                    _id: 0,
                },
            },
            {
                $limit: posts.length,
            },
        ]);

        for (const mosaic of mosaics) {
            mosaic.isClosed = Date.now() - mosaic.collectionEnd >= 0;
            mosaic.contentId = traceryContentIdMap.get(mosaic.tracery);
            delete mosaic.tracery;
        }

        return {
            mosaics,
        };
    }
}

module.exports = Gallery;
