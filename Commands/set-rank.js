const robloxLogin = require("../robloxLogin");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { channelsId, rolesId, idGrupo, rangos } = require("../constants.json");

module.exports = {
  name: "set-rank",
  async execute(message) {
    const args = message.content.split(" ");
    const username = args[1];
    const rankName = args[2];

    if (!username || !rankName) {
      return message.channel.send("Ingresa un usuario y su rango.");
    }

    // Check if the user has the specific role to set rank
    const requiredRoleId = rolesId.admin;
    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.channel.send(
        "You do not have permission to use this command."
      );
    }

    // Check if the provided rank exists in the rangos object
    const rankValue = rangos[rankName];
    if (!rankValue) {
      return message.channel.send("Invalid rank provided.");
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

      // Set the new rank
      await noblox.setRank(idGrupo, userId, rankValue);
      const newRankName = await noblox.getRankNameInGroup(idGrupo, userId);

      message.channel.send(
        `User ${username} has been set to rank ${newRankName}.`
      );

      const rankEmbed = new EmbedBuilder()
        .setTitle("Rank Set")
        .setDescription(
          `User: ${userInfo.username}\nRank: ${currentRank} ➜ ${newRankName}\nSet by: ${message.author.username}`
        )
        .setThumbnail(
          `https://icons.veryicon.com/png/o/miscellaneous/william/upgrade-13.png`
        )
        .setColor("#00FF00");

      const logsChannel = await message.client.channels.fetch(
        channelsId.logsPromos
      );
      await logsChannel.send({ embeds: [rankEmbed] });
    } catch (error) {
      console.error(`Error trying to set rank for user: ${username}`, error);
      if (error.message.includes("User not found")) {
        message.reply("User not found on Roblox.");
      } else if (error.message.includes("403")) {
        message.reply(
          "You do not have permission to set the rank for this user."
        );
      } else {
        message.reply("There was an error trying to execute that command.");
      }
    }
  },
};
