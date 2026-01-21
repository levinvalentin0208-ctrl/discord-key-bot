const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");

const mongoose = require("mongoose");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI);

const keySchema = new mongoose.Schema({
  key: String,
  pack: String,
  userId: String,
  used: Boolean,
});

const Key = mongoose.model("Key", keySchema);

/* ================= KEY GENERATOR ================= */

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

/* ================= READY ================= */

client.once("ready", () => {
  console.log("✅ Bot online");
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async (interaction) => {

  /* ===== /generatekey ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "generatekey") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ No permission", ephemeral: true });
    }

    const pack = interaction.options.getString("pack");
    const user = interaction.options.getUser("user");

    const key = generateKey();

    await Key.create({
      key,
      pack,
      userId: user.id,
      used: false,
    });

    await user.send(
      `🔑 **Your key**\n\n📦 Pack: **${pack}**\n\`${key}\`\n\nThis key is personal and one-time use.`
    );

    return interaction.reply({
      content: `✅ Key created for ${user}\n\`${key}\``,
      ephemeral: true,
    });
  }

  /* ===== /resetkey ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "resetkey") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ No permission", ephemeral: true });
    }

    const pack = interaction.options.getString("pack");
    const user = interaction.options.getUser("user");

    const newKey = generateKey();

    await Key.create({
      key: newKey,
      pack,
      userId: user.id,
      used: false,
    });

    await user.send(
      `♻️ **Your key was reset**\n\n📦 Pack: **${pack}**\n\`${newKey}\``
    );

    return interaction.reply({
      content: "✅ Key reset complete",
      ephemeral: true,
    });
  }

  /* ===== /embed ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "embed") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ No permission", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎁 Digital Pack Store")
      .setDescription(
        "**Payments:**\n" +
        "💳 PayPal\n💶 Paysafecard\n🎮 Valorant Points\n\n" +
        "**Steps:**\n" +
        "• Buy a key from an admin\n" +
        "• Click **Enter Key**\n" +
        "• Receive your download\n\n" +
        "🌐 https://lawliet.teamviz.org/\n" +
        "💬 https://discord.gg/lawliethq"
      )
      .setColor(0x5865f2);

    const button = new ButtonBuilder()
      .setCustomId("enter_key")
      .setLabel("Enter Key")
      .setStyle(ButtonStyle.Primary);

    return interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(button)],
    });
  }

  /* ===== BUTTON ===== */
  if (interaction.isButton() && interaction.customId === "enter_key") {
    const modal = new ModalBuilder()
      .setCustomId("key_modal")
      .setTitle("Enter your key");

    const input = new TextInputBuilder()
      .setCustomId("key_input")
      .setLabel("16-character key")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  /* ===== KEY CHECK ===== */
  if (interaction.isModalSubmit() && interaction.customId === "key_modal") {
    const enteredKey = interaction.fields.getTextInputValue("key_input");

    const data = await Key.findOne({ key: enteredKey });

    if (!data) {
      return interaction.reply({ content: "❌ Invalid key", ephemeral: true });
    }

    if (data.used) {
      return interaction.reply({ content: "❌ Key already used", ephemeral: true });
    }

    if (interaction.user.id !== data.userId) {
      return interaction.reply({ content: "❌ This key is not for you", ephemeral: true });
    }

    data.used = true;
    await data.save();

    return interaction.reply({
      content: `✅ **Access granted**\n📦 Pack: **${data.pack}**\n🔗 Download link: *coming soon*`,
      ephemeral: true,
    });
  }
});

/* ================= LOGIN ================= */

client.login(process.env.DISCORD_TOKEN);
