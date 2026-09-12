const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYA
// =====================================================

const dataKlasoru = path.join(__dirname, "..", "data");
const dataDosyasi = path.join(dataKlasoru, "economy.json");

if (!fs.existsSync(dataKlasoru)) {
    fs.mkdirSync(dataKlasoru, { recursive: true });
}

if (!fs.existsSync(dataDosyasi)) {
    fs.writeFileSync(dataDosyasi, "{}", "utf8");
}

// =====================================================
// VERİ FONKSİYONLARI
// =====================================================

function verileriOku() {
    try {
        const veri = fs.readFileSync(dataDosyasi, "utf8");

        if (!veri.trim()) {
            return {};
        }

        const parsed = JSON.parse(veri);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }

        return parsed;
    } catch (error) {
        console.error("Ekonomi JSON okuma hatası:", error);
        return {};
    }
}

function verileriKaydet(data) {
    try {
        fs.writeFileSync(
            dataDosyasi,
            JSON.stringify(data, null, 4),
            "utf8"
        );
    } catch (error) {
        console.error("Ekonomi JSON kaydetme hatası:", error);
    }
}

// =====================================================
// TARİH
// =====================================================

function bugun() {
    const tarih = new Date();

    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, "0");
    const gun = String(tarih.getDate()).padStart(2, "0");

    return `${yil}-${ay}-${gun}`;
}

// =====================================================
// FORMAT
// =====================================================

function paraFormatla(sayi) {
    return Number(sayi || 0).toLocaleString("tr-TR");
}

function embedBaslik(baslik, aciklama) {
    return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(baslik)
        .setDescription(aciklama)
        .setTimestamp();
}

// =====================================================
// HESAP OLUŞTUR
// =====================================================

function hesapOlustur(data, guildId, userId) {
    if (!data[guildId] || typeof data[guildId] !== "object") {
        data[guildId] = {};
    }

    if (!data[guildId][userId] || typeof data[guildId][userId] !== "object") {
        data[guildId][userId] = {};
    }

    const hesap = data[guildId][userId];

    // Temel değerler
    if (typeof hesap.para !== "number") hesap.para = 0;
    if (typeof hesap.banka !== "number") hesap.banka = 0;

    if (typeof hesap.toplamKazanilan !== "number") {
        hesap.toplamKazanilan = 0;
    }

    if (typeof hesap.toplamHarcanan !== "number") {
        hesap.toplamHarcanan = 0;
    }

    // Cooldownlar
    if (typeof hesap.sonGunluk !== "number") hesap.sonGunluk = 0;
    if (typeof hesap.sonCalisma !== "number") hesap.sonCalisma = 0;
    if (typeof hesap.sonFaiz !== "number") hesap.sonFaiz = 0;
    if (typeof hesap.sonSoygun !== "number") hesap.sonSoygun = 0;
    if (typeof hesap.sonKasa !== "number") hesap.sonKasa = 0;

    // Meslek
    if (typeof hesap.meslek !== "string") {
        hesap.meslek = "İşsiz";
    }

    // Kasa
    if (typeof hesap.kasa !== "number") {
        hesap.kasa = 0;
    }

    // Envanter
    if (!hesap.envanter || typeof hesap.envanter !== "object") {
        hesap.envanter = {};
    }

    // Görevler
    if (typeof hesap.gorevTarih !== "string") {
        hesap.gorevTarih = bugun();
    }

    if (!hesap.gorevler || typeof hesap.gorevler !== "object") {
        hesap.gorevler = {};
    }

    if (typeof hesap.gorevler.calisma !== "number") {
        hesap.gorevler.calisma = 0;
    }

    if (typeof hesap.gorevler.transfer !== "number") {
        hesap.gorevler.transfer = 0;
    }

    if (typeof hesap.gorevler.market !== "number") {
        hesap.gorevler.market = 0;
    }

    if (!hesap.gorevOdulleri || typeof hesap.gorevOdulleri !== "object") {
        hesap.gorevOdulleri = {};
    }

    if (typeof hesap.gorevOdulleri.calisma !== "boolean") {
        hesap.gorevOdulleri.calisma = false;
    }

    if (typeof hesap.gorevOdulleri.transfer !== "boolean") {
        hesap.gorevOdulleri.transfer = false;
    }

    if (typeof hesap.gorevOdulleri.market !== "boolean") {
        hesap.gorevOdulleri.market = false;
    }

    gorevleriKontrolEt(hesap);

    return hesap;
}

// =====================================================
// GÜNLÜK GÖREV KONTROL
// =====================================================

function gorevleriKontrolEt(hesap) {
    const tarih = bugun();

    if (hesap.gorevTarih !== tarih) {
        hesap.gorevTarih = tarih;

        hesap.gorevler = {
            calisma: 0,
            transfer: 0,
            market: 0
        };

        hesap.gorevOdulleri = {
            calisma: false,
            transfer: false,
            market: false
        };
    }
}

// =====================================================
// MESLEKLER
// =====================================================

const meslekler = {
    madenci: {
        isim: "Madenci",
        min: 100,
        max: 300
    },

    yazilimci: {
        isim: "Yazılımcı",
        min: 200,
        max: 500
    },

    doktor: {
        isim: "Doktor",
        min: 300,
        max: 700
    },

    muhendis: {
        isim: "Mühendis",
        min: 250,
        max: 600
    },

    tasarimci: {
        isim: "Tasarımcı",
        min: 150,
        max: 400
    }
};

// =====================================================
// MARKET
// =====================================================

const market = {
    elma: {
        isim: "Elma",
        fiyat: 100
    },

    kahve: {
        isim: "Kahve",
        fiyat: 250
    },

    pizza: {
        isim: "Pizza",
        fiyat: 500
    },

    laptop: {
        isim: "Laptop",
        fiyat: 5000
    },

    araba: {
        isim: "Araba",
        fiyat: 25000
    }
};

// =====================================================
// KOMUT
// =====================================================

const data = new SlashCommandBuilder()
    .setName("ekonomi")
    .setDescription("Ekonomi sistemini kullan.")

// -----------------------------------------------------
// BAKİYE
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("bakiye")
            .setDescription("Bakiye bilgini gösterir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Bakiyesini görmek istediğin üye.")
                    .setRequired(false)
            )
    )

// -----------------------------------------------------
// GÜNLÜK
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("gunluk")
            .setDescription("Günlük para ödülünü al.")
    )

// -----------------------------------------------------
// ÇALIŞ
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("calis")
            .setDescription("Çalışarak para kazan.")
    )

// -----------------------------------------------------
// MESLEK
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("meslek")
            .setDescription("Mesleğini seç veya değiştir.")
            .addStringOption(option =>
                option
                    .setName("sec")
                    .setDescription("Seçilecek meslek.")
                    .setRequired(true)
                    .addChoices(
                        { name: "İşsiz", value: "issiz" },
                        { name: "Madenci", value: "madenci" },
                        { name: "Yazılımcı", value: "yazilimci" },
                        { name: "Doktor", value: "doktor" },
                        { name: "Mühendis", value: "muhendis" },
                        { name: "Tasarımcı", value: "tasarimci" }
                    )
            )
    )

// -----------------------------------------------------
// TRANSFER
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("transfer")
            .setDescription("Başka bir kullanıcıya para gönder.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Para gönderilecek kullanıcı.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Gönderilecek miktar.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// ZENGİNLER
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("zenginler")
            .setDescription("Sunucunun en zengin kullanıcılarını gösterir.")
    )

// -----------------------------------------------------
// ENVANTER
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("envanter")
            .setDescription("Envanterini gösterir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Envanterine bakılacak kullanıcı.")
                    .setRequired(false)
            )
    )

// -----------------------------------------------------
// MARKET
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("market")
            .setDescription("Ekonomi marketini gösterir.")
    )

// -----------------------------------------------------
// SATIN AL
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("satinal")
            .setDescription("Marketten eşya satın al.")
            .addStringOption(option =>
                option
                    .setName("esya")
                    .setDescription("Satın alınacak eşya.")
                    .setRequired(true)
                    .addChoices(
                        { name: "Elma - 100", value: "elma" },
                        { name: "Kahve - 250", value: "kahve" },
                        { name: "Pizza - 500", value: "pizza" },
                        { name: "Laptop - 5.000", value: "laptop" },
                        { name: "Araba - 25.000", value: "araba" }
                    )
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Kaç adet alınacak?")
                    .setMinValue(1)
                    .setMaxValue(100)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// SAT
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("sat")
            .setDescription("Envanterindeki eşyayı sat.")
            .addStringOption(option =>
                option
                    .setName("esya")
                    .setDescription("Satılacak eşya.")
                    .setRequired(true)
                    .addChoices(
                        { name: "Elma", value: "elma" },
                        { name: "Kahve", value: "kahve" },
                        { name: "Pizza", value: "pizza" },
                        { name: "Laptop", value: "laptop" },
                        { name: "Araba", value: "araba" }
                    )
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Kaç adet satılacak?")
                    .setMinValue(1)
                    .setMaxValue(100)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// BANKA
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("banka")
            .setDescription("Banka bakiyeni gösterir.")
    )

// -----------------------------------------------------
// YATIR
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("yatir")
            .setDescription("Bankaya para yatır.")
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Yatırılacak miktar.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// ÇEK
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("cek")
            .setDescription("Bankadan para çek.")
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Çekilecek miktar.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// FAİZ
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("faiz")
            .setDescription("Bankadaki paran için faiz al.")
    )

// -----------------------------------------------------
// KASA
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("kasa")
            .setDescription("Kasa bilgini gösterir.")
    )

// -----------------------------------------------------
// KASA AÇ
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("kasa-ac")
            .setDescription("5.000 para karşılığında kasa aç.")
    )

// -----------------------------------------------------
// SOYGUN
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("soygun")
            .setDescription("Başka bir kullanıcının parasını çalmayı dene.")
            .addUserOption(option =>
                option
                    .setName("hedef")
                    .setDescription("Soyulacak kullanıcı.")
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// GÖREVLER
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("gorevler")
            .setDescription("Günlük görevlerini gösterir.")
    )

// -----------------------------------------------------
// GÖREV ÖDÜLÜ
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("gorev")
            .setDescription("Tamamladığın görevlerin ödülünü al.")
    )

// -----------------------------------------------------
// GÖREV SIFIRLA
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("gorev-sifirla")
            .setDescription("Bir kullanıcının günlük görevlerini sıfırlar.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Görevleri sıfırlanacak kullanıcı.")
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// PARA VER
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("para-ver")
            .setDescription("Bir kullanıcıya para verir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Para verilecek kullanıcı.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Verilecek para miktarı.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

// -----------------------------------------------------
// PARA AL
// -----------------------------------------------------

    .addSubcommand(sub =>
        sub
            .setName("para-al")
            .setDescription("Bir kullanıcıdan para alır.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Para alınacak kullanıcı.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Alınacak para miktarı.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    );

// =====================================================
// EXECUTE
// =====================================================

async function execute(interaction) {

    if (!interaction.guild) {
        return interaction.reply({
            content: "❌ Bu komut sadece sunucularda kullanılabilir.",
            ephemeral: true
        });
    }

    try {

        const data = verileriOku();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const hesap = hesapOlustur(data, guildId, userId);

        // Tarih değiştiyse kaydet
        verileriKaydet(data);

        const komut = interaction.options.getSubcommand();

        // =================================================
        // BAKİYE
        // =================================================

        if (komut === "bakiye") {

            const uye = interaction.options.getUser("uye") || interaction.user;

            const hedefHesap = hesapOlustur(
                data,
                guildId,
                uye.id
            );

            verileriKaydet(data);

            const toplam =
                hedefHesap.para +
                hedefHesap.banka;

            const embed = embedBaslik(
                "💰 Ekonomi • Bakiye",
                `**${uye.username}** adlı kullanıcının ekonomi bilgileri`
            );

            embed.addFields(
                {
                    name: "💵 Cüzdan",
                    value: `${paraFormatla(hedefHesap.para)} para`,
                    inline: true
                },
                {
                    name: "🏦 Banka",
                    value: `${paraFormatla(hedefHesap.banka)} para`,
                    inline: true
                },
                {
                    name: "💎 Toplam",
                    value: `${paraFormatla(toplam)} para`,
                    inline: true
                },
                {
                    name: "💼 Meslek",
                    value: hedefHesap.meslek,
                    inline: true
                },
                {
                    name: "📈 Kazanılan",
                    value: `${paraFormatla(hedefHesap.toplamKazanilan)} para`,
                    inline: true
                },
                {
                    name: "📉 Harcanan",
                    value: `${paraFormatla(hedefHesap.toplamHarcanan)} para`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // GÜNLÜK
        // =================================================

        if (komut === "gunluk") {

            const simdi = Date.now();

            if (
                hesap.sonGunluk &&
                simdi - hesap.sonGunluk < 24 * 60 * 60 * 1000
            ) {
                const kalan =
                    24 * 60 * 60 * 1000 -
                    (simdi - hesap.sonGunluk);

                const saat = Math.floor(kalan / 3600000);
                const dakika = Math.floor(
                    (kalan % 3600000) / 60000
                );

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "⏳ Günlük Ödül",
                            `Günlük ödülünü zaten aldın.\n\nTekrar alabilmek için **${saat} saat ${dakika} dakika** beklemelisin.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const odul =
                Math.floor(Math.random() * 501) + 500;

            hesap.para += odul;
            hesap.toplamKazanilan += odul;
            hesap.sonGunluk = simdi;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🎁 Günlük Ödül",
                        `Bugünkü ödülünü aldın!\n\n💰 Kazandığın: **${paraFormatla(odul)} para**\n💵 Yeni bakiye: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // ÇALIŞ
        // =================================================

        if (komut === "calis") {

            const simdi = Date.now();

            if (
                hesap.sonCalisma &&
                simdi - hesap.sonCalisma < 60 * 1000
            ) {
                const kalan = Math.ceil(
                    (60000 - (simdi - hesap.sonCalisma)) / 1000
                );

                return interaction.reply({
                    content: `⏳ Tekrar çalışmak için **${kalan} saniye** beklemelisin.`,
                    ephemeral: true
                });
            }

            let kazanc;

            if (hesap.meslek === "İşsiz") {

                kazanc =
                    Math.floor(Math.random() * 101) + 50;

            } else {

                const meslek = Object.values(meslekler)
                    .find(x => x.isim === hesap.meslek);

                if (meslek) {
                    kazanc =
                        Math.floor(
                            Math.random() *
                            (meslek.max - meslek.min + 1)
                        ) + meslek.min;
                } else {
                    kazanc =
                        Math.floor(Math.random() * 101) + 50;
                }
            }

            hesap.para += kazanc;
            hesap.toplamKazanilan += kazanc;
            hesap.sonCalisma = simdi;
            hesap.gorevler.calisma++;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💼 Çalıştın!",
                        `Çalışarak **${paraFormatla(kazanc)} para** kazandın.\n\n💵 Cüzdan: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // MESLEK
        // =================================================

        if (komut === "meslek") {

            const sec = interaction.options.getString("sec");

            if (sec === "issiz") {

                hesap.meslek = "İşsiz";

            } else {

                if (!meslekler[sec]) {
                    return interaction.reply({
                        content: "❌ Geçersiz meslek.",
                        ephemeral: true
                    });
                }

                hesap.meslek = meslekler[sec].isim;
            }

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💼 Meslek Değiştirildi",
                        `Yeni mesleğin: **${hesap.meslek}**`
                    )
                ]
            });
        }

        // =================================================
        // TRANSFER
        // =================================================

        if (komut === "transfer") {

            const uye = interaction.options.getUser("uye");
            const miktar = interaction.options.getInteger("miktar");

            if (!uye) {
                return interaction.reply({
                    content: "❌ Kullanıcı bulunamadı.",
                    ephemeral: true
                });
            }

            if (uye.bot) {
                return interaction.reply({
                    content: "❌ Botlara para gönderemezsin.",
                    ephemeral: true
                });
            }

            if (uye.id === userId) {
                return interaction.reply({
                    content: "❌ Kendine para gönderemezsin.",
                    ephemeral: true
                });
            }

            if (hesap.para < miktar) {
                return interaction.reply({
                    content: "❌ Cüzdanında yeterli para yok.",
                    ephemeral: true
                });
            }

            const hedefHesap =
                hesapOlustur(data, guildId, uye.id);

            hesap.para -= miktar;
            hedefHesap.para += miktar;

            hesap.toplamHarcanan += miktar;
            hedefHesap.toplamKazanilan += miktar;

            hesap.gorevler.transfer++;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💸 Para Transferi",
                        `**${uye.username}** kullanıcısına **${paraFormatla(miktar)} para** gönderdin.\n\n💵 Yeni bakiye: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // ZENGİNLER
        // =================================================

        if (komut === "zenginler") {

            const sunucu = data[guildId] || {};

            const liste = Object.entries(sunucu)
                .map(([id, hesap]) => ({
                    id,
                    toplam:
                        Number(hesap.para || 0) +
                        Number(hesap.banka || 0)
                }))
                .sort((a, b) => b.toplam - a.toplam)
                .slice(0, 10);

            if (liste.length === 0) {
                return interaction.reply({
                    content: "❌ Henüz ekonomi verisi bulunmuyor.",
                    ephemeral: true
                });
            }

            let metin = "";

            for (let i = 0; i < liste.length; i++) {

                const uye = await interaction.client.users
                    .fetch(liste[i].id)
                    .catch(() => null);

                const isim = uye
                    ? uye.username
                    : `Bilinmeyen Kullanıcı`;

                metin +=
                    `**${i + 1}.** ${isim} — **${paraFormatla(liste[i].toplam)} para**\n`;
            }

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🏆 En Zenginler",
                        metin
                    )
                ]
            });
        }

        // =================================================
        // ENVANTER
        // =================================================

        if (komut === "envanter") {

            const uye = interaction.options.getUser("uye") || interaction.user;

            const hedef =
                hesapOlustur(data, guildId, uye.id);

            verileriKaydet(data);

            const esyalar =
                Object.entries(hedef.envanter)
                    .filter(([, miktar]) => Number(miktar) > 0);

            if (esyalar.length === 0) {
                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "🎒 Envanter",
                            `**${uye.username}** adlı kullanıcının envanteri boş.`
                        )
                    ]
                });
            }

            let metin = "";

            for (const [anahtar, miktar] of esyalar) {

                const item = market[anahtar];

                if (!item) continue;

                metin +=
                    `**${item.isim}** × ${miktar}\n`;
            }

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        `🎒 ${uye.username} • Envanter`,
                        metin || "Envanter boş."
                    )
                ]
            });
        }

        // =================================================
        // MARKET
        // =================================================

        if (komut === "market") {

            let metin = "";

            for (const item of Object.values(market)) {
                metin +=
                    `**${item.isim}** — ${paraFormatla(item.fiyat)} para\n`;
            }

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🛒 Ekonomi Marketi",
                        metin
                    )
                ]
            });
        }

        // =================================================
        // SATIN AL
        // =================================================

        if (komut === "satinal") {

            const esya = interaction.options.getString("esya");
            const miktar = interaction.options.getInteger("miktar");

            const item = market[esya];

            if (!item) {
                return interaction.reply({
                    content: "❌ Geçersiz eşya.",
                    ephemeral: true
                });
            }

            const toplam = item.fiyat * miktar;

            if (hesap.para < toplam) {
                return interaction.reply({
                    content:
                        `❌ Yeterli paran yok.\n\nGereken: **${paraFormatla(toplam)} para**`,
                    ephemeral: true
                });
            }

            hesap.para -= toplam;
            hesap.toplamHarcanan += toplam;

            hesap.envanter[esya] =
                Number(hesap.envanter[esya] || 0) + miktar;

            hesap.gorevler.market += miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🛒 Satın Alma",
                        `**${miktar}x ${item.isim}** satın aldın.\n\n💸 Harcanan: **${paraFormatla(toplam)} para**\n💵 Kalan: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // SAT
        // =================================================

        if (komut === "sat") {

            const esya = interaction.options.getString("esya");
            const miktar = interaction.options.getInteger("miktar");

            const item = market[esya];

            if (!item) {
                return interaction.reply({
                    content: "❌ Geçersiz eşya.",
                    ephemeral: true
                });
            }

            const sahip =
                Number(hesap.envanter[esya] || 0);

            if (sahip < miktar) {
                return interaction.reply({
                    content:
                        `❌ Envanterinde yeterli **${item.isim}** yok.`,
                    ephemeral: true
                });
            }

            const kazanc =
                Math.floor(item.fiyat * 0.60) * miktar;

            hesap.envanter[esya] -= miktar;
            hesap.para += kazanc;
            hesap.toplamKazanilan += kazanc;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💰 Eşya Satıldı",
                        `**${miktar}x ${item.isim}** sattın.\n\n💵 Kazanç: **${paraFormatla(kazanc)} para**`
                    )
                ]
            });
        }

        // =================================================
        // BANKA
        // =================================================

        if (komut === "banka") {

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🏦 Banka",
                        `💵 Cüzdan: **${paraFormatla(hesap.para)} para**\n🏦 Banka: **${paraFormatla(hesap.banka)} para**\n\n📊 Banka limiti: **1.000.000 para**`
                    )
                ]
            });
        }

        // =================================================
        // YATIR
        // =================================================

        if (komut === "yatir") {

            const miktar =
                interaction.options.getInteger("miktar");

            if (hesap.para < miktar) {
                return interaction.reply({
                    content: "❌ Cüzdanında yeterli para yok.",
                    ephemeral: true
                });
            }

            if (hesap.banka + miktar > 1000000) {
                return interaction.reply({
                    content: "❌ Banka limiti 1.000.000 paradır.",
                    ephemeral: true
                });
            }

            hesap.para -= miktar;
            hesap.banka += miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🏦 Para Yatırıldı",
                        `**${paraFormatla(miktar)} para** bankaya yatırıldı.\n\n🏦 Banka: **${paraFormatla(hesap.banka)} para**`
                    )
                ]
            });
        }

        // =================================================
        // ÇEK
        // =================================================

        if (komut === "cek") {

            const miktar =
                interaction.options.getInteger("miktar");

            if (hesap.banka < miktar) {
                return interaction.reply({
                    content: "❌ Bankanda yeterli para yok.",
                    ephemeral: true
                });
            }

            hesap.banka -= miktar;
            hesap.para += miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🏦 Para Çekildi",
                        `Bankadan **${paraFormatla(miktar)} para** çektin.\n\n💵 Cüzdan: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // FAİZ
        // =================================================

        if (komut === "faiz") {

            const simdi = Date.now();

            if (
                hesap.sonFaiz &&
                simdi - hesap.sonFaiz < 24 * 60 * 60 * 1000
            ) {
                const kalan =
                    24 * 60 * 60 * 1000 -
                    (simdi - hesap.sonFaiz);

                const saat =
                    Math.floor(kalan / 3600000);

                return interaction.reply({
                    content:
                        `⏳ Faizi tekrar almak için yaklaşık **${saat} saat** beklemelisin.`,
                    ephemeral: true
                });
            }

            if (hesap.banka <= 0) {
                return interaction.reply({
                    content: "❌ Bankanda faiz kazanacak para yok.",
                    ephemeral: true
                });
            }

            const faiz =
                Math.floor(hesap.banka * 0.02);

            hesap.banka =
                Math.min(1000000, hesap.banka + faiz);

            hesap.toplamKazanilan += faiz;
            hesap.sonFaiz = simdi;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "📈 Banka Faizi",
                        `Bankandan **%2 faiz** kazandın.\n\n💰 Faiz: **${paraFormatla(faiz)} para**\n🏦 Yeni banka bakiyesi: **${paraFormatla(hesap.banka)} para**`
                    )
                ]
            });
        }

        // =================================================
        // KASA
        // =================================================

        if (komut === "kasa") {

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🎁 Kasa",
                        `Sahip olduğun kasa: **${hesap.kasa}**\n\n📦 Kasa açma ücreti: **5.000 para**\n🎁 Ödül aralığı: **1.000 - 10.000 para**`
                    )
                ]
            });
        }

        // =================================================
        // KASA AÇ
        // =================================================

        if (komut === "kasa-ac") {

            const fiyat = 5000;

            if (hesap.para < fiyat) {
                return interaction.reply({
                    content:
                        `❌ Kasa açmak için **${paraFormatla(fiyat)} para** gerekiyor.`,
                    ephemeral: true
                });
            }

            const odul =
                Math.floor(Math.random() * 9001) + 1000;

            hesap.para -= fiyat;
            hesap.toplamHarcanan += fiyat;

            hesap.para += odul;
            hesap.toplamKazanilan += odul;

            hesap.sonKasa = Date.now();

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🎁 Kasa Açıldı!",
                        `Kasa için **${paraFormatla(fiyat)} para** harcadın.\n\n🎉 Kazandığın ödül: **${paraFormatla(odul)} para**\n\n💵 Yeni bakiye: **${paraFormatla(hesap.para)} para**`
                    )
                ]
            });
        }

        // =================================================
        // SOYGUN
        // =================================================

        if (komut === "soygun") {

            const hedefUser =
                interaction.options.getUser("hedef");

            if (!hedefUser) {
                return interaction.reply({
                    content: "❌ Hedef kullanıcı bulunamadı.",
                    ephemeral: true
                });
            }

            if (hedefUser.id === userId) {
                return interaction.reply({
                    content: "❌ Kendini soyamazsın.",
                    ephemeral: true
                });
            }

            if (hedefUser.bot) {
                return interaction.reply({
                    content: "❌ Botları soyamazsın.",
                    ephemeral: true
                });
            }

            const simdi = Date.now();

            if (
                hesap.sonSoygun &&
                simdi - hesap.sonSoygun < 30 * 60 * 1000
            ) {

                const kalan =
                    30 * 60 * 1000 -
                    (simdi - hesap.sonSoygun);

                const dakika =
                    Math.ceil(kalan / 60000);

                return interaction.reply({
                    content:
                        `⏳ Tekrar soygun yapabilmek için **${dakika} dakika** beklemelisin.`,
                    ephemeral: true
                });
            }

            const hedef =
                hesapOlustur(data, guildId, hedefUser.id);

            hesap.sonSoygun = simdi;

            const basarili =
                Math.random() < 0.40;

            if (!basarili) {

                const ceza =
                    Math.min(
                        hesap.para,
                        Math.floor(Math.random() * 401) + 100
                    );

                hesap.para -= ceza;
                hesap.toplamHarcanan += ceza;

                verileriKaydet(data);

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "🚨 Soygun Başarısız",
                            `Soygun girişimin başarısız oldu.\n\n💸 Kayıp: **${paraFormatla(ceza)} para**`
                        )
                    ]
                });
            }

            if (hedef.para <= 0) {

                verileriKaydet(data);

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "💰 Soygun",
                            `**${hedefUser.username}** kullanıcısının cüzdanında çalınabilecek para yok.`
                        )
                    ]
                });
            }

            const miktar =
                Math.min(
                    hedef.para,
                    Math.floor(Math.random() * 9001) + 1000
                );

            hedef.para -= miktar;
            hesap.para += miktar;

            hesap.toplamKazanilan += miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💰 Soygun Başarılı!",
                        `**${hedefUser.username}** kullanıcısından **${paraFormatla(miktar)} para** kazandın.`
                    )
                ]
            });
        }

        // =================================================
        // GÖREVLER
        // =================================================

        if (komut === "gorevler") {

            const calisma =
                Math.min(hesap.gorevler.calisma, 5);

            const transfer =
                Math.min(hesap.gorevler.transfer, 3);

            const marketSayisi =
                Math.min(hesap.gorevler.market, 5);

            const embed = embedBaslik(
                "📋 Günlük Görevler",
                "Bugünkü görevlerin:"
            );

            embed.addFields(
                {
                    name: "💼 Çalış",
                    value:
                        `${calisma}/5\nÖdül: **2.000 para**`,
                    inline: true
                },
                {
                    name: "💸 Transfer",
                    value:
                        `${transfer}/3\nÖdül: **1.500 para**`,
                    inline: true
                },
                {
                    name: "🛒 Market",
                    value:
                        `${marketSayisi}/5\nÖdül: **1.000 para**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // GÖREV ÖDÜLÜ
        // =================================================

        if (komut === "gorev") {

            let odul = 0;
            let mesaj = [];

            if (
                hesap.gorevler.calisma >= 5 &&
                !hesap.gorevOdulleri.calisma
            ) {

                hesap.gorevOdulleri.calisma = true;
                odul += 2000;

                mesaj.push(
                    "💼 Çalış görevi: **+2.000**"
                );
            }

            if (
                hesap.gorevler.transfer >= 3 &&
                !hesap.gorevOdulleri.transfer
            ) {

                hesap.gorevOdulleri.transfer = true;
                odul += 1500;

                mesaj.push(
                    "💸 Transfer görevi: **+1.500**"
                );
            }

            if (
                hesap.gorevler.market >= 5 &&
                !hesap.gorevOdulleri.market
            ) {

                hesap.gorevOdulleri.market = true;
                odul += 1000;

                mesaj.push(
                    "🛒 Market görevi: **+1.000**"
                );
            }

            if (odul <= 0) {
                return interaction.reply({
                    content:
                        "❌ Şu anda alınabilecek tamamlanmış bir görev ödülün yok.",
                    ephemeral: true
                });
            }

            hesap.para += odul;
            hesap.toplamKazanilan += odul;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🎁 Görev Ödülleri",
                        `${mesaj.join("\n")}\n\n💰 Toplam ödül: **${paraFormatla(odul)} para**`
                    )
                ]
            });
        }

        // =================================================
        // YETKİLİ KONTROLÜ
        // =================================================

        const yetkiGerekenler = [
            "gorev-sifirla",
            "para-ver",
            "para-al"
        ];

        if (yetkiGerekenler.includes(komut)) {

            if (
                !interaction.memberPermissions ||
                !interaction.memberPermissions.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Bu ekonomi komutu için **Sunucuyu Yönet** yetkisine sahip olmalısın.",
                    ephemeral: true
                });
            }
        }

        // =================================================
        // GÖREV SIFIRLA
        // =================================================

        if (komut === "gorev-sifirla") {

            const uye =
                interaction.options.getUser("uye");

            const hedef =
                hesapOlustur(data, guildId, uye.id);

            hedef.gorevTarih = bugun();

            hedef.gorevler = {
                calisma: 0,
                transfer: 0,
                market: 0
            };

            hedef.gorevOdulleri = {
                calisma: false,
                transfer: false,
                market: false
            };

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "🔄 Görevler Sıfırlandı",
                        `**${uye.username}** kullanıcısının günlük görevleri sıfırlandı.`
                    )
                ]
            });
        }

        // =================================================
        // PARA VER
        // =================================================

        if (komut === "para-ver") {

            const uye =
                interaction.options.getUser("uye");

            const miktar =
                interaction.options.getInteger("miktar");

            if (uye.bot) {
                return interaction.reply({
                    content: "❌ Botlara ekonomi parası veremezsin.",
                    ephemeral: true
                });
            }

            const hedef =
                hesapOlustur(data, guildId, uye.id);

            hedef.para += miktar;
            hedef.toplamKazanilan += miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💰 Para Verildi",
                        `**${uye.username}** kullanıcısına **${paraFormatla(miktar)} para** verildi.`
                    )
                ]
            });
        }

        // =================================================
        // PARA AL
        // =================================================

        if (komut === "para-al") {

            const uye =
                interaction.options.getUser("uye");

            const miktar =
                interaction.options.getInteger("miktar");

            const hedef =
                hesapOlustur(data, guildId, uye.id);

            const alinabilecek =
                Math.min(hedef.para, miktar);

            if (alinabilecek <= 0) {
                return interaction.reply({
                    content:
                        "❌ Kullanıcının cüzdanında para bulunmuyor.",
                    ephemeral: true
                });
            }

            hedef.para -= alinabilecek;
            hedef.toplamHarcanan += alinabilecek;

            hesap.para += alinabilecek;
            hesap.toplamKazanilan += alinabilecek;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💸 Para Alındı",
                        `**${uye.username}** kullanıcısından **${paraFormatla(alinabilecek)} para** alındı.`
                    )
                ]
            });
        }

        // =================================================
        // TANIMSIZ KOMUT
        // =================================================

        return interaction.reply({
            content: "❌ Geçersiz ekonomi alt komutu.",
            ephemeral: true
        });

    } catch (error) {

        console.error("❌ Ekonomi komutu hatası:", error);

        const mesaj =
            "❌ Ekonomi komutunda beklenmeyen bir hata oluştu.";

        if (interaction.replied || interaction.deferred) {
            return interaction.followUp({
                content: mesaj,
                ephemeral: true
            }).catch(() => {});
        }

        return interaction.reply({
            content: mesaj,
            ephemeral: true
        }).catch(() => {});
    }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute
};