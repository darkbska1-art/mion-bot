
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("Mevcut kanalı yeniler ve mesaj geçmişini temizler.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const channel = interaction.channel;

        if (!channel || !channel.guild) {
            return interaction.reply({
                content: "❌ Bu komut sadece sunucu kanallarında kullanılabilir.",
                ephemeral: true
            });
        }

        if (!channel.manageable) {
            return interaction.reply({
                content: "❌ Bu kanalı yenileyemiyorum. Botun kanal yönetme yetkisini ve rol sırasını kontrol et.",
                ephemeral: true
            });
        }

        const oldName = channel.name;
        const oldTopic = channel.topic;
        const oldNSFW = channel.nsfw;
        const oldParent = channel.parentId;
        const oldPosition = channel.rawPosition;
        const oldRateLimit = channel.rateLimitPerUser;

        await interaction.reply({
            content: "💥 Kanal yenileniyor..."
        });

        try {
            const newChannel = await channel.clone({
                name: oldName,
                topic: oldTopic || undefined,
                nsfw: oldNSFW,
                parent: oldParent || undefined,
                reason: `Nuke - ${interaction.user.tag}`
            });

            await newChannel.setRateLimitPerUser(oldRateLimit);

            try {
                await newChannel.setPosition(oldPosition);
            } catch {}

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("💥 Kanal Yenilendi")
                .setDescription(
                    `Bu kanal **${interaction.user}** tarafından yenilendi.\n\n` +
                    `🧹 Eski mesajlar temizlendi.`
                )
                .setTimestamp();

            await newChannel.send({
                embeds: [embed]
            });

            await channel.delete(
                `Nuke - ${interaction.user.tag}`
            );

        } catch (error) {
            console.error("Nuke hatası:", error);

            try {
                await interaction.editReply({
                    content: "❌ Kanal yenilenirken bir hata oluştu."
                });
            } catch {}
        }
    }
};

