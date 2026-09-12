const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bir üyeyi sunucudan yasaklar.")
        .addUserOption(option =>
            option
                .setName("üye")
                .setDescription("Yasaklanacak üye")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Yasaklama sebebi")
                .setMaxLength(500)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser("üye");
        const reason =
            interaction.options.getString("sebep") ||
            "Sebep belirtilmedi.";

        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        // Bot kendisini banlamasın
        if (user.id === interaction.client.user.id) {
            return interaction.reply({
                content: "❌ Kendimi yasaklayamam.",
                ephemeral: true
            });
        }

        // Komutu kullanan kendisini banlamasın
        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Kendini yasaklayamazsın.",
                ephemeral: true
            });
        }

        // Sunucu sahibi korunur
        if (user.id === interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ Sunucu sahibini yasaklayamazsın.",
                ephemeral: true
            });
        }

        // Üye sunucudaysa hiyerarşi kontrolü
        if (member) {
            if (
                member.roles.highest.position >=
                interaction.member.roles.highest.position
            ) {
                return interaction.reply({
                    content:
                        "❌ Bu üyeyi yasaklayamazsın. Rolü senin rolünle aynı veya daha yüksek.",
                    ephemeral: true
                });
            }

            if (
                member.roles.highest.position >=
                interaction.guild.members.me.roles.highest.position
            ) {
                return interaction.reply({
                    content:
                        "❌ Bu üyeyi yasaklayamam. Üyenin rolü botun en yüksek rolüne eşit veya daha yüksek.",
                    ephemeral: true
                });
            }
        }

        // DM bildirimi
        if (member) {
            await member.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🔨 Sunucudan Yasaklandın")
                        .setDescription(
                            `**${interaction.guild.name}** sunucusundan yasaklandın.`
                        )
                        .addFields({
                            name: "📝 Sebep",
                            value: reason
                        })
                        .setTimestamp()
                ]
            }).catch(() => {});
        }

        try {
            await interaction.guild.members.ban(user.id, {
                reason: `${reason} | Yetkili: ${interaction.user.tag}`,
                deleteMessageSeconds: 86400
            });

            const embed = new EmbedBuilder()
                .setTitle("🔨 Üye Yasaklandı")
                .setDescription(`${user} başarıyla sunucudan yasaklandı.`)
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
                    },
                    {
                        name: "🗑️ Mesajlar",
                        value: "Son 24 saat silindi.",
                        inline: true
                    }
                )
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
                .setTimestamp()
                .setFooter({
                    text: "Mion Moderasyon"
                });

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Ban hatası:", error);

            await interaction.reply({
                content:
                    "❌ Üye yasaklanamadı. Botun **Ban Members** yetkisini ve rol sırasını kontrol et.",
                ephemeral: true
            });
        }
    }
};