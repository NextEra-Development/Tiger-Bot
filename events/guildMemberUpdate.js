const { applyAutoroles } = require('../utils/autorole');

// Discord won't let bots add roles to members who haven't passed membership screening yet,
// so autoroles are applied once `pending` flips from true to false.
module.exports = async (client, oldMember, newMember) => {
    if (oldMember.pending && !newMember.pending) await applyAutoroles(newMember);
};
