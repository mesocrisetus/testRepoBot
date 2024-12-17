const robloxLogin = require("../robloxLogin");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { channelsId, rolesId, idGrupo } = require("../constants.json");

module.exports = {
  name: "demote",
  async execute(message) {
    const args = message.content.split(" ");
    const username = args[1];
    if (!username) {
      return message.channel.send("Por favor, dame un nombre que no soy adivino");
    }

    // Check if the user has the specific role to demote
    const requiredRoleId = rolesId.admin;
    if (!message.member.roles.cache.has(requiredRoleId)) {
      return message.channel.send(
        "No tienes permisos para ejecutar el comando, Necesitas el rol de administrador"
      );
    }

    try {
      await robloxLogin();
      const userId = await noblox.getIdFromUsername(username);
      console.log(`User ID: ${userId}`);

      // Check if the user is in the group
      const userRankInGroup = await noblox.getRankInGroup(idGrupo, userId);
      if (userRankInGroup === 0) {
        return message.channel.send("Ese chango no está en el grupo.");
      }

      const userInfo = await noblox.getPlayerInfo(userId);
      const currentRank = await noblox.getRankNameInGroup(idGrupo, userId);
      const newRank = await noblox.demote(idGrupo, userId);
      const newRankName = await noblox.getRankNameInGroup(idGrupo, userId);

      message.channel.send(
        `El Usuario ${username} ha sido demoteado to ${newRankName}.`
      );

      const demotionEmbed = new EmbedBuilder()
        .setTitle("Demote Aprobado")
        .setDescription(
          `User: ${userInfo.username}\nRank: ${currentRank} ➜ ${newRankName}\nDemoted by: ${message.author.username}`
        )
        .setThumbnail(`https://static.thenounproject.com/png/3427785-200.png`)
        .setColor("#FF0000");

      const promotionLogsChannel = await message.client.channels.fetch(
        channelsId.logsDegrados
      );
      await promotionLogsChannel.send({ embeds: [demotionEmbed] });
    } catch (error) {
      console.error(`Error trying to demote user: ${username}`, error);
      if (error.message.includes("User not found")) {
        message.reply("User not found on Roblox.");
      } else if (error.message.includes("403")) {
        message.reply("You do not have permission to demote this user.");
      } else {
        message.reply("There was an error trying to execute that command.");
      }
    }
  },
};
