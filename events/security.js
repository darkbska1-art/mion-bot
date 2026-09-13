
const {
    EmbedBuilder,
    PermissionsBitField,
    AuditLogEvent
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYALAR
// =====================================================

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "security.json");

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

// =====================================================
// DEFAULT CONFIG
// =====================================================

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

// =====================================================
// CONFIG MERGE
// =====================================================

function mergeConfig(config = {}) {

    const defaults = defaultConfig();

    return {
        ...defaults,
        ...config,

        antiSpam: {
            ...defaults.antiSpam,
            ...(config.antiSpam || {})
        },

        antiFlood: {
            ...defaults.antiFlood,
            ...(config.antiFlood || {})
        },

        antiLink: {
            ...defaults.antiLink,
            ...(config.antiLink || {})
        },

        antiAd: {
            ...defaults.antiAd,
            ...(config.antiAd || {})
        },

        antiMention: {
            ...defaults.antiMention,
            ...(config.antiMention || {})
        },

        antiRaid: {
            ...defaults.antiRaid,
            ...(config.antiRaid || {})
        },

        antiBot: {
            ...defaults.antiBot,
            ...(config.antiBot || {})
        },

        antiNuke: {
            ...defaults.antiNuke,
            ...(config.antiNuke || {})
        },

        whitelist: {
            ...defaults.whitelist,
            ...(config.whitelist || {})
        }
    };
}

// =====================================================
// DATA OKU
// =====================================================

function loadData() {

    try {

        const raw =
            fs.readFileSync(
                dataFile,
                "utf8"
            );

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "❌ Security data okunamadı:",
            error
        );

        return {};
    }
}

// =====================================================
// DATA KAYDET
// =====================================================

function saveData(data) {

    try {

        fs.writeFileSync(
            dataFile,
            JSON.stringify(
                data,
                null,
                4
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "❌ Security data kaydedilemedi:",
            error
        );
    }
}

// =====================================================
// CONFIG AL
// =====================================================

function getConfig(guildId) {

    const data = loadData();

    if (!data[guildId]) {

        data[guildId] =
            defaultConfig();

        saveData(data);
    }

    data[guildId] =
        mergeConfig(
            data[guildId]
        );

    return data[guildId];
}

// =====================================================
// WHITELIST
// =====================================================

function isWhitelisted(member, config) {

    if (!member) {
        return false;
    }

    // Sunucu sahibi
    if (
        member.id ===
        member.guild.ownerId
    ) {
        return true;
    }

    // Kullanıcı whitelist
    if (
        config.whitelist?.users?.includes(
            member.id
        )
    ) {
        return true;
    }

    // Rol whitelist
    if (
        member.roles?.cache?.some(
            role =>
                config.whitelist?.roles?.includes(
                    role.id
                )
        )
    ) {
        return true;
    }

    // Administrator
    if (
        member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {
        return true;
    }

    return false;
}

// =====================================================
// LOG
// =====================================================

async function securityLog(
    guild,
    config,
    title,
    description,
    member = null
) {

    if (!config.logChannel) {
        return;
    }

    const channel =
        guild.channels.cache.get(
            config.logChannel
        );

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        return;
    }

    const embed =
        new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp()
            .setFooter({
                text:
                    "Mion • Security"
            });

    if (member) {

        embed.addFields({
            name: "👤 Kullanıcı",
            value:
                `${member.user?.tag || member.tag || "Bilinmiyor"}\n` +
                `\`${member.id}\``,
            inline: false
        });
    }

    try {

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {

        console.error(
            "❌ Security log gönderilemedi:",
            error.message
        );
    }
}

// =====================================================
// TIMEOUT
// =====================================================

async function timeoutMember(
    member,
    minutes,
    reason
) {

    if (!member) {
        return false;
    }

    if (!member.moderatable) {
        return false;
    }

    try {

        await member.timeout(
            Math.max(1, minutes) * 60 * 1000,
            `Mion Security: ${reason}`
        );

        return true;

    } catch {

        return false;
    }
}

// =====================================================
// MESAJ SİL + TIMEOUT
// =====================================================

async function punishMessage(
    message,
    reason,
    timeoutMinutes
) {

    let deleted = false;
    let timeout = false;

    try {

        await message.delete();

        deleted = true;

    } catch {}

    if (message.member) {

        timeout =
            await timeoutMember(
                message.member,
                timeoutMinutes,
                reason
            );
    }

    return {
        deleted,
        timeout
    };
}

// =====================================================
// LINK
// =====================================================

function containsLink(content) {

    return /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/invite\/)/i
        .test(content);
}

// =====================================================
// DISCORD DAVETİ
// =====================================================

function containsDiscordInvite(content) {

    return /(discord\.gg\/|discord\.com\/invite\/)/i
        .test(content);
}

// =====================================================
// REKLAM
// =====================================================

function containsAdvertisement(content) {

    const patterns = [

        /https?:\/\/\S+/i,

        /www\.\S+/i,

        /discord\.gg\/\S+/i,

        /discord\.com\/invite\/\S+/i,

        /sunucumuza\s+katıl/i,

        /sunucumuza\s+bekleriz/i,

        /sunucuma\s+katıl/i,

        /dm.*gel/i,

        /dmden.*yaz/i,

        /özelden.*yaz/i,

        /reklam/i
    ];

    return patterns.some(
        regex =>
            regex.test(content)
    );
}

// =====================================================
// MENTION KONTROL
// =====================================================

function containsMassMention(
    message,
    config
) {

    const userMentions =
        message.mentions.users.size;

    const roleMentions =
        message.mentions.roles.size;

    const everyone =
        message.mentions.everyone
            ? 1
            : 0;

    if (
        everyone >=
        config.antiMention.maxEveryone
    ) {
        return true;
    }

    if (
        userMentions >=
        config.antiMention.maxMentions
    ) {
        return true;
    }

    if (
        roleMentions >=
        config.antiMention.maxMentions
    ) {
        return true;
    }

    return false;
}

// =====================================================
// TRACKER
// =====================================================

const spamTracker =
    new Map();

const floodTracker =
    new Map();

const raidTracker =
    new Map();

const nukeTracker =
    new Map();

const punishmentCooldown =
    new Map();

// =====================================================
// TRACK ACTION
// =====================================================

function trackAction(
    map,
    key,
    interval
) {

    const now =
        Date.now();

    let timestamps =
        map.get(key) || [];

    timestamps =
        timestamps.filter(
            timestamp =>
                now - timestamp <=
                interval
        );

    timestamps.push(now);

    map.set(
        key,
        timestamps
    );

    return timestamps.length;
}

// =====================================================
// CEZA COOLDOWN
// =====================================================

function canPunish(
    guildId,
    userId,
    type,
    cooldown = 10000
) {

    const key =
        `${guildId}:${userId}:${type}`;

    const now =
        Date.now();

    const last =
        punishmentCooldown.get(
            key
        );

    if (
        last &&
        now - last <
        cooldown
    ) {
        return false;
    }

    punishmentCooldown.set(
        key,
        now
    );

    setTimeout(
        () => {
            punishmentCooldown.delete(
                key
            );
        },
        cooldown
    );

    return true;
}

// =====================================================
// AUDIT LOG EXECUTOR
// =====================================================

async function getAuditExecutor(
    guild,
    auditType,
    targetId = null
) {

    try {

        const logs =
            await guild.fetchAuditLogs({
                type: auditType,
                limit: 5
            });

        const now =
            Date.now();

        const entry =
            logs.entries.find(
                entry => {

                    if (
                        now -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return false;
                    }

                    if (
                        targetId &&
                        entry.target?.id &&
                        entry.target.id !== targetId
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        return entry || null;

    } catch (error) {

        console.error(
            "❌ Audit log alınamadı:",
            error.message
        );

        return null;
    }
}

// =====================================================
// ANTI NUKE
// =====================================================

async function handleNuke(
    guild,
    config,
    executor,
    action,
    limit
) {

    if (!executor) {
        return;
    }

    // Bot kendisi işlem yaptıysa
    if (executor.bot) {
        return;
    }

    const member =
        guild.members.cache.get(
            executor.id
        );

    if (!member) {
        return;
    }

    if (
        isWhitelisted(
            member,
            config
        )
    ) {
        return;
    }

    const key =
        `${guild.id}:${executor.id}:${action}`;

    const count =
        trackAction(
            nukeTracker,
            key,
            config.antiNuke.interval
        );

    if (count < limit) {
        return;
    }

    if (
        !canPunish(
            guild.id,
            executor.id,
            `nuke-${action}`,
            config.antiNuke.interval
        )
    ) {
        return;
    }

    let punished = false;

    // KICK
    if (
        config.antiNuke.action === "kick" &&
        member.kickable
    ) {

        try {

            await member.kick(
                `Mion Anti-Nuke: ${action}`
            );

            punished = true;

        } catch {}
    }

    await securityLog(
        guild,
        config,

        "🚨 ANTI-NUKE TETİKLENDİ",

        `**${executor.tag}** kısa sürede çok fazla **${action}** işlemi gerçekleştirdi.\n\n` +

        `📊 İşlem sayısı: **${count}**\n` +

        `⏱️ Aralık: **${config.antiNuke.interval / 1000} saniye**\n` +

        `🔨 Ceza: **${
            punished
                ? "Kick"
                : "Uygulanamadı"
        }**`,

        member
    );

    nukeTracker.delete(
        key
    );
}

// =====================================================
// TEMİZLİK
// =====================================================

setInterval(
    () => {

        const now =
            Date.now();

        for (
            const [key, timestamps]
            of spamTracker
        ) {

            const filtered =
                timestamps.filter(
                    time =>
                        now - time < 30000
                );

            if (
                filtered.length === 0
            ) {
                spamTracker.delete(
                    key
                );
            } else {
                spamTracker.set(
                    key,
                    filtered
                );
            }
        }

        for (
            const [key, entries]
            of floodTracker
        ) {

            const filtered =
                entries.filter(
                    entry =>
                        now - entry.time <
                        30000
                );

            if (
                filtered.length === 0
            ) {
                floodTracker.delete(
                    key
                );
            } else {
                floodTracker.set(
                    key,
                    filtered
                );
            }
        }

        for (
            const [guildId, joins]
            of raidTracker
        ) {

            const filtered =
                joins.filter(
                    time =>
                        now - time <
                        60000
                );

            if (
                filtered.length === 0
            ) {
                raidTracker.delete(
                    guildId
                );
            } else {
                raidTracker.set(
                    guildId,
                    filtered
                );
            }
        }

    },
    60000
);

// =====================================================
// MODULE
// =====================================================

module.exports = {

    name: "security",

    register(client) {

        // =================================================
        // MESSAGE CREATE
        // =================================================

        client.on(
            "messageCreate",
            async message => {

                try {

                    if (
                        !message.guild ||
                        message.author.bot
                    ) {
                        return;
                    }

                    const config =
                        getConfig(
                            message.guild.id
                        );

                    if (
                        !config.enabled
                    ) {
                        return;
                    }

                    const member =
                        message.member;

                    if (
                        !member ||
                        isWhitelisted(
                            member,
                            config
                        )
                    ) {
                        return;
                    }

                    const guildId =
                        message.guild.id;

                    const userId =
                        message.author.id;

                    // =============================================
                    // ANTI SPAM
                    // =============================================

                    if (
                        config.antiSpam.enabled
                    ) {

                        const key =
                            `${guildId}:${userId}`;

                        const count =
                            trackAction(
                                spamTracker,
                                key,
                                config.antiSpam.interval
                            );

                        if (
                            count >=
                            config.antiSpam.maxMessages
                        ) {

                            if (
                                !canPunish(
                                    guildId,
                                    userId,
                                    "spam"
                                )
                            ) {
                                return;
                            }

                            const punishment =
                                await punishMessage(
                                    message,
                                    "Spam",
                                    config.antiSpam.timeout
                                );

                            spamTracker.delete(
                                key
                            );

                            await securityLog(
                                message.guild,
                                config,
                                "🚨 ANTI-SPAM",

                                `**${message.author.tag}** kısa sürede çok fazla mesaj gönderdi.\n\n` +

                                `📊 Mesaj: **${count}**\n` +

                                `⏱️ Süre: **${config.antiSpam.interval / 1000} saniye**\n` +

                                `🗑️ Mesaj silindi: **${
                                    punishment.deleted
                                        ? "Evet"
                                        : "Hayır"
                                }**\n` +

                                `🔨 Timeout: **${
                                    punishment.timeout
                                        ? `${config.antiSpam.timeout} dakika`
                                        : "Uygulanamadı"
                                }**`,

                                member
                            );

                            return;
                        }
                    }

                    // =============================================
                    // ANTI FLOOD
                    // =============================================

                    if (
                        config.antiFlood.enabled &&
                        message.content.trim()
                    ) {

                        const key =
                            `${guildId}:${userId}`;

                        const now =
                            Date.now();

                        let entries =
                            floodTracker.get(
                                key
                            ) || [];

                        entries =
                            entries.filter(
                                item =>
                                    now - item.time <=
                                    config.antiFlood.interval
                            );

                        const content =
                            message.content
                                .toLowerCase()
                                .replace(
                                    /\s+/g,
                                    " "
                                )
                                .trim();

                        entries.push({
                            content,
                            time: now
                        });

                        floodTracker.set(
                            key,
                            entries
                        );

                        const duplicateCount =
                            entries.filter(
                                item =>
                                    item.content ===
                                    content
                            ).length;

                        if (
                            duplicateCount >=
                            config.antiFlood.maxDuplicates
                        ) {

                            if (
                                !canPunish(
                                    guildId,
                                    userId,
                                    "flood"
                                )
                            ) {
                                return;
                            }

                            const punishment =
                                await punishMessage(
                                    message,
                                    "Flood",
                                    config.antiFlood.timeout
                                );

                            floodTracker.delete(
                                key
                            );

                            await securityLog(
                                message.guild,
                                config,
                                "🌊 ANTI-FLOOD",

                                `**${message.author.tag}** aynı mesajı tekrar tekrar gönderdi.\n\n` +

                                `🔁 Tekrar: **${duplicateCount}**\n` +

                                `⏱️ Süre: **${config.antiFlood.interval / 1000} saniye**\n` +

                                `🔨 Timeout: **${
                                    punishment.timeout
                                        ? `${config.antiFlood.timeout} dakika`
                                        : "Uygulanamadı"
                                }**`,

                                member
                            );

                            return;
                        }
                    }

                    // =============================================
                    // ANTI LINK
                    // =============================================

                    if (
                        config.antiLink.enabled &&
                        containsLink(
                            message.content
                        )
                    ) {

                        const isDiscordInvite =
                            containsDiscordInvite(
                                message.content
                            );

                        const allowed =
                            Array.isArray(
                                config.antiLink.whitelist
                            ) &&
                            config.antiLink.whitelist.some(
                                domain =>
                                    message.content
                                        .toLowerCase()
                                        .includes(
                                            String(domain)
                                                .toLowerCase()
                                        )
                            );

                        const blockedDiscord =
                            isDiscordInvite &&
                            !config.antiLink.allowDiscord;

                        if (
                            !allowed &&
                            (
                                !isDiscordInvite ||
                                blockedDiscord
                            )
                        ) {

                            if (
                                !canPunish(
                                    guildId,
                                    userId,
                                    "link"
                                )
                            ) {
                                return;
                            }

                            const punishment =
                                await punishMessage(
                                    message,
                                    "İzinsiz link",
                                    10
                                );

                            await securityLog(
                                message.guild,
                                config,
                                "🔗 ANTI-LINK",

                                `**${message.author.tag}** izinsiz link gönderdi.\n\n` +

                                `🗑️ Mesaj silindi: **${
                                    punishment.deleted
                                        ? "Evet"
                                        : "Hayır"
                                }**\n` +

                                `🔨 Timeout: **${
                                    punishment.timeout
                                        ? "10 dakika"
                                        : "Uygulanamadı"
                                }**`,

                                member
                            );

                            return;
                        }
                    }

                    // =============================================
                    // ANTI REKLAM
                    // =============================================

                    if (
                        config.antiAd.enabled &&
                        containsAdvertisement(
                            message.content
                        )
                    ) {

                        if (
                            !canPunish(
                                guildId,
                                userId,
                                "advertisement"
                            )
                        ) {
                            return;
                        }

                        const punishment =
                            await punishMessage(
                                message,
                                "Reklam",
                                10
                            );

                        await securityLog(
                            message.guild,
                            config,
                            "📢 ANTI-REKLAM",

                            `**${message.author.tag}** tarafından reklam içerikli mesaj engellendi.\n\n` +

                            `🗑️ Mesaj silindi: **${
                                punishment.deleted
                                    ? "Evet"
                                    : "Hayır"
                            }**\n` +

                            `🔨 Timeout: **${
                                punishment.timeout
                                    ? "10 dakika"
                                    : "Uygulanamadı"
                            }**`,

                            member
                        );

                        return;
                    }

                    // =============================================
                    // ANTI MENTION
                    // =============================================

                    if (
                        config.antiMention.enabled &&
                        containsMassMention(
                            message,
                            config
                        )
                    ) {

                        if (
                            !canPunish(
                                guildId,
                                userId,
                                "mention"
                            )
                        ) {
                            return;
                        }

                        const punishment =
                            await punishMessage(
                                message,
                                "Aşırı mention",
                                config.antiMention.timeout
                            );

                        await securityLog(
                            message.guild,
                            config,
                            "👥 ANTI-MENTION",

                            `**${message.author.tag}** aşırı mention kullandı.\n\n` +

                            `👤 Kullanıcı mention: **${message.mentions.users.size}**\n` +

                            `🎭 Rol mention: **${message.mentions.roles.size}**\n` +

                            `📢 Everyone: **${
                                message.mentions.everyone
                                    ? "Evet"
                                    : "Hayır"
                            }**\n` +

                            `🔨 Timeout: **${
                                punishment.timeout
                                    ? `${config.antiMention.timeout} dakika`
                                    : "Uygulanamadı"
                            }**`,

                            member
                        );

                        return;
                    }

                } catch (error) {

                    console.error(
                        "❌ Security message sistemi:",
                        error
                    );
                }
            }
        );

        // =================================================
        // MEMBER ADD
        // =================================================

        client.on(
            "guildMemberAdd",
            async member => {

                try {

                    const config =
                        getConfig(
                            member.guild.id
                        );

                    if (
                        !config.enabled
                    ) {
                        return;
                    }

                    // =============================================
                    // BOT KORUMASI
                    // =============================================

                    if (
                        member.user.bot &&
                        config.antiBot.enabled
                    ) {

                        if (
                            isWhitelisted(
                                member,
                                config
                            )
                        ) {
                            return;
                        }

                        if (
                            member.kickable
                        ) {

                            try {

                                await member.kick(
                                    "Mion Security: İzinsiz bot"
                                );

                                await securityLog(
                                    member.guild,
                                    config,
                                    "🤖 ANTI-BOT",

                                    `**${member.user.tag}** sunucuya eklendi ancak bot koruması tarafından çıkarıldı.`,

                                    member
                                );

                            } catch (error) {

                                console.error(
                                    "❌ Bot kicklenemedi:",
                                    error.message
                                );
                            }
                        }

                        return;
                    }

                    // =============================================
                    // RAID
                    // =============================================

                    if (
                        config.antiRaid.enabled
                    ) {

                        const now =
                            Date.now();

                        let joins =
                            raidTracker.get(
                                member.guild.id
                            ) || [];

                        joins =
                            joins.filter(
                                timestamp =>
                                    now - timestamp <=
                                    config.antiRaid.interval
                            );

                        joins.push(
                            now
                        );

                        raidTracker.set(
                            member.guild.id,
                            joins
                        );

                        if (
                            joins.length >=
                            config.antiRaid.joinLimit
                        ) {

                            await securityLog(
                                member.guild,
                                config,
                                "🚨 ANTI-RAID",

                                `Kısa sürede çok fazla kullanıcı sunucuya katıldı.\n\n` +

                                `👥 Katılım: **${joins.length}**\n` +

                                `⏱️ Süre: **${config.antiRaid.interval / 1000} saniye**\n` +

                                `⚔️ Aksiyon: **${config.antiRaid.action}**`,

                                member
                            );

                            if (
                                config.antiRaid.action === "kick" &&
                                member.kickable &&
                                !isWhitelisted(
                                    member,
                                    config
                                )
                            ) {

                                try {

                                    await member.kick(
                                        "Mion Anti-Raid"
                                    );

                                } catch {}
                            }

                            raidTracker.set(
                                member.guild.id,
                                []
                            );
                        }
                    }

                    // =============================================
                    // YENİ HESAP
                    // =============================================

                    if (
                        config.antiRaid.enabled
                    ) {

                        const accountAge =
                            Date.now() -
                            member.user.createdTimestamp;

                        if (
                            accountAge <
                            config.antiRaid.accountAge
                        ) {

                            const ageHours =
                                Math.max(
                                    0,
                                    Math.floor(
                                        accountAge /
                                        3600000
                                    )
                                );

                            await securityLog(
                                member.guild,
                                config,
                                "⚠️ YENİ HESAP",

                                `**${member.user.tag}** yeni oluşturulmuş bir hesapla sunucuya katıldı.\n\n` +

                                `👤 Hesap yaşı: **${ageHours} saat**\n` +

                                `📅 Hesap: <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,

                                member
                            );
                        }
                    }

                } catch (error) {

                    console.error(
                        "❌ Security memberAdd:",
                        error
                    );
                }
            }
        );

        // =================================================
        // CHANNEL DELETE
        // =================================================

        client.on(
            "channelDelete",
            async channel => {

                try {

                    if (!channel.guild) {
                        return;
                    }

                    const config =
                        getConfig(
                            channel.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            channel.guild,
                            AuditLogEvent.ChannelDelete,
                            channel.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        channel.guild,
                        config,
                        entry.executor,
                        "kanal silme",
                        config.antiNuke.channelDelete
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke channelDelete:",
                        error
                    );
                }
            }
        );

        // =================================================
        // CHANNEL CREATE
        // =================================================

        client.on(
            "channelCreate",
            async channel => {

                try {

                    if (!channel.guild) {
                        return;
                    }

                    const config =
                        getConfig(
                            channel.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            channel.guild,
                            AuditLogEvent.ChannelCreate,
                            channel.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        channel.guild,
                        config,
                        entry.executor,
                        "kanal oluşturma",
                        config.antiNuke.channelCreate
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke channelCreate:",
                        error
                    );
                }
            }
        );

        // =================================================
        // ROLE DELETE
        // =================================================

        client.on(
            "roleDelete",
            async role => {

                try {

                    const config =
                        getConfig(
                            role.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            role.guild,
                            AuditLogEvent.RoleDelete,
                            role.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        role.guild,
                        config,
                        entry.executor,
                        "rol silme",
                        config.antiNuke.roleDelete
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke roleDelete:",
                        error
                    );
                }
            }
        );

        // =================================================
        // ROLE CREATE
        // =================================================

        client.on(
            "roleCreate",
            async role => {

                try {

                    const config =
                        getConfig(
                            role.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            role.guild,
                            AuditLogEvent.RoleCreate,
                            role.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        role.guild,
                        config,
                        entry.executor,
                        "rol oluşturma",
                        config.antiNuke.roleCreate
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke roleCreate:",
                        error
                    );
                }
            }
        );

        // =================================================
        // BAN
        // =================================================

        client.on(
            "guildBanAdd",
            async ban => {

                try {

                    const config =
                        getConfig(
                            ban.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            ban.guild,
                            AuditLogEvent.MemberBanAdd,
                            ban.user.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        ban.guild,
                        config,
                        entry.executor,
                        "ban",
                        config.antiNuke.ban
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke ban:",
                        error
                    );
                }
            }
        );

        // =================================================
        // KICK
        // =================================================

        client.on(
            "guildMemberRemove",
            async member => {

                try {

                    const config =
                        getConfig(
                            member.guild.id
                        );

                    if (
                        !config.enabled ||
                        !config.antiNuke.enabled
                    ) {
                        return;
                    }

                    const entry =
                        await getAuditExecutor(
                            member.guild,
                            AuditLogEvent.MemberKick,
                            member.id
                        );

                    if (!entry) {
                        return;
                    }

                    await handleNuke(
                        member.guild,
                        config,
                        entry.executor,
                        "kick",
                        config.antiNuke.kick
                    );

                } catch (error) {

                    console.error(
                        "❌ Anti-Nuke kick:",
                        error
                    );
                }
            }
        );

        console.log(
            "🛡️ Mion Security Event sistemi aktif."
        );
    }
};
