const {
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataFile =
    path.join(__dirname, "..", "data", "logs.json");

function loadData() {

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

function getChannel(guild, category) {

    const data = loadData();

    const config =
        data[guild.id];

    if (!config || !config.enabled) {
        return null;
    }

    const channelId =
        config.channels?.[category] ||
        config.channels?.general;

    if (!channelId) {
        return null;
    }

    return guild.channels.cache.get(
        channelId
    ) || null;
}

async function sendLog(
    guild,
    category,
    embed
) {
    try {

        const channel = getChannel(
            guild,
            category
        );

        // Log kanalı bulunamadı
        if (!channel) return;

        // Botun kanala erişimi var mı?
        const me = guild.members.me;

        if (!me) return;

        const permissions =
            channel.permissionsFor(me);

        if (!permissions) return;

        // Kanalı görüntüleme yok
        if (!permissions.has("ViewChannel")) {
            console.warn(
                `⚠️ Log kanalı görüntülenemiyor: ${channel.name} (${channel.id})`
            );
            return;
        }

        // Mesaj gönderme yok
        if (!permissions.has("SendMessages")) {
            console.warn(
                `⚠️ Log kanalına mesaj gönderilemiyor: ${channel.name} (${channel.id})`
            );
            return;
        }

        // Embed gönderme yok
        if (!permissions.has("EmbedLinks")) {
            console.warn(
                `⚠️ Log kanalında Embed Links izni yok: ${channel.name} (${channel.id})`
            );
            return;
        }

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {

        if (error.code === 50001) {

            console.warn(
                `⚠️ Botun log kanalına erişimi yok. Kategori: ${category}`
            );

            return;
        }

        if (error.code === 50013) {

            console.warn(
                `⚠️ Botun log kanalında gerekli yetkisi yok. Kategori: ${category}`
            );

            return;
        }

        console.error(
            "❌ Log gönderilirken hata:",
            error
        );
    }
}



async function getExecutor(
    guild,
    type,
    targetId
) {

    try {

        const logs =
            await guild.fetchAuditLogs({
                type,
                limit: 5
            });

        const entry =
            logs.entries.find(entry => {

                if (
                    targetId &&
                    entry.target?.id !== targetId
                ) {
                    return false;
                }

                return (
                    Date.now() -
                    entry.createdTimestamp
                ) < 10000;
            });

        return entry?.executor || null;

    } catch {

        return null;
    }
}

function baseEmbed(
    title,
    description
) {

    return new EmbedBuilder()
        .setColor("#fc0421")
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
} 

module.exports = {

    name: "logs",

    register(client) {

        // =================================================
        // ÜYE KATILDI
        // =================================================

        client.on(
            "guildMemberAdd",
            async member => {

                const embed =
                    baseEmbed(
                        "📥 Üye Katıldı",
                        `${member} sunucuya katıldı.`
                    )
                        .addFields({
                            name: "👤 Kullanıcı",
                            value:
                                `${member.user.tag}\n\`${member.id}\``,
                            inline: true
                        }, {
                            name: "📅 Hesap",
                            value:
                                `<t:${Math.floor(
                                    member.user.createdTimestamp / 1000
                                )}:R>`,
                            inline: true
                        })
                        .setThumbnail(
                            member.user.displayAvatarURL()
                        );

                await sendLog(
                    member.guild,
                    "member",
                    embed
                );
            }
        );

        // =================================================
        // ÜYE AYRILDI
        // =================================================

        client.on(
            "guildMemberRemove",
            async member => {

                const executor =
                    await getExecutor(
                        member.guild,
                        AuditLogEvent.MemberKick,
                        member.id
                    );

                const embed =
                    baseEmbed(
                        "📤 Üye Ayrıldı",
                        `${member.user.tag} sunucudan ayrıldı.`
                    )
                        .addFields({
                            name: "👤 Kullanıcı",
                            value:
                                `${member.user.tag}\n\`${member.id}\``,
                            inline: true
                        });

                if (executor) {

                    embed.addFields({
                        name: "👮 İşlemi Yapan",
                        value:
                            `${executor}`,
                        inline: true
                    });

                    embed.setTitle(
                        "👢 Üye Atıldı"
                    );
                }

                await sendLog(
                    member.guild,
                    "member",
                    embed
                );
            }
        );

        // =================================================
        // NICK DEĞİŞTİ
        // =================================================

        client.on(
            "guildMemberUpdate",
            async (oldMember, newMember) => {

                // NICK

                if (
                    oldMember.nickname !==
                    newMember.nickname
                ) {

                    const embed =
                        baseEmbed(
                            "📝 Takma Ad Değiştirildi",
                            `${newMember} kullanıcısının takma adı değiştirildi.`
                        )
                            .addFields({
                                name: "👤 Kullanıcı",
                                value:
                                    `${newMember.user.tag}`,
                                inline: true
                            }, {
                                name: "⬅️ Eski",
                                value:
                                    oldMember.nickname ||
                                    "Yok",
                                inline: true
                            }, {
                                name: "➡️ Yeni",
                                value:
                                    newMember.nickname ||
                                    "Yok",
                                inline: true
                            });

                    await sendLog(
                        newMember.guild,
                        "member",
                        embed
                    );
                }

                // ROLLER

                const oldRoles =
                    oldMember.roles.cache;

                const newRoles =
                    newMember.roles.cache;

                const added =
                    newRoles.filter(
                        role =>
                            !oldRoles.has(role.id)
                    );

                const removed =
                    oldRoles.filter(
                        role =>
                            !newRoles.has(role.id)
                    );

                if (added.size > 0) {

                    const roleText =
                        added
                            .map(role => `${role}`)
                            .join(", ");

                    const embed =
                        baseEmbed(
                            "🎭 Rol Verildi",
                            `${newMember} kullanıcısına rol verildi.`
                        )
                            .addFields({
                                name: "👤 Kullanıcı",
                                value:
                                    `${newMember}`,
                                inline: true
                            }, {
                                name: "🎭 Roller",
                                value:
                                    roleText,
                                inline: false
                            });

                    await sendLog(
                        newMember.guild,
                        "member",
                        embed
                    );
                }

                if (removed.size > 0) {

                    const roleText =
                        removed
                            .map(role => `${role}`)
                            .join(", ");

                    const embed =
                        baseEmbed(
                            "🎭 Rol Alındı",
                            `${newMember} kullanıcısından rol alındı.`
                        )
                            .addFields({
                                name: "👤 Kullanıcı",
                                value:
                                    `${newMember}`,
                                inline: true
                            }, {
                                name: "🎭 Roller",
                                value:
                                    roleText,
                                inline: false
                            });

                    await sendLog(
                        newMember.guild,
                        "member",
                        embed
                    );
                }
            }
        );

        // =================================================
        // MESAJ SİLİNDİ
        // =================================================

        client.on(
            "messageDelete",
            async message => {

                if (!message.guild) return;

                const embed =
                    baseEmbed(
                        "🗑️ Mesaj Silindi",
                        `Bir mesaj silindi.`
                    )
                        .addFields({
                            name: "👤 Kullanıcı",
                            value:
                                message.author
                                    ? `${message.author}`
                                    : "Bilinmiyor",
                            inline: true
                        }, {
                            name: "📍 Kanal",
                            value:
                                `${message.channel}`,
                            inline: true
                        });

                if (message.content) {

                    embed.addFields({
                        name: "💬 İçerik",
                        value:
                            message.content.slice(
                                0,
                                1024
                            )
                    });
                }

                if (
                    message.attachments?.size
                ) {

                    embed.addFields({
                        name: "📎 Ekler",
                        value:
                            `${message.attachments.size} dosya`
                    });
                }

                await sendLog(
                    message.guild,
                    "message",
                    embed
                );
            }
        );

        // =================================================
        // MESAJ DÜZENLENDİ
        // =================================================

        client.on(
            "messageUpdate",
            async (oldMessage, newMessage) => {

                if (!oldMessage.guild) return;

                if (
                    oldMessage.author?.bot
                ) return;

                if (
                    oldMessage.content ===
                    newMessage.content
                ) return;

                const embed =
                    baseEmbed(
                        "✏️ Mesaj Düzenlendi",
                        `${newMessage.author} bir mesajını düzenledi.`
                    )
                        .addFields({
                            name: "📍 Kanal",
                            value:
                                `${newMessage.channel}`,
                            inline: true
                        }, {
                            name: "👤 Kullanıcı",
                            value:
                                `${newMessage.author}`,
                            inline: true
                        }, {
                            name: "⬅️ Eski",
                            value:
                                oldMessage.content
                                    ?.slice(0, 1024) ||
                                "Bilinmiyor"
                        }, {
                            name: "➡️ Yeni",
                            value:
                                newMessage.content
                                    ?.slice(0, 1024) ||
                                "Bilinmiyor"
                        })
                        .setURL(
                            newMessage.url
                        );

                await sendLog(
                    newMessage.guild,
                    "message",
                    embed
                );
            }
        );

        // =================================================
        // BAN
        // =================================================

        client.on(
            "guildBanAdd",
            async ban => {

                const executor =
                    await getExecutor(
                        ban.guild,
                        AuditLogEvent.MemberBanAdd,
                        ban.user.id
                    );

                const embed =
                    baseEmbed(
                        "🔨 Üye Yasaklandı",
                        `${ban.user.tag} sunucudan yasaklandı.`
                    )
                        .addFields({
                            name: "👤 Kullanıcı",
                            value:
                                `${ban.user.tag}\n\`${ban.user.id}\``,
                            inline: true
                        });

                if (executor) {

                    embed.addFields({
                        name: "👮 Yetkili",
                        value:
                            `${executor}`,
                        inline: true
                    });
                }

                if (ban.reason) {

                    embed.addFields({
                        name: "📋 Sebep",
                        value:
                            ban.reason
                    });
                }

                await sendLog(
                    ban.guild,
                    "moderation",
                    embed
                );
            }
        );

        // =================================================
        // UNBAN
        // =================================================

        client.on(
            "guildBanRemove",
            async ban => {

                const executor =
                    await getExecutor(
                        ban.guild,
                        AuditLogEvent.MemberBanRemove,
                        ban.user.id
                    );

                const embed =
                    baseEmbed(
                        "🔓 Ban Kaldırıldı",
                        `${ban.user.tag} kullanıcısının banı kaldırıldı.`
                    )
                        .addFields({
                            name: "👤 Kullanıcı",
                            value:
                                `${ban.user.tag}`,
                            inline: true
                        });

                if (executor) {

                    embed.addFields({
                        name: "👮 Yetkili",
                        value:
                            `${executor}`,
                        inline: true
                    });
                }

                await sendLog(
                    ban.guild,
                    "moderation",
                    embed
                );
            }
        );

        // =================================================
        // KANAL OLUŞTURULDU
        // =================================================

        client.on(
            "channelCreate",
            async channel => {

                if (!channel.guild) return;

                const embed =
                    baseEmbed(
                        "📁 Kanal Oluşturuldu",
                        `${channel} kanalı oluşturuldu.`
                    )
                        .addFields({
                            name: "📛 Kanal",
                            value:
                                `${channel.name}`,
                            inline: true
                        }, {
                            name: "🆔 ID",
                            value:
                                `\`${channel.id}\``,
                            inline: true
                        }, {
                            name: "📂 Tür",
                            value:
                                `${channel.type}`,
                            inline: true
                        });

                await sendLog(
                    channel.guild,
                    "channel",
                    embed
                );
            }
        );

        // =================================================
        // KANAL SİLİNDİ
        // =================================================

        client.on(
            "channelDelete",
            async channel => {

                if (!channel.guild) return;

                const embed =
                    baseEmbed(
                        "🗑️ Kanal Silindi",
                        `**#${channel.name}** kanalı silindi.`
                    )
                        .addFields({
                            name: "🆔 Kanal ID",
                            value:
                                `\`${channel.id}\``,
                            inline: true
                        });

                await sendLog(
                    channel.guild,
                    "channel",
                    embed
                );
            }
        );

        // =================================================
        // ROL OLUŞTURULDU
        // =================================================

        client.on(
            "roleCreate",
            async role => {

                const embed =
                    baseEmbed(
                        "🎭 Rol Oluşturuldu",
                        `${role} rolü oluşturuldu.`
                    )
                        .addFields({
                            name: "📛 Rol",
                            value:
                                `${role.name}`,
                            inline: true
                        }, {
                            name: "🆔 ID",
                            value:
                                `\`${role.id}\``,
                            inline: true
                        });

                await sendLog(
                    role.guild,
                    "role",
                    embed
                );
            }
        );

        // =================================================
        // ROL SİLİNDİ
        // =================================================

        client.on(
            "roleDelete",
            async role => {

                const embed =
                    baseEmbed(
                        "🗑️ Rol Silindi",
                        `**${role.name}** rolü silindi.`
                    )
                        .addFields({
                            name: "🆔 Rol ID",
                            value:
                                `\`${role.id}\``,
                            inline: true
                        });

                await sendLog(
                    role.guild,
                    "role",
                    embed
                );
            }
        );

        // =================================================
        // ROL DEĞİŞTİ
        // =================================================

        client.on(
            "roleUpdate",
            async (oldRole, newRole) => {

                const changes = [];

                if (
                    oldRole.name !==
                    newRole.name
                ) {

                    changes.push(
                        `📛 İsim: **${oldRole.name}** → **${newRole.name}**`
                    );
                }

                if (
                    oldRole.hexColor !==
                    newRole.hexColor
                ) {

                    changes.push(
                        `🎨 Renk: **${oldRole.hexColor}** → **${newRole.hexColor}**`
                    );
                }

                if (
                    changes.length === 0
                ) return;

                const embed =
                    baseEmbed(
                        "✏️ Rol Güncellendi",
                        changes.join("\n")
                    )
                        .addFields({
                            name: "🎭 Rol",
                            value:
                                `${newRole}`,
                            inline: true
                        });

                await sendLog(
                    newRole.guild,
                    "role",
                    embed
                );
            }
        );

        // =================================================
        // VOICE
        // =================================================

        client.on(
            "voiceStateUpdate",
            async (oldState, newState) => {

                if (!oldState.guild) return;

                let title;
                let description;

                if (
                    !oldState.channel &&
                    newState.channel
                ) {

                    title =
                        "🔊 Voice Kanalına Katıldı";

                    description =
                        `${newState.member} **${newState.channel.name}** kanalına katıldı.`;
                }

                else if (
                    oldState.channel &&
                    !newState.channel
                ) {

                    title =
                        "🔇 Voice Kanalından Ayrıldı";

                    description =
                        `${newState.member} **${oldState.channel.name}** kanalından ayrıldı.`;
                }

                else if (
                    oldState.channelId !==
                    newState.channelId
                ) {

                    title =
                        "🔄 Voice Kanalı Değiştirildi";

                    description =
                        `${newState.member} **${oldState.channel.name}** → **${newState.channel.name}**`;
                }

                if (!title) return;

                const embed =
                    baseEmbed(
                        title,
                        description
                    );

                await sendLog(
                    newState.guild,
                    "voice",
                    embed
                );
            }
        );
    }
};