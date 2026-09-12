const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "logs.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

function loadData() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

const categories = [
    "general",
    "member",
    "message",
    "moderation",
    "role",
    "channel",
    "voice",
    "emoji"
];

module.exports = {

    data: new SlashCommandBuilder()

        .setName("log")

        .setDescription(
            "📋 Gelişmiş sunucu log sistemini yönet."
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

        // =============================================
        // AYARLA
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("ayarla")
                .setDescription(
                    "Bir log kategorisine kanal ayarla."
                )
                .addStringOption(option =>
                    option
                        .setName("kategori")
                        .setDescription(
                            "Log kategorisi"
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: "📋 Genel",
                                value: "general"
                            },
                            {
                                name: "👤 Üye",
                                value: "member"
                            },
                            {
                                name: "💬 Mesaj",
                                value: "message"
                            },
                            {
                                name: "🛡️ Moderasyon",
                                value: "moderation"
                            },
                            {
                                name: "🎭 Rol",
                                value: "role"
                            },
                            {
                                name: "📁 Kanal",
                                value: "channel"
                            },
                            {
                                name: "🔊 Ses",
                                value: "voice"
                            },
                            {
                                name: "😀 Emoji",
                                value: "emoji"
                            }
                        )
                )
                .addChannelOption(option =>
                    option
                        .setName("kanal")
                        .setDescription(
                            "Logların gönderileceği kanal."
                        )
                        .setRequired(true)
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement
                        )
                )
        )

        // =============================================
        // DURUM
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription(
                    "📊 Log sisteminin durumunu göster."
                )
        )

        // =============================================
        // TEST
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("test")
                .setDescription(
                    "🧪 Log sistemini test et."
                )
                .addStringOption(option =>
                    option
                        .setName("kategori")
                        .setDescription(
                            "Test edilecek kategori."
                        )
                        .setRequired(false)
                        .addChoices(
                            {
                                name: "📋 Genel",
                                value: "general"
                            },
                            {
                                name: "👤 Üye",
                                value: "member"
                            },
                            {
                                name: "💬 Mesaj",
                                value: "message"
                            },
                            {
                                name: "🛡️ Moderasyon",
                                value: "moderation"
                            },
                            {
                                name: "🎭 Rol",
                                value: "role"
                            },
                            {
                                name: "📁 Kanal",
                                value: "channel"
                            },
                            {
                                name: "🔊 Ses",
                                value: "voice"
                            },
                            {
                                name: "😀 Emoji",
                                value: "emoji"
                            }
                        )
                )
        )

        // =============================================
        // SIFIRLA
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("sıfırla")
                .setDescription(
                    "♻️ Tüm log ayarlarını sıfırla."
                )
        )

        // =============================================
        // KAPAT
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription(
                    "🔴 Log sistemini tamamen kapat."
                )
        ),

    async execute(interaction) {

        const guildId = interaction.guild.id;
        const subcommand =
            interaction.options.getSubcommand();

        const data = loadData();

        if (!data[guildId]) {
            data[guildId] = {
                enabled: true,
                channels: {}
            };
        }

        // =============================================
        // AYARLA
        // =============================================

        if (subcommand === "ayarla") {

            const category =
                interaction.options.getString(
                    "kategori"
                );

            const channel =
                interaction.options.getChannel(
                    "kanal"
                );

            data[guildId].enabled = true;

            data[guildId].channels[category] =
                channel.id;

            saveData(data);

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "✅ Log Kanalı Ayarlandı"
                    )
                    .setDescription(
                        `**${category}** logları artık ${channel} kanalına gönderilecek.`
                    )
                    .addFields({
                        name: "📂 Kategori",
                        value: category,
                        inline: true
                    }, {
                        name: "📢 Kanal",
                        value: `${channel}`,
                        inline: true
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // DURUM
        // =============================================

        if (subcommand === "durum") {

            const config =
                data[guildId];

            const names = {
                general: "📋 Genel",
                member: "👤 Üye",
                message: "💬 Mesaj",
                moderation: "🛡️ Moderasyon",
                role: "🎭 Rol",
                channel: "📁 Kanal",
                voice: "🔊 Ses",
                emoji: "😀 Emoji"
            };

            const lines = categories.map(category => {

                const channelId =
                    config?.channels?.[category];

                const channel =
                    channelId
                        ? interaction.guild.channels.cache.get(
                            channelId
                        )
                        : null;

                return `${names[category]} → ${
                    channel
                        ? channel.toString()
                        : "❌ Ayarlanmadı"
                }`;
            });

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "📊 Log Sistemi"
                    )
                    .setDescription(
                        lines.join("\n")
                    )
                    .addFields({
                        name: "Durum",
                        value:
                            config?.enabled
                                ? "🟢 Aktif"
                                : "🔴 Kapalı",
                        inline: true
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // TEST
        // =============================================

        if (subcommand === "test") {

            const category =
                interaction.options.getString(
                    "kategori"
                ) || "general";

            const channelId =
                data[guildId]?.channels?.[category];

            if (!channelId) {

                return interaction.reply({
                    content:
                        `❌ **${category}** kategorisi için log kanalı ayarlanmamış.`,
                    ephemeral: true
                });
            }

            const channel =
                interaction.guild.channels.cache.get(
                    channelId
                );

            if (!channel) {

                return interaction.reply({
                    content:
                        "❌ Ayarlanan log kanalı bulunamadı.",
                    ephemeral: true
                });
            }

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "🧪 Log Sistemi Testi"
                    )
                    .setDescription(
                        "Log sistemi başarıyla çalışıyor."
                    )
                    .addFields({
                        name: "📂 Kategori",
                        value: category,
                        inline: true
                    }, {
                        name: "👤 Testi Yapan",
                        value: `${interaction.user}`,
                        inline: true
                    })
                    .setTimestamp();

            await channel.send({
                embeds: [embed]
            });

            return interaction.reply({
                content:
                    `✅ Test mesajı ${channel} kanalına gönderildi.`,
                ephemeral: true
            });
        }

        // =============================================
        // SIFIRLA
        // =============================================

        if (subcommand === "sıfırla") {

            data[guildId] = {
                enabled: false,
                channels: {}
            };

            saveData(data);

            return interaction.reply({
                content:
                    "♻️ Bu sunucunun tüm log ayarları sıfırlandı."
            });
        }

        // =============================================
        // KAPAT
        // =============================================

        if (subcommand === "kapat") {

            if (!data[guildId]) {
                data[guildId] = {
                    enabled: false,
                    channels: {}
                };
            }

            data[guildId].enabled = false;

            saveData(data);

            return interaction.reply({
                content:
                    "🔴 Log sistemi bu sunucuda kapatıldı."
            });
        }
    }
};