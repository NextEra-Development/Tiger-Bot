const { sendGreeting } = require('../utils/greeting');

// Goodbye message (+ optional image banner). Configured with /goodbye.
module.exports = async (client, member) => {
    await sendGreeting('goodbye', member);
};
