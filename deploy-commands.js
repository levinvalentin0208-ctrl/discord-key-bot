require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Send the store embed"),

  new SlashCommandBuilder()
    .setName("generatekey")
    .setDescription("Generate a product key")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User to receive the key")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pack")
        .setDescription("Pack name")
        .setRequired(true)
        .addChoices(
          { name: "Pack 1", value: "pack1" },
          { name: "Pack 2", value: "pack2" },
          { name: "Pack 3", value: "pack3" },
          { name: "Pack 4", value: "pack4" }
        )
    ),

  new SlashCommandBuilder()
    .setName("resetkey")
    .setDescription("Reset a user key")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pack")
        .setDescription("Pack")
        .setRequired(true)
        .addChoices(
          { name: "Pack 1", value: "pack1" },
          { name: "Pack 2", value: "pack2" },
          { name: "Pack 3", value: "pack3" },
          { name: "Pack 4", value: "pack4" }
        )
    ),

  new SlashCommandBuilder()
    .setName("deletekey")
    .setDescription("Delete a key")
    .addStringOption(o =>
      o.setName("key")
        .setDescription("Key to delete")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement embed")
    .addStringOption(o =>
      o.setName("text")
        .setDescription("Announcement text")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("⏳ Deploying commands...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log("✅ Commands deployed");
  } catch (err) {
    console.error(err);
  }
})();
