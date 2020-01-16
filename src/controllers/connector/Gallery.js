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
        const tracery = calculateTracery(userId, permlink);

        const mosaics = await Mosaic.aggregate([
            {
                $match: { tracery },
            },
            {
                $project: {
                    topCount: 1,
                    reward: 1,
                    collectionEnd: 1,
                    _id: 0,
                },
            },
            {
                $limit: 1,
            },
        ]);

        const mosaic = mosaics[0];

        if (!mosaic) {
            throw {
                code: 404,
                message: 'Tracery for this post is not found',
            };
        }

        mosaic.isClosed = Date.now() - mosaic.collectionEnd >= 0;

        return {
            mosaic,
        };
    }
}

module.exports = Gallery;
