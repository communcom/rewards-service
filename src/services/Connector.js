const core = require('cyberway-core-service');
const BasicConnector = core.services.Connector;
const env = require('../data/env');
const Gallery = require('../controllers/connector/Gallery');

class Connector extends BasicConnector {
    constructor() {
        super();

        const linking = { connector: this };
        this._gallery = new Gallery(linking);
    }

    async start() {
        await super.start({
            serverRoutes: {
                quickSearch: {
                    handler: this._gallery.getState,
                    scope: this._gallery,
                    validation: {},
                },
            },
        });
    }
}

module.exports = Connector;
