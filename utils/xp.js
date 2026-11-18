// Mirrors the level formula in events/messageCreate.2.js and commands/Level/rank.js exactly
// (including the `i ^ 2` XOR), so levels computed here match levels earned by chatting.
function requiredXP(level) {
    let reqXP = 100;
    for (let i = 1; i <= level; i++) reqXP += 5 * (i ^ 2) + (50 * i) + 100;
    return reqXP;
}

// XP is cumulative: a user at `level` levels up once their xp reaches requiredXP(level).
function levelForXP(xp) {
    let level = 0;
    while (xp >= requiredXP(level)) level++;
    return level;
}

module.exports = { requiredXP, levelForXP };
