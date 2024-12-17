const noblox = require("noblox.js");

async function robloxLogin() {
  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`);
    return currentUser;
  } catch (error) {
    console.error("Error logging into Roblox:", error);
    throw error;
  }
}

module.exports = robloxLogin;
