const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("toplurolver")
        .setDescription("Sunucudaki tüm üyelere rol verir.")
        .addRoleOption(option =>
            option
                .setName("rol")
                .setDescription("Verilecek rol.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const role = interaction.options.getRole("rol");

        if (role.managed) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription("❌ Bu rol Discord tarafından yönetiliyor.")
                ],
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription("❌ Bu rol benim en yüksek rolümden yukarıda veya eşit.")
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        await interaction.guild.members.fetch();

        let verilen = 0;
        let atlanan = 0;

        for (const member of interaction.guild.members.cache.values()) {
            if (member.user.bot) continue;

            if (member.roles.cache.has(role.id)) {
                atlanan++;
                continue;
            }

            try {
                await member.roles.add(role);
                verilen++;
            } catch {
                atlanan++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎭 Toplu Rol Verildi")
            .addFields(
                { name: "Rol", value: `${role}`, inline: true },
                { name: "Verilen", value: `${verilen}`, inline: true },
                { name: "Atlanan", value: `${atlanan}`, inline: true }
            )
            .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};