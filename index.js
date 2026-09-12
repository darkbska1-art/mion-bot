
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
// 📁 CASE-INSENSITIVE KLASÖR BULUCU
// Render Linux olduğu için Commands/commands farkını çözer
// =====================================================

function findFolder(folderNames) {

    for (const folderName of folderNames) {

        const exactPath =
            path.join(__dirname, folderName);

        if (fs.existsSync(exactPath)) {
            return exactPath;
        }
    }

    // Büyük/küçük harf farkını kontrol et
    const rootItems = fs.readdirSync(__dirname);

    const found = rootItems.find(item => {

        const fullPath =
            path.join(__dirname, item);

        return (
            fs.statSync(fullPath).isDirectory() &&
            folderNames.some(
                name =>
                    item.toLowerCase() ===
                    name.toLowerCase()
            )
        );
    });

    if (found) {
        return path.join(__dirname, found);
    }

    return null;
}


// =====================================================
// 🤖 CLIENT
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
// 📦 KOMUT SİSTEMİ
// =====================================================

client.commands = new Collection();

const commands = [];


// Commands / commands
let commandsPath =
    findFolder([
        "Commands",
        "commands"
    ]);


// Klasör yoksa oluştur
if (!commandsPath) {

    commandsPath =
        path.join(__dirname, "Commands");

    fs.mkdirSync(
        commandsPath,
        {
            recursive: true
        }
    );

    console.log(
        "⚠️ Commands klasörü bulunamadı, oluşturuldu."
    );
}


console.log(
    `📂 Komut klasörü: ${commandsPath}`
);


const commandFiles =
    fs.readdirSync(commandsPath)
        .filter(
            file =>
                file.toLowerCase().endsWith(".js")
        );


console.log(
    `📦 ${commandFiles.length} adet komut dosyası bulundu.`
);


// =====================================================
// 🔄 KOMUTLARI YÜKLE
// =====================================================

for (const file of commandFiles) {

    const filePath =
        path.join(
            commandsPath,
            file
        );

    try {

        // Cache temizle
        delete require.cache[
            require.resolve(filePath)
        ];

        const command =
            require(filePath);


        if (
            command &&
            command.data &&
            typeof command.execute === "function"
        ) {

            const commandName =
                command.data.name;


            client.commands.set(
                commandName,
                command
            );


            commands.push(
                command.data.toJSON()
            );


            console.log(
                `✅ Komut yüklendi: /${commandName}`
            );

        } else {

            console.log(
                `⚠️ Hatalı komut dosyası: ${file}`
            );

        }

    } catch (error) {

        console.error(
            `❌ ${file} yüklenemedi:`
        );

        console.error(error);

    }
}


// =====================================================
// 🎯 EVENT SİSTEMİ
// =====================================================

let eventsPath =
    findFolder([
        "Events",
        "events"
    ]);


if (!eventsPath) {

    eventsPath =
        path.join(
            __dirname,
            "Events"
        );

    fs.mkdirSync(
        eventsPath,
        {
            recursive: true
        }
    );

    console.log(
        "⚠️ Events klasörü bulunamadı, oluşturuldu."
    );

}


console.log(
    `📂 Event klasörü: ${eventsPath}`
);


const eventFiles =
    fs.readdirSync(eventsPath)
        .filter(
            file =>
                file.toLowerCase().endsWith(".js")
        );


console.log(
    `🎯 ${eventFiles.length} adet event dosyası bulundu.`
);


// =====================================================
// 🔄 EVENTLERİ YÜKLE
// =====================================================

for (const file of eventFiles) {

    const filePath =
        path.join(
            eventsPath,
            file
        );

    try {

        delete require.cache[
            require.resolve(filePath)
        ];

        const event =
            require(filePath);


        if (
            event &&
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
            `❌ ${file} event'i yüklenemedi:`
        );

        console.error(error);

    }
}


// =====================================================
// 🌐 GLOBAL AFK DOSYASI
// =====================================================

const dataDir =
    path.join(
        __dirname,
        "data"
    );


if (!fs.existsSync(dataDir)) {

    fs.mkdirSync(
        dataDir,
        {
            recursive: true
        }
    );

}


const afkFile =
    path.join(
        dataDir,
        "afk.json"
    );


if (!fs.existsSync(afkFile)) {

    fs.writeFileSync(
        afkFile,
        "{}",
        "utf8"
    );

}


// =====================================================
// 📖 AFK OKU
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
// 💾 AFK KAYDET
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
// ⏱️ AFK SÜRESİ
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
// 💤 AFK COOLDOWN
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
            // 👋 KENDİ AFK'SINI KAPAT
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
                                name: "⏱️ AFK Süresi",
                                value: duration,
                                inline: true
                            },
                            {
                                name: "🌐 Durum",
                                value: "Global AFK kapatıldı",
                                inline: true
                            }
                        )
                        .setTimestamp();


                await message.reply({
                    embeds: [embed]
                }).catch(() => {});


                return;
            }


            // =============================================
            // ETİKET YOK
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
                embeds: [embed]
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
// 🎮 TEK INTERACTION SİSTEMİ
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        try {

            // =================================================
            // 🔘 BUTTON / MODAL / SELECT
            // =================================================

            if (
                interaction.isButton() ||
                interaction.isModalSubmit() ||
                interaction.isStringSelectMenu()
            ) {

                // =============================================
                // YETKİLİ BAŞVURU
                // =============================================

                const customId =
                    interaction.customId || "";


                const isYetkiliInteraction =
                    customId === "yetkili_basvuru_ac" ||
                    customId === "yetkili_basvuru_modal" ||
                    customId.startsWith("yetkili_kabul_") ||
                    customId.startsWith("yetkili_red_");


                if (isYetkiliInteraction) {

                    const yetkiliCommand =
                        client.commands.get(
                            "yetkilibasvuru"
                        );


                    if (
                        yetkiliCommand &&
                        typeof yetkiliCommand.handleInteraction ===
                        "function"
                    ) {

                        await yetkiliCommand.handleInteraction(
                            interaction
                        );

                    }

                    return;
                }


                // =============================================
                // DİĞER KOMUTLARIN BUTTON / SELECT / MODAL
                // =============================================

                for (
                    const command
                    of client.commands.values()
                ) {

                    if (
                        typeof command.handleInteraction !==
                        "function"
                    ) {

                        continue;

                    }


                    const handled =
                        await command.handleInteraction(
                            interaction
                        );


                    if (handled) {
                        return;
                    }

                }


                return;
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

                console.log(
                    `❌ Komut bulunamadı: /${interaction.commandName}`
                );


                if (!interaction.replied) {

                    await interaction.reply({
                        content:
                            "❌ Bu komut bot tarafından yüklenmemiş.",
                        ephemeral: true
                    }).catch(() => {});

                }

                return;
            }


            console.log(
                `▶️ Komut çalıştırılıyor: /${interaction.commandName}`
            );


            await command.execute(
                interaction,
                client
            );


        } catch (error) {

            console.error(
                "❌ Interaction hatası:",
                error
            );


            try {

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

            } catch {}

        }

    }
);


// =====================================================
// 🚀 READY
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


        // =================================================
        // SLASH KOMUTLARINI DISCORD'A YÜKLE
        // =================================================

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


            // =================================================
            // SUNUCU ID VARSA → SUNUCUYA ÖZEL KAYIT
            // YOKSA → GLOBAL KAYIT
            // =================================================

            const guildId =
                process.env.GUILD_ID ||
                config.guildId;


            let route;


            if (guildId) {

                route =
                    Routes.applicationGuildCommands(
                        client.user.id,
                        guildId
                    );


                console.log(
                    `🎯 Sunucuya özel komut kaydı: ${guildId}`
                );

            } else {

                route =
                    Routes.applicationCommands(
                        client.user.id
                    );


                console.log(
                    "🌐 Global komut kaydı kullanılıyor."
                );

            }


            await rest.put(
                route,
                {
                    body: commands
                }
            );


            console.log(
                `✅ ${commands.length} slash komutu Discord'a yüklendi!`
            );


            console.log(
                "📋 Yüklenen komutlar:"
            );


            for (
                const command
                of commands
            ) {

                console.log(
                    `   /${command.name}`
                );

            }


        } catch (error) {

            console.error(
                "❌ Slash komut yükleme hatası:"
            );

            console.error(error);

        }

    }
);


// =====================================================
// ❌ DISCORD HATALARI
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


// =====================================================
// ⚠️ UNHANDLED REJECTION
// =====================================================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ İşlenmeyen Promise hatası:",
            error
        );

    }
);


// =====================================================
// 💥 UNCAUGHT EXCEPTION
// =====================================================

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
// 🔑 TOKEN KONTROL
// =====================================================

if (!config.token) {

    console.error(
        "❌ config.js üzerinden token bulunamadı!"
    );

    console.error(
        "❌ Render Environment Variables kısmından DISCORD_TOKEN ekle."
    );

    process.exit(1);

}


// =====================================================
// 🔐 LOGIN
// =====================================================

client.login(
    config.token
);

