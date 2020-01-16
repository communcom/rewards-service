const core = require('cyberway-core-service');
const { Logger } = core.utils;
const BasicService = core.services.Basic;
const Mosaic = require('../models/Mosaic');

class Gallery extends BasicService {
    constructor({ forkService, ...args }) {
        super(args);
        this._forkService = forkService;
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
            Model: Mosaic,
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

        if (previousModel) {
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
                Model: Mosaic,
                documentId: newModel.toObject()._id,
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
