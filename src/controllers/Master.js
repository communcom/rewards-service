const { Logger } = require('cyberway-core-service').utils;

const Gallery = require('./Gallery');
const Community = require('./Community');

class Master {
    constructor({ connector, forkService }) {
        this._gallery = new Gallery({ connector, forkService });
        this._community = new Community({ connector, forkService });

        this._galleryEvents = [];
        this._postCreateActions = [];
        this._communityEvents = [];
    }

    async disperse({ transactions, blockNum, blockTime }) {
        for (const { actions } of transactions) {
            for (const action of actions) {
                await this._disperseAction(action, { blockNum, blockTime });
            }
        }

        const flow = {
            communityEvents: this._communityEvents,
            postCreateActions: this._postCreateActions,
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

    async _disperseAction(action, { blockTime, blockNum }) {
        const pathName = [action.code, action.action].join('->');
        switch (pathName) {
            case 'c.list->create':
                this._communityEvents.push(() => this._community.handleCreate(action.args));
                break;
            case 'c.list->setsysparams':
                this._communityEvents.push(() => this._community.handleSetSysParams(action.args));
                break;
            case 'c.gallery->create':
                this._postCreateActions.push(() => this._gallery.handlePostCreate(action.args));
                break;
        }

        if (action.events) {
            for (const event of action.events) {
                switch (event.event) {
                    case 'mosaicstate':
                        this._galleryEvents.push(() => this._gallery.handleMosaicState(event.args));
                        break;
                    case 'mosaictop':
                        this._galleryEvents.push(() => this._gallery.handleTop(event.args));
                        break;
                    case 'gemstate':
                        this._galleryEvents.push(() =>
                            this._gallery.handleGemState({ ...event.args, blockTime, blockNum })
                        );
                        break;
                    case 'gemchop':
                        this._galleryEvents.push(() => this._gallery.handleGemChop(event.args));
                        break;
                    default:
                        break;
                }
            }
        }
    }

    _clearActions() {
        this._galleryEvents = [];
        this._communityEvents = [];
    }
}

module.exports = Master;
