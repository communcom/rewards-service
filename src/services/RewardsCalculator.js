const core = require('cyberway-core-service');
const BasicService = core.services.Basic;
const BigNum = core.types.BigNum;
const env = require('../data/env');
const MosaicModel = require('../models/Mosaic');
const GemModel = require('../models/Gem');

class RewardsCalculatorService extends BasicService {
    async start() {
        await this.startLoop(0, 2 * 60 * 1000);
    }

    async stop() {
        this.stopLoop();
    }

    async iteration() {
        // Get active mosaics (past collection end date, not banned, gem count > 0
        const activeMosaics = await MosaicModel.find({
            // todo: also use moderation period and extra reward period settings
            collectionEnd: { $lte: Date.now() },
            banned: false,
            gemCount: { $gt: 0 },
            shares: { $gt: 0 },
        });
        // for each of those:
        // 1. Save its shares as mosaicShares and reward as mosaicReward
        // 2. Get all unchopped gems for that mosaic (by tracery)
        for (const { tracery, reward: mosaicReward, shares: mosaicShares } of activeMosaics) {
            const gems = await GemModel.find({ tracery, isChopped: false }, {});

            // for each of those:
            // 3. Save gem to DB with new data + set isClaimable = true
            for (const gem of gems) {
                // 1. Save its shares as gemShares
                const gemShares = new BigNum(gem.shares);
                // 2. Calculate its reward as mosaicReward/(mosaicShares/gemShares) and save as gemReward
                gem.reward = new BigNum(mosaicReward).div(new BigNum(mosaicShares).div(gemShares));
                gem.isClaimable = true;
                await gem.save();
            }
        }
    }
}

module.exports = RewardsCalculatorService;
