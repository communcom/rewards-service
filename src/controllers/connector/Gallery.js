const core = require('cyberway-core-service');
const BasicController = core.controllers.Basic;
const env = require('../../data/env');

class Gallery extends BasicController {
    constructor({ connector }) {
        super({ connector });
    }

    getState(tracery) {
        // todo: implement this
    }
}

module.exports = Gallery;
