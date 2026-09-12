const {
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const filePath = path.join(
    __dirname,
    "..",
    "data",
    "counter.json"
);

function getData() {
    try {
        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 4)
    );
}

async function updateCounter(guild, announce = false) {
    const db = getData();
    const ayar = db[guild.id];

    if (!ayar) return;
    if (!ayar.enabled) return;
    if (!ayar.channelId) return;

    const channel =
        guild.channels.cache.get(ayar.channelId);

    if (!channel) return;

    const current = guild.memberCount;

    let channelName =
        `👥 Üye Sayısı: ${current.toLocaleString("tr-TR")}`;

    if (ayar.target) {
        channelName +=
            ` / ${ayar.target.toLocaleString("tr-TR")}`;
    }

    try {
        if (channel.manageable) {
            await channel.setName(channelName);
        } else {
            console.error(
                `[Sayaç] ${guild.name} için kanal yönetilemiyor.`
            );
        }
    } catch (error) {
        console.error(
            `[Sayaç] Kanal güncellenemedi: ${error.message}`
        );
    }

    // =====================================================
    // HEDEF KONTROLÜ
    // =====================================================

    if (!ayar.target) return;

    if (current >= ayar.target && !ayar.reached) {
        ayar.reached = true;
        saveData(db);

        if (!announce) return;

        try {
            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setAuthor({
                    name: `${guild.name} • Sayaç`
                })
                .setTitle("🎉 Sayaç Hedefine Ulaşıldı!")
                .setDescription(
                    `Tebrikler!\n\n` +
                    `Sunucumuz **${ayar.target.toLocaleString("tr-TR")} üye** hedefine ulaştı! 🎊\n\n` +
                    `**Mevcut Üye:** ${current.toLocaleString("tr-TR")}`
                )
                .setFooter({
                    text: "Mion • Sayaç Sistemi"
                })
                .setTimestamp();

            await channel.send({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                `[Sayaç] Hedef mesajı gönderilemedi: ${error.message}`
            );
        }
    }

    // Hedefin altına düşülürse tekrar hedef kontrolü aktif olur.
    if (current < ayar.target && ayar.reached) {
        ayar.reached = false;
        saveData(db);
    }
}

module.exports = {
    register(client) {

        client.on("guildMemberAdd", async member => {
            await updateCounter(
                member.guild,
                true
            );
        });

        client.on("guildMemberRemove", async member => {
            await updateCounter(
                member.guild,
                true
            );
        });

        console.log(
            "✓ Gelişmiş sayaç sistemi yüklendi."
        );
    }
};
