const { Schema, model } = require('mongoose');

// One document per moderation action (warn, kick, ban, ...). `case` is a per-guild counter.
const Infraction = new Schema({
    guild: { type: String, index: true },
    case: Number,
    user: { type: String, index: true },
    moderator: String,
    type: String,
    reason: { type: String, default: 'No reason provided' },
    duration: Number, // milliseconds, for timeouts
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('infractions', Infraction);
