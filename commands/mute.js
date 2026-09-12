const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Bir kullanıcıya mute rolü verir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Mute uygulanacak kullanıcı.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Mute sebebi.")
                .setMaxLength(1000)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        // =====================================================
        // INTERACTION'I HEMEN DEFER ET
        // =====================================================

        await interaction.deferReply({ ephemeral: false });

        try {

            // =====================================================
            // YETKİ KONTROLÜ
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
            // KENDİNE MUTE
            // =====================================================

            if (member.id === interaction.user.id) {
                return interaction.editReply({
                    content: "❌ Kendine mute uygulayamazsın."
                });
            }

            // =====================================================
            // BOT YETKİSİ
            // =====================================================

            const botMember = interaction.guild.members.me;

            if (!botMember) {
                return interaction.editReply({
                    content: "❌ Bot üyesi bulunamadı."
                });
            }

            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.editReply({
                    content: "❌ Botun **Rolleri Yönet** yetkisi yok."
                });
            }

            // =====================================================
            // MUTE ROLÜNÜ BUL / OLUŞTUR
            // =====================================================

            let muteRole = interaction.guild.roles.cache.find(
                role => role.name === "Muted"
            );

            if (!muteRole) {

                muteRole = await interaction.guild.roles.create({
                    name: "Muted",

                    // color yerine colors kullanılıyor
                    colors: {
                        primaryColor: 0x808080
                    },

                    reason: "Mute sistemi için oluşturuldu."
                });

                // =================================================
                // KANALLARA MUTE İZNİ
                // =================================================

                for (const channel of interaction.guild.channels.cache.values()) {

                    if (!channel.permissionOverwrites) continue;

                    await channel.permissionOverwrites.edit(
                        muteRole,
                        {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false
                        }
                    ).catch(() => {});
                }
            }

            // =====================================================
            // ZATEN MUTELİ Mİ?
            // =====================================================

            if (member.roles.cache.has(muteRole.id)) {
                return interaction.editReply({
                    content: "❌ Bu kullanıcı zaten mute."
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
            // ÜYEYE MUTE ROLÜ VER
            // =====================================================

            await member.roles.add(
                muteRole,
                sebep
            );

            // =====================================================
            // BAŞARILI EMBED
            // =====================================================

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🔇 Kullanıcı Mutelendi")
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}`,
                        inline: true
                    },
                    {
                        name: "🔇 Rol",
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

            console.error("Mute hatası:", error);

            // Interaction daha önce cevaplandıysa
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "❌ Kullanıcı mutelenirken bir hata oluştu."
                }).catch(() => {});
            }

        }
    }
};