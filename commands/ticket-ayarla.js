
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "tickets.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2));
}

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-ayar")
        .setDescription("Ticket sisteminin ayarlarını görüntüler veya değiştirir.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

        .addStringOption(option =>
            option
                .setName("başlık")
                .setDescription("Ticket panelinin başlığını değiştirir.")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("açıklama")
                .setDescription("Ticket panelinin açıklamasını değiştirir.")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("renk")
                .setDescription("Ticket panelinin rengini değiştirir. Örnek: #000000")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("buton")
                .setDescription("Ticket açma butonunun yazısını değiştirir.")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const data = loadData();
        const guildId = interaction.guild.id;

        if (!data[guildId] || !data[guildId].enabled) {
            return interaction.reply({
                content: "❌ Bu sunucuda ticket sistemi kurulu değil.\nÖnce `/ticket-kur` kullan.",
                ephemeral: true
            });
        }

        const settings = data[guildId];

        const baslik = interaction.options.getString("başlık");
        const aciklama = interaction.options.getString("açıklama");
        const renk = interaction.options.getString("renk");
        const buton = interaction.options.getString("buton");

        // Hiçbir ayar verilmediyse mevcut ayarları göster
        if (!baslik && !aciklama && !renk && !buton) {
            const embed = new EmbedBuilder()
                .setColor(settings.color || "#FF69B4")
                .setTitle("🎫 Ticket Ayarları")
                .addFields(
                    {
                        name: "📌 Durum",
                        value: settings.enabled ? "🟢 Aktif" : "🔴 Kapalı",
                        inline: true
                    },
                    {
                        name: "📁 Kategori",
                        value: settings.categoryId
                            ? `<#${settings.categoryId}>`
                            : "Ayarlanmamış",
                        inline: true
                    },
                    {
                        name: "🛡️ Yetkili Rolü",
                        value: settings.supportRoleId
                            ? `<@&${settings.supportRoleId}>`
                            : "Ayarlanmamış",
                        inline: true
                    },
                    {
                        name: "📋 Log Kanalı",
                        value: settings.logChannelId
                            ? `<#${settings.logChannelId}>`
                            : "Ayarlanmamış",
                        inline: true
                    },
                    {
                        name: "📨 Panel Kanalı",
                        value: settings.panelChannelId
                            ? `<#${settings.panelChannelId}>`
                            : "Ayarlanmamış",
                        inline: true
                    },
                    {
                        name: "🎫 Açık Ticket",
                        value: `${Object.values(settings.tickets || {}).filter(t => t.open).length}`,
                        inline: true
                    },
                    {
                        name: "📝 Başlık",
                        value: settings.title || "Ticket Destek",
                        inline: false
                    },
                    {
                        name: "📄 Açıklama",
                        value: settings.description || "Destek almak için aşağıdaki butona tıklayın.",
                        inline: false
                    },
                    {
                        name: "🎨 Renk",
                        value: settings.color || "#FF69B4",
                        inline: true
                    },
                    {
                        name: "🔘 Buton",
                        value: settings.buttonLabel || "Ticket Aç",
                        inline: true
                    },
                    {
                        name: "🔢 Sıradaki Ticket",
                        value: `${settings.nextNumber || 1}`,
                        inline: true
                    }
                )
                .setFooter({
                    text: "Değiştirmek için /ticket-ayar kullan."
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // =========================
        // BAŞLIK
        // =========================

        if (baslik) {
            if (baslik.length > 256) {
                return interaction.reply({
                    content: "❌ Başlık en fazla **256 karakter** olabilir.",
                    ephemeral: true
                });
            }

            settings.title = baslik;
        }

        // =========================
        // AÇIKLAMA
        // =========================

        if (aciklama) {
            if (aciklama.length > 4096) {
                return interaction.reply({
                    content: "❌ Açıklama en fazla **4096 karakter** olabilir.",
                    ephemeral: true
                });
            }

            settings.description = aciklama;
        }

        // =========================
        // RENK
        // =========================

        if (renk) {
            const temizRenk = renk.trim();

            if (!/^#[0-9A-Fa-f]{6}$/.test(temizRenk)) {
                return interaction.reply({
                    content: "❌ Geçersiz renk!\nÖrnek: `#000000` veya `#FF69B4`",
                    ephemeral: true
                });
            }

            settings.color = temizRenk;
        }

        // =========================
        // BUTON
        // =========================

        if (buton) {
            if (buton.length > 80) {
                return interaction.reply({
                    content: "❌ Buton yazısı en fazla **80 karakter** olabilir.",
                    ephemeral: true
                });
            }

            settings.buttonLabel = buton;
        }

        data[guildId] = settings;
        saveData(data);

        const embed = new EmbedBuilder()
            .setColor(settings.color || "#FF69B4")
            .setTitle("✅ Ticket Ayarları Güncellendi")
            .setDescription("Yapılan değişiklikler başarıyla kaydedildi.")
            .addFields(
                {
                    name: "📝 Başlık",
                    value: settings.title || "Ticket Destek",
                    inline: false
                },
                {
                    name: "📄 Açıklama",
                    value: settings.description || "Açıklama yok.",
                    inline: false
                },
                {
                    name: "🎨 Renk",
                    value: settings.color || "#FF69B4",
                    inline: true
                },
                {
                    name: "🔘 Buton",
                    value: settings.buttonLabel || "Ticket Aç",
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
