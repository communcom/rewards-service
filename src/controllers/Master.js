const { Logger } = require('cyberway-core-service').utils;

const Gallery = require('./Gallery');

class Master {
    constructor({ connector, forkService }) {
        this._gallery = new Gallery({ connector, forkService });

        this._galleryEvents = [];
    }

    async disperse({ transactions, blockNum, blockTime }) {
        for (const { actions } of transactions) {
            for (const action of actions) {
                await this._disperseAction(action, { blockNum, blockTime });
            }
        }

        const flow = {
            galleryEvents: this._galleryEvents,
        };

        for (const stageKey of Object.keys(flow)) {
            switch (stageKey) {
                case 'galleryEvents':
                    for (const wrappedEvent of flow[stageKey]) {
                        try {
                            await wrappedEvent();
                        } catch (error) {
                            Logger.warn(error);
                        }
                    }
                    break;
                default:
                    await Promise.all(
                        flow[stageKey].map(wrappedAction =>
                            wrappedAction().catch(error => {
                                Logger.warn(error);
                            })
                        )
                    );
            }
        }

        this._clearActions();
    }

    async _disperseAction(action) {
        if (action.events) {
            for (const event of action.events) {
                switch (event.event) {
                    case 'mosaicstate':
                        this._galleryEvents.push(() => this._gallery.handleMosaicState(event.args));
                        break;
                    case 'mosaictop':
                        this._galleryEvents.push(() => this._gallery.handleTop(event.args));
                        break;
                    default:
                        break;
                }
            }
        }
    }

    _clearActions() {
        this._galleryEvents = [];
    }
}

module.exports = Master;
