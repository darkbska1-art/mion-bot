const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Bir üyeyi sunucudan atar.")
        .addUserOption(option =>
            option
                .setName("üye")
                .setDescription("Atılacak üye")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Atılma sebebi")
                .setMaxLength(500)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("üye");
        const reason =
            interaction.options.getString("sebep") ||
            "Sebep belirtilmedi.";

        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        if (!member) {
            return interaction.reply({
                content:
                    "❌ Bu kullanıcı sunucuda bulunmuyor.",
                ephemeral: true
            });
        }

        // Kendini atamasın
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Kendini sunucudan atamazsın.",
                ephemeral: true
            });
        }

        // Bot kendisini atamasın
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: "❌ Kendimi sunucudan atamam.",
                ephemeral: true
            });
        }

        // Sunucu sahibi
        if (user.id === interaction.guild.ownerId) {
            return interaction.reply({
                content:
                    "❌ Sunucu sahibini sunucudan atamazsın.",
                ephemeral: true
            });
        }

        // Yetkili hiyerarşisi
        if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.reply({
                content:
                    "❌ Bu üyeyi atamazsın. Rolü senin rolünle aynı veya daha yüksek.",
                ephemeral: true
            });
        }

        // Bot hiyerarşisi
        if (
            member.roles.highest.position >=
            interaction.guild.members.me.roles.highest.position
        ) {
            return interaction.reply({
                content:
                    "❌ Bu üyeyi atamam. Üyenin rolü botun en yüksek rolüne eşit veya daha yüksek.",
                ephemeral: true
            });
        }

        // DM bildirimi
        await member.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("👢 Sunucudan Atıldın")
                    .setDescription(
                        `**${interaction.guild.name}** sunucusundan atıldın.`
                    )
                    .addFields({
                        name: "📝 Sebep",
                        value: reason
                    })
                    .setTimestamp()
            ]
        }).catch(() => {});

        try {
            await member.kick(
                `${reason} | Yetkili: ${interaction.user.tag}`
            );

            const embed = new EmbedBuilder()
                .setTitle("👢 Üye Atıldı")
                .setDescription(
                    `${user} başarıyla sunucudan atıldı.`
                )
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user.tag} (\`${user.id}\`)`,
                        inline: true
                    },
                    {
                        name: "🛡️ Yetkili",
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: reason
                    }
                )
                .setThumbnail(
                    user.displayAvatarURL({ size: 256 })
                )
                .setTimestamp()
                .setFooter({
                    text: "Mion Moderasyon"
                });

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Kick hatası:", error);

            await interaction.reply({
                content:
                    "❌ Üye atılamadı. Botun **Kick Members** yetkisini ve rol sırasını kontrol et.",
                ephemeral: true
            });
        }
    }
};