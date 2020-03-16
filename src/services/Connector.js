const core = require('cyberway-core-service');
const BasicConnector = core.services.Connector;
const Gallery = require('../controllers/connector/Gallery');
const Rewards = require('../controllers/connector/Rewards');

class Connector extends BasicConnector {
    constructor() {
        super();

        const linking = { connector: this };
        this._gallery = new Gallery(linking);
        this._rewards = new Rewards(linking);
    }

    async start() {
        await super.start({
            serverRoutes: {
                getUsersWithRewards: {
                    handler: this._rewards.getUsersWithRewards,
                    scope: this._rewards,
                    validation: {
                        properties: {
                            limit: {
                                type: 'number',
                                default: 10,
                            },
                            offset: {
                                type: 'number',
                                default: 0,
                            },
                        },
                    },
                },
                getUserRewards: {
                    handler: this._rewards.getUsersRewards,
                    scope: this._rewards,
                    validation: {
                        required: ['userId'],
                        properties: {
                            limit: {
                                type: 'number',
                                default: 10,
                            },
                            offset: {
                                type: 'number',
                                default: 0,
                            },
                            userId: {
                                type: 'string',
                            },
                        },
                    },
                },
                getState: {
                    handler: this._gallery.getState,
                    scope: this._gallery,
                    validation: {
                        required: ['userId', 'permlink'],
                        properties: {
                            userId: {
                                type: 'string',
                            },
                            permlink: {
                                type: 'string',
                            },
                        },
                    },
                },
                getStateBulk: {
                    handler: this._gallery.getStateBulk,
                    scope: this._gallery,
                    validation: {
                        properties: {
                            posts: {
                                maxItems: 20,
                                items: {
                                    required: ['userId', 'permlink'],
                                    properties: {
                                        userId: {
                                            type: 'string',
                                        },
                                        permlink: {
                                            type: 'string',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}

module.exports = Connector;
