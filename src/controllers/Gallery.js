const core = require('cyberway-core-service');
const { Logger } = core.utils;
const BasicService = core.services.Basic;
const Mosaic = require('../models/Mosaic');

class Gallery extends BasicService {
    constructor({ forkService, ...args }) {
        super(args);
        this._forkService = forkService;
    }

    async handleMosaicState(state) {
        const { tracery } = state;

        const previousModel = await Mosaic.findOneAndUpdate(
            {
                tracery,
            },
            {
                $set: {
                    tracery,
                    collectionEnd: state.collection_end_date,
                    gemCount: state.gem_count,
                    shares: state.shares,
                    damnShares: state.damn_shares,
                    reward: state.reward,
                    banned: state.banned,
                },
            }
        );

        await this.registerForkChanges({
            type: 'update',
            Model: Mosaic,
            documentId: previousModel._id,
            data: {
                $set: {
                    ...previousModel.toObject(),
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

module.exports = Gallery;
