const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

/* ================= SERVER WHITELIST ================= */

const ALLOWED_GUILDS = [
  "1462172999267520584",
  "1459780567511072863"
];

/* ================= KEY STORAGE ================= */

const keys = new Map();

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
  console.log("✅ Bot online (multi-server mode)");
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async (interaction) => {

  /* ===== SERVER CHECK ===== */
  if (!ALLOWED_GUILDS.includes(interaction.guildId)) {
    return interaction.reply({
      content: "❌ This bot is not available on this server.",
      ephemeral: true,
    });
  }

  /* ===== /generatekey ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "generatekey") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ No permission", ephemeral: true });
    }

    const pack = interaction.options.getString("pack");
    const user = interaction.options.getUser("user");

    const key = generateKey();
    keys.set(key, { pack, userId: user.id, used: false });

    const dmEmbed = new EmbedBuilder()
      .setTitle("🔑 Your Access Key")
      .setDescription(
        `**Pack:** ${pack}\n\n` +
        `\`${key}\`\n\n` +
        "⚠️ This key is **one-time use** and **user locked**."
      )
      .setColor(0x57f287);

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch {}

    return interaction.reply({
      content: `✅ Key generated for ${user}`,
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
    keys.set(newKey, { pack, userId: user.id, used: false });

    const embed = new EmbedBuilder()
      .setTitle("♻️ Key Reset")
      .setDescription(
        `👤 User: ${user}\n` +
        `📦 Pack: **${pack}**\n\n` +
        `🔑 New Key:\n\`${newKey}\``
      )
      .setColor(0xfee75c);

    try {
      await user.send({ embeds: [embed] });
    } catch {}

    await interaction.channel.send({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Key reset completed",
      ephemeral: true,
    });
  }

  /* ===== /embed ===== */
  if (interaction.isChatInputCommand() && interaction.commandName === "embed") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ No permission", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎁 Lawliet Digital Packs")
      .setDescription(
        "💳 PayPal | 💶 Paysafecard | 🎮 Valorant Points\n\n" +
        "**How it works:**\n" +
        "• Purchase a key from an admin\n" +
        "• Click the button below\n" +
        "• Enter your key\n" +
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
      .setLabel("Your 16-character key")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  /* ===== MODAL ===== */
  if (interaction.isModalSubmit() && interaction.customId === "key_modal") {
    const enteredKey = interaction.fields.getTextInputValue("key_input");
    const data = keys.get(enteredKey);

    if (!data) {
      return interaction.reply({ content: "❌ Invalid key", ephemeral: true });
    }

    if (data.used) {
      return interaction.reply({ content: "❌ Key already used", ephemeral: true });
    }

    if (interaction.user.id !== data.userId) {
      return interaction.reply({ content: "❌ This key is not assigned to you", ephemeral: true });
    }

    data.used = true;

    const embed = new EmbedBuilder()
      .setTitle("✅ Access Granted")
      .setDescription(
        `📦 Pack: **${data.pack}**\n\n` +
        "🔗 Download:\nComing soon"
      )
      .setColor(0x57f287);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
