
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYA SİSTEMİ
// =====================================================

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "security.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// =====================================================
// VARSAYILAN AYARLAR
// =====================================================

function createDefaultConfig() {
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

// =====================================================
// AYARLARI BİRLEŞTİR
// =====================================================

function mergeConfig(oldConfig = {}) {

    const defaults = createDefaultConfig();

    return {
        ...defaults,
        ...oldConfig,

        antiSpam: {
            ...defaults.antiSpam,
            ...(oldConfig.antiSpam || {})
        },

        antiFlood: {
            ...defaults.antiFlood,
            ...(oldConfig.antiFlood || {})
        },

        antiLink: {
            ...defaults.antiLink,
            ...(oldConfig.antiLink || {})
        },

        antiAd: {
            ...defaults.antiAd,
            ...(oldConfig.antiAd || {})
        },

        antiMention: {
            ...defaults.antiMention,
            ...(oldConfig.antiMention || {})
        },

        antiRaid: {
            ...defaults.antiRaid,
            ...(oldConfig.antiRaid || {})
        },

        antiBot: {
            ...defaults.antiBot,
            ...(oldConfig.antiBot || {})
        },

        antiNuke: {
            ...defaults.antiNuke,
            ...(oldConfig.antiNuke || {})
        },

        whitelist: {
            ...defaults.whitelist,
            ...(oldConfig.whitelist || {})
        }
    };
}

// =====================================================
// OKU
// =====================================================

function loadData() {

    try {

        if (!fs.existsSync(dataFile)) {
            const config = createDefaultConfig();

            fs.writeFileSync(
                dataFile,
                JSON.stringify(config, null, 4),
                "utf8"
            );

            return config;
        }

        const raw = fs.readFileSync(
            dataFile,
            "utf8"
        );

        if (!raw.trim()) {
            return createDefaultConfig();
        }

        return mergeConfig(JSON.parse(raw));

    } catch (error) {

        console.error(
            "❌ Security ayarları okunamadı:",
            error
        );

        return createDefaultConfig();
    }
}

// =====================================================
// KAYDET
// =====================================================

function saveData(data) {

    try {

        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Security ayarları kaydedilemedi:",
            error
        );

        return false;
    }
}

// =====================================================
// SUNUCU AYARLARINI AL
// =====================================================

function getGuildConfig(guildId) {

    const allData = loadData();

    if (!allData[guildId]) {
        allData[guildId] = createDefaultConfig();
        saveData(allData);
    }

    allData[guildId] =
        mergeConfig(allData[guildId]);

    saveData(allData);

    return {
        allData,
        config: allData[guildId]
    };
}

// =====================================================
// DURUM
// =====================================================

function status(enabled) {
    return enabled ? "🟢 Açık" : "🔴 Kapalı";
}

// =====================================================
// SİSTEM İSİMLERİ
// =====================================================

const systemNames = {
    antiSpam: "Anti-Spam",
    antiFlood: "Anti-Flood",
    antiLink: "Anti-Link",
    antiAd: "Anti-Reklam",
    antiMention: "Anti-Mention",
    antiRaid: "Anti-Raid",
    antiBot: "Anti-Bot",
    antiNuke: "Anti-Nuke"
};

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("security")

        .setDescription(
            "Sunucunun güvenlik sistemini yönetir."
        )

        // =============================================
        // AÇ
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("ac")
                .setDescription(
                    "Tüm güvenlik sistemini açar."
                )
        )

        // =============================================
        // KAPAT
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription(
                    "Tüm güvenlik sistemini kapatır."
                )
        )

        // =============================================
        // DURUM
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription(
                    "Güvenlik sistemlerinin durumunu gösterir."
                )
        )

        // =============================================
        // SİSTEM AYARLA
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("ayarla")
                .setDescription(
                    "Belirli bir güvenlik sistemini açar veya kapatır."
                )

                .addStringOption(option =>
                    option
                        .setName("sistem")
                        .setDescription(
                            "Ayarlanacak güvenlik sistemi."
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: "Anti-Spam",
                                value: "antiSpam"
                            },
                            {
                                name: "Anti-Flood",
                                value: "antiFlood"
                            },
                            {
                                name: "Anti-Link",
                                value: "antiLink"
                            },
                            {
                                name: "Anti-Reklam",
                                value: "antiAd"
                            },
                            {
                                name: "Anti-Mention",
                                value: "antiMention"
                            },
                            {
                                name: "Anti-Raid",
                                value: "antiRaid"
                            },
                            {
                                name: "Anti-Bot",
                                value: "antiBot"
                            },
                            {
                                name: "Anti-Nuke",
                                value: "antiNuke"
                            }
                        )
                )

                .addStringOption(option =>
                    option
                        .setName("durum")
                        .setDescription(
                            "Sistemin yeni durumu."
                        )
                        .setRequired(true)
                        .addChoices(
                            {
                                name: "Aç",
                                value: "ac"
                            },
                            {
                                name: "Kapat",
                                value: "kapat"
                            }
                        )
                )
        )

        // =============================================
        // LOG KANALI
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("log-kanal")
                .setDescription(
                    "Güvenlik log kanalını ayarlar."
                )
                .addChannelOption(option =>
                    option
                        .setName("kanal")
                        .setDescription(
                            "Güvenlik loglarının gönderileceği kanal."
                        )
                        .addChannelTypes(
                            ChannelType.GuildText
                        )
                        .setRequired(true)
                )
        )

        // =============================================
        // LOG SIFIRLA
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("log-sifirla")
                .setDescription(
                    "Güvenlik log kanalını kaldırır."
                )
        )

        // =============================================
        // KULLANICI WHITELIST
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("whitelist-kullanici")
                .setDescription(
                    "Bir kullanıcıyı güvenlik whitelistine ekler."
                )
                .addUserOption(option =>
                    option
                        .setName("kullanici")
                        .setDescription(
                            "Whitelist'e eklenecek kullanıcı."
                        )
                        .setRequired(true)
                )
        )

        // =============================================
        // KULLANICI WHITELIST SİL
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("whitelist-kullanici-sil")
                .setDescription(
                    "Bir kullanıcıyı whitelistten çıkarır."
                )
                .addUserOption(option =>
                    option
                        .setName("kullanici")
                        .setDescription(
                            "Whitelistten çıkarılacak kullanıcı."
                        )
                        .setRequired(true)
                )
        )

        // =============================================
        // ROL WHITELIST
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("whitelist-rol")
                .setDescription(
                    "Bir rolü güvenlik whitelistine ekler."
                )
                .addRoleOption(option =>
                    option
                        .setName("rol")
                        .setDescription(
                            "Whitelist'e eklenecek rol."
                        )
                        .setRequired(true)
                )
        )

        // =============================================
        // ROL WHITELIST SİL
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("whitelist-rol-sil")
                .setDescription(
                    "Bir rolü whitelistten çıkarır."
                )
                .addRoleOption(option =>
                    option
                        .setName("rol")
                        .setDescription(
                            "Whitelistten çıkarılacak rol."
                        )
                        .setRequired(true)
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // =================================================
    // EXECUTE
    // =================================================

    async execute(interaction) {

        if (!interaction.guild) {
            return interaction.reply({
                content:
                    "❌ Bu komut sadece sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        // =============================================
        // YETKİ
        // =============================================

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return interaction.reply({
                content:
                    "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        // =============================================
        // AYARLARI AL
        // =============================================

        const {
            allData,
            config
        } = getGuildConfig(
            interaction.guild.id
        );

        const subcommand =
            interaction.options.getSubcommand();

        // =============================================
        // TÜM SİSTEMİ AÇ
        // =============================================

        if (subcommand === "ac") {

            config.enabled = true;

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🛡️ Güvenlik Sistemi")
                        .setDescription(
                            "Sunucunun güvenlik sistemi **aktif edildi**."
                        )
                        .addFields({
                            name: "Durum",
                            value: "🟢 Aktif",
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Security"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =============================================
        // TÜM SİSTEMİ KAPAT
        // =============================================

        if (subcommand === "kapat") {

            config.enabled = false;

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🛡️ Güvenlik Sistemi")
                        .setDescription(
                            "Sunucunun güvenlik sistemi **devre dışı bırakıldı**."
                        )
                        .addFields({
                            name: "Durum",
                            value: "🔴 Kapalı",
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Security"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =============================================
        // DURUM
        // =============================================

        if (subcommand === "durum") {

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle(
                        "🛡️ Mion Güvenlik Merkezi"
                    )
                    .setDescription(
                        `**Genel Sistem:** ${status(config.enabled)}`
                    )
                    .addFields(
                        {
                            name: "🛡️ Güvenlik Sistemleri",
                            value:
                                `**Anti-Spam:** ${status(config.antiSpam.enabled)}\n` +
                                `**Anti-Flood:** ${status(config.antiFlood.enabled)}\n` +
                                `**Anti-Link:** ${status(config.antiLink.enabled)}\n` +
                                `**Anti-Reklam:** ${status(config.antiAd.enabled)}\n` +
                                `**Anti-Mention:** ${status(config.antiMention.enabled)}\n` +
                                `**Anti-Raid:** ${status(config.antiRaid.enabled)}\n` +
                                `**Anti-Bot:** ${status(config.antiBot.enabled)}\n` +
                                `**Anti-Nuke:** ${status(config.antiNuke.enabled)}`
                        },

                        {
                            name: "⚙️ Anti-Spam",
                            value:
                                `Mesaj: **${config.antiSpam.maxMessages}**\n` +
                                `Süre: **${config.antiSpam.interval / 1000}s**\n` +
                                `Timeout: **${config.antiSpam.timeout} dk**`,
                            inline: true
                        },

                        {
                            name: "🌊 Anti-Flood",
                            value:
                                `Tekrar: **${config.antiFlood.maxDuplicates}**\n` +
                                `Süre: **${config.antiFlood.interval / 1000}s**\n` +
                                `Timeout: **${config.antiFlood.timeout} dk**`,
                            inline: true
                        },

                        {
                            name: "📢 Anti-Mention",
                            value:
                                `Mention: **${config.antiMention.maxMentions}**\n` +
                                `Everyone: **${config.antiMention.maxEveryone}**\n` +
                                `Timeout: **${config.antiMention.timeout} dk**`,
                            inline: true
                        },

                        {
                            name: "🚨 Anti-Raid",
                            value:
                                `Katılım: **${config.antiRaid.joinLimit}**\n` +
                                `Süre: **${config.antiRaid.interval / 1000}s**\n` +
                                `Hesap yaşı: **${config.antiRaid.accountAge / 86400000} gün**\n` +
                                `Aksiyon: **${config.antiRaid.action}**`,
                            inline: true
                        },

                        {
                            name: "💥 Anti-Nuke",
                            value:
                                `Kanal silme: **${config.antiNuke.channelDelete}**\n` +
                                `Kanal oluşturma: **${config.antiNuke.channelCreate}**\n` +
                                `Rol silme: **${config.antiNuke.roleDelete}**\n` +
                                `Rol oluşturma: **${config.antiNuke.roleCreate}**\n` +
                                `Ban: **${config.antiNuke.ban}**\n` +
                                `Kick: **${config.antiNuke.kick}**`,
                            inline: true
                        },

                        {
                            name: "📋 Log Kanalı",
                            value: config.logChannel
                                ? `<#${config.logChannel}>`
                                : "Ayarlanmadı",
                            inline: true
                        },

                        {
                            name: "👥 Whitelist",
                            value:
                                `Kullanıcı: **${config.whitelist.users.length}**\n` +
                                `Rol: **${config.whitelist.roles.length}**`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            "Mion • Security System"
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // SİSTEM AYARLA
        // =============================================

        if (subcommand === "ayarla") {

            const system =
                interaction.options.getString(
                    "sistem"
                );

            const newStatus =
                interaction.options.getString(
                    "durum"
                );

            if (!config[system]) {

                return interaction.reply({
                    content:
                        "❌ Geçersiz güvenlik sistemi.",
                    ephemeral: true
                });
            }

            config[system].enabled =
                newStatus === "ac";

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("⚙️ Güvenlik Ayarı")
                        .setDescription(
                            `**${systemNames[system]}** sistemi ` +
                            `${newStatus === "ac"
                                ? "🟢 açıldı."
                                : "🔴 kapatıldı."}`
                        )
                        .setFooter({
                            text: "Mion • Security"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =============================================
        // LOG KANALI
        // =============================================

        if (subcommand === "log-kanal") {

            const channel =
                interaction.options.getChannel(
                    "kanal"
                );

            config.logChannel =
                channel.id;

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("📋 Güvenlik Logu")
                        .setDescription(
                            `Güvenlik log kanalı ${channel} olarak ayarlandı.`
                        )
                        .setFooter({
                            text: "Mion • Security"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =============================================
        // LOG SIFIRLA
        // =============================================

        if (subcommand === "log-sifirla") {

            config.logChannel = null;

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                content:
                    "✅ Güvenlik log kanalı kaldırıldı."
            });
        }

        // =============================================
        // KULLANICI EKLE
        // =============================================

        if (
            subcommand ===
            "whitelist-kullanici"
        ) {

            const user =
                interaction.options.getUser(
                    "kullanici"
                );

            if (
                config.whitelist.users.includes(
                    user.id
                )
            ) {

                return interaction.reply({
                    content:
                        "⚠️ Bu kullanıcı zaten whitelistte.",
                    ephemeral: true
                });
            }

            config.whitelist.users.push(
                user.id
            );

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                content:
                    `✅ ${user} whitelist'e eklendi.`
            });
        }

        // =============================================
        // KULLANICI SİL
        // =============================================

        if (
            subcommand ===
            "whitelist-kullanici-sil"
        ) {

            const user =
                interaction.options.getUser(
                    "kullanici"
                );

            config.whitelist.users =
                config.whitelist.users.filter(
                    id => id !== user.id
                );

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                content:
                    `✅ ${user} whitelist'ten çıkarıldı.`
            });
        }

        // =============================================
        // ROL EKLE
        // =============================================

        if (
            subcommand ===
            "whitelist-rol"
        ) {

            const role =
                interaction.options.getRole(
                    "rol"
                );

            if (
                config.whitelist.roles.includes(
                    role.id
                )
            ) {

                return interaction.reply({
                    content:
                        "⚠️ Bu rol zaten whitelistte.",
                    ephemeral: true
                });
            }

            config.whitelist.roles.push(
                role.id
            );

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                content:
                    `✅ ${role} whitelist'e eklendi.`
            });
        }

        // =============================================
        // ROL SİL
        // =============================================

        if (
            subcommand ===
            "whitelist-rol-sil"
        ) {

            const role =
                interaction.options.getRole(
                    "rol"
                );

            config.whitelist.roles =
                config.whitelist.roles.filter(
                    id => id !== role.id
                );

            allData[interaction.guild.id] =
                config;

            saveData(allData);

            return interaction.reply({
                content:
                    `✅ ${role} whitelist'ten çıkarıldı.`
            });
        }
    }
};
