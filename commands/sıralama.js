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
// COMMAND
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("siralama")

        .setDescription(
            "Sunucunun seviye sıralamasını gösterir."
        ),


    async execute(interaction) {

        const data = loadData();

        const guildData =
            data[interaction.guild.id];


        // =================================================
        // VERİ KONTROLÜ
        // =================================================

        if (
            !guildData ||
            !guildData.users ||
            Object.keys(guildData.users).length === 0
        ) {

            return interaction.reply({
                content:
                    "❌ Henüz seviye sıralaması oluşmadı.",
                ephemeral: true
            });

        }


        // =================================================
        // SIRALAMA
        // =================================================

        const users =
            Object.entries(
                guildData.users
            )
                .sort(
                    (a, b) =>
                        (b[1].totalXp || 0) -
                        (a[1].totalXp || 0)
                )
                .slice(0, 10);


        let description = "";


        // =================================================
        // KULLANICILAR
        // =================================================

        for (
            let i = 0;
            i < users.length;
            i++
        ) {

            const [
                userId,
                userData
            ] = users[i];


            const member =
                await interaction.guild.members
                    .fetch(userId)
                    .catch(() => null);


            const username =
                member?.user?.username ||
                "Bilinmeyen Kullanıcı";


            // Madalya
            let medal;

            if (i === 0) {

                medal = "🥇";

            } else if (i === 1) {

                medal = "🥈";

            } else if (i === 2) {

                medal = "🥉";

            } else {

                medal = `**${i + 1}.**`;

            }


            // Kullanıcı gösterimi
            const userDisplay =
                member
                    ? `${member}`
                    : `**${username}**`;


            description +=
                `${medal} ${userDisplay}\n` +
                `> 🎚️ Seviye **${userData.level || 0}** • ` +
                `✨ **${userData.totalXp || 0} XP**\n\n`;

        }


        // =================================================
        // EMBED
        // =================================================

        const embed =
            new EmbedBuilder()

                .setColor(0x000000)

                .setTitle(
                    "🏆 SEVİYE SIRALAMASI"
                )

                .setDescription(
                    description
                )

                .addFields({
                    name: "📊 Gösterilen",
                    value:
                        `İlk **${users.length}** kullanıcı`,
                    inline: true
                })

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