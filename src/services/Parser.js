const core = require('cyberway-core-service');
const { Service, BlockSubscribe } = core.services;
const { Logger } = core.utils;

const env = require('../data/env');
const MasterController = require('../controllers/Master');

class Prism extends Service {
    constructor({ ...options } = {}) {
        super(options);

        this.getEmitter().setMaxListeners(Infinity);
    }

    setForkService(forkService) {
        this._forkService = forkService;
    }

    setConnector(connector) {
        this._connector = connector;
    }

    async start() {
        this._blockInProcessing = false;
        this._blockQueue = [];
        this._recentTransactions = new Set();
        this._currentBlockNum = 0;
        this._master = new MasterController({
            connector: this._connector,
            forkService: this._forkService,
        });

        this._subscriber = new BlockSubscribe({
            handler: this._handleEvent.bind(this),
        });

        const lastBlockInfo = await this._subscriber.getLastBlockMetaData();
        Logger.info('Last block info:', lastBlockInfo);

        if (lastBlockInfo.lastBlockNum !== 0 && !env.GLS_DONT_REVERT_LAST_BLOCK) {
            await this._revertLastBlock();
        }

        try {
            await this._subscriber.start();
        } catch (error) {
            Logger.error('Cant start block subscriber:', error);
        }
    }

    getCurrentBlockNum() {
        return this._currentBlockNum;
    }

    hasRecentTransaction(id) {
        return this._recentTransactions.has(id);
    }

    /**
     * Обработка событий из BlockSubscribe.
     * @param {'BLOCK'|'FORK'|'IRREVERSIBLE_BLOCK'} type
     * @param {Object} data
     * @private
     */
    async _handleEvent({ type, data }) {
        switch (type) {
            case BlockSubscribe.EVENT_TYPES.BLOCK:
                await this._registerNewBlock(data);
                break;
            case BlockSubscribe.EVENT_TYPES.IRREVERSIBLE_BLOCK:
                await this._handleIrreversibleBlock(data);
                break;
            case BlockSubscribe.EVENT_TYPES.FORK:
                Logger.warn(`Fork detected, new safe base on block num: ${data.baseBlockNum}`);
                await this._handleFork(data.baseBlockNum);
                break;
            default:
        }
    }

    async _registerNewBlock(block) {
        this._blockQueue.push(block);
        await this._handleBlockQueue(block.blockNum);
    }

    async _handleBlockQueue() {
        if (this._blockInProcessing) {
            return;
        }

        this._blockInProcessing = true;

        let block;

        while ((block = this._blockQueue.shift())) {
            await this._handleBlock(block);
        }

        this._blockInProcessing = false;
    }

    async _handleBlock(block) {
        try {
            await this._forkService.initBlock(block);
            await this._master.disperse(block);

            this._emitHandled(block);
        } catch (error) {
            Logger.error(`Cant disperse block, num: ${block.blockNum}, id: ${block.id}`, error);
            process.exit(1);
        }
    }

    _emitHandled(block) {
        const blockNum = block.blockNum;

        this._currentBlockNum = blockNum;

        this.emit('blockDone', blockNum);

        for (const transaction of block.transactions) {
            if (!transaction || !transaction.actions) {
                Logger.warn(`Empty transaction - ${blockNum}`);
                return;
            }

            const id = transaction.id;

            this.emit('transactionDone', id);

            this._recentTransactions.add(id);

            setTimeout(
                // Clean lexical scope for memory optimization
                (id => () => this._recentTransactions.delete(id))(id),
                env.GLS_RECENT_TRANSACTION_ID_TTL
            );
        }
    }

    async _handleIrreversibleBlock(block) {
        await this._forkService.registerIrreversibleBlock(block);
    }

    async _handleFork(baseBlockNum) {
        try {
            await this._forkService.revert(this._subscriber, baseBlockNum);
        } catch (error) {
            Logger.error('Critical error!');
            Logger.error('Cant revert on fork:', error);
            process.exit(1);
        }
    }

    async _revertLastBlock() {
        try {
            await this._forkService.revertUnfinalizedBlocks(this._subscriber);
        } catch (error) {
            Logger.error('Cant revert unfinalized blocks, but continue:', err);
        }
    }
}

module.exports = Prism;
