const fs = require("fs");
const path = require("path");
const {
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "levels.json");

const cooldowns = new Map();

function ensureData() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(
            dataFile,
            "{}",
            "utf8"
        );
    }
}

function loadData() {
    ensureData();

    try {
        return JSON.parse(
            fs.readFileSync(
                dataFile,
                "utf8"
            )
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    ensureData();

    fs.writeFileSync(
        dataFile,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}

function requiredXP(level) {
    return 100 + (level * 75);
}

function register(client) {

    client.on("messageCreate", async message => {

        try {

            // DM kontrolü
            if (!message.guild) return;

            // Botları sayma
            if (message.author.bot) return;

            const data = loadData();

            const guildId = message.guild.id;
            const userId = message.author.id;

            // Sunucu verisi yoksa oluştur
            if (!data[guildId]) {

                data[guildId] = {
                    enabled: false,
                    levelChannel: null,
                    announce: true,
                    users: {}
                };

                saveData(data);
            }

            const guildData = data[guildId];

            // Sistem kapalıysa XP verme
            if (guildData.enabled !== true) {
                return;
            }

            if (!guildData.users) {
                guildData.users = {};
            }

            // Kullanıcı verisi
            if (!guildData.users[userId]) {

                guildData.users[userId] = {
                    xp: 0,
                    level: 0,
                    totalXp: 0
                };
            }

            const userData = guildData.users[userId];

            // XP cooldown
            const cooldownKey =
                `${guildId}:${userId}`;

            const now = Date.now();

            const lastXP =
                cooldowns.get(cooldownKey) || 0;

            if (now - lastXP < 8000) {
                return;
            }

            cooldowns.set(
                cooldownKey,
                now
            );

            // 15-25 XP
            const xpGain =
                Math.floor(
                    Math.random() * 11
                ) + 15;

            userData.xp += xpGain;
            userData.totalXp += xpGain;

            let leveledUp = false;

            // Seviye kontrolü
            while (
                userData.xp >=
                requiredXP(userData.level)
            ) {

                userData.xp -=
                    requiredXP(userData.level);

                userData.level++;

                leveledUp = true;
            }

            saveData(data);

            // Seviye atlamadıysa mesaj gönderme
            if (!leveledUp) {
                return;
            }

            // Duyuru kapalıysa mesaj gönderme
            if (guildData.announce !== true) {
                return;
            }

            // ==========================================
            // EMBED
            // ==========================================

            const embed =
                new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle("🎉 Seviye Atladın!")
                    .setDescription(
                        `Tebrikler **${message.author.username}**!`
                    )
                    .addFields(
                        {
                            name: "⭐ Yeni Seviye",
                            value:
                                `**${userData.level}**`,
                            inline: true
                        },
                        {
                            name: "✨ Kazanılan XP",
                            value:
                                `+${xpGain} XP`,
                            inline: true
                        },
                        {
                            name: "📊 Toplam XP",
                            value:
                                `**${userData.totalXp} XP**`,
                            inline: true
                        }
                    )
                    .setThumbnail(
                        message.author.displayAvatarURL({
                            dynamic: true,
                            size: 256
                        })
                    )
                    .setFooter({
                        text: "Mion • Seviye Sistemi"
                    })
                    .setTimestamp();

            // ==========================================
            // KANAL BUL
            // ==========================================

            let channel = null;

            // Ayarlanmış level kanalı varsa
            if (guildData.levelChannel) {

                channel =
                    message.guild.channels.cache.get(
                        guildData.levelChannel
                    );

                if (!channel) {

                    console.log(
                        `⚠️ Level kanalı bulunamadı: ${guildData.levelChannel}`
                    );

                }
            }

            // Ayarlı kanal yoksa mesajın geldiği kanalı kullan
            if (!channel) {
                channel = message.channel;
            }

            // ==========================================
            // KANAL KONTROLÜ
            // ==========================================

            if (!channel) {

                console.log(
                    "❌ Level mesajı gönderilecek kanal bulunamadı."
                );

                return;
            }

            if (!channel.isTextBased()) {

                console.log(
                    `❌ Level kanalı yazı kanalı değil: ${channel.name || channel.id}`
                );

                return;
            }

            // ==========================================
            // BOT YETKİ KONTROLÜ
            // ==========================================

            const botMember =
                message.guild.members.me;

            if (!botMember) {

                console.log(
                    "❌ Bot sunucu üyesi bulunamadı."
                );

                return;
            }

            const permissions =
                channel.permissionsFor(botMember);

            if (
                !permissions ||
                !permissions.has(
                    PermissionsBitField.Flags.SendMessages
                )
            ) {

                console.log(
                    `❌ ${message.guild.name} → #${channel.name} kanalına mesaj gönderme yetkim yok.`
                );

                return;
            }

            // ==========================================
            // MESAJI GÖNDER
            // ==========================================

            await channel.send({
                content: `${message.author}`,
                embeds: [embed]
            });

            console.log(
                `🎉 Level mesajı gönderildi: ${message.author.tag} → #${channel.name}`
            );

        } catch (error) {

            console.error(
                "❌ Level sistemi event hatası:",
                error
            );

        }

    });

}

module.exports = {
    register
};