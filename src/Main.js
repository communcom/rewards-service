const core = require('cyberway-core-service');
const BasicMain = core.services.BasicMain;
const env = require('./data/env');
const Parser = require('./services/Parser');
const Fork = require('./services/Fork');
const Connector = require('./services/Connector');

class Main extends BasicMain {
    constructor() {
        super(env);

        let parser;

        const fork = new Fork();

        parser = new Parser();
        parser.setForkService(fork);

        this.addNested(fork, parser);

        const connector = new Connector({ parser });

        parser.setConnector(connector);

        this.startMongoBeforeBoot(null, { poolSize: env.GLS_MONGO_POOL_SIZE });

        this.addNested(connector);
    }
}

module.exports = Main;
