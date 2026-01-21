const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  partials: ["CHANNEL"]
});

// ===== DOWNLOAD LINKS (PLACEHOLDER) =====
const DOWNLOADS = {
  pack1: "https://example.com/pack1.zip",
  pack2: "https://example.com/pack2.zip",
  pack3: "https://example.com/pack3.zip",
  pack4: "https://example.com/pack4.zip"
};

// ===== KEY STORAGE =====
function loadKeys() {
  return JSON.parse(fs.readFileSync("./keys.json", "utf8"));
}

function saveKeys(data) {
  fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));
}

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ===== READY =====
client.once(Events.ClientReady, () => {
  console.log("✅ Bot online");
});

// ===== INTERACTIONS =====
client.on(Events.InteractionCreate, async (interaction) => {

  // ===== /embed =====
  if (interaction.isChatInputCommand() && interaction.commandName === "embed") {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.editReply("❌ No permission");
    }

    const embed = new EmbedBuilder()
      .setTitle("🎬 Lawliet Edit Pack System")
      .setDescription(
        "**How it works:**\n" +
        "1️⃣ Click the button below\n" +
        "2️⃣ Enter your product key\n" +
        "3️⃣ Receive your download instantly\n\n" +
        "🌐 Website: https://lawliet.teamviz.org/\n" +
        "💬 Discord: https://discord.gg/lawliethq"
      )
      .setColor(0x5865F2)
      .setFooter({ text: "Lawliet • Digital Products" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("redeem_key")
        .setLabel("Redeem Key")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.editReply("✅ Embed sent");
  }

  // ===== BUTTON =====
  if (interaction.isButton() && interaction.customId === "redeem_key") {
    const modal = new ModalBuilder()
      .setCustomId("redeem_modal")
      .setTitle("Redeem your key");

    const input = new TextInputBuilder()
      .setCustomId("key_input")
      .setLabel("Enter your key")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // ===== MODAL =====
  if (interaction.isModalSubmit() && interaction.customId === "redeem_modal") {
    await interaction.deferReply({ ephemeral: true });

    const inputKey = interaction.fields.getTextInputValue("key_input");
    const keys = loadKeys();

    if (!keys[inputKey]) {
      return interaction.editReply("❌ Invalid key");
    }

    if (keys[inputKey].used) {
      return interaction.editReply("❌ This key has already been used");
    }

    const pack = keys[inputKey].pack;
    keys[inputKey].used = true;
    saveKeys(keys);

    // ===== DM SEND =====
    try {
      await interaction.user.send(
        `✅ **Key successfully redeemed**\n\n` +
        `📦 Pack: **${pack}**\n` +
        `🔗 Download:\n${DOWNLOADS[pack]}\n\n` +
        `Thank you for your support ❤️`
      );
    } catch (err) {
      console.log("⚠️ Could not send DM");
    }

    return interaction.editReply(
      `✅ **Key successfully redeemed**\n\n📦 Pack: **${pack}**\n📩 Check your DMs for the download link.`
    );
  }

  // ===== /generatekey =====
  if (interaction.isChatInputCommand() && interaction.commandName === "generatekey") {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.editReply("❌ No permission");
    }

    const pack = interaction.options.getString("pack");
    const keys = loadKeys();
    const key = generateKey();

    keys[key] = { pack: pack, used: false };
    saveKeys(keys);

    return interaction.editReply(
      `🔑 **Key generated**\n📦 Pack: **${pack}**\n\`${key}\``
    );
  }
});

// ===== LOGIN =====
client.login("process.env.DISCORD_TOKEN");

