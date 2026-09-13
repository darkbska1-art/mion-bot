const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ============================================================
// MION • HOŞ GELDİN AYARLA
// Makima Welcome System ile tam uyumlu
// ============================================================

const DATA_FOLDER = path.join(
    __dirname,
    "..",
    "data"
);

const DATA_FILE = path.join(
    DATA_FOLDER,
    "welcome.json"
);

// ============================================================
// KLASÖR
// ============================================================

if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(
        DATA_FOLDER,
        {
            recursive: true
        }
    );
}

// ============================================================
// VERİ OKU
// ============================================================

function readData() {

    if (!fs.existsSync(DATA_FILE)) {

        fs.writeFileSync(
            DATA_FILE,
            "{}",
            "utf8"
        );

        return {};
    }

    try {

        const raw =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "❌ [Makima Ayar] welcome.json okunamadı:",
            error
        );

        return {};
    }
}

// ============================================================
// VERİ KAYDET
// ============================================================

function saveData(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}

// ============================================================
// GUILD AYARI
// ============================================================

function getSettings(data, guildId) {

    if (!data[guildId]) {

        data[guildId] = {

            enabled: false,

            channel: null,

            welcome: true,

            goodbye: true,

            mention: true
        };
    }

    return data[guildId];
}

// ============================================================
// EMBED
// ============================================================

function createEmbed(
    title,
    description
) {

    return new EmbedBuilder()
        .setColor("#9e0000")
        .setTitle(`🩸 ${title}`)
        .setDescription(description)
        .setFooter({
            text: "Mion • Makima Welcome System"
        })
        .setTimestamp();
}

// ============================================================
// KOMUT
// ============================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("hosgeldin-ayarla")

        .setDescription(
            "Makima hoş geldin ve görüşürüz sistemini ayarla."
        )

        // ====================================================
        // AÇ
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("aç")
                    .setDescription(
                        "Hoş geldin sistemini aktif eder."
                    )
        )

        // ====================================================
        // KAPAT
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("kapat")
                    .setDescription(
                        "Hoş geldin sistemini tamamen kapatır."
                    )
        )

        // ====================================================
        // KANAL
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("kanal")
                    .setDescription(
                        "Hoş geldin ve görüşürüz kanalını ayarlar."
                    )
                    .addChannelOption(
                        option =>
                            option
                                .setName("kanal")
                                .setDescription(
                                    "Mesajların gönderileceği kanal."
                                )
                                .addChannelTypes(
                                    ChannelType.GuildText,
                                    ChannelType.GuildAnnouncement
                                )
                                .setRequired(true)
                    )
        )

        // ====================================================
        // HOŞ GELDİN
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("hosgeldin")
                    .setDescription(
                        "Hoş geldin mesajlarını açar veya kapatır."
                    )
                    .addBooleanOption(
                        option =>
                            option
                                .setName("durum")
                                .setDescription(
                                    "Hoş geldin sisteminin durumu."
                                )
                                .setRequired(true)
                    )
        )

        // ====================================================
        // GÖRÜŞÜRÜZ
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("gorusuruz")
                    .setDescription(
                        "Görüşürüz mesajlarını açar veya kapatır."
                    )
                    .addBooleanOption(
                        option =>
                            option
                                .setName("durum")
                                .setDescription(
                                    "Görüşürüz sisteminin durumu."
                                )
                                .setRequired(true)
                    )
        )

        // ====================================================
        // MENTION
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("mention")
                    .setDescription(
                        "Hoş geldin mesajında kullanıcı etiketini açar/kapatır."
                    )
                    .addBooleanOption(
                        option =>
                            option
                                .setName("durum")
                                .setDescription(
                                    "Kullanıcı etiketlensin mi?"
                                )
                                .setRequired(true)
                    )
        )

        // ====================================================
        // DURUM
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("durum")
                    .setDescription(
                        "Mevcut Makima sistem ayarlarını gösterir."
                    )
        )

        // ====================================================
        // SIFIRLA
        // ====================================================

        .addSubcommand(
            sub =>
                sub
                    .setName("sifirla")
                    .setDescription(
                        "Bu sunucunun Makima ayarlarını sıfırlar."
                    )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // ========================================================
    // EXECUTE
    // ========================================================

    async execute(interaction) {

        if (!interaction.guild) {

            return interaction.reply({
                content:
                    "❌ Bu komut sadece sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        // ====================================================
        // YETKİ
        // ====================================================

        if (
            !interaction.memberPermissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Yetkin Yok",
                        "❌ Bu sistemi ayarlamak için **Sunucuyu Yönet** yetkisine sahip olmalısın."
                    )
                ],

                ephemeral: true
            });
        }

        const data =
            readData();

        const settings =
            getSettings(
                data,
                interaction.guild.id
            );

        const subcommand =
            interaction.options.getSubcommand();

        // ====================================================
        // AÇ
        // ====================================================

        if (
            subcommand === "aç"
        ) {

            settings.enabled = true;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Sistem Aktif",
                        [
                            "✅ **Makima Hoş Geldin Sistemi aktif edildi.**",
                            "",
                            `📢 Kanal: ${
                                settings.channel
                                    ? `<#${settings.channel}>`
                                    : "❌ Ayarlanmadı"
                            }`,
                            `👋 Hoş Geldin: ${
                                settings.welcome
                                    ? "🟢 Açık"
                                    : "🔴 Kapalı"
                            }`,
                            `👋 Görüşürüz: ${
                                settings.goodbye
                                    ? "🟢 Açık"
                                    : "🔴 Kapalı"
                            }`
                        ].join("\n")
                    )
                ]

            });
        }

        // ====================================================
        // KAPAT
        // ====================================================

        if (
            subcommand === "kapat"
        ) {

            settings.enabled = false;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Sistem Kapatıldı",
                        "🔴 **Makima Hoş Geldin Sistemi tamamen kapatıldı.**"
                    )
                ]

            });
        }

        // ====================================================
        // KANAL
        // ====================================================

        if (
            subcommand === "kanal"
        ) {

            const channel =
                interaction.options.getChannel(
                    "kanal"
                );

            settings.channel =
                channel.id;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Kanal Ayarlandı",
                        [
                            `✅ Hoş geldin ve görüşürüz mesajları artık ${channel} kanalına gönderilecek.`,
                            "",
                            `📢 Kanal: ${channel}`,
                            `🆔 ID: \`${channel.id}\``,
                            "",
                            "💡 Sistemi kullanmak için `/hosgeldin-ayarla aç` yazmayı unutma."
                        ].join("\n")
                    )
                ]

            });
        }

        // ====================================================
        // HOŞ GELDİN
        // ====================================================

        if (
            subcommand === "hosgeldin"
        ) {

            const status =
                interaction.options.getBoolean(
                    "durum"
                );

            settings.welcome =
                status;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Hoş Geldin Ayarı",
                        status
                            ? "🟢 **Hoş geldin mesajları açıldı.**"
                            : "🔴 **Hoş geldin mesajları kapatıldı.**"
                    )
                ]

            });
        }

        // ====================================================
        // GÖRÜŞÜRÜZ
        // ====================================================

        if (
            subcommand === "gorusuruz"
        ) {

            const status =
                interaction.options.getBoolean(
                    "durum"
                );

            settings.goodbye =
                status;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Görüşürüz Ayarı",
                        status
                            ? "🟢 **Görüşürüz mesajları açıldı.**"
                            : "🔴 **Görüşürüz mesajları kapatıldı.**"
                    )
                ]

            });
        }

        // ====================================================
        // MENTION
        // ====================================================

        if (
            subcommand === "mention"
        ) {

            const status =
                interaction.options.getBoolean(
                    "durum"
                );

            settings.mention =
                status;

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Mention Ayarı",
                        status
                            ? "🟢 Yeni katılan kullanıcı mesajda etiketlenecek."
                            : "🔴 Yeni katılan kullanıcı mesajda etiketlenmeyecek."
                    )
                ]

            });
        }

        // ====================================================
        // DURUM
        // ====================================================

        if (
            subcommand === "durum"
        ) {

            const channelText =
                settings.channel
                    ? `<#${settings.channel}>`
                    : "❌ Ayarlanmadı";

            const enabledText =
                settings.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const welcomeText =
                settings.welcome
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const goodbyeText =
                settings.goodbye
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const mentionText =
                settings.mention
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Makima Sistem Durumu",
                        [
                            `⚙️ **Ana Sistem:** ${enabledText}`,
                            "",
                            `📢 **Kanal:** ${channelText}`,
                            `👋 **Hoş Geldin:** ${welcomeText}`,
                            `🚪 **Görüşürüz:** ${goodbyeText}`,
                            `🏷️ **Mention:** ${mentionText}`,
                            "",
                            "━━━━━━━━━━━━━━━━━━━━",
                            "",
                            settings.enabled &&
                            settings.channel
                                ? "✅ Sistem kullanıma hazır."
                                : "⚠️ Sistem henüz tamamen ayarlanmadı."
                        ].join("\n")
                    )
                ],

                ephemeral: true

            });
        }

        // ====================================================
        // SIFIRLA
        // ====================================================

        if (
            subcommand === "sifirla"
        ) {

            data[interaction.guild.id] = {

                enabled: false,

                channel: null,

                welcome: true,

                goodbye: true,

                mention: true

            };

            saveData(data);

            return interaction.reply({

                embeds: [
                    createEmbed(
                        "Ayarlar Sıfırlandı",
                        [
                            "♻️ Bu sunucunun Makima ayarları sıfırlandı.",
                            "",
                            "🔴 Ana sistem: Kapalı",
                            "📢 Kanal: Ayarlanmadı",
                            "👋 Hoş geldin: Açık",
                            "🚪 Görüşürüz: Açık",
                            "🏷️ Mention: Açık"
                        ].join("\n")
                    )
                ]

            });
        }
    }
};