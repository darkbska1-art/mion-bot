
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYA
// =====================================================

const dataDir =
    path.join(__dirname, "..", "data");

const dataFile =
    path.join(dataDir, "afk.json");

// =====================================================
// KLASÖR OLUŞTUR
// =====================================================

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

// =====================================================
// DOSYA OLUŞTUR
// =====================================================

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
        dataFile,
        "{}",
        "utf8"
    );
}

// =====================================================
// AFK VERİLERİNİ OKU
// =====================================================

function loadAfk() {

    try {

        return JSON.parse(
            fs.readFileSync(
                dataFile,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "❌ AFK verisi okunamadı:",
            error
        );

        return {};
    }
}

// =====================================================
// AFK VERİLERİNİ KAYDET
// =====================================================

function saveAfk(data) {

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
            "❌ AFK verisi kaydedilemedi:",
            error
        );
    }
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()
        .setName("afk")
        .setDescription(
            "🌙 Global olarak AFK moduna gir veya AFK'dan çık."
        )
        .addStringOption(option =>
            option
                .setName("mesaj")
                .setDescription(
                    "AFK mesajın"
                )
                .setRequired(false)
                .setMaxLength(200)
        ),

    async execute(interaction) {

        const userId =
            interaction.user.id;

        const afkData =
            loadAfk();

        // =================================================
        // ZATEN AFK İSE → AFK KAPAT
        // =================================================

        if (afkData[userId]) {

            const oldData =
                afkData[userId];

            delete afkData[userId];

            saveAfk(
                afkData
            );

            const duration =
                formatDuration(
                    Date.now() -
                    oldData.timestamp
                );

            return interaction.reply({

                embeds: [

                    new EmbedBuilder()
                        .setTitle(
                            "👋 AFK Kapatıldı"
                        )
                        .setDescription(
                            `${interaction.user} artık **AFK değil.**`
                        )
                        .addFields(
                            {
                                name:
                                    "⏱️ AFK Süresi",
                                value:
                                    duration,
                                inline:
                                    true
                            },
                            {
                                name:
                                    "🌐 Durum",
                                value:
                                    " AFK kapalı",
                                inline:
                                    true
                            }
                        )
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // AFK MESAJI
        // =================================================

        const afkMessage =
            interaction.options.getString(
                "mesaj"
            ) ||
            "Şu anda müsait değilim.";

        // =================================================
        // SUNUCU
        // =================================================

        const guildName =
            interaction.guild?.name ||
            "Bilinmeyen sunucu";

        // =================================================
        // AFK KAYDET
        // =================================================

        const timestamp =
            Date.now();

        afkData[userId] = {

            message:
                afkMessage,

            timestamp:
                timestamp,

            guildId:
                interaction.guild?.id ||
                null,

            guildName:
                guildName
        };

        saveAfk(
            afkData
        );

        // =================================================
        // CEVAP
        // =================================================

        return interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setTitle(
                        "💤 AFK Aktif"
                    )

                    .setDescription(
                        `${interaction.user} artık ** olarak AFK!**`
                    )

                    .addFields(
                        {
                            name:
                                "📝 Mesaj",
                            value:
                                `> ${afkMessage}`,
                            inline:
                                false
                        },
                        {
                            name:
                                "📍 Başlangıç",
                            value:
                                `<t:${Math.floor(timestamp / 1000)}:F>`,
                            inline:
                                true
                        },
                        {
                            name:
                                "🌐 Durum",
                            value:
                                "Tüm sunucularda aktif",
                            inline:
                                true
                        }
                    )

                    .setFooter({
                        text:
                            `AFK • ${guildName}`
                    })

                    .setTimestamp()
            ]
        });
    }
};

// =====================================================
// SÜRE HESAPLA
// =====================================================

function formatDuration(ms) {

    let seconds =
        Math.floor(
            ms / 1000
        );

    if (seconds < 60) {

        return `${seconds} saniye`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {

        return `${minutes} dakika`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {

        const remainingMinutes =
            minutes % 60;

        if (remainingMinutes > 0) {

            return (
                `${hours} saat ` +
                `${remainingMinutes} dakika`
            );
        }

        return `${hours} saat`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    const remainingHours =
        hours % 24;

    if (remainingHours > 0) {

        return (
            `${days} gün ` +
            `${remainingHours} saat`
        );
    }

    return `${days} gün`;
}

