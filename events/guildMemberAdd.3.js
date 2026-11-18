const { applyAutoroles } = require('../utils/autorole');

// Autorole on join. Members still in membership screening get their roles in guildMemberUpdate.
module.exports = async (client, member) => {
    await applyAutoroles(member);
};
