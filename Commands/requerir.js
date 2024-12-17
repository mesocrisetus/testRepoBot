const robloxLogin = require("../robloxLogin");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { channelsId, rolesId, idGrupo } = require("../constants.json");

module.exports = {
  name: "requerir",
  async execute(message) {
    try {
      // Send a direct message to the user asking for their Roblox username
      await message.author.send("Ingresa tu nombre de usuario");
      console.log(
        `Sent DM to user: ${message.author.username} [${message.author.id}]`
      );

      // Set up a message collector to collect the user's response for the username
      const filter = (response) => response.author.id === message.author.id;
      const dmChannel = await message.author.createDM();

      const usernameCollected = await dmChannel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ["time"],
      });

      const username = usernameCollected.first().content.trim();
      console.log(
        `Received username from user: ${message.author.username} [${message.author.id}] - ${username}`
      );

      // Send a direct message to the user asking for their promotion picture
      await message.author.send("Envía una imagen de prueba para tu ascenso.");
      console.log(
        `Sent DM to user: ${message.author.username} [${message.author.id}]`
      );

      // Set up a message collector to collect the user's response for the picture
      const pictureCollected = await dmChannel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ["time"],
      });

      const attachment = pictureCollected.first().attachments.first();
      if (!attachment) {
        throw new Error("No attachment found.");
      }
      console.log(
        `Received attachment from user: ${message.author.username} [${message.author.id}] - ${attachment.url}`
      );

      try {
        // Authenticate with Roblox
        await robloxLogin();

        // Fetch the Roblox user information
        const UserID = await noblox.getIdFromUsername(username);
        const userInfo = await noblox.getPlayerInfo(UserID);

        // Get the user's rank in the group
        const rank = await noblox.getRankNameInGroup(idGrupo, UserID);
        console.log(`User rank: ${JSON.stringify(rank)}`);

        // Create an embed with the user's information
        const embed = new EmbedBuilder()
          .setTitle("Solicitud de Ascenso")
          .addFields(
            { name: "Usuario", value: userInfo.username, inline: true },
            { name: "Rango Actual", value: rank, inline: true }
          )
          .setImage(attachment.url)
          .setColor("#00AAFF")
          .setFooter({ text: `Solicitada por: ${message.author.username}` });

        // Send the embed to the Discord channel
        const channel = await message.client.channels.fetch(channelsId.promos);
        const sentMessage = await channel.send({ embeds: [embed] });

        console.log("Embed sent, adding reactions...");

        // Add reactions to the sent embed
        await sentMessage.react("✅"); // white_check_mark
        await sentMessage.react("❌"); // cross_mark

        console.log("Reactions added, setting up reaction collector...");

        // Set up a reaction collector
        const reactionFilter = (reaction, user) => {
          return (
            ["✅", "❌"].includes(reaction.emoji.name) &&
            user.id !== message.client.user.id // Ensure the bot does not consider its own reactions
          );
        };

        const collector = sentMessage.createReactionCollector({
          filter: reactionFilter,
          dispose: true,
        });

        collector.on("collect", async (reaction, user) => {
          console.log(
            `Reaction collected: ${reaction.emoji.name} by ${user.username}`
          );

          try {
            const member = await reaction.message.guild.members.fetch(user.id);
            console.log(
              `Member fetched: ${
                member.user.username
              } with roles: ${member.roles.cache
                .map((role) => role.id)
                .join(", ")}`
            );

            if (member.roles.cache.has(rolesId.admin)) {
              console.log(`Member has the required role: ${user.username}`);
              if (reaction.emoji.name === "✅") {
                // Promote the user
                try {
                  console.log("APPROVED");

                  // Add the user to the group
                  console.log(`User ID: ${UserID}`);
                  await noblox.promote(idGrupo, UserID);

                  // Send a direct message to the user
                  await message.author.send("Tu promoción ha sido aprobada.");

                  // Send a message to the channel that the user was promoted
                  const promotedEmbed = new EmbedBuilder()
                    .setTitle("Promotion Approved")
                    .setDescription(
                      `User: ${userInfo.username}\nRank: ${rank}\nPromoted by: ${user.username}`
                    )
                    .setColor("#00FF00");

                  const promotionLogsChannel =
                    await message.client.channels.fetch(channelsId.logsPromos);
                  await promotionLogsChannel.send({ embeds: [promotedEmbed] });
                } catch (promotionError) {
                  console.error(
                    `Error promoting user: ${userInfo.username}`,
                    promotionError
                  );
                  await member.send(
                    "Hubo un error al intentar aprobar tu promoción. Por favor, intenta de nuevo más tarde."
                  );
                }
              } else if (reaction.emoji.name === "❌") {
                // Deny the user
                console.log("DENIED");

                // Send a direct message to the user
                await message.author.send("Tu promoción ha sido denegada.");

                // Send a message to the channel that the user was denied
                const deniedEmbed = new EmbedBuilder()
                  .setTitle("Promotion Denied")
                  .setDescription(
                    `User: ${userInfo.username}\nRank: ${rank}\nDenied by: ${user.username}`
                  )
                  .setColor("#FF0000");

                const promotionLogsChannel =
                  await message.client.channels.fetch(channelsId.logsPromos);
                await promotionLogsChannel.send({ embeds: [deniedEmbed] });
              }

              // Remove all reactions from the message
              await reaction.message.reactions.removeAll();
              console.log(`All reactions removed by ${user.username}`);
            } else {
              console.log(
                `Member does not have the required role: ${user.username}`
              );
            }
          } catch (fetchError) {
            console.error(
              `Error fetching member: ${user.username}`,
              fetchError
            );
          }
        });

        collector.on("remove", async (reaction, user) => {
          console.log(
            `Reaction removed: ${reaction.emoji.name} by ${user.username}`
          );

          try {
            const member = await reaction.message.guild.members.fetch(user.id);
            if (member.roles.cache.has(rolesId.requiredRole)) {
              if (reaction.emoji.name === "✅") {
                console.log("APPROVAL REMOVED");
              } else if (reaction.emoji.name === "❌") {
                console.log("DENIAL REMOVED");
              }
            }
          } catch (fetchError) {
            console.error(
              `Error fetching member: ${user.username}`,
              fetchError
            );
          }
        });
      } catch (error) {
        console.error(
          `Error fetching info for Roblox user: ${username}`,
          error
        );

        // Create an error embed
        const errorEmbed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription(
            "There was an error fetching the Roblox user information. Please ensure the username is correct."
          )
          .setColor("#FF0000");

        await dmChannel.send({ embeds: [errorEmbed] });
      }
    } catch (error) {
      console.error(
        `Error in !requerir command for user: ${message.author.username} [${message.author.id}]`,
        error
      );
      message.reply("There was an error trying to execute that command.");
    }
  },
};
