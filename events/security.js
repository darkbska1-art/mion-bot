const {
    EmbedBuilder,
    PermissionsBitField,
    AuditLogEvent
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "security.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}");
}

// =====================================================
// DATA
// =====================================================

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
    try {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 4)
        );
    } catch (error) {
        console.error("Security data kaydedilemedi:", error);
    }
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
// CONFIG
// =====================================================

function getConfig(guildId) {
    const data = loadData();

    if (!data[guildId]) {
        data[guildId] = defaultConfig();
        saveData(data);
    }

    return data[guildId];
}

// =====================================================
// WHITELIST
// =====================================================

function isWhitelisted(member, config) {
    if (!member) return false;

    if (member.id === member.guild.ownerId) {
        return true;
    }

    if (
        config.whitelist?.users?.includes(member.id)
    ) {
        return true;
    }

    if (
        member.roles.cache.some(role =>
            config.whitelist?.roles?.includes(role.id)
        )
    ) {
        return true;
    }

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
    member
) {
    if (!config.logChannel) return;

    const channel =
        guild.channels.cache.get(config.logChannel);

    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor("#FF4D6D")
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({
            text: "Mion Security"
        });

    if (member) {
        embed.addFields({
            name: "Kullanıcı",
            value: `${member.user?.tag || member.tag || "Bilinmiyor"}\n\`${member.id}\``,
            inline: false
        });
    }

    try {
        await channel.send({
            embeds: [embed]
        });
    } catch {}
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
            minutes * 60 * 1000,
            reason
        );

        return true;
    } catch {
        return false;
    }
}

// =====================================================
// MESSAGE CHECKS
// =====================================================

function containsLink(content) {
    return /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/invite\/)/i
        .test(content);
}

function containsDiscordInvite(content) {
    return /(discord\.gg\/|discord\.com\/invite\/)/i
        .test(content);
}

function containsAdvertisement(content) {
    const patterns = [
        /https?:\/\/\S+/i,
        /discord\.gg\/\S+/i,
        /sunucumuza katıl/i,
        /sunucumuza bekleriz/i,
        /dm.*gel/i,
        /özelden.*yaz/i,
        /reklam/i
    ];

    return patterns.some(regex =>
        regex.test(content)
    );
}

function containsMassMention(message, config) {
    const everyone =
        message.mentions.everyone ? 1 : 0;

    const users =
        message.mentions.users.size;

    return (
        everyone >=
            config.antiMention.maxEveryone ||
        users >=
            config.antiMention.maxMentions
    );
}

// =====================================================
// PUNISH MESSAGE
// =====================================================

async function punishMessage(
    message,
    reason,
    timeoutMinutes = 10
) {
    let deleted = false;
    let timeout = false;

    try {
        await message.delete();
        deleted = true;
    } catch {}

    if (message.member) {
        timeout = await timeoutMember(
            message.member,
            timeoutMinutes,
            `Mion Security: ${reason}`
        );
    }

    return {
        deleted,
        timeout,
        reason
    };
}

// =====================================================
// TRACKERS
// =====================================================

const messageTracker = new Map();
const messageFloodTracker = new Map();
const raidTracker = new Map();
const nukeTracker = new Map();

function trackAction(
    map,
    guildId,
    userId,
    action,
    interval
) {
    const key =
        `${guildId}:${userId}:${action}`;

    const now = Date.now();

    let timestamps =
        map.get(key) || [];

    timestamps =
        timestamps.filter(
            time =>
                now - time <= interval
        );

    timestamps.push(now);

    map.set(key, timestamps);

    return timestamps.length;
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
    if (!executor) return;

    const member =
        guild.members.cache.get(
            executor.id
        );

    if (!member) return;

    if (
        isWhitelisted(
            member,
            config
        )
    ) {
        return;
    }

    const count =
        trackAction(
            nukeTracker,
            guild.id,
            executor.id,
            action,
            config.antiNuke.interval
        );

    if (count < limit) {
        return;
    }

    let punished = false;

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

        `**${executor.tag}** tarafından kısa sürede çok fazla **${action}** işlemi algılandı.\n\n` +
        `📊 İşlem sayısı: **${count}**\n` +
        `⚔️ Uygulanan işlem: **${
            punished
                ? "Kick"
                : "İşlem uygulanamadı"
        }**`,

        member
    );

    // Aynı kişiyi sürekli cezalandırmasını engelle
    nukeTracker.delete(
        `${guild.id}:${executor.id}:${action}`
    );
}

// =====================================================
// MODULE
// =====================================================

module.exports = {

    name: "security",

    register(client) {

        // =================================================
        // MESAJ KORUMASI
        // =================================================

        client.on(
            "messageCreate",
            async message => {

                if (!message.guild) return;
                if (message.author.bot) return;

                const config =
                    getConfig(
                        message.guild.id
                    );

                if (!config.enabled) return;

                const member =
                    message.member;

                if (
                    isWhitelisted(
                        member,
                        config
                    )
                ) {
                    return;
                }

                const userId =
                    message.author.id;

                // =================================================
                // SPAM
                // =================================================

                if (
                    config.antiSpam.enabled
                ) {

                    const key =
                        `${message.guild.id}:${userId}`;

                    const now =
                        Date.now();

                    let messages =
                        messageTracker.get(
                            key
                        ) || [];

                    messages =
                        messages.filter(
                            time =>
                                now - time <=
                                config.antiSpam.interval
                        );

                    messages.push(now);

                    messageTracker.set(
                        key,
                        messages
                    );

                    if (
                        messages.length >=
                        config.antiSpam.maxMessages
                    ) {

                        const punishment =
                            await punishMessage(
                                message,
                                "Spam",
                                config.antiSpam.timeout
                            );

                        messageTracker.delete(
                            key
                        );

                        await securityLog(
                            message.guild,
                            config,
                            "🚨 SPAM ALGILANDI",

                            `**${message.author.tag}** kısa sürede çok fazla mesaj gönderdi.\n\n` +
                            `📊 Mesaj sayısı: **${messages.length}**\n` +
                            `⏱️ Süre: **${config.antiSpam.interval / 1000} saniye**\n` +
                            `🔨 Ceza: **${
                                punishment.timeout
                                    ? `${config.antiSpam.timeout} dakika timeout`
                                    : "Timeout uygulanamadı"
                            }**`,

                            member
                        );

                        return;
                    }
                }

                // =================================================
                // FLOOD
                // =================================================

                if (
                    config.antiFlood.enabled
                ) {

                    const key =
                        `${message.guild.id}:${userId}:flood`;

                    const now =
                        Date.now();

                    let entries =
                        messageFloodTracker.get(
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
                            .trim();

                    entries.push({
                        content,
                        time: now
                    });

                    messageFloodTracker.set(
                        key,
                        entries
                    );

                    const sameCount =
                        entries.filter(
                            item =>
                                item.content ===
                                content
                        ).length;

                    if (
                        sameCount >=
                        config.antiFlood.maxDuplicates
                    ) {

                        const punishment =
                            await punishMessage(
                                message,
                                "Flood",
                                config.antiFlood.timeout
                            );

                        messageFloodTracker.delete(
                            key
                        );

                        await securityLog(
                            message.guild,
                            config,
                            "🌊 FLOOD ALGILANDI",

                            `**${message.author.tag}** aynı mesajı tekrar tekrar gönderdi.\n\n` +
                            `🔨 Ceza: **${
                                punishment.timeout
                                    ? `${config.antiFlood.timeout} dakika timeout`
                                    : "Timeout uygulanamadı"
                            }**`,

                            member
                        );

                        return;
                    }
                }

                // =================================================
                // LINK
                // =================================================

                if (
                    config.antiLink.enabled
                ) {

                    if (
                        containsLink(
                            message.content
                        )
                    ) {

                        const isDiscord =
                            containsDiscordInvite(
                                message.content
                            );

                        const allowed =
                            config.antiLink.whitelist.some(
                                domain =>
                                    message.content
                                        .toLowerCase()
                                        .includes(
                                            domain.toLowerCase()
                                        )
                            );

                        if (
                            !allowed &&
                            (
                                !isDiscord ||
                                !config.antiLink.allowDiscord
                            )
                        ) {

                            await punishMessage(
                                message,
                                "İzinsiz link",
                                10
                            );

                            await securityLog(
                                message.guild,
                                config,
                                "🔗 İZİNSİZ LİNK",

                                `**${message.author.tag}** izinsiz bir link gönderdi.`,

                                member
                            );

                            return;
                        }
                    }
                }

                // =================================================
                // REKLAM
                // =================================================

                if (
                    config.antiAd.enabled
                ) {

                    if (
                        containsAdvertisement(
                            message.content
                        )
                    ) {

                        await punishMessage(
                            message,
                            "Reklam",
                            10
                        );

                        await securityLog(
                            message.guild,
                            config,
                            "📢 REKLAM ENGELLENDİ",

                            `**${message.author.tag}** tarafından reklam içerikli mesaj engellendi.`,

                            member
                        );

                        return;
                    }
                }

                // =================================================
                // MENTION
                // =================================================

                if (
                    config.antiMention.enabled
                ) {

                    if (
                        containsMassMention(
                            message,
                            config
                        )
                    ) {

                        await punishMessage(
                            message,
                            "Mention spam",
                            config.antiMention.timeout
                        );

                        await securityLog(
                            message.guild,
                            config,
                            "👥 MENTION SPAM",

                            `**${message.author.tag}** aşırı mention kullandı.`,

                            member
                        );

                        return;
                    }
                }
            }
        );

        // =====================================================
        // RAID
        // =====================================================

        client.on(
            "guildMemberAdd",
            async member => {

                const config =
                    getConfig(
                        member.guild.id
                    );

                if (!config.enabled) {
                    return;
                }

                // -----------------------------
                // BOT KORUMASI
                // -----------------------------

                if (
                    member.user.bot &&
                    config.antiBot.enabled
                ) {

                    const botMember =
                        member.guild.members.me;

                    if (
                        botMember &&
                        botMember.permissions.has(
                            PermissionsBitField.Flags.KickMembers
                        ) &&
                        member.kickable
                    ) {

                        try {

                            await member.kick(
                                "Mion Security: İzinsiz bot"
                            );

                            await securityLog(
                                member.guild,
                                config,
                                "🤖 BOT ENGELLENDİ",

                                `**${member.user.tag}** sunucuya eklendi ve bot koruması tarafından çıkarıldı.`,

                                member
                            );

                        } catch {}
                    }

                    return;
                }

                if (
                    !config.antiRaid.enabled
                ) {
                    return;
                }

                // -----------------------------
                // RAID TRACKER
                // -----------------------------

                const now =
                    Date.now();

                let joins =
                    raidTracker.get(
                        member.guild.id
                    ) || [];

                joins =
                    joins.filter(
                        time =>
                            now - time <=
                            config.antiRaid.interval
                    );

                joins.push(now);

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
                        "🚨 RAID ALGILANDI",

                        `Son **${config.antiRaid.interval / 1000} saniye** içerisinde **${joins.length}** kişi sunucuya katıldı.\n\n` +
                        `🛡️ Raid koruması aktif.`,

                        member
                    );

                    // Raid'i başlatan son katılan kişiye
                    // ayardaki action uygulanır.
                    if (
                        config.antiRaid.action === "kick" &&
                        member.kickable
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

                // -----------------------------
                // YENİ HESAP
                // -----------------------------

                const accountAge =
                    Date.now() -
                    member.user.createdTimestamp;

                if (
                    accountAge <
                    config.antiRaid.accountAge
                ) {

                    await securityLog(
                        member.guild,
                        config,
                        "⚠️ YENİ HESAP",

                        `**${member.user.tag}** çok yeni bir hesapla sunucuya katıldı.\n\n` +
                        `👤 Hesap yaşı: **${Math.floor(accountAge / 3600000)} saat**`,

                        member
                    );
                }
            }
        );

        // =====================================================
        // ANTI NUKE - CHANNEL DELETE
        // =====================================================

        client.on(
            "channelDelete",
            async channel => {

                if (!channel.guild) return;

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

                try {

                    const logs =
                        await channel.guild.fetchAuditLogs({
                            type: AuditLogEvent.ChannelDelete,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
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
                        "Anti-Nuke channelDelete:",
                        error
                    );
                }
            }
        );

        // =====================================================
        // ANTI NUKE - CHANNEL CREATE
        // =====================================================

        client.on(
            "channelCreate",
            async channel => {

                if (!channel.guild) return;

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

                try {

                    const logs =
                        await channel.guild.fetchAuditLogs({
                            type: AuditLogEvent.ChannelCreate,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return;
                    }

                    await handleNuke(
                        channel.guild,
                        config,
                        entry.executor,
                        "kanal oluşturma",
                        config.antiNuke.channelCreate
                    );

                } catch {}
            }
        );

        // =====================================================
        // ANTI NUKE - ROLE DELETE
        // =====================================================

        client.on(
            "roleDelete",
            async role => {

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

                try {

                    const logs =
                        await role.guild.fetchAuditLogs({
                            type: AuditLogEvent.RoleDelete,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return;
                    }

                    await handleNuke(
                        role.guild,
                        config,
                        entry.executor,
                        "rol silme",
                        config.antiNuke.roleDelete
                    );

                } catch {}
            }
        );

        // =====================================================
        // ANTI NUKE - ROLE CREATE
        // =====================================================

        client.on(
            "roleCreate",
            async role => {

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

                try {

                    const logs =
                        await role.guild.fetchAuditLogs({
                            type: AuditLogEvent.RoleCreate,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return;
                    }

                    await handleNuke(
                        role.guild,
                        config,
                        entry.executor,
                        "rol oluşturma",
                        config.antiNuke.roleCreate
                    );

                } catch {}
            }
        );

        // =====================================================
        // BAN
        // =====================================================

        client.on(
            "guildBanAdd",
            async ban => {

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

                try {

                    const logs =
                        await ban.guild.fetchAuditLogs({
                            type: AuditLogEvent.MemberBanAdd,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return;
                    }

                    await handleNuke(
                        ban.guild,
                        config,
                        entry.executor,
                        "ban",
                        config.antiNuke.ban
                    );

                } catch {}
            }
        );

        // =====================================================
        // KICK
        // =====================================================

        client.on(
            "guildMemberRemove",
            async member => {

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

                try {

                    const logs =
                        await member.guild.fetchAuditLogs({
                            type: AuditLogEvent.MemberKick,
                            limit: 1
                        });

                    const entry =
                        logs.entries.first();

                    if (!entry) return;

                    if (
                        Date.now() -
                        entry.createdTimestamp >
                        5000
                    ) {
                        return;
                    }

                    await handleNuke(
                        member.guild,
                        config,
                        entry.executor,
                        "kick",
                        config.antiNuke.kick
                    );

                } catch {}
            }
        );

        console.log(
            "🛡️ Mion Security sistemi aktif."
        );
    }
};