
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "..", "data");
const filePath = path.join(dataFolder, "counter.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "{}");
}

function getData() {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4)
    );
}

function getDefault() {
    return {
        enabled: false,
        channelId: null,
        target: null,
        reached: false
    };
}

function createBar(current, target) {
    if (!target || target <= 0) {
        return "▱▱▱▱▱▱▱▱▱▱";
    }

    const percentage = Math.min(
        100,
        Math.floor((current / target) * 100)
    );

    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;

    return "▰".repeat(filled) + "▱".repeat(empty);
}

function getPercentage(current, target) {
    if (!target || target <= 0) return 0;

    return Math.min(
        100,
        Math.floor((current / target) * 100)
    );
}

const data = new SlashCommandBuilder()
    .setName("sayac-ayarla")
    .setDescription("Gelişmiş üye sayacı sistemini yönetir.")
    .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild.toString()
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName("kanal")
            .setDescription("Sayaç kanalını ayarlar.")
            .addChannelOption(option =>
                option
                    .setName("kanal")
                    .setDescription("Üye sayısının gösterileceği kanal.")
                    .addChannelTypes(
                        ChannelType.GuildVoice,
                        ChannelType.GuildText,
                        ChannelType.GuildAnnouncement
                    )
                    .setRequired(true)
            )
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName("hedef")
            .setDescription("Sayaç hedefini ayarlar.")
            .addIntegerOption(option =>
                option
                    .setName("sayi")
                    .setDescription("Ulaşılacak üye sayısı.")
                    .setMinValue(1)
                    .setMaxValue(1000000)
                    .setRequired(true)
            )
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName("ac")
            .setDescription("Sayaç sistemini açar.")
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName("kapat")
            .setDescription("Sayaç sistemini kapatır.")
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName("durum")
            .setDescription("Sayaç sisteminin tüm ayarlarını gösterir.")
    );

async function execute(interaction) {
    const guild = interaction.guild;
    const guildId = guild.id;

    const db = getData();

    if (!db[guildId]) {
        db[guildId] = getDefault();
    }

    const ayar = db[guildId];
    const subcommand = interaction.options.getSubcommand();

    // =====================================================
    // KANAL
    // =====================================================

    if (subcommand === "kanal") {
        const channel =
            interaction.options.getChannel("kanal");

        ayar.channelId = channel.id;

        saveData(db);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setAuthor({
                name: "Mion • Sayaç Sistemi",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle("📊 Sayaç Kanalı Ayarlandı")
            .setDescription(
                `Sayaç kanalı başarıyla ${channel} olarak ayarlandı.\n\n` +
                `**Kanal:** ${channel}\n` +
                `**Durum:** ${ayar.enabled ? "🟢 Açık" : "🔴 Kapalı"}`
            )
            .setFooter({
                text: guild.name
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }

    // =====================================================
    // HEDEF
    // =====================================================

    if (subcommand === "hedef") {
        const target =
            interaction.options.getInteger("sayi");

        ayar.target = target;
        ayar.reached = guild.memberCount >= target;

        saveData(db);

        const percentage =
            getPercentage(guild.memberCount, target);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setAuthor({
                name: "Mion • Sayaç Sistemi",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle("🎯 Sayaç Hedefi Güncellendi")
            .setDescription(
                `Yeni hedef **${target.toLocaleString("tr-TR")} üye** olarak ayarlandı.`
            )
            .addFields(
                {
                    name: "👥 Mevcut Üye",
                    value:
                        guild.memberCount.toLocaleString("tr-TR"),
                    inline: true
                },
                {
                    name: "🎯 Hedef",
                    value:
                        target.toLocaleString("tr-TR"),
                    inline: true
                },
                {
                    name: "📈 İlerleme",
                    value:
                        `%${percentage}\n${createBar(
                            guild.memberCount,
                            target
                        )}`,
                    inline: false
                }
            )
            .setFooter({
                text: guild.name
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }

    // =====================================================
    // AÇ
    // =====================================================

    if (subcommand === "ac") {
        if (!ayar.channelId) {
            await interaction.reply({
                content:
                    "❌ Önce sayaç kanalını ayarlamalısın.\n\n`/sayac-ayarla kanal`",
                ephemeral: true
            });
            return;
        }

        const channel =
            guild.channels.cache.get(ayar.channelId);

        if (!channel) {
            ayar.channelId = null;
            saveData(db);

            await interaction.reply({
                content:
                    "❌ Sayaç kanalı artık bulunamıyor. Yeni bir kanal ayarla.",
                ephemeral: true
            });

            return;
        }

        ayar.enabled = true;
        ayar.reached =
            ayar.target
                ? guild.memberCount >= ayar.target
                : false;

        saveData(db);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🟢 Sayaç Sistemi Aktif")
                    .setDescription(
                        `Sayaç sistemi **${channel}** kanalında aktif edildi.\n\n` +
                        `Mevcut üye: **${guild.memberCount.toLocaleString("tr-TR")}**`
                    )
                    .setFooter({
                        text: "Mion • Sayaç Sistemi"
                    })
                    .setTimestamp()
            ]
        });

        return;
    }

    // =====================================================
    // KAPAT
    // =====================================================

    if (subcommand === "kapat") {
        ayar.enabled = false;

        saveData(db);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🔴 Sayaç Sistemi Kapatıldı")
                    .setDescription(
                        "Sayaç sistemi başarıyla devre dışı bırakıldı."
                    )
                    .setFooter({
                        text: "Mion • Sayaç Sistemi"
                    })
                    .setTimestamp()
            ]
        });

        return;
    }

    // =====================================================
    // DURUM
    // =====================================================

    if (subcommand === "durum") {
        const current = guild.memberCount;

        const target =
            ayar.target || null;

        const percentage =
            target
                ? getPercentage(current, target)
                : 0;

        let remaining = "Hedef ayarlanmamış";

        if (target) {
            remaining =
                current >= target
                    ? "🎉 Hedef tamamlandı!"
                    : `${(target - current).toLocaleString("tr-TR")} üye kaldı`;
        }

        const channel =
            ayar.channelId
                ? `<#${ayar.channelId}>`
                : "Ayarlanmamış";

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setAuthor({
                name: "Mion • Sayaç Sistemi",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle("📊 Sayaç Kontrol Paneli")
            .setDescription(
                `**${guild.name}** sayaç sisteminin ayrıntılı durumu.`
            )
            .addFields(
                {
                    name: "⚙️ Sistem",
                    value:
                        ayar.enabled
                            ? "🟢 Aktif"
                            : "🔴 Kapalı",
                    inline: true
                },
                {
                    name: "📢 Kanal",
                    value: channel,
                    inline: true
                },
                {
                    name: "👥 Üye",
                    value:
                        current.toLocaleString("tr-TR"),
                    inline: true
                },
                {
                    name: "🎯 Hedef",
                    value:
                        target
                            ? target.toLocaleString("tr-TR")
                            : "Ayarlanmamış",
                    inline: true
                },
                {
                    name: "📈 İlerleme",
                    value:
                        target
                            ? `%${percentage}\n${createBar(
                                current,
                                target
                            )}`
                            : "Hedef belirlenmemiş.",
                    inline: false
                },
                {
                    name: "⏳ Kalan",
                    value: remaining,
                    inline: false
                }
            )
            .setFooter({
                text: `Mion • ${guild.name}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
}

module.exports = {
    data,
    execute
};

