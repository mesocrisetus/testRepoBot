const robloxLogin = require("../robloxLogin");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "user-info",
  async execute(message) {
    try {
      // Send a direct message to the user asking for their Roblox username
      await message.author.send("Please provide your Roblox username.");
      console.log(
        `Sent DM to user: ${message.author.username} [${message.author.id}]`
      );

      // Set up a message collector to collect the user's response
      const filter = (response) => response.author.id === message.author.id;
      const dmChannel = await message.author.createDM();

      dmChannel
        .awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
        .then(async (collected) => {
          const username = collected.first().content.trim();
          console.log(
            `Received username from user: ${message.author.username} [${message.author.id}] - ${username}`
          );

          try {
            // Authenticate with Roblox
            await robloxLogin();

            // Fetch the Roblox user information
            const UserID = await noblox.getIdFromUsername(username);
            console.log(`User info: ${JSON.stringify(UserID)}`);

            // Get user's information
            const userInfo = await noblox.getPlayerInfo(UserID);
            console.log(`User info: ${JSON.stringify(userInfo)}`);

            // Create an embed with the user's information
            const embed = new EmbedBuilder()
              .setTitle("Roblox User Information")
              .addFields(
                { name: "Username", value: userInfo.username, inline: true },
                { name: "UserID", value: UserID.toString(), inline: true },
                {
                  name: "Blurb",
                  value: userInfo.blurb || "N/A",
                  inline: false,
                },
                {
                  name: "Old Names",
                  value: userInfo.oldNames?.join(", ") || "N/A",
                  inline: false,
                },
                {
                  name: "Join Date",
                  value: new Date(userInfo.joinDate).toLocaleDateString(),
                  inline: false,
                },
                {
                  name: "Followers",
                  value: userInfo.followerCount?.toString() || "0",
                  inline: false,
                },
                {
                  name: "Following",
                  value: userInfo.followingCount?.toString() || "0",
                  inline: false,
                },
                {
                  name: "Friends",
                  value: userInfo.friendCount?.toString() || "0",
                  inline: false,
                }
              )
              .setColor("#00AAFF")
              .setFooter({ text: `Requested by ${message.author.username}` });

            // Send the embed to the Discord channel
            await dmChannel.send({ embeds: [embed] });
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
        })
        .catch(async () => {
          console.log(
            "Time ran out or an error occurred while waiting for username."
          );

          // Create a timeout embed
          const timeoutEmbed = new EmbedBuilder()
            .setTitle("Timeout")
            .setDescription("You did not provide your Roblox username in time.")
            .setColor("#FF0000");

          await dmChannel.send({ embeds: [timeoutEmbed] });
        });
    } catch (error) {
      console.error(
        `Error in !user-info command for user: ${message.author.username} [${message.author.id}]`,
        error
      );
      message.reply("There was an error trying to execute that command.");
    }
  },
};
