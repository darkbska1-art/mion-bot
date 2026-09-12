const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataFile =
    path.join(__dirname, "..", "data", "warns.json");

function loadWarns() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return {};
    }
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("warns")
        .setDescription("Bir kullanıcının uyarılarını gösterir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Uyarıları gösterilecek kullanıcı")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Bu komut sadece sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.ModerateMembers
            )
        ) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Üyeleri Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser("kullanıcı");

        const data = loadWarns();

        const warnings =
            data?.[interaction.guild.id]?.[user.id] || [];

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("⚠️ Uyarı Geçmişi")
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}\n\`${user.id}\``,
                        inline: true
                    },
                    {
                        name: "📊 Toplam Uyarı",
                        value: `${warnings.length}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: "Mion • Warn Sistemi"
                });

        if (warnings.length === 0) {

            embed.setDescription(
                "Bu kullanıcının herhangi bir uyarısı bulunmuyor."
            );

        } else {

            const list =
                warnings
                    .map((warn, index) => {

                        const time =
                            Math.floor(
                                warn.timestamp / 1000
                            );

                        return (
                            `**${index + 1}.** \`${warn.id}\`\n` +
                            `> 📝 **Sebep:** ${warn.reason}\n` +
                            `> 🛡️ **Yetkili:** <@${warn.moderatorId}>\n` +
                            `> 🕐 **Tarih:** <t:${time}:F>`
                        );
                    })
                    .join("\n\n");

            embed.setDescription(list);
        }

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};