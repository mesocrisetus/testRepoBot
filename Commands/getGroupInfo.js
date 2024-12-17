const noblox = require("noblox.js");
const { idGrupo } = require("../constants.json");

module.exports = {
  name: "group",
  async execute(message) {
    const groupID = idGrupo;

    /*parseInt(args[1], 10);
    if (isNaN(groupID)) {
      return message.channel.send("Invalid group ID.");
    }
*/
    try {
      // Authenticate with Noblox
      const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
      console.log(
        `Logged in as ${currentUser.UserName} [${currentUser.UserID}]`
      );

      // Fetch the group information
      const groupInfo = await noblox.getGroup(groupID);
      console.log(groupInfo);

      // Send the group information to the Discord channel
      message.channel.send(
        `Group Name: ${groupInfo.name}\nGroup Description: ${groupInfo.description}\nMember Count: ${groupInfo.memberCount}`
      );
    } catch (error) {
      console.error(error);
      message.channel.send(
        "There was an error fetching the group information."
      );
    }
  },
};
