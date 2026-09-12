const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/welcome.json");

// =====================================================
// DATA
// =====================================================

function getData() {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });

        fs.writeFileSync(
            dataPath,
            JSON.stringify({}, null, 4)
        );
    }

    try {
        return JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataPath,
        JSON.stringify(data, null, 4)
    );
}

// =====================================================
// COMMAND
// =====================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hosgeldin-ayarla")
        .setDescription("Hoş geldin ve görüşürüz sistemini ayarlar.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        // -----------------------------
        // HOŞ GELDİN KANALI
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("kanal")
                .setDescription("Hoş geldin mesajlarının gönderileceği kanalı ayarlar.")
                .addChannelOption(option =>
                    option
                        .setName("kanal")
                        .setDescription("Hoş geldin kanalı")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )

        // -----------------------------
        // AYRILMA KANALI
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("ayrilma-kanal")
                .setDescription("Görüşürüz mesajlarının gönderileceği kanalı ayarlar.")
                .addChannelOption(option =>
                    option
                        .setName("kanal")
                        .setDescription("Görüşürüz kanalı")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )

        // -----------------------------
        // HOŞ GELDİN MESAJI
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("mesaj")
                .setDescription("Hoş geldin mesajını değiştirir.")
                .addStringOption(option =>
                    option
                        .setName("metin")
                        .setDescription("Hoş geldin mesajı")
                        .setRequired(true)
                )
        )

        // -----------------------------
        // AYRILMA MESAJI
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("ayrilma-mesaj")
                .setDescription("Görüşürüz mesajını değiştirir.")
                .addStringOption(option =>
                    option
                        .setName("metin")
                        .setDescription("Görüşürüz mesajı")
                        .setRequired(true)
                )
        )

        // -----------------------------
        // HOŞ GELDİN AÇ
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("ac")
                .setDescription("Hoş geldin sistemini açar.")
        )

        // -----------------------------
        // HOŞ GELDİN KAPAT
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription("Hoş geldin sistemini kapatır.")
        )

        // -----------------------------
        // AYRILMA AÇ
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("ayrilma-ac")
                .setDescription("Görüşürüz sistemini açar.")
        )

        // -----------------------------
        // AYRILMA KAPAT
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("ayrilma-kapat")
                .setDescription("Görüşürüz sistemini kapatır.")
        )

        // -----------------------------
        // VARSAYILAN
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("varsayilan")
                .setDescription("Mesajları varsayılan haline getirir.")
        )

        // -----------------------------
        // DURUM
        // -----------------------------
        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription("Hoş geldin sisteminin durumunu gösterir.")
        ),

    async execute(interaction) {

        const guildId = interaction.guild.id;

        const data = getData();

        if (!data[guildId]) {
            data[guildId] = {
                welcomeEnabled: false,
                welcomeChannel: null,

                leaveEnabled: false,
                leaveChannel: null,

                welcomeMessage:
                    "👋 Hoş geldin {user}!\n\n" +
                    "**{server}** ailesine katıldın.\n" +
                    "Seninle birlikte **{membercount}** kişi olduk! ♡",

                leaveMessage:
                    "🚪 **{username}** sunucudan ayrıldı.\n\n" +
                    "**{server}** artık **{membercount}** üyeye sahip."
            };
        }

        const guildData = data[guildId];

        const subcommand =
            interaction.options.getSubcommand();

        // =================================================
        // KANAL
        // =================================================

        if (subcommand === "kanal") {

            const channel =
                interaction.options.getChannel("kanal");

            guildData.welcomeChannel = channel.id;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("👋 Hoş Geldin Kanalı")
                        .setDescription(
                            `Hoş geldin mesajları artık ${channel} kanalına gönderilecek.`
                        )
                        .setFooter({
                            text: "Mion • Hoş Geldin Sistemi"
                        })
                ],
                ephemeral: true
            });
        }

        // =================================================
        // AYRILMA KANALI
        // =================================================

        if (subcommand === "ayrilma-kanal") {

            const channel =
                interaction.options.getChannel("kanal");

            guildData.leaveChannel = channel.id;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("🚪 Görüşürüz Kanalı")
                        .setDescription(
                            `Ayrılma mesajları artık ${channel} kanalına gönderilecek.`
                        )
                        .setFooter({
                            text: "Mion • Görüşürüz Sistemi"
                        })
                ],
                ephemeral: true
            });
        }

        // =================================================
        // MESAJ
        // =================================================

        if (subcommand === "mesaj") {

            const message =
                interaction.options.getString("metin");

            guildData.welcomeMessage = message;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("✏️ Hoş Geldin Mesajı Güncellendi")
                        .setDescription(
                            `Yeni mesaj:\n\n${message}`
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // AYRILMA MESAJI
        // =================================================

        if (subcommand === "ayrilma-mesaj") {

            const message =
                interaction.options.getString("metin");

            guildData.leaveMessage = message;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("✏️ Görüşürüz Mesajı Güncellendi")
                        .setDescription(
                            `Yeni mesaj:\n\n${message}`
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // AÇ
        // =================================================

        if (subcommand === "ac") {

            if (!guildData.welcomeChannel) {
                return interaction.reply({
                    content:
                        "❌ Önce `/hosgeldin-ayarla kanal` ile hoş geldin kanalını ayarlamalısın.",
                    ephemeral: true
                });
            }

            guildData.welcomeEnabled = true;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("🟢 Hoş Geldin Sistemi Açıldı")
                        .setDescription(
                            `Hoş geldin sistemi aktif edildi.\n\n` +
                            `📍 Kanal: <#${guildData.welcomeChannel}>`
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // KAPAT
        // =================================================

        if (subcommand === "kapat") {

            guildData.welcomeEnabled = false;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("🔴 Hoş Geldin Sistemi Kapatıldı")
                        .setDescription(
                            "Hoş geldin mesajları artık gönderilmeyecek."
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // AYRILMA AÇ
        // =================================================

        if (subcommand === "ayrilma-ac") {

            if (!guildData.leaveChannel) {
                return interaction.reply({
                    content:
                        "❌ Önce `/hosgeldin-ayarla ayrilma-kanal` ile görüşürüz kanalını ayarlamalısın.",
                    ephemeral: true
                });
            }

            guildData.leaveEnabled = true;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("🟢 Görüşürüz Sistemi Açıldı")
                        .setDescription(
                            `Görüşürüz sistemi aktif edildi.\n\n` +
                            `📍 Kanal: <#${guildData.leaveChannel}>`
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // AYRILMA KAPAT
        // =================================================

        if (subcommand === "ayrilma-kapat") {

            guildData.leaveEnabled = false;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("🔴 Görüşürüz Sistemi Kapatıldı")
                        .setDescription(
                            "Ayrılma mesajları artık gönderilmeyecek."
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // VARSAYILAN
        // =================================================

        if (subcommand === "varsayilan") {

            guildData.welcomeMessage =
                "👋 Hoş geldin {user}!\n\n" +
                "**{server}** ailesine katıldın.\n" +
                "Seninle birlikte **{membercount}** kişi olduk! ♡";

            guildData.leaveMessage =
                "🚪 **{username}** sunucudan ayrıldı.\n\n" +
                "**{server}** artık **{membercount}** üyeye sahip.";

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("↩️ Varsayılan Mesajlar")
                        .setDescription(
                            "Hoş geldin ve görüşürüz mesajları varsayılan haline getirildi."
                        )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // DURUM
        // =================================================

        if (subcommand === "durum") {

            const welcomeStatus =
                guildData.welcomeEnabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const leaveStatus =
                guildData.leaveEnabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const welcomeChannel =
                guildData.welcomeChannel
                    ? `<#${guildData.welcomeChannel}>`
                    : "Ayarlanmamış";

            const leaveChannel =
                guildData.leaveChannel
                    ? `<#${guildData.leaveChannel}>`
                    : "Ayarlanmamış";

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xE31C23)
                        .setTitle("⚙️ Hoş Geldin Sistemi")
                        .setDescription(
                            `**Hoş Geldin**\n` +
                            `${welcomeStatus}\n` +
                            `📍 Kanal: ${welcomeChannel}\n\n` +

                            `**Görüşürüz**\n` +
                            `${leaveStatus}\n` +
                            `📍 Kanal: ${leaveChannel}\n\n` +

                            `━━━━━━━━━━━━━━━━━━\n\n` +

                            `**Hoş Geldin Mesajı**\n` +
                            `${guildData.welcomeMessage}\n\n` +

                            `**Görüşürüz Mesajı**\n` +
                            `${guildData.leaveMessage}`
                        )
                        .setFooter({
                            text: "Mion • Hoş Geldin & Görüşürüz"
                        })
                ],
                ephemeral: true
            });
        }
    }
};