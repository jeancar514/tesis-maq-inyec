require('dotenv').config();

const bridge = require('./bridge/protocolBridge');
const logger = require('./utils/logger');

async function main() {
    try {
        await bridge.start();
    } catch (error) {
        logger.error(`Fatal error: ${error.message}`);
        process.exit(1);
    }
}

main();