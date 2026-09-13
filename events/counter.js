const {
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYA
// =====================================================

const dataFolder = path.join(__dirname, "..", "data");
const filePath = path.join(dataFolder, "counter.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

const DEFAULT_DATA = {};

// =====================================================
// DATA OKUMA
// =====================================================

function readData() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(
                filePath,
                JSON.stringify(DEFAULT_DATA, null, 4)
            );

            return {};
        }

        const raw = fs.readFileSync(filePath, "utf8").trim();

        if (!raw) {
            return {};
        }

        return JSON.parse(raw);
    } catch (error) {
        console.error("❌ counter.json okunamadı:", error);
        return {};
    }
}

// =====================================================
// DATA KAYDETME
// =====================================================

function saveData(data) {
    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 4)
        );
    } catch (error) {
        console.error("❌ counter.json kaydedilemedi:", error);
    }
}

// =====================================================
// SAYI FORMAT
// =====================================================

function formatNumber(number) {
    return Number(number || 0).toLocaleString("tr-TR");
}

// =====================================================
// İLERLEME ÇUBUĞU
// =====================================================

function progressBar(current, target, size = 20) {
    if (!target || target <= 0) {
        return "━━━━━━━━━━━━━━━━━━━━";
    }

    const percentage = Math.min(
        Math.max(current / target, 0),
        1
    );

    const filled = Math.round(percentage * size);
    const empty = size - filled;

    return "█".repeat(filled) + "░".repeat(empty);
}

// =====================================================
// YÜZDE
// =====================================================

function getPercentage(current, target) {
    if (!target || target <= 0) {
        return 0;
    }

    return Math.min(
        Math.round((current / target) * 100),
        100
    );
}

// =====================================================
// ÜYE SAYISI MESAJI
// =====================================================

async function sendCounterMessage(guild, member, type) {
    const data = readData();

    const ayar = data[guild.id];

    if (!ayar) return;
    if (!ayar.enabled) return;
    if (!ayar.channelId) return;

    // =================================================
    // KANAL
    // =================================================

    const channel = guild.channels.cache.get(ayar.channelId);

    if (!channel) {
        console.log(
            `⚠️ ${guild.name} sunucusunda sayaç kanalı bulunamadı.`
        );

        return;
    }

    // =================================================
    // KANAL KONTROL
    // =================================================

    if (!channel.isTextBased()) {
        console.log(
            `⚠️ ${guild.name} sunucusunda sayaç kanalı mesaj desteklemiyor.`
        );

        return;
    }

    // =================================================
    // BOT YETKİLERİ
    // =================================================

    const permissions = channel.permissionsFor(guild.members.me);

    if (
        !permissions ||
        !permissions.has(
            PermissionsBitField.Flags.ViewChannel
        ) ||
        !permissions.has(
            PermissionsBitField.Flags.SendMessages
        ) ||
        !permissions.has(
            PermissionsBitField.Flags.EmbedLinks
        )
    ) {
        console.log(
            `⚠️ ${guild.name} - Sayaç kanalında gerekli yetkiler yok.`
        );

        return;
    }

    // =================================================
    // GÜNCEL ÜYE SAYISI
    // =================================================

    const current = guild.memberCount;

    const target = Number(ayar.target) || 0;

    const percentage = getPercentage(
        current,
        target
    );

    const bar = progressBar(
        current,
        target
    );

    // =================================================
    // ÜYE GİRİŞ / ÇIKIŞ
    // =================================================

    let title;
    let description;

    if (type === "join") {

        title = "👋 Yeni Üye Katıldı";

        description =
            `${member} sunucuya katıldı!\n\n` +
            `👤 **Kullanıcı:** ${member.user.tag}\n` +
            `🆔 **ID:** \`${member.id}\``;

    } else {

        title = "👋 Üye Ayrıldı";

        description =
            `**${member.user.tag}** sunucudan ayrıldı.\n\n` +
            `🆔 **ID:** \`${member.id}\``;
    }

    // =================================================
    // HEDEF BİLGİSİ
    // =================================================

    let targetText;

    if (target > 0) {

        const remaining = Math.max(
            target - current,
            0
        );

        if (current >= target) {

            targetText =
                `🎯 **Hedef:** ${formatNumber(target)}\n` +
                `🏆 **Hedefe ulaşıldı!**\n` +
                `📊 ${bar} **%${percentage}**`;

        } else {

            targetText =
                `🎯 **Hedef:** ${formatNumber(target)}\n` +
                `📈 **Kalan:** ${formatNumber(remaining)} üye\n` +
                `📊 ${bar} **%${percentage}**`;
        }

    } else {

        targetText =
            `🎯 **Hedef:** Ayarlanmamış`;
    }

    // =================================================
    // EMBED
    // =================================================

    const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(title)
        .setDescription(description)
        .addFields(
            {
                name: "👥 Güncel Üye Sayısı",
                value: `**${formatNumber(current)}**`,
                inline: true
            },
            {
                name: "📊 Sayaç",
                value: targetText,
                inline: false
            }
        )
        .setFooter({
            text: `${guild.name} • Sayaç Sistemi`
        })
        .setTimestamp();

    // Kullanıcı avatarı varsa thumbnail
    if (member.user?.displayAvatarURL) {
        embed.setThumbnail(
            member.user.displayAvatarURL({
                extension: "png",
                size: 256
            })
        );
    }

    // =================================================
    // MESAJ GÖNDER
    // =================================================

    try {

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {

        console.error(
            `❌ ${guild.name} sayaç mesajı gönderilemedi:`,
            error
        );
    }

    // =================================================
    // HEDEF KONTROLÜ
    // =================================================

    if (
        target > 0 &&
        current >= target &&
        !ayar.reached
    ) {

        ayar.reached = true;

        saveData(data);

        const targetEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎉 Sayaç Hedefine Ulaşıldı!")
            .setDescription(
                `Sunucu **${formatNumber(target)}** üye hedefine ulaştı!\n\n` +
                `👥 **Güncel Üye:** ${formatNumber(current)}\n` +
                `🎯 **Hedef:** ${formatNumber(target)}\n\n` +
                `${progressBar(current, target)} **%100**`
            )
            .setFooter({
                text: `${guild.name} • Sayaç Sistemi`
            })
            .setTimestamp();

        try {

            await channel.send({
                embeds: [targetEmbed]
            });

        } catch (error) {

            console.error(
                `❌ ${guild.name} hedef mesajı gönderilemedi:`,
                error
            );
        }

    } else if (
        target > 0 &&
        current < target &&
        ayar.reached
    ) {

        // Hedeften tekrar aşağı düşüldüyse
        // reached durumunu sıfırla.

        ayar.reached = false;

        saveData(data);
    }
}

// =====================================================
// EVENT
// =====================================================

module.exports = {

    name: "guildMemberAdd",

    async execute(member) {

        await sendCounterMessage(
            member.guild,
            member,
            "join"
        );
    }
};