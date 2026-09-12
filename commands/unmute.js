const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Bir kullanıcının mute rolünü kaldırır.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Mute kaldırılacak kullanıcı.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Unmute sebebi.")
                .setMaxLength(1000)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        // Interaction süresinin dolmasını önler
        await interaction.deferReply();

        try {

            // =====================================================
            // YETKİ
            // =====================================================

            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.editReply({
                    content: "❌ Bu komut için **Rolleri Yönet** yetkisine sahip olmalısın."
                });
            }

            // =====================================================
            // KULLANICI
            // =====================================================

            const user = interaction.options.getUser("kullanıcı");

            const sebep =
                interaction.options.getString("sebep") ||
                "Sebep belirtilmedi.";

            // =====================================================
            // ÜYEYİ BUL
            // =====================================================

            const member = await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

            if (!member) {
                return interaction.editReply({
                    content: "❌ Bu kullanıcı sunucuda bulunamadı."
                });
            }

            // =====================================================
            // BOT ÜYESİ
            // =====================================================

            const botMember = interaction.guild.members.me;

            if (!botMember) {
                return interaction.editReply({
                    content: "❌ Bot üyesi bulunamadı."
                });
            }

            // =====================================================
            // BOT YETKİSİ
            // =====================================================

            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.editReply({
                    content: "❌ Botun **Rolleri Yönet** yetkisi yok."
                });
            }

            // =====================================================
            // MUTED ROLÜNÜ BUL
            // =====================================================

            const muteRole = interaction.guild.roles.cache.find(
                role => role.name === "Muted"
            );

            if (!muteRole) {
                return interaction.editReply({
                    content: "❌ Sunucuda `Muted` rolü bulunamadı."
                });
            }

            // =====================================================
            // KULLANICI MUTELİ Mİ?
            // =====================================================

            if (!member.roles.cache.has(muteRole.id)) {
                return interaction.editReply({
                    content: "❌ Bu kullanıcı zaten mute değil."
                });
            }

            // =====================================================
            // ROL HİYERARŞİSİ
            // =====================================================

            if (
                muteRole.position >=
                botMember.roles.highest.position
            ) {
                return interaction.editReply({
                    content: "❌ `Muted` rolü botun rolünün altında olmalı."
                });
            }

            // =====================================================
            // MUTE ROLÜNÜ KALDIR
            // =====================================================

            await member.roles.remove(
                muteRole,
                sebep
            );

            // =====================================================
            // EMBED
            // =====================================================

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🔊 Kullanıcının Mute'u Kaldırıldı")
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}`,
                        inline: true
                    },
                    {
                        name: "🔓 Rol",
                        value: `${muteRole}`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: sebep,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Yetkili: ${interaction.user.tag}`
                })
                .setTimestamp();

            // =====================================================
            // CEVAP
            // =====================================================

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("Unmute hatası:", error);

            // Interaction zaten defer edildiği için editReply
            await interaction.editReply({
                content: "❌ Kullanıcının mute'u kaldırılırken bir hata oluştu."
            }).catch(() => {});

        }
    }
};