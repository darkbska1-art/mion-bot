
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

// =====================================================
// KOMUT
// =====================================================

const data = new SlashCommandBuilder()
    .setName("ship")
    .setDescription("İki kullanıcı arasındaki eğlencelik uyumu hesaplar.")
    .addUserOption(option =>
        option
            .setName("kullanici")
            .setDescription("Ship yapmak istediğin kullanıcı.")
            .setRequired(true)
    )
    .addUserOption(option =>
        option
            .setName("diger")
            .setDescription("İkinci kullanıcı. Boş bırakırsan sen seçilirsin.")
            .setRequired(false)
    );


// =====================================================
// HASH SİSTEMİ
// Aynı iki kişi = aynı sonuç
// =====================================================

function createHash(text) {

    let hash = 0;

    for (let i = 0; i < text.length; i++) {

        hash =
            ((hash << 5) - hash) +
            text.charCodeAt(i);

        hash |= 0;
    }

    return Math.abs(hash);

}


// =====================================================
// UYUM HESAPLAMA
// =====================================================

function calculateCompatibility(user1, user2) {

    const ids = [
        user1.id,
        user2.id
    ].sort();

    const combined = ids.join("-");

    const hash = createHash(combined);

    /*
        0 - 100 arası sabit sonuç.
    */

    let score = hash % 101;

    /*
        Aşırı uç sonuçların çok sık gelmesini
        biraz daha dengeli hale getiriyoruz.
    */

    if (score < 5) {
        score += 5;
    }

    if (score > 100) {
        score = 100;
    }

    return score;

}


// =====================================================
// UYUM DURUMU
// =====================================================

function getCompatibilityStatus(score) {

    if (score >= 95) {
        return {
            emoji: "💖",
            title: "MÜKEMMEL UYUM!",
            text: "Bu ikili arasında inanılmaz bir uyum var!",
            level: "Efsanevi"
        };
    }

    if (score >= 85) {
        return {
            emoji: "💞",
            title: "ÇOK YÜKSEK UYUM!",
            text: "Aralarındaki uyum oldukça yüksek görünüyor!",
            level: "Çok yüksek"
        };
    }

    if (score >= 70) {
        return {
            emoji: "💕",
            title: "YÜKSEK UYUM!",
            text: "Gayet güzel bir uyum yakaladılar.",
            level: "Yüksek"
        };
    }

    if (score >= 55) {
        return {
            emoji: "💗",
            title: "ORTA ÜSTÜ UYUM!",
            text: "Fena değil, aralarında güzel bir uyum var.",
            level: "Orta üstü"
        };
    }

    if (score >= 40) {
        return {
            emoji: "💓",
            title: "ORTA UYUM!",
            text: "Biraz şansa ve zamana ihtiyaçları olabilir.",
            level: "Orta"
        };
    }

    if (score >= 20) {
        return {
            emoji: "💔",
            title: "DÜŞÜK UYUM!",
            text: "Uyumları pek yüksek görünmüyor.",
            level: "Düşük"
        };
    }

    return {
        emoji: "😭",
        title: "ÇOK DÜŞÜK UYUM!",
        text: "Mion hesaplamalarına göre pek uyumlu görünmüyorlar.",
        level: "Çok düşük"
    };

}


// =====================================================
// UYUM BARI
// =====================================================

function createBar(score) {

    const total = 20;

    const filled =
        Math.round(
            (score / 100) * total
        );

    const empty =
        total - filled;

    return (
        "▰".repeat(filled) +
        "▱".repeat(empty)
    );

}


// =====================================================
// SHIP İSMİ
// =====================================================

function createShipName(user1, user2) {

    const name1 =
        user1.username
            .replace(/[^a-zA-Z0-9]/g, "");

    const name2 =
        user2.username
            .replace(/[^a-zA-Z0-9]/g, "");

    const first =
        name1.slice(
            0,
            Math.ceil(name1.length / 2)
        );

    const second =
        name2.slice(
            Math.floor(name2.length / 2)
        );

    const result =
        `${first}${second}`;

    return result || "MionShip";

}


// =====================================================
// EXECUTE
// =====================================================

async function execute(interaction) {

    const firstUser =
        interaction.options.getUser("kullanici");

    const secondUser =
        interaction.options.getUser("diger") ||
        interaction.user;


    // =================================================
    // KENDİSİYLE SHIP
    // =================================================

    if (
        firstUser.id === secondUser.id
    ) {

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("💗 Mion Ship")
            .setDescription(
                "Kendinle ship yapmak yerine başka bir kullanıcı seçmelisin. 😭"
            )
            .setFooter({
                text: "Mion • Eğlence Sistemi"
            });

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }


    // =================================================
    // HESAPLAMA
    // =================================================

    const score =
        calculateCompatibility(
            firstUser,
            secondUser
        );

    const status =
        getCompatibilityStatus(score);

    const bar =
        createBar(score);

    const shipName =
        createShipName(
            firstUser,
            secondUser
        );


    // =================================================
    // EMBED
    // =================================================

    const embed = new EmbedBuilder()
        .setColor(0x000000)

        .setAuthor({
            name: "Mion • Ship Calculator",
            iconURL:
                interaction.client.user.displayAvatarURL()
        })

        .setTitle(
            `${status.emoji} ${firstUser.username} × ${secondUser.username}`
        )

        .setDescription(
            `### 💞 ${shipName}\n\n` +

            `**Uyum Oranı**\n` +
            `# ${score}%\n\n` +

            `\`${bar}\`\n\n` +

            `${status.emoji} **${status.title}**\n` +
            `${status.text}\n\n` +

            `**Uyum Seviyesi:** ${status.level}`
        )

        .addFields(
            {
                name: "👤 1. Kullanıcı",
                value:
                    `${firstUser}\n` +
                    `\`${firstUser.username}\``,
                inline: true
            },

            {
                name: "👤 2. Kullanıcı",
                value:
                    `${secondUser}\n` +
                    `\`${secondUser.username}\``,
                inline: true
            },

            {
                name: "💗 Ship",
                value:
                    `**${shipName}**`,
                inline: true
            }
        )

        .setThumbnail(
            firstUser.displayAvatarURL({
                size: 256
            })
        )

        .setFooter({
            text:
                "Mion • Bu sonuç tamamen eğlence amaçlıdır."
        })

        .setTimestamp();


    // =================================================
    // GÖNDER
    // =================================================

    await interaction.reply({
        embeds: [embed]
    });

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute
};
