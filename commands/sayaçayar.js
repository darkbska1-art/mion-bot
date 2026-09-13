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

const dataFolder = path.join(__dirname, "..", "data");
const filePath = path.join(dataFolder, "counter.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, {
        recursive: true
    });
}

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
        filePath,
        JSON.stringify({}, null, 4),
        "utf8"
    );
}

// =====================================================
// VERİTABANI
// =====================================================

function getData() {
    try {
        const raw = fs.readFileSync(filePath, "utf8");

        if (!raw.trim()) {
            return {};
        }

        const parsed = JSON.parse(raw);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return {};
        }

        return parsed;

    } catch (error) {
        console.error(
            "❌ counter.json okunamadı:",
            error
        );

        return {};
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 4),
            "utf8"
        );

        return true;

    } catch (error) {
        console.error(
            "❌ counter.json kaydedilemedi:",
            error
        );

        return false;
    }
}

// =====================================================
// VARSAYILAN AYARLAR
// =====================================================

function getDefault() {
    return {
        enabled: false,
        channelId: null,
        target: null,
        reached: false
    };
}

// =====================================================
// VERİ DOĞRULAMA
// =====================================================

function normalizeGuildData(data) {

    if (
        typeof data !== "object" ||
        data === null
    ) {
        return getDefault();
    }

    const defaultData = getDefault();

    return {
        enabled:
            typeof data.enabled === "boolean"
                ? data.enabled
                : defaultData.enabled,

        channelId:
            typeof data.channelId === "string"
                ? data.channelId
                : null,

        target:
            Number.isInteger(data.target) &&
            data.target > 0
                ? data.target
                : null,

        reached:
            typeof data.reached === "boolean"
                ? data.reached
                : false
    };
}

// =====================================================
// SAYI FORMATLAMA
// =====================================================

function formatNumber(number) {
    return Number(number || 0)
        .toLocaleString("tr-TR");
}

// =====================================================
// YÜZDE
// =====================================================

function getPercentage(current, target) {

    if (
        !target ||
        target <= 0 ||
        !Number.isFinite(current)
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.floor(
                (current / target) * 100
            )
        )
    );
}

// =====================================================
// İLERLEME ÇUBUĞU
// =====================================================

function createBar(current, target) {

    const totalBlocks = 12;

    if (
        !target ||
        target <= 0
    ) {
        return "▱".repeat(totalBlocks);
    }

    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (current / target) * 100
            )
        );

    const filled =
        Math.floor(
            (percentage / 100) *
            totalBlocks
        );

    const empty =
        totalBlocks - filled;

    return (
        "▰".repeat(filled) +
        "▱".repeat(empty)
    );
}

// =====================================================
// HEDEF DURUMU
// =====================================================

function getTargetStatus(current, target) {

    if (!target) {
        return {
            title: "🎯 Hedef Yok",
            text: "Henüz bir sayaç hedefi belirlenmemiş.",
            completed: false
        };
    }

    if (current >= target) {

        const difference =
            current - target;

        return {
            title: "🎉 Hedef Tamamlandı",
            text:
                difference > 0
                    ? `Hedef **${formatNumber(difference)} üye** aşıldı.`
                    : "Belirlenen hedefe ulaşıldı.",
            completed: true
        };
    }

    const remaining =
        target - current;

    return {
        title: "⏳ Hedef Bekleniyor",
        text:
            `Hedefe ulaşmak için **${formatNumber(remaining)} üye** daha gerekiyor.`,
        completed: false
    };
}

// =====================================================
// KANAL KONTROLÜ
// =====================================================

function isValidCounterChannel(channel) {

    if (!channel) {
        return false;
    }

    return [
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.GuildAnnouncement
    ].includes(channel.type);
}

// =====================================================
// BOT İZİN KONTROLÜ
// =====================================================

function hasChannelPermission(channel, permission) {

    try {

        const botMember =
            channel.guild.members.me;

        if (!botMember) {
            return false;
        }

        return channel
            .permissionsFor(botMember)
            ?.has(permission) ?? false;

    } catch {
        return false;
    }
}

// =====================================================
// EMBED YARDIMCISI
// =====================================================

function createEmbed(interaction) {

    return new EmbedBuilder()
        .setColor(0x000000)
        .setAuthor({
            name: "Mion • Sayaç Sistemi",
            iconURL:
                interaction.client.user
                    .displayAvatarURL()
        })
        .setFooter({
            text:
                `Mion • ${interaction.guild.name}`
        })
        .setTimestamp();
}

// =====================================================
// SLASH COMMAND
// =====================================================

const data = new SlashCommandBuilder()
    .setName("sayac-ayarla")
    .setDescription(
        "Gelişmiş üye sayacı sistemini yönetir."
    )
    .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild.toString()
    )

    // =================================================
    // KANAL
    // =================================================

    .addSubcommand(subcommand =>
        subcommand
            .setName("kanal")
            .setDescription(
                "Sayaç kanalını ayarlar."
            )
            .addChannelOption(option =>
                option
                    .setName("kanal")
                    .setDescription(
                        "Üye sayısının gösterileceği kanal."
                    )
                    .addChannelTypes(
                        ChannelType.GuildVoice,
                        ChannelType.GuildText,
                        ChannelType.GuildAnnouncement
                    )
                    .setRequired(true)
            )
    )

    // =================================================
    // HEDEF
    // =================================================

    .addSubcommand(subcommand =>
        subcommand
            .setName("hedef")
            .setDescription(
                "Sayaç hedefini ayarlar."
            )
            .addIntegerOption(option =>
                option
                    .setName("sayi")
                    .setDescription(
                        "Ulaşılacak üye sayısı."
                    )
                    .setMinValue(1)
                    .setMaxValue(1000000)
                    .setRequired(true)
            )
    )

    // =================================================
    // AÇ
    // =================================================

    .addSubcommand(subcommand =>
        subcommand
            .setName("ac")
            .setDescription(
                "Sayaç sistemini açar."
            )
    )

    // =================================================
    // KAPAT
    // =================================================

    .addSubcommand(subcommand =>
        subcommand
            .setName("kapat")
            .setDescription(
                "Sayaç sistemini kapatır."
            )
    )

    // =================================================
    // DURUM
    // =================================================

    .addSubcommand(subcommand =>
        subcommand
            .setName("durum")
            .setDescription(
                "Sayaç sisteminin tüm ayarlarını gösterir."
            )
    );

// =====================================================
// EXECUTE
// =====================================================

async function execute(interaction) {

    try {

        if (!interaction.guild) {

            return interaction.reply({
                content:
                    "❌ Bu komut yalnızca sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        const guild =
            interaction.guild;

        const guildId =
            guild.id;

        const db =
            getData();

        // =============================================
        // SUNUCU VERİSİ
        // =============================================

        if (!db[guildId]) {

            db[guildId] =
                getDefault();
        }

        db[guildId] =
            normalizeGuildData(
                db[guildId]
            );

        const ayar =
            db[guildId];

        const subcommand =
            interaction.options.getSubcommand();

        // =============================================
        // KANAL
        // =============================================

        if (subcommand === "kanal") {

            const channel =
                interaction.options.getChannel(
                    "kanal"
                );

            if (!channel) {

                return interaction.reply({
                    content:
                        "❌ Geçerli bir kanal seçmelisin.",
                    ephemeral: true
                });
            }

            if (!isValidCounterChannel(channel)) {

                return interaction.reply({
                    content:
                        "❌ Bu kanal türü sayaç için kullanılamaz.",
                    ephemeral: true
                });
            }

            // =========================================
            // BOT İZİNLERİ
            // =========================================

            if (
                !hasChannelPermission(
                    channel,
                    PermissionFlagsBits.ViewChannel
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Botun bu kanalı görme izni yok.",
                    ephemeral: true
                });
            }

            if (
                !hasChannelPermission(
                    channel,
                    PermissionFlagsBits.Connect
                ) &&
                channel.type === ChannelType.GuildVoice
            ) {

                return interaction.reply({
                    content:
                        "❌ Botun bu ses kanalına bağlanma izni yok.",
                    ephemeral: true
                });
            }

            // =========================================
            // VERİ KAYDI
            // =========================================

            const oldChannel =
                ayar.channelId;

            ayar.channelId =
                channel.id;

            const saved =
                saveData(db);

            if (!saved) {

                return interaction.reply({
                    content:
                        "❌ Sayaç ayarı kaydedilirken bir hata oluştu.",
                    ephemeral: true
                });
            }

            const embed =
                createEmbed(interaction)
                    .setTitle(
                        "📊 Sayaç Kanalı Güncellendi"
                    )
                    .setDescription(
                        `Sayaç sistemi için kullanılacak kanal başarıyla güncellendi.\n\n` +
                        `**Yeni Kanal:** ${channel}\n` +
                        `**Önceki Kanal:** ${
                            oldChannel
                                ? `<#${oldChannel}>`
                                : "Ayarlanmamış"
                        }\n` +
                        `**Sistem Durumu:** ${
                            ayar.enabled
                                ? "🟢 Aktif"
                                : "🔴 Kapalı"
                        }`
                    )
                    .addFields(
                        {
                            name: "📢 Kanal",
                            value:
                                `${channel}\n\`${channel.name}\``,
                            inline: true
                        },
                        {
                            name: "👥 Mevcut Üye",
                            value:
                                `**${formatNumber(
                                    guild.memberCount
                                )}**`,
                            inline: true
                        },
                        {
                            name: "🎯 Hedef",
                            value:
                                ayar.target
                                    ? formatNumber(
                                        ayar.target
                                    )
                                    : "Ayarlanmamış",
                            inline: true
                        }
                    );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // HEDEF
        // =============================================

        if (subcommand === "hedef") {

            const target =
                interaction.options.getInteger(
                    "sayi"
                );

            const oldTarget =
                ayar.target;

            const current =
                guild.memberCount;

            ayar.target =
                target;

            ayar.reached =
                current >= target;

            const saved =
                saveData(db);

            if (!saved) {

                return interaction.reply({
                    content:
                        "❌ Sayaç hedefi kaydedilirken bir hata oluştu.",
                    ephemeral: true
                });
            }

            const percentage =
                getPercentage(
                    current,
                    target
                );

            const bar =
                createBar(
                    current,
                    target
                );

            const status =
                getTargetStatus(
                    current,
                    target
                );

            let differenceText;

            if (current >= target) {

                differenceText =
                    `+${formatNumber(
                        current - target
                    )} üye`;

            } else {

                differenceText =
                    `-${formatNumber(
                        target - current
                    )} üye`;
            }

            const embed =
                createEmbed(interaction)
                    .setTitle(
                        "🎯 Sayaç Hedefi Güncellendi"
                    )
                    .setDescription(
                        `Sunucunun sayaç hedefi başarıyla güncellendi.\n\n` +
                        `Yeni hedef: **${formatNumber(
                            target
                        )} üye**`
                    )
                    .addFields(
                        {
                            name: "👥 Mevcut Üye",
                            value:
                                `**${formatNumber(
                                    current
                                )}**`,
                            inline: true
                        },
                        {
                            name: "🎯 Yeni Hedef",
                            value:
                                `**${formatNumber(
                                    target
                                )}**`,
                            inline: true
                        },
                        {
                            name: "📊 Eski Hedef",
                            value:
                                oldTarget
                                    ? formatNumber(
                                        oldTarget
                                    )
                                    : "Yok",
                            inline: true
                        },
                        {
                            name: "📈 İlerleme",
                            value:
                                `**%${percentage}**\n${bar}`,
                            inline: false
                        },
                        {
                            name: "📌 Fark",
                            value:
                                `\`${differenceText}\``,
                            inline: true
                        },
                        {
                            name: "🏁 Durum",
                            value:
                                `${status.title}\n${status.text}`,
                            inline: true
                        }
                    );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // AÇ
        // =============================================

        if (subcommand === "ac") {

            // =========================================
            // KANAL KONTROLÜ
            // =========================================

            if (!ayar.channelId) {

                return interaction.reply({
                    content:
                        "❌ Sayaç sistemi açılamadı.\n\n" +
                        "Önce sayaç kanalını ayarlamalısın:\n" +
                        "`/sayac-ayarla kanal`",
                    ephemeral: true
                });
            }

            const channel =
                guild.channels.cache.get(
                    ayar.channelId
                );

            if (!channel) {

                ayar.channelId = null;
                ayar.enabled = false;

                saveData(db);

                return interaction.reply({
                    content:
                        "❌ Ayarlanmış sayaç kanalı artık bulunamıyor.\n\n" +
                        "Yeni bir kanal ayarlamalısın:\n" +
                        "`/sayac-ayarla kanal`",
                    ephemeral: true
                });
            }

            if (!isValidCounterChannel(channel)) {

                ayar.enabled = false;

                saveData(db);

                return interaction.reply({
                    content:
                        "❌ Ayarlanmış kanal artık geçerli bir sayaç kanalı değil.",
                    ephemeral: true
                });
            }

            // =========================================
            // BOT İZİNLERİ
            // =========================================

            if (
                !hasChannelPermission(
                    channel,
                    PermissionFlagsBits.ViewChannel
                )
            ) {

                return interaction.reply({
                    content:
                        `❌ Botun ${channel} kanalını görme izni bulunmuyor.`,
                    ephemeral: true
                });
            }

            // =========================================
            // AKTİF ET
            // =========================================

            const wasEnabled =
                ayar.enabled;

            const previousReached =
                ayar.reached;

            ayar.enabled = true;

            ayar.reached =
                ayar.target
                    ? guild.memberCount >=
                      ayar.target
                    : false;

            const saved =
                saveData(db);

            if (!saved) {

                return interaction.reply({
                    content:
                        "❌ Sayaç sistemi kaydedilirken bir hata oluştu.",
                    ephemeral: true
                });
            }

            const embed =
                createEmbed(interaction)
                    .setTitle(
                        "🟢 Sayaç Sistemi Aktif"
                    )
                    .setDescription(
                        `Sayaç sistemi başarıyla aktif edildi.\n\n` +
                        `Sayaç kanalı: ${channel}`
                    )
                    .addFields(
                        {
                            name: "📢 Sayaç Kanalı",
                            value:
                                `${channel}`,
                            inline: true
                        },
                        {
                            name: "👥 Mevcut Üye",
                            value:
                                `**${formatNumber(
                                    guild.memberCount
                                )}**`,
                            inline: true
                        },
                        {
                            name: "🎯 Hedef",
                            value:
                                ayar.target
                                    ? formatNumber(
                                        ayar.target
                                    )
                                    : "Belirlenmemiş",
                            inline: true
                        },
                        {
                            name: "📈 İlerleme",
                            value:
                                ayar.target
                                    ? `**%${getPercentage(
                                        guild.memberCount,
                                        ayar.target
                                    )}**\n${createBar(
                                        guild.memberCount,
                                        ayar.target
                                    )}`
                                    : "Hedef belirlenmemiş.",
                            inline: false
                        },
                        {
                            name: "🔄 Önceki Durum",
                            value:
                                wasEnabled
                                    ? "🟢 Zaten aktifti"
                                    : "🔴 Kapalıydı",
                            inline: true
                        },
                        {
                            name: "🏁 Hedef Durumu",
                            value:
                                ayar.target
                                    ? (
                                        ayar.reached
                                            ? "🎉 Tamamlandı"
                                            : "⏳ Devam ediyor"
                                    )
                                    : "⚪ Hedef yok",
                            inline: true
                        }
                    );

            if (
                ayar.reached &&
                !previousReached &&
                ayar.target
            ) {
                embed.addFields({
                    name: "🎉 Tebrikler",
                    value:
                        `Sunucu **${formatNumber(
                            ayar.target
                        )}** üye hedefine ulaşmış durumda!`,
                    inline: false
                });
            }

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // KAPAT
        // =============================================

        if (subcommand === "kapat") {

            const wasEnabled =
                ayar.enabled;

            ayar.enabled = false;

            const saved =
                saveData(db);

            if (!saved) {

                return interaction.reply({
                    content:
                        "❌ Sayaç sistemi kapatılırken ayarlar kaydedilemedi.",
                    ephemeral: true
                });
            }

            const embed =
                createEmbed(interaction)
                    .setTitle(
                        "🔴 Sayaç Sistemi Devre Dışı"
                    )
                    .setDescription(
                        wasEnabled
                            ? "Sayaç sistemi başarıyla kapatıldı."
                            : "Sayaç sistemi zaten kapalıydı."
                    )
                    .addFields(
                        {
                            name: "⚙️ Durum",
                            value:
                                "🔴 Kapalı",
                            inline: true
                        },
                        {
                            name: "📢 Kanal",
                            value:
                                ayar.channelId
                                    ? `<#${ayar.channelId}>`
                                    : "Ayarlanmamış",
                            inline: true
                        },
                        {
                            name: "🎯 Hedef",
                            value:
                                ayar.target
                                    ? formatNumber(
                                        ayar.target
                                    )
                                    : "Ayarlanmamış",
                            inline: true
                        },
                        {
                            name: "💾 Ayarlar",
                            value:
                                "Kanal ve hedef ayarların korunuyor.",
                            inline: false
                        }
                    );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =============================================
        // DURUM
        // =============================================

        if (subcommand === "durum") {

            const current =
                guild.memberCount;

            const target =
                ayar.target;

            const percentage =
                target
                    ? getPercentage(
                        current,
                        target
                    )
                    : 0;

            const bar =
                target
                    ? createBar(
                        current,
                        target
                    )
                    : createBar(
                        0,
                        null
                    );

            const targetStatus =
                getTargetStatus(
                    current,
                    target
                );

            let remaining;

            if (!target) {

                remaining =
                    "🎯 Hedef ayarlanmamış.";

            } else if (current >= target) {

                const exceeded =
                    current - target;

                remaining =
                    exceeded > 0
                        ? `🎉 Hedef **${formatNumber(
                            exceeded
                        )} üye** aşıldı.`
                        : "🎉 Hedefe tam olarak ulaşıldı.";

            } else {

                remaining =
                    `⏳ **${formatNumber(
                        target - current
                    )} üye** kaldı.`;
            }

            const channel =
                ayar.channelId
                    ? guild.channels.cache.get(
                        ayar.channelId
                    )
                    : null;

            let channelStatus;

            if (!ayar.channelId) {

                channelStatus =
                    "🔴 Ayarlanmamış";

            } else if (!channel) {

                channelStatus =
                    "⚠️ Kanal bulunamadı";

            } else {

                channelStatus =
                    `🟢 ${channel}`;
            }

            // =========================================
            // EK İSTATİSTİKLER
            // =========================================

            let difference = "—";

            if (target) {

                if (current >= target) {

                    difference =
                        `+${formatNumber(
                            current - target
                        )}`;

                } else {

                    difference =
                        `-${formatNumber(
                            target - current
                        )}`;
                }
            }

            const targetText =
                target
                    ? formatNumber(target)
                    : "Ayarlanmamış";

            const embed =
                createEmbed(interaction)
                    .setTitle(
                        "📊 Sayaç Kontrol Paneli"
                    )
                    .setDescription(
                        `**${guild.name}** sunucusunun sayaç sistemi ayrıntılı olarak aşağıda gösteriliyor.\n\n` +
                        `${targetStatus.title}\n` +
                        `${targetStatus.text}`
                    )
                    .addFields(
                        {
                            name: "⚙️ Sistem",
                            value:
                                ayar.enabled
                                    ? "🟢 **Aktif**"
                                    : "🔴 **Kapalı**",
                            inline: true
                        },
                        {
                            name: "📢 Sayaç Kanalı",
                            value:
                                channelStatus,
                            inline: true
                        },
                        {
                            name: "👥 Mevcut Üye",
                            value:
                                `**${formatNumber(
                                    current
                                )}**`,
                            inline: true
                        },
                        {
                            name: "🎯 Hedef",
                            value:
                                `**${targetText}**`,
                            inline: true
                        },
                        {
                            name: "📈 İlerleme",
                            value:
                                target
                                    ? `**%${percentage}**\n${bar}`
                                    : `Hedef belirlenmemiş.\n${bar}`,
                            inline: false
                        },
                        {
                            name: "📌 Hedef Farkı",
                            value:
                                `\`${difference}\``,
                            inline: true
                        },
                        {
                            name: "⏳ Kalan",
                            value:
                                remaining,
                            inline: true
                        },
                        {
                            name: "🏁 Hedef Durumu",
                            value:
                                target
                                    ? (
                                        ayar.reached
                                            ? "🎉 Tamamlandı"
                                            : "⏳ Devam ediyor"
                                    )
                                    : "⚪ Bekleniyor",
                            inline: true
                        }
                    )
                    .addFields({
                        name: "🧩 Sistem Özeti",
                        value:
                            `> Sistem: ${
                                ayar.enabled
                                    ? "🟢 Aktif"
                                    : "🔴 Kapalı"
                            }\n` +
                            `> Kanal: ${
                                ayar.channelId
                                    ? `<#${ayar.channelId}>`
                                    : "Yok"
                            }\n` +
                            `> Üye: **${formatNumber(
                                current
                            )}**\n` +
                            `> Hedef: **${targetText}**\n` +
                            `> İlerleme: **%${percentage}**`,
                        inline: false
                    });

            return interaction.reply({
                embeds: [embed]
            });
        }

    } catch (error) {

        console.error(
            "❌ /sayac-ayarla komutunda hata:",
            error
        );

        const errorMessage =
            "❌ Sayaç sistemi çalıştırılırken beklenmeyen bir hata oluştu.";

        try {

            if (interaction.replied ||
                interaction.deferred) {

                await interaction.followUp({
                    content: errorMessage,
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }

        } catch (replyError) {

            console.error(
                "❌ Hata mesajı gönderilemedi:",
                replyError
            );
        }
    }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute
};