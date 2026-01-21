const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Post the key system embed"),

  new SlashCommandBuilder()
    .setName("generatekey")
    .setDescription("Generate a product key")
    .addStringOption(option =>
      option.setName("pack")
        .setDescription("Choose a pack")
        .setRequired(true)
        .addChoices(
          { name: "Pack 1", value: "pack1" },
          { name: "Pack 2", value: "pack2" },
          { name: "Pack 3", value: "pack3" },
          { name: "Pack 4", value: "pack4" }
        )
    )
];

const rest = new REST({ version: "10" }).setToken("MTQ2MjUzOTkwMDkyNTUwOTc3Ng.Gl8RJr.3uNCh4hLUaWLF0CQgUCuhr4J61jYS2iIdtXimU");

(async () => {
  await rest.put(
    Routes.applicationCommands("1462539900925509776"),
    { body: commands }
  );
  console.log("✅ Slash commands registered");
})();
