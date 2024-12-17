const robloxLogin = require("../robloxLogin");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { channelsId, rolesId, idGrupo } = require("../constants.json");

module.exports = {
  name: "promote",
  async execute(message) {
    const args = message.content.split(" ");
    const username = args[1];
    if (!username) {
      return message.channel.send("Please provide a username.");
    }

    // Check if the user has the specific role to promote
    const requiredRoleId = rolesId.admin;
    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.channel.send(
        "You do not have permission to use this command."
      );
    }

    try {
      await robloxLogin();
      const userId = await noblox.getIdFromUsername(username);
      console.log(`User ID: ${userId}`);

      // Check if the user is in the group
      const userRankInGroup = await noblox.getRankInGroup(idGrupo, userId);
      if (userRankInGroup === 0) {
        return message.channel.send("The user is not in the group.");
      }

      const userInfo = await noblox.getPlayerInfo(userId);
      const currentRank = await noblox.getRankNameInGroup(idGrupo, userId);
      const newRank = await noblox.promote(idGrupo, userId);
      const newRankName = await noblox.getRankNameInGroup(idGrupo, userId);

      message.channel.send(
        `User ${username} has been promoted to ${newRankName}.`
      );

      const promotedEmbed = new EmbedBuilder()
        .setTitle("Promotion Approved")
        .setDescription(
          `User: ${userInfo.username}\nRank: ${currentRank} ➜ ${newRankName}\nPromoted by: ${message.author.username}`
        )
        .setThumbnail(
          `https://icons.veryicon.com/png/o/miscellaneous/william/upgrade-13.png`
        )
        .setColor("#00FF00");

      const promotionLogsChannel = await message.client.channels.fetch(
        channelsId.logsPromos
      );
      await promotionLogsChannel.send({ embeds: [promotedEmbed] });
    } catch (error) {
      console.error(`Error trying to promote user: ${username}`, error);
      if (error.message.includes("User not found")) {
        message.reply("User not found on Roblox.");
      } else if (error.message.includes("403")) {
        message.reply("You do not have permission to promote this user.");
      } else {
        message.reply("There was an error trying to execute that command.");
      }
    }
  },
};
