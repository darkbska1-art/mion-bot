const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const dataFile = path.join(dataDir, "security.json");


// =====================================================
// DATA
// =====================================================

function ensureData() {

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(
            dataFile,
            "{}",
            "utf8"
        );
    }
}

function defaultConfig() {

    return {
        enabled: false,

        antiSpam: {
            enabled: true,
            maxMessages: 6,
            interval: 5000,
            timeout: 10
        },

        antiFlood: {
            enabled: true,
            maxDuplicates: 3,
            interval: 8000,
            timeout: 10
        },

        antiLink: {
            enabled: true,
            allowDiscord: false,
            whitelist: []
        },

        antiAd: {
            enabled: true
        },

        antiMention: {
            enabled: true,
            maxMentions: 5,
            maxEveryone: 1,
            timeout: 10
        },

        antiRaid: {
            enabled: true,
            joinLimit: 5,
            interval: 10000,
            accountAge: 86400000,
            action: "kick"
        },

        antiBot: {
            enabled: true
        },

        antiNuke: {
            enabled: true,
            channelDelete: 3,
            channelCreate: 5,
            roleDelete: 3,
            roleCreate: 5,
            ban: 3,
            kick: 3,
            interval: 10000,
            action: "kick"
        },

        logChannel: null,

        whitelist: {
            users: [],
            roles: []
        }
    };
}

function loadData() {

    ensureData();

    try {

        return JSON.parse(
            fs.readFileSync(
                dataFile,
                "utf8"
            )
        );

    } catch {

        return {};

    }
}

function saveData(data) {

    ensureData();

    fs.writeFileSync(
        dataFile,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}


// =====================================================
// COMMAND
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("security")

        .setDescription(
            "Mion Security sistemini yönetir."
        )

        .addSubcommand(sub =>
            sub
                .setName("ac")
                .setDescription(
                    "Security sistemini açar."
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription(
                    "Security sistemini kapatır."
                )
        )

        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription(
                    "Security sisteminin durumunu gösterir."
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),


    async execute(interaction) {

        const data = loadData();

        const guildId =
            interaction.guild.id;


        // =================================================
        // SUNUCU AYARINI OLUŞTUR
        // =================================================

        if (!data[guildId]) {

            data[guildId] =
                defaultConfig();

            saveData(data);

        }


        const config =
            data[guildId];


        // =================================================
        // ESKİ CONFIG UYUMLULUĞU
        // =================================================

        if (
            typeof config.enabled !== "boolean"
        ) {

            config.enabled = false;

        }


        const subcommand =
            interaction.options.getSubcommand();


        // =================================================
        // AÇ
        // =================================================

        if (subcommand === "ac") {

            if (config.enabled === true) {

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setColor(0x000000)

                            .setTitle(
                                "🛡️ Mion Security Zaten Açık"
                            )

                            .setDescription(
                                "Security sistemi bu sunucuda zaten aktif."
                            )

                            .setFooter({
                                text:
                                    "Mion • Security"
                            })

                            .setTimestamp()

                    ],

                    ephemeral: true

                });

            }


            config.enabled = true;

            saveData(data);


            return interaction.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(0x000000)

                        .setTitle(
                            "🟢 Mion Security Açıldı"
                        )

                        .setDescription(
                            "Sunucu güvenlik sistemi başarıyla aktif edildi.\n\n" +
                            "🛡️ Spam koruması\n" +
                            "🌊 Flood koruması\n" +
                            "🔗 Link koruması\n" +
                            "📢 Reklam koruması\n" +
                            "👥 Mention koruması\n" +
                            "🚨 Raid koruması\n" +
                            "🤖 Bot koruması\n" +
                            "💥 Anti-Nuke sistemi"
                        )

                        .setFooter({
                            text:
                                "Mion • Security"
                        })

                        .setTimestamp()

                ]

            });

        }


        // =================================================
        // KAPAT
        // =================================================

        if (subcommand === "kapat") {

            if (config.enabled !== true) {

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setColor(0x000000)

                            .setTitle(
                                "🔴 Mion Security Zaten Kapalı"
                            )

                            .setDescription(
                                "Security sistemi bu sunucuda zaten devre dışı."
                            )

                            .setFooter({
                                text:
                                    "Mion • Security"
                            })

                            .setTimestamp()

                    ],

                    ephemeral: true

                });

            }


            config.enabled = false;

            saveData(data);


            return interaction.reply({

                embeds: [

                    new EmbedBuilder()

                        .setColor(0x000000)

                        .setTitle(
                            "🔴 Mion Security Kapatıldı"
                        )

                        .setDescription(
                            "Sunucu güvenlik sistemi devre dışı bırakıldı.\n\n" +
                            "⚠️ Koruma sistemleri artık çalışmayacak."
                        )

                        .setFooter({
                            text:
                                "Mion • Security"
                        })

                        .setTimestamp()

                ]

            });

        }


        // =================================================
        // DURUM
        // =================================================

        if (subcommand === "durum") {

            const status =
                config.enabled
                    ? "🟢 AÇIK"
                    : "🔴 KAPALI";


            const spam =
                config.antiSpam?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const flood =
                config.antiFlood?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const link =
                config.antiLink?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const ad =
                config.antiAd?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const mention =
                config.antiMention?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const raid =
                config.antiRaid?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const bot =
                config.antiBot?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const nuke =
                config.antiNuke?.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";


            const embed =
                new EmbedBuilder()

                    .setColor(0x000000)

                    .setTitle(
                        "🛡️ MION SECURITY DURUMU"
                    )

                    .setDescription(
                        `**Genel Sistem:** ${status}\n\n` +
                        `🛡️ **Anti-Spam:** ${spam}\n` +
                        `🌊 **Anti-Flood:** ${flood}\n` +
                        `🔗 **Anti-Link:** ${link}\n` +
                        `📢 **Anti-Reklam:** ${ad}\n` +
                        `👥 **Anti-Mention:** ${mention}\n` +
                        `🚨 **Anti-Raid:** ${raid}\n` +
                        `🤖 **Anti-Bot:** ${bot}\n` +
                        `💥 **Anti-Nuke:** ${nuke}`
                    )

                    .addFields(
                        {
                            name: "📊 Spam Limiti",
                            value:
                                `${config.antiSpam?.maxMessages || 6} mesaj / ` +
                                `${(config.antiSpam?.interval || 5000) / 1000} saniye`,
                            inline: true
                        },
                        {
                            name: "🌊 Flood Limiti",
                            value:
                                `${config.antiFlood?.maxDuplicates || 3} tekrar / ` +
                                `${(config.antiFlood?.interval || 8000) / 1000} saniye`,
                            inline: true
                        },
                        {
                            name: "🚨 Raid Limiti",
                            value:
                                `${config.antiRaid?.joinLimit || 5} kişi / ` +
                                `${(config.antiRaid?.interval || 10000) / 1000} saniye`,
                            inline: true
                        }
                    )

                    .setFooter({
                        text:
                            `${interaction.guild.name} • Mion Security`
                    })

                    .setTimestamp();


            return interaction.reply({
                embeds: [embed]
            });

        }

    }

};