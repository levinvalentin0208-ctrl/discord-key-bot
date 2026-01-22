require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

/* ================== CONFIG ================== */

// 👑 YOUR Discord User ID
const OWNER_ID = "1040616052150767666";

// 🏠 Allowed servers (empty = allow none)
const ALLOWED_GUILDS = [
  "1462172999267520584",
  "1459780567511072863",
  "1454838898139205719"
];

// 🧾 Key log channel (must exist)
const KEY_LOG_CHANNEL_ID = "1462175437105926347";

// ⏱ Rate limit (seconds)
const REDEEM_COOLDOWN = 30;

/* ================== CLIENT ================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ]
});

/* ================== STORAGE ================== */
const keys = new Map(); // key -> { pack, userId }
const redeemCooldown = new Map(); // userId -> timestamp

/* ================== HELPERS ================== */
function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function isAllowedGuild(guildId) {
  return ALLOWED_GUILDS.includes(guildId);
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

async function logKeyAction(client, message) {
  const channel = await client.channels.fetch(KEY_LOG_CHANNEL_ID).catch(() => null);
  if (!channel) return;
  channel.send({ content: message });
}

/* ================== READY ================== */
client.once("ready", () => {
  console.log("✅ BOT ONLINE");
});

/* ================== AUTO LEAVE NON-WHITELIST ================== */
client.on("guildCreate", guild => {
  if (!isAllowedGuild(guild.id)) {
    guild.leave();
  }
});

/* ================== INTERACTIONS ================== */
client.on("interactionCreate", async interaction => {

  // ❌ Block non-whitelisted servers
  if (interaction.guild && !isAllowedGuild(interaction.guild.id)) {
    return interaction.reply({
      content: "❌ This bot is not authorized for this server.",
      ephemeral: true
    });
  }

  /* ---------- SLASH COMMANDS ---------- */
  if (interaction.isChatInputCommand()) {

    /* OWNER ONLY */
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Owner only command.",
        ephemeral: true
      });
    }

    /* /embed */
    if (interaction.commandName === "embed") {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("💎 Lawliet Store")
        .setDescription(
          "**Premium Digital Products**\n\n" +
          "🔑 Purchase a key from staff\n" +
          "📥 Redeem it below\n" +
          "📩 Download via DM\n\n" +
          "🌐 https://lawliet.teamviz.org/\n" +
          "💬 https://discord.gg/lawliethq"
        )
        .setFooter({ text: "Lawliet • Official Store" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("redeem_key")
          .setLabel("Redeem Key")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: "✅ Embed sent", ephemeral: true });
    }

    /* /generatekey */
    if (interaction.commandName === "generatekey") {
      const user = interaction.options.getUser("user");
      const pack = interaction.options.getString("pack");

      const key = generateKey();
      keys.set(key, { pack, userId: user.id });

      await user.send(
        `🔑 **Your Product Key**\n\nPack: **${pack}**\nKey:\n\`${key}\``
      );

      await logKeyAction(client, `🟢 GENERATED | ${key} | ${pack} | ${user.tag}`);
      return interaction.reply({ content: "✅ Key generated", ephemeral: true });
    }

    /* /resetkey */
    if (interaction.commandName === "resetkey") {
      const user = interaction.options.getUser("user");
      const pack = interaction.options.getString("pack");

      const key = generateKey();
      keys.set(key, { pack, userId: user.id });

      await user.send(
        `♻️ **Your Key Has Been Reset**\n\nPack: **${pack}**\nNew Key:\n\`${key}\``
      );

      await logKeyAction(client, `🔄 RESET | ${key} | ${pack} | ${user.tag}`);
      return interaction.reply({ content: "✅ Key reset", ephemeral: true });
    }

    /* /deletekey */
    if (interaction.commandName === "deletekey") {
      const key = interaction.options.getString("key").toUpperCase();
      const deleted = keys.delete(key);

      if (!deleted)
        return interaction.reply({ content: "❌ Key not found", ephemeral: true });

      await logKeyAction(client, `🔴 DELETED | ${key}`);
      return interaction.reply({ content: "✅ Key deleted", ephemeral: true });
    }

    /* /announce */
    if (interaction.commandName === "announce") {
      const text = interaction.options.getString("text");

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle("📢 Announcement")
        .setDescription(text)
        .setFooter({ text: "Lawliet Team" });

      await interaction.channel.send({ embeds: [embed] });
      return interaction.reply({ content: "✅ Announcement sent", ephemeral: true });
    }
  }

  /* ---------- BUTTON ---------- */
  if (interaction.isButton() && interaction.customId === "redeem_key") {
    const modal = new ModalBuilder()
      .setCustomId("redeem_modal")
      .setTitle("Redeem Key");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("key_input")
          .setLabel("Enter your key")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* ---------- MODAL ---------- */
  if (interaction.isModalSubmit() && interaction.customId === "redeem_modal") {

    const now = Date.now();
    const last = redeemCooldown.get(interaction.user.id) || 0;
    if (now - last < REDEEM_COOLDOWN * 1000) {
      return interaction.reply({
        content: "⏱ Please wait before redeeming another key.",
        ephemeral: true
      });
    }

    const key = interaction.fields.getTextInputValue("key_input").toUpperCase();
    const data = keys.get(key);

    if (!data)
      return interaction.reply({ content: "❌ Invalid key", ephemeral: true });

    if (data.userId !== interaction.user.id)
      return interaction.reply({ content: "❌ This key is not yours", ephemeral: true });

    keys.delete(key);
    redeemCooldown.set(interaction.user.id, now);

    await interaction.user.send(
      `✅ **Download Ready**\n\nPack: **${data.pack}**\n\n🔗 Download link coming soon.`
    );

    await logKeyAction(client, `✅ REDEEMED | ${key} | ${data.pack} | ${interaction.user.tag}`);
    return interaction.reply({ content: "✅ Check your DMs", ephemeral: true });
  }
});

/* ================== LOGIN ================== */
client.login(process.env.DISCORD_TOKEN);

// ===== KEEP ALIVE SERVER =====
const http = require("http");

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running");
}).listen(process.env.PORT || 3000, () => {
  console.log("🌐 Keep-alive server running");
});
