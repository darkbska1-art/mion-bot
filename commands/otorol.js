const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const file = path.join(
    __dirname,
    "../data/otorol.json"
);

// =====================================================
// DOSYA
// =====================================================

if (!fs.existsSync(path.dirname(file))) {
    fs.mkdirSync(path.dirname(file), {
        recursive: true
    });
}

if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "{}");
}

function loadData() {
    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()
        .setName("otorol")
        .setDescription("Sunucu otomatik rol sistemini yönetir.")

        // AÇ
        .addSubcommand(sub =>
            sub
                .setName("aç")
                .setDescription("Otomatik rol sistemini açar.")
        )

        // KAPAT
        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription("Otomatik rol sistemini kapatır.")
        )

        // ÜYE ROLÜ
        .addSubcommand(sub =>
            sub
                .setName("üye")
                .setDescription("Yeni üyelere verilecek rolü ayarlar.")
                .addRoleOption(option =>
                    option
                        .setName("rol")
                        .setDescription("Üyelere verilecek rol.")
                        .setRequired(true)
                )
        )

        // BOT ROLÜ
        .addSubcommand(sub =>
            sub
                .setName("bot")
                .setDescription("Yeni botlara verilecek rolü ayarlar.")
                .addRoleOption(option =>
                    option
                        .setName("rol")
                        .setDescription("Botlara verilecek rol.")
                        .setRequired(true)
                )
        )

        // SIFIRLA
        .addSubcommand(sub =>
            sub
                .setName("sıfırla")
                .setDescription("Otomatik rol ayarlarını sıfırlar.")
        )

        // DURUM
        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription("Otomatik rol sisteminin durumunu gösterir.")
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    async execute(interaction) {

        const guildId =
            interaction.guild.id;

        const data = loadData();

        // Sunucu kaydı
        if (!data[guildId]) {
            data[guildId] = {
                enabled: false,
                memberRole: null,
                botRole: null
            };
        }

        const config =
            data[guildId];

        const subcommand =
            interaction.options.getSubcommand();

        // =================================================
        // AÇ
        // =================================================

        if (subcommand === "aç") {

            if (
                !config.memberRole &&
                !config.botRole
            ) {
                return interaction.reply({
                    content:
                        "❌ Önce en az bir otomatik rol ayarlamalısın.\n\n" +
                        "`/otorol üye` veya `/otorol bot` kullanabilirsin.",
                    ephemeral: true
                });
            }

            config.enabled = true;

            saveData(data);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🟢 OTOROL AKTİF")
                .setDescription(
                    "Otomatik rol sistemi başarıyla açıldı."
                )
                .addFields(
                    {
                        name: "👤 Üye Rolü",
                        value: config.memberRole
                            ? `<@&${config.memberRole}>`
                            : "Ayarlanmadı",
                        inline: true
                    },
                    {
                        name: "🤖 Bot Rolü",
                        value: config.botRole
                            ? `<@&${config.botRole}>`
                            : "Ayarlanmadı",
                        inline: true
                    }
                )
                .setFooter({
                    text: "Mion • Otomatik Rol Sistemi"
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // KAPAT
        // =================================================

        if (subcommand === "kapat") {

            config.enabled = false;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🔴 OTOROL KAPATILDI")
                        .setDescription(
                            "Otomatik rol sistemi devre dışı bırakıldı."
                        )
                        .setFooter({
                            text: "Mion • Otomatik Rol Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // ÜYE ROLÜ
        // =================================================

        if (subcommand === "üye") {

            const role =
                interaction.options.getRole("rol");

            // Yönetilen rol kontrolü
            if (role.managed) {
                return interaction.reply({
                    content:
                        "❌ Bu rol Discord tarafından yönetiliyor ve verilemez.",
                    ephemeral: true
                });
            }

            // Botun kendi rolü
            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                return interaction.reply({
                    content:
                        "❌ Bot sunucu üyesi bilgisine ulaşamadı.",
                    ephemeral: true
                });
            }

            // Yetki
            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Botun **Rolleri Yönet** yetkisi yok.",
                    ephemeral: true
                });
            }

            // Rol hiyerarşisi
            if (
                role.position >=
                botMember.roles.highest.position
            ) {
                return interaction.reply({
                    content:
                        "❌ Bu rol botun en yüksek rolünden yukarıda veya aynı seviyede.\n" +
                        "Botun rolünü bu rolün üzerine taşımalısın.",
                    ephemeral: true
                });
            }

            config.memberRole = role.id;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("👤 ÜYE OTOROLÜ AYARLANDI")
                        .setDescription(
                            `Yeni üyeler sunucuya girdiğinde ${role} rolünü alacak.`
                        )
                        .addFields({
                            name: "📌 Rol",
                            value: `${role}`,
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Otomatik Rol Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // BOT ROLÜ
        // =================================================

        if (subcommand === "bot") {

            const role =
                interaction.options.getRole("rol");

            if (role.managed) {
                return interaction.reply({
                    content:
                        "❌ Bu rol Discord tarafından yönetiliyor ve verilemez.",
                    ephemeral: true
                });
            }

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                return interaction.reply({
                    content:
                        "❌ Bot sunucu üyesi bilgisine ulaşamadı.",
                    ephemeral: true
                });
            }

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Botun **Rolleri Yönet** yetkisi yok.",
                    ephemeral: true
                });
            }

            if (
                role.position >=
                botMember.roles.highest.position
            ) {
                return interaction.reply({
                    content:
                        "❌ Bu rol botun en yüksek rolünden yukarıda veya aynı seviyede.",
                    ephemeral: true
                });
            }

            config.botRole = role.id;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🤖 BOT OTOROLÜ AYARLANDI")
                        .setDescription(
                            `Sunucuya eklenen botlara ${role} rolü verilecek.`
                        )
                        .addFields({
                            name: "📌 Rol",
                            value: `${role}`,
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Otomatik Rol Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }

        // =================================================
        // DURUM
        // =================================================

        if (subcommand === "durum") {

            const durum =
                config.enabled
                    ? "🟢 Açık"
                    : "🔴 Kapalı";

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("⚙️ OTOROL DURUMU")
                .addFields(
                    {
                        name: "📡 Sistem",
                        value: durum,
                        inline: true
                    },
                    {
                        name: "👤 Üye Rolü",
                        value:
                            config.memberRole
                                ? `<@&${config.memberRole}>`
                                : "Ayarlanmadı",
                        inline: true
                    },
                    {
                        name: "🤖 Bot Rolü",
                        value:
                            config.botRole
                                ? `<@&${config.botRole}>`
                                : "Ayarlanmadı",
                        inline: true
                    }
                )
                .setFooter({
                    text: "Mion • Otomatik Rol Sistemi"
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // SIFIRLA
        // =================================================

        if (subcommand === "sıfırla") {

            data[guildId] = {
                enabled: false,
                memberRole: null,
                botRole: null
            };

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("♻️ OTOROL SIFIRLANDI")
                        .setDescription(
                            "Bu sunucunun otomatik rol ayarları tamamen sıfırlandı."
                        )
                        .setFooter({
                            text: "Mion • Otomatik Rol Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }
    }
};