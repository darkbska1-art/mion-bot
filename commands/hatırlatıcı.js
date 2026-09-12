const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "reminders.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

function loadReminders() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
        return [];
    }
}

function saveReminders(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function parseDuration(text) {
    const match = text
        .toLowerCase()
        .trim()
        .match(/^(\d+)\s*(s|sn|sec|m|dk|min|h|sa|d|g)$/);

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    if (!amount || amount < 1) return null;

    const units = {
        s: 1000,
        sn: 1000,
        sec: 1000,

        m: 60 * 1000,
        dk: 60 * 1000,
        min: 60 * 1000,

        h: 60 * 60 * 1000,
        sa: 60 * 60 * 1000,

        d: 24 * 60 * 60 * 1000,
        g: 24 * 60 * 60 * 1000
    };

    return amount * units[unit];
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];

    if (days) parts.push(`${days} gün`);
    if (hours) parts.push(`${hours} saat`);
    if (minutes) parts.push(`${minutes} dakika`);
    if (seconds || parts.length === 0) parts.push(`${seconds} saniye`);

    return parts.join(" ");
}

async function createReminder(client, reminder) {
    const waitTime = reminder.time - Date.now();

    if (waitTime > 0) {
        setTimeout(() => {
            createReminder(client, reminder);
        }, Math.min(waitTime, 2147483647));

        return;
    }

    let user;

    try {
        user = await client.users.fetch(reminder.userId);
    } catch {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("⏰ Hatırlatıcın Var!")
        .setDescription(reminder.message)
        .addFields(
            {
                name: "📅 Oluşturulma",
                value: `<t:${Math.floor(reminder.createdAt / 1000)}:F>`,
                inline: false
            }
        )
        .setFooter({
            text: "Mion • Hatırlatıcı Sistemi"
        })
        .setTimestamp();

    try {
        await user.send({
            embeds: [embed]
        });
    } catch {
        // DM kapalıysa sessizce geç
    }

    const reminders = loadReminders();

    const index = reminders.findIndex(
        r => r.id === reminder.id
    );

    if (index !== -1) {
        reminders.splice(index, 1);
        saveReminders(reminders);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hatırlatıcı")
        .setDescription("Belirlediğin süre sonunda sana hatırlatma gönderir.")
        .addStringOption(option =>
            option
                .setName("süre")
                .setDescription("Örn: 10dk, 2sa, 1g")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("mesaj")
                .setDescription("Hatırlatılmasını istediğin şey")
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction, client) {

        const durationText =
            interaction.options.getString("süre");

        const message =
            interaction.options.getString("mesaj");

        const duration =
            parseDuration(durationText);

        if (!duration) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("❌ Geçersiz Süre")
                        .setDescription(
                            "Geçerli süre örnekleri:\n" +
                            "`10sn` • `10dk` • `2sa` • `1g`"
                        )
                ],
                ephemeral: true
            });
        }

        // 365 günden uzun süreleri engelle
        if (duration > 365 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("❌ Süre Çok Uzun")
                        .setDescription(
                            "En fazla **365 gün** sonrasına hatırlatıcı kurulabilir."
                        )
                ],
                ephemeral: true
            });
        }

        const reminders = loadReminders();

        const reminder = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: interaction.user.id,
            guildId: interaction.guildId,
            message,
            createdAt: Date.now(),
            time: Date.now() + duration
        };

        reminders.push(reminder);
        saveReminders(reminders);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("⏰ Hatırlatıcı Kuruldu")
            .setDescription(
                `**${message}**`
            )
            .addFields(
                {
                    name: "⏳ Süre",
                    value: formatDuration(duration),
                    inline: true
                },
                {
                    name: "📅 Zaman",
                    value: `<t:${Math.floor(reminder.time / 1000)}:R>`,
                    inline: true
                }
            )
            .setFooter({
                text: "Mion • Hatırlatıcı Sistemi"
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

        createReminder(client, reminder);
    }
};

// Bot yeniden başlarsa kayıtlı hatırlatıcıları tekrar başlat
module.exports.loadReminders = function(client) {
    const reminders = loadReminders();

    for (const reminder of reminders) {
        createReminder(client, reminder);
    }
};