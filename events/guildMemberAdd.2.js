const { sendGreeting } = require('../utils/greeting');

// Welcome message (+ optional image banner). Configured with /welcome.
module.exports = async (client, member) => {
    await sendGreeting('welcome', member);
};
