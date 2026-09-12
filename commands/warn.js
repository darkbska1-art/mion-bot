const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "warns.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

function loadWarns() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return {};
    }
}

function saveWarns(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Bir kullanıcıya uyarı verir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Uyarılacak kullanıcı")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Uyarı sebebi")
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

        const reason =
            interaction.options.getString("sebep");

        if (user.bot) {
            return interaction.reply({
                content: "❌ Botlara uyarı veremezsin.",
                ephemeral: true
            });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Kendine uyarı veremezsin.",
                ephemeral: true
            });
        }

        const member =
            await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

        if (!member) {
            return interaction.reply({
                content: "❌ Bu kullanıcı sunucuda bulunamadı.",
                ephemeral: true
            });
        }

        const data = loadWarns();

        if (!data[interaction.guild.id]) {
            data[interaction.guild.id] = {};
        }

        if (!data[interaction.guild.id][user.id]) {
            data[interaction.guild.id][user.id] = [];
        }

        const warnings =
            data[interaction.guild.id][user.id];

        const warnId =
            `W${Date.now().toString(36).toUpperCase()}`;

        warnings.push({
            id: warnId,
            reason: reason,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            timestamp: Date.now()
        });

        saveWarns(data);

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("⚠️ Kullanıcı Uyarıldı")
                .setDescription(
                    `${user} kullanıcısına başarıyla uyarı verildi.`
                )
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}\n\`${user.id}\``,
                        inline: true
                    },
                    {
                        name: "⚠️ Uyarı Sayısı",
                        value: `${warnings.length}`,
                        inline: true
                    },
                    {
                        name: "🆔 Uyarı ID",
                        value: `\`${warnId}\``,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: reason,
                        inline: false
                    },
                    {
                        name: "🛡️ Yetkili",
                        value: `${interaction.user}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: "Mion • Warn Sistemi"
                });

        return interaction.reply({
            embeds: [embed]
        });
    }
};