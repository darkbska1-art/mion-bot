const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const file = path.join(dataDir, "levels.json");


// =====================================================
// DATA
// =====================================================

function ensureData() {

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            "{}",
            "utf8"
        );
    }
}

function loadData() {

    ensureData();

    try {

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch {

        return {};

    }
}


// =====================================================
// XP HESABI
// =====================================================

function requiredXP(level) {
    return 100 + (level * 75);
}


// =====================================================
// COMMAND
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("seviye")

        .setDescription(
            "Kullanıcının seviye ve XP bilgisini gösterir."
        )

        .addUserOption(option =>
            option
                .setName("kullanici")
                .setDescription(
                    "Bilgisini görmek istediğin kullanıcı."
                )
                .setRequired(false)
        ),


    async execute(interaction) {

        const data = loadData();

        const guildData =
            data[interaction.guild.id];


        // =================================================
        // SUNUCU VERİSİ
        // =================================================

        if (!guildData) {

            return interaction.reply({
                content:
                    "❌ Bu sunucuda henüz seviye sistemi verisi bulunmuyor.",
                ephemeral: true
            });

        }


        // =================================================
        // HEDEF KULLANICI
        // =================================================

        const target =
            interaction.options.getUser("kullanici") ||
            interaction.user;


        // =================================================
        // KULLANICI VERİSİ
        // =================================================

        const user =
            guildData.users?.[target.id];


        if (!user) {

            return interaction.reply({
                content:
                    `❌ ${target} henüz XP kazanmamış.`,
                ephemeral: true
            });

        }


        // =================================================
        // XP
        // =================================================

        const level =
            user.level || 0;

        const currentXP =
            user.xp || 0;

        const totalXP =
            user.totalXp || 0;

        const needed =
            requiredXP(level);


        const percentage = Math.min(
            100,
            Math.floor(
                (currentXP / needed) * 100
            )
        );


        // =================================================
        // XP BAR
        // =================================================

        const filled =
            Math.floor(
                percentage / 10
            );

        const bar =
            "▰".repeat(filled) +
            "▱".repeat(10 - filled);


        // =================================================
        // SIRALAMA
        // =================================================

        const users =
            Object.entries(
                guildData.users || {}
            );


        users.sort(
            (a, b) =>
                (b[1].totalXp || 0) -
                (a[1].totalXp || 0)
        );


        const rank =
            users.findIndex(
                ([id]) =>
                    id === target.id
            ) + 1;


        // =================================================
        // EMBED
        // =================================================

        const embed =
            new EmbedBuilder()

                .setColor(0x000000)

                .setAuthor({
                    name:
                        `${target.username} • Seviye`,
                    iconURL:
                        target.displayAvatarURL({
                            size: 256
                        })
                })

                .setTitle(
                    "🎚️ SEVİYE PROFİLİ"
                )

                .setThumbnail(
                    target.displayAvatarURL({
                        size: 512
                    })
                )

                .addFields(

                    {
                        name: "🏆 Seviye",
                        value:
                            `**${level}**`,
                        inline: true
                    },

                    {
                        name: "🥇 Sunucu Sırası",
                        value:
                            `**#${rank}**`,
                        inline: true
                    },

                    {
                        name: "✨ Toplam XP",
                        value:
                            `**${totalXP} XP**`,
                        inline: true
                    },

                    {
                        name: "📈 XP İlerlemesi",
                        value:
                            `${bar} **${percentage}%**\n` +
                            `**${currentXP} / ${needed} XP**`,
                        inline: false
                    }

                )

                .setFooter({
                    text:
                        `${interaction.guild.name} • Mion`
                })

                .setTimestamp();


        // =================================================
        // GÖNDER
        // =================================================

        return interaction.reply({
            embeds: [embed]
        });

    }

};