const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolal")
        .setDescription("Bir kullanıcıdan rol alır.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Rolü alınacak kullanıcı.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("rol")
                .setDescription("Alınacak rol.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser("kullanıcı");
        const role = interaction.options.getRole("rol");

        const member = await interaction.guild.members.fetch(user.id);

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

        if (!member.roles.cache.has(role.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription(`⚠️ ${member} zaten ${role} rolüne sahip değil.`)
                ],
                ephemeral: true
            });
        }

        await member.roles.remove(role);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎭 Rol Alındı")
            .addFields(
                { name: "Kullanıcı", value: `${member}`, inline: true },
                { name: "Rol", value: `${role}`, inline: true },
                { name: "Yetkili", value: `${interaction.user}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};