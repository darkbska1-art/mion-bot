const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Discord bot is running!");
}).listen(PORT, () => {
    console.log(`🌐 Web server ${PORT} portunda çalışıyor.`);
});


const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Collection,
    REST,
    Routes,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const config = require("./config.js");


// =====================================================
// CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});


// =====================================================
// KOMUTLAR
// =====================================================

client.commands = new Collection();

const commands = [];

const commandsPath =
    path.join(__dirname, "Commands");

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, {
        recursive: true
    });
}

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {

    const filePath =
        path.join(commandsPath, file);

    try {

        const command =
            require(filePath);

        if (
            command.data &&
            command.execute
        ) {

            client.commands.set(
                command.data.name,
                command
            );

            commands.push(
                command.data.toJSON()
            );

            console.log(
                `✅ Komut yüklendi: /${command.data.name}`
            );

        } else {

            console.log(
                `⚠️ Hatalı komut dosyası: ${file}`
            );
        }

    } catch (error) {

        console.error(
            `❌ ${file} yüklenemedi:`,
            error
        );
    }
}


// =====================================================
// 🎯 EVENT SİSTEMİ
// =====================================================

const eventsPath =
    path.join(__dirname, "Events");

if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, {
        recursive: true
    });
}

const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith(".js"));

for (const file of eventFiles) {

    const filePath =
        path.join(eventsPath, file);

    try {

        const event =
            require(filePath);

        if (
            typeof event.register === "function"
        ) {

            event.register(client);

            console.log(
                `✅ Event yüklendi: ${file}`
            );

        } else {

            console.log(
                `⚠️ Event formatı hatalı: ${file}`
            );
        }

    } catch (error) {

        console.error(
            `❌ ${file} event'i yüklenemedi:`,
            error
        );
    }
}


// =====================================================
// 🌐 GLOBAL AFK DOSYASI
// =====================================================

const dataDir =
    path.join(__dirname, "data");

const afkFile =
    path.join(
        dataDir,
        "afk.json"
    );

if (!fs.existsSync(dataDir)) {

    fs.mkdirSync(
        dataDir,
        {
            recursive: true
        }
    );
}

if (!fs.existsSync(afkFile)) {

    fs.writeFileSync(
        afkFile,
        "{}",
        "utf8"
    );
}


// =====================================================
// AFK VERİLERİNİ OKU
// =====================================================

function loadAfkData() {

    try {

        const data =
            fs.readFileSync(
                afkFile,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "❌ AFK verisi okunamadı:",
            error
        );

        return {};
    }
}


// =====================================================
// AFK VERİLERİNİ KAYDET
// =====================================================

function saveAfkData(data) {

    try {

        fs.writeFileSync(
            afkFile,
            JSON.stringify(
                data,
                null,
                4
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "❌ AFK verisi kaydedilemedi:",
            error
        );
    }
}


// =====================================================
// AFK SÜRESİ
// =====================================================

function formatAfkDuration(ms) {

    let seconds =
        Math.floor(
            ms / 1000
        );

    if (seconds < 60) {

        return `${seconds} saniye`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {

        return `${minutes} dakika`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {

        const remainingMinutes =
            minutes % 60;

        if (remainingMinutes > 0) {

            return (
                `${hours} saat ` +
                `${remainingMinutes} dakika`
            );
        }

        return `${hours} saat`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    const remainingHours =
        hours % 24;

    if (remainingHours > 0) {

        return (
            `${days} gün ` +
            `${remainingHours} saat`
        );
    }

    return `${days} gün`;
}


// =====================================================
// AFK BİLDİRİM COOLDOWN
// =====================================================

const afkCooldown =
    new Map();

const AFK_COOLDOWN =
    5000;


// =====================================================
// 🌐 GLOBAL AFK MESSAGE SYSTEM
// =====================================================

client.on(
    "messageCreate",
    async message => {

        try {

            if (message.author.bot) {
                return;
            }

            if (!message.guild) {
                return;
            }

            const afkData =
                loadAfkData();

            const authorId =
                message.author.id;


            // =============================================
            // 👋 KİŞİ AFK İKEN MESAJ ATTI
            // =============================================

            if (afkData[authorId]) {

                const afkInfo =
                    afkData[authorId];

                delete afkData[authorId];

                saveAfkData(
                    afkData
                );

                const duration =
                    formatAfkDuration(
                        Date.now() -
                        afkInfo.timestamp
                    );

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            "👋 AFK Kapatıldı"
                        )
                        .setDescription(
                            `${message.author}, tekrar hoş geldin!`
                        )
                        .addFields(
                            {
                                name:
                                    "⏱️ AFK Süresi",
                                value:
                                    duration,
                                inline: true
                            },
                            {
                                name:
                                    "🌐 Durum",
                                value:
                                    "Global AFK kapatıldı",
                                inline: true
                            }
                        )
                        .setTimestamp();

                await message.reply({
                    embeds: [
                        embed
                    ]
                }).catch(() => {});

                return;
            }


            // =============================================
            // ETİKET YOKSA
            // =============================================

            if (
                message.mentions.users.size === 0
            ) {
                return;
            }


            // =============================================
            // ETİKETLENEN AFK KİŞİLER
            // =============================================

            const mentionedAfk = [];

            for (
                const user
                of message.mentions.users.values()
            ) {

                const afkInfo =
                    afkData[user.id];

                if (!afkInfo) {
                    continue;
                }

                mentionedAfk.push({
                    user,
                    info: afkInfo
                });
            }


            if (
                mentionedAfk.length === 0
            ) {
                return;
            }


            // =============================================
            // COOLDOWN
            // =============================================

            const cooldownKey =
                `${message.guild.id}:${authorId}`;

            const lastMessage =
                afkCooldown.get(
                    cooldownKey
                );

            if (
                lastMessage &&
                Date.now() -
                lastMessage <
                AFK_COOLDOWN
            ) {

                return;
            }

            afkCooldown.set(
                cooldownKey,
                Date.now()
            );

            setTimeout(
                () => {
                    afkCooldown.delete(
                        cooldownKey
                    );
                },
                AFK_COOLDOWN
            );


            // =============================================
            // AFK EMBED
            // =============================================

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        "💤 AFK Bildirimi"
                    )
                    .setDescription(
                        mentionedAfk
                            .map(item => {

                                const duration =
                                    formatAfkDuration(
                                        Date.now() -
                                        item.info.timestamp
                                    );

                                const startTime =
                                    Math.floor(
                                        item.info.timestamp /
                                        1000
                                    );

                                return (
                                    `${item.user} şu anda **AFK**.\n` +
                                    `> 📝 **Mesaj:** ${item.info.message}\n` +
                                    `> ⏱️ **Süre:** ${duration}\n` +
                                    `> 🕐 **Başlangıç:** <t:${startTime}:R>`
                                );

                            })
                            .join("\n\n")
                    )
                    .setFooter({
                        text:
                            "🌐 Global AFK Sistemi"
                    })
                    .setTimestamp();

            await message.reply({
                embeds: [
                    embed
                ]
            }).catch(() => {});

        } catch (error) {

            console.error(
                "❌ AFK sistemi hatası:",
                error
            );
        }
    }
);

// =====================================================
// INTERACTION HANDLER
// =====================================================

client.on("interactionCreate", async (interaction) => {

    try {

        // =============================================
        // SLASH COMMAND
        // =============================================

        if (interaction.isChatInputCommand()) {

            const command =
                client.commands.get(interaction.commandName);

            if (!command) {
                console.log(
                    `❌ Komut bulunamadı: ${interaction.commandName}`
                );
                return;
            }

            await command.execute(interaction);

            return;
        }

        // =============================================
        // BUTTON / SELECT MENU
        // =============================================

        if (
            interaction.isButton() ||
            interaction.isStringSelectMenu()
        ) {

            for (const command of client.commands.values()) {

                if (
                    typeof command.handleInteraction !== "function"
                ) {
                    continue;
                }

                const handled =
                    await command.handleInteraction(interaction);

                if (handled) {
                    return;
                }
            }

        }

    } catch (error) {

        console.error(
            "❌ Interaction hatası:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            await interaction.followUp({
                content:
                    "❌ İşlem sırasında bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});

        } else {

            await interaction.reply({
                content:
                    "❌ İşlem sırasında bir hata oluştu.",
                ephemeral: true
            }).catch(() => {});

        }

    }

});
// =====================================================
// READY
// =====================================================

client.once(
    "ready",
    async () => {

        console.log(
            "================================="
        );

        console.log(
            `✅ Bot aktif: ${client.user.tag}`
        );

        console.log(
            `🏠 Sunucu sayısı: ${client.guilds.cache.size}`
        );

        console.log(
            `💤 Global AFK sistemi aktif`
        );

        console.log(
            `📦 Toplam komut: ${commands.length}`
        );

        console.log(
            "================================="
        );


        client.user.setPresence({
            activities: [
                {
                    name:
                        "Dünyanın en tatlı botu 🌸",
                    type:
                        ActivityType.Watching
                }
            ],
            status:
                "online"
        });


        // =============================================
        // SLASH KOMUTLARI
        // =============================================

        try {

            const rest =
                new REST({
                    version: "10"
                }).setToken(
                    config.token
                );

            console.log(
                "🔄 Slash komutları yükleniyor..."
            );

            await rest.put(
                Routes.applicationCommands(
                    client.user.id
                ),
                {
                    body:
                        commands
                }
            );

            console.log(
                `✅ ${commands.length} slash komutu Discord'a yüklendi!`
            );

        } catch (error) {

            console.error(
                "❌ Slash komut yükleme hatası:",
                error
            );
        }
    }
);


// =====================================================
// 🔥 TÜM INTERACTIONLAR
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        try {

           if (interaction.isButton() || interaction.isModalSubmit()) {

    const isYetkiliInteraction =
        interaction.customId === "yetkili_basvuru_ac" ||
        interaction.customId === "yetkili_basvuru_modal" ||
        interaction.customId.startsWith("yetkili_kabul_") ||
        interaction.customId.startsWith("yetkili_red_");

    if (isYetkiliInteraction) {

        const yetkiliCommand =
            client.commands.get("yetkilibasvuru");

        if (
            yetkiliCommand &&
            typeof yetkiliCommand.handleInteraction === "function"
        ) {
            await yetkiliCommand.handleInteraction(interaction);
        }

        return;
    }
}


            // =================================================
            // SLASH COMMAND
            // =================================================

            if (
                !interaction.isChatInputCommand()
            ) {
                return;
            }


            const command =
                client.commands.get(
                    interaction.commandName
                );


            if (!command) {

                return interaction.reply({
                    content:
                        "❌ Bu komut bulunamadı.",
                    ephemeral: true
                });
            }


            try {

                await command.execute(
                    interaction,
                    client
                );

            } catch (error) {

                console.error(
                    `❌ /${interaction.commandName} hatası:`,
                    error
                );

                try {

                    if (
                        interaction.replied ||
                        interaction.deferred
                    ) {

                        await interaction.followUp({
                            content:
                                "❌ Komutu çalıştırırken bir hata oluştu.",
                            ephemeral: true
                        });

                    } else {

                        await interaction.reply({
                            content:
                                "❌ Komutu çalıştırırken bir hata oluştu.",
                            ephemeral: true
                        });
                    }

                } catch {}
            }

        } catch (error) {

            console.error(
                "❌ Interaction sistemi hatası:",
                error
            );
        }
    }
);


// =====================================================
// HATALAR
// =====================================================

client.on(
    "error",
    error => {

        console.error(
            "❌ Discord hatası:",
            error
        );
    }
);


process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ İşlenmeyen Promise hatası:",
            error
        );
    }
);


process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Kritik hata:",
            error
        );
    }
);


// =====================================================
// TOKEN
// =====================================================

if (!config.token) {

    console.error(
        "❌ config.js üzerinden token bulunamadı!"
    );

    process.exit(1);
}


// =====================================================
// LOGIN
// =====================================================

client.login(
    config.token
);