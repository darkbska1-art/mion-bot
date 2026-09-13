
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYA SİSTEMİ
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
// VERİ SİSTEMİ
// =====================================================

function verileriOku() {
    try {
        const veri = fs.readFileSync(dataDosyasi, "utf8");

        if (!veri.trim()) {
            return {};
        }

        const parsed = JSON.parse(veri);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            return {};
        }

        return parsed;
    } catch (error) {
        console.error("❌ Ekonomi JSON okuma hatası:", error);

        // Bozuk JSON yüzünden sistemi tamamen durdurmamak için
        // mevcut dosyayı yedekliyoruz.
        try {
            const backup = `${dataDosyasi}.backup-${Date.now()}`;
            fs.copyFileSync(dataDosyasi, backup);
        } catch {}

        return {};
    }
}

function verileriKaydet(data) {
    try {
        const geciciDosya = `${dataDosyasi}.tmp`;

        fs.writeFileSync(
            geciciDosya,
            JSON.stringify(data, null, 4),
            "utf8"
        );

        fs.renameSync(geciciDosya, dataDosyasi);

        return true;
    } catch (error) {
        console.error("❌ Ekonomi JSON kaydetme hatası:", error);
        return false;
    }
}

// =====================================================
// TARİH / ZAMAN
// =====================================================

function bugun() {
    const tarih = new Date();

    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, "0");
    const gun = String(tarih.getDate()).padStart(2, "0");

    return `${yil}-${ay}-${gun}`;
}

function kalanSure(ms) {
    if (ms <= 0) return "Hazır";

    const toplamSaniye = Math.ceil(ms / 1000);

    const gun = Math.floor(toplamSaniye / 86400);
    const saat = Math.floor((toplamSaniye % 86400) / 3600);
    const dakika = Math.floor((toplamSaniye % 3600) / 60);
    const saniye = toplamSaniye % 60;

    const parcalar = [];

    if (gun > 0) parcalar.push(`${gun} gün`);
    if (saat > 0) parcalar.push(`${saat} saat`);
    if (dakika > 0) parcalar.push(`${dakika} dk`);

    if (gun === 0 && saat === 0) {
        parcalar.push(`${saniye} sn`);
    }

    return parcalar.join(" ");
}

function cooldownKalan(sonKullanim, cooldown) {
    if (!sonKullanim) return 0;

    const kalan = cooldown - (Date.now() - sonKullanim);

    return Math.max(0, kalan);
}

// =====================================================
// FORMAT
// =====================================================

function paraFormatla(sayi) {
    return Number(sayi || 0).toLocaleString("tr-TR");
}

function yuzdeFormatla(sayi) {
    return `${Number(sayi || 0).toLocaleString("tr-TR", {
        maximumFractionDigits: 2
    })}%`;
}

function ilerlemeCubugu(mevcut, hedef, uzunluk = 10) {
    if (hedef <= 0) {
        return "██████████";
    }

    const oran = Math.min(1, Math.max(0, mevcut / hedef));
    const dolu = Math.round(oran * uzunluk);

    return (
        "█".repeat(dolu) +
        "░".repeat(uzunluk - dolu)
    );
}

function paraYuzdesi(deger, toplam) {
    if (!toplam || toplam <= 0) return 0;

    return (deger / toplam) * 100;
}

// =====================================================
// EMBED SİSTEMİ
// =====================================================

function embedBaslik(baslik, aciklama) {
    return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(baslik)
        .setDescription(aciklama)
        .setTimestamp();
}

function kullaniciFooter(embed, user) {
    return embed.setFooter({
        text: `${user.username} • Ekonomi Sistemi`,
        iconURL: user.displayAvatarURL()
    });
}

// =====================================================
// MESLEKLER
// =====================================================

const meslekler = {
    issiz: {
        isim: "İşsiz",
        emoji: "🧑",
        min: 50,
        max: 150,
        aciklama: "Herhangi bir mesleğe bağlı olmadan çalışırsın."
    },

    madenci: {
        isim: "Madenci",
        emoji: "⛏️",
        min: 100,
        max: 300,
        aciklama: "Madenlerde çalışarak düzenli gelir elde edersin."
    },

    yazilimci: {
        isim: "Yazılımcı",
        emoji: "💻",
        min: 200,
        max: 500,
        aciklama: "Kod yazarak yüksek gelir elde edersin."
    },

    doktor: {
        isim: "Doktor",
        emoji: "🩺",
        min: 300,
        max: 700,
        aciklama: "Sağlık sektöründeki yüksek maaşlı meslek."
    },

    muhendis: {
        isim: "Mühendis",
        emoji: "⚙️",
        min: 250,
        max: 600,
        aciklama: "Teknik projeler üzerinde çalışırsın."
    },

    tasarimci: {
        isim: "Tasarımcı",
        emoji: "🎨",
        min: 150,
        max: 400,
        aciklama: "Tasarım yaparak para kazanırsın."
    }
};

// =====================================================
// MARKET
// =====================================================

const market = {
    elma: {
        isim: "Elma",
        emoji: "🍎",
        fiyat: 100,
        satis: 60,
        kategori: "Tüketilebilir",
        aciklama: "Basit ama ekonomik bir yiyecek."
    },

    kahve: {
        isim: "Kahve",
        emoji: "☕",
        fiyat: 250,
        satis: 150,
        kategori: "Tüketilebilir",
        aciklama: "Günün enerjisini artıran klasik içecek."
    },

    pizza: {
        isim: "Pizza",
        emoji: "🍕",
        fiyat: 500,
        satis: 300,
        kategori: "Tüketilebilir",
        aciklama: "Lezzetli ve pahalı bir yiyecek."
    },

    laptop: {
        isim: "Laptop",
        emoji: "💻",
        fiyat: 5000,
        satis: 3000,
        kategori: "Elektronik",
        aciklama: "Çalışma ve teknoloji için güçlü cihaz."
    },

    araba: {
        isim: "Araba",
        emoji: "🚗",
        fiyat: 25000,
        satis: 15000,
        kategori: "Araç",
        aciklama: "Ekonomi sistemindeki en değerli eşyalardan biri."
    }
};

// =====================================================
// SABİTLER
// =====================================================

const BANKA_LIMITI = 1_000_000;
const FAIZ_ORANI = 0.02;

const GUNLUK_MIN = 500;
const GUNLUK_MAX = 1000;

const CALISMA_COOLDOWN = 60 * 1000;
const GUNLUK_COOLDOWN = 24 * 60 * 60 * 1000;
const FAIZ_COOLDOWN = 24 * 60 * 60 * 1000;
const SOYGUN_COOLDOWN = 30 * 60 * 1000;

const KASA_FIYAT = 5000;
const KASA_MIN = 1000;
const KASA_MAX = 10000;

// =====================================================
// HESAP OLUŞTURMA
// =====================================================

function hesapOlustur(data, guildId, userId) {

    if (
        !data[guildId] ||
        typeof data[guildId] !== "object" ||
        Array.isArray(data[guildId])
    ) {
        data[guildId] = {};
    }

    if (
        !data[guildId][userId] ||
        typeof data[guildId][userId] !== "object" ||
        Array.isArray(data[guildId][userId])
    ) {
        data[guildId][userId] = {};
    }

    const hesap = data[guildId][userId];

    // =================================================
    // TEMEL PARA
    // =================================================

    if (typeof hesap.para !== "number" || !Number.isFinite(hesap.para)) {
        hesap.para = 0;
    }

    if (typeof hesap.banka !== "number" || !Number.isFinite(hesap.banka)) {
        hesap.banka = 0;
    }

    if (
        typeof hesap.toplamKazanilan !== "number" ||
        !Number.isFinite(hesap.toplamKazanilan)
    ) {
        hesap.toplamKazanilan = 0;
    }

    if (
        typeof hesap.toplamHarcanan !== "number" ||
        !Number.isFinite(hesap.toplamHarcanan)
    ) {
        hesap.toplamHarcanan = 0;
    }

    // =================================================
    // COOLDOWN
    // =================================================

    if (typeof hesap.sonGunluk !== "number") hesap.sonGunluk = 0;
    if (typeof hesap.sonCalisma !== "number") hesap.sonCalisma = 0;
    if (typeof hesap.sonFaiz !== "number") hesap.sonFaiz = 0;
    if (typeof hesap.sonSoygun !== "number") hesap.sonSoygun = 0;
    if (typeof hesap.sonKasa !== "number") hesap.sonKasa = 0;

    // =================================================
    // MESLEK
    // =================================================

    if (typeof hesap.meslek !== "string") {
        hesap.meslek = "İşsiz";
    }

    // =================================================
    // KASA
    // =================================================

    if (
        typeof hesap.kasa !== "number" ||
        !Number.isFinite(hesap.kasa)
    ) {
        hesap.kasa = 0;
    }

    // =================================================
    // ENVANTER
    // =================================================

    if (
        !hesap.envanter ||
        typeof hesap.envanter !== "object" ||
        Array.isArray(hesap.envanter)
    ) {
        hesap.envanter = {};
    }

    // =================================================
    // GÖREVLER
    // =================================================

    if (typeof hesap.gorevTarih !== "string") {
        hesap.gorevTarih = bugun();
    }

    if (
        !hesap.gorevler ||
        typeof hesap.gorevler !== "object"
    ) {
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

    if (
        !hesap.gorevOdulleri ||
        typeof hesap.gorevOdulleri !== "object"
    ) {
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

    // =================================================
    // İSTATİSTİKLER
    // =================================================

    if (!hesap.istatistik || typeof hesap.istatistik !== "object") {
        hesap.istatistik = {};
    }

    const istatistikAlanlari = [
        "calisma",
        "gunluk",
        "transfer",
        "satinAlma",
        "satis",
        "soygun",
        "basariliSoygun",
        "basarisizSoygun",
        "faiz",
        "kasa"
    ];

    for (const alan of istatistikAlanlari) {
        if (
            typeof hesap.istatistik[alan] !== "number" ||
            !Number.isFinite(hesap.istatistik[alan])
        ) {
            hesap.istatistik[alan] = 0;
        }
    }

    // =================================================
    // GÜNLÜK GÖREV KONTROL
    // =================================================

    gorevleriKontrolEt(hesap);

    return hesap;
}

// =====================================================
// GÖREV SIFIRLAMA
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
// PARA EKLE
// =====================================================

function paraEkle(hesap, miktar) {
    hesap.para += miktar;
    hesap.toplamKazanilan += miktar;
}

// =====================================================
// PARA ÇIKAR
// =====================================================

function paraCikar(hesap, miktar) {
    hesap.para = Math.max(0, hesap.para - miktar);
    hesap.toplamHarcanan += miktar;
}

// =====================================================
// GÖREV DURUMU
// =====================================================

function gorevDurumu(mevcut, hedef) {

    const oran = Math.min(
        100,
        (mevcut / hedef) * 100
    );

    return (
        `${ilerlemeCubugu(mevcut, hedef, 8)} ` +
        `**${Math.min(mevcut, hedef)}/${hedef}**\n` +
        `İlerleme: **${yuzdeFormatla(oran)}**`
    );
}

// =====================================================
// KOMUT
// =====================================================

const data = new SlashCommandBuilder()
    .setName("ekonomi")
    .setDescription("Gelişmiş ekonomi sistemini kullan.")

    // =================================================
    // BAKİYE
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("bakiye")
            .setDescription("Detaylı ekonomi ve servet bilgini gösterir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Bakiyesini görmek istediğin üye.")
                    .setRequired(false)
            )
    )

    // =================================================
    // GÜNLÜK
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("gunluk")
            .setDescription("Günlük para ödülünü al.")
    )

    // =================================================
    // ÇALIŞ
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("calis")
            .setDescription("Mesleğine göre çalışarak para kazan.")
    )

    // =================================================
    // MESLEK
    // =================================================

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
                        {
                            name: "İşsiz",
                            value: "issiz"
                        },
                        {
                            name: "Madenci",
                            value: "madenci"
                        },
                        {
                            name: "Yazılımcı",
                            value: "yazilimci"
                        },
                        {
                            name: "Doktor",
                            value: "doktor"
                        },
                        {
                            name: "Mühendis",
                            value: "muhendis"
                        },
                        {
                            name: "Tasarımcı",
                            value: "tasarimci"
                        }
                    )
            )
    )

    // =================================================
    // TRANSFER
    // =================================================

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
                    .setDescription("Gönderilecek para.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

    // =================================================
    // ZENGİNLER
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("zenginler")
            .setDescription("Sunucunun en zengin kullanıcılarını gösterir.")
    )

    // =================================================
    // ENVANTER
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("envanter")
            .setDescription("Detaylı envanterini gösterir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Envanterine bakılacak kullanıcı.")
                    .setRequired(false)
            )
    )

    // =================================================
    // MARKET
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("market")
            .setDescription("Ekonomi marketini detaylı gösterir.")
    )

    // =================================================
    // SATIN AL
    // =================================================

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
                        {
                            name: "🍎 Elma - 100",
                            value: "elma"
                        },
                        {
                            name: "☕ Kahve - 250",
                            value: "kahve"
                        },
                        {
                            name: "🍕 Pizza - 500",
                            value: "pizza"
                        },
                        {
                            name: "💻 Laptop - 5.000",
                            value: "laptop"
                        },
                        {
                            name: "🚗 Araba - 25.000",
                            value: "araba"
                        }
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

    // =================================================
    // SAT
    // =================================================

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
                        {
                            name: "🍎 Elma",
                            value: "elma"
                        },
                        {
                            name: "☕ Kahve",
                            value: "kahve"
                        },
                        {
                            name: "🍕 Pizza",
                            value: "pizza"
                        },
                        {
                            name: "💻 Laptop",
                            value: "laptop"
                        },
                        {
                            name: "🚗 Araba",
                            value: "araba"
                        }
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

    // =================================================
    // BANKA
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("banka")
            .setDescription("Detaylı banka bilgilerini gösterir.")
    )

    // =================================================
    // YATIR
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("yatir")
            .setDescription("Bankaya para yatır.")
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Yatırılacak para.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

    // =================================================
    // ÇEK
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("cek")
            .setDescription("Bankadan para çek.")
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Çekilecek para.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

    // =================================================
    // FAİZ
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("faiz")
            .setDescription("Bankadaki paran için faiz al.")
    )

    // =================================================
    // KASA
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("kasa")
            .setDescription("Kasa bilgilerini ve durumunu gösterir.")
    )

    // =================================================
    // KASA AÇ
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("kasa-ac")
            .setDescription("5.000 para karşılığında kasa aç.")
    )

    // =================================================
    // SOYGUN
    // =================================================

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

    // =================================================
    // GÖREVLER
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("gorevler")
            .setDescription("Günlük görevlerini detaylı gösterir.")
    )

    // =================================================
    // GÖREV ÖDÜLÜ
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("gorev")
            .setDescription("Tamamladığın görevlerin ödülünü al.")
    )

    // =================================================
    // GÖREV SIFIRLA
    // =================================================

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

    // =================================================
    // PARA VER
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("para-ver")
            .setDescription("Bir kullanıcıya ekonomi parası verir.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Para verilecek kullanıcı.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Verilecek para.")
                    .setMinValue(1)
                    .setRequired(true)
            )
    )

    // =================================================
    // PARA AL
    // =================================================

    .addSubcommand(sub =>
        sub
            .setName("para-al")
            .setDescription("Bir kullanıcının cüzdanından para alır.")
            .addUserOption(option =>
                option
                    .setName("uye")
                    .setDescription("Para alınacak kullanıcı.")
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("miktar")
                    .setDescription("Alınacak para.")
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

        const hesap = hesapOlustur(
            data,
            guildId,
            userId
        );

        // Tarih değiştiyse görevleri yenile
        verileriKaydet(data);

        const komut = interaction.options.getSubcommand();

        // =================================================
        // BAKİYE
        // =================================================

        if (komut === "bakiye") {

            const uye =
                interaction.options.getUser("uye") ||
                interaction.user;

            const hedefHesap =
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            verileriKaydet(data);

            const toplam =
                hedefHesap.para +
                hedefHesap.banka;

            const toplamHareket =
                hedefHesap.toplamKazanilan +
                hedefHesap.toplamHarcanan;

            const bankaOrani =
                Math.min(
                    100,
                    (hedefHesap.banka / BANKA_LIMITI) * 100
                );

            const meslek =
                Object.values(meslekler)
                    .find(x => x.isim === hedefHesap.meslek);

            const embed = embedBaslik(
                "💰 Ekonomi • Bakiye",
                `### ${uye.username}\n` +
                `Kullanıcının detaylı ekonomi özeti aşağıdadır.`
            );

            embed.setThumbnail(
                uye.displayAvatarURL({
                    size: 256
                })
            );

            embed.addFields(
                {
                    name: "💵 Cüzdan",
                    value:
                        `**${paraFormatla(hedefHesap.para)}** para`,
                    inline: true
                },
                {
                    name: "🏦 Banka",
                    value:
                        `**${paraFormatla(hedefHesap.banka)}** para`,
                    inline: true
                },
                {
                    name: "💎 Toplam Servet",
                    value:
                        `**${paraFormatla(toplam)}** para`,
                    inline: true
                },
                {
                    name: "💼 Meslek",
                    value:
                        `${meslek?.emoji || "🧑"} **${hedefHesap.meslek}**`,
                    inline: true
                },
                {
                    name: "📈 Toplam Kazanç",
                    value:
                        `**${paraFormatla(hedefHesap.toplamKazanilan)}**`,
                    inline: true
                },
                {
                    name: "📉 Toplam Harcama",
                    value:
                        `**${paraFormatla(hedefHesap.toplamHarcanan)}**`,
                    inline: true
                },
                {
                    name: "🏦 Banka Kullanımı",
                    value:
                        `${ilerlemeCubugu(
                            hedefHesap.banka,
                            BANKA_LIMITI,
                            12
                        )}\n` +
                        `**${yuzdeFormatla(bankaOrani)}** • ` +
                        `${paraFormatla(
                            BANKA_LIMITI - hedefHesap.banka
                        )} limit kaldı`,
                    inline: false
                },
                {
                    name: "📊 Ekonomi Hareketleri",
                    value:
                        `💰 Kazanç: **${paraFormatla(hedefHesap.toplamKazanilan)}**\n` +
                        `💸 Harcama: **${paraFormatla(hedefHesap.toplamHarcanan)}**\n` +
                        `🔄 Toplam hareket: **${paraFormatla(toplamHareket)}**`,
                    inline: false
                }
            );

            kullaniciFooter(embed, uye);

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // GÜNLÜK
        // =================================================

        if (komut === "gunluk") {

            const kalan =
                cooldownKalan(
                    hesap.sonGunluk,
                    GUNLUK_COOLDOWN
                );

            if (kalan > 0) {

                const embed = embedBaslik(
                    "⏳ Günlük Ödül",
                    `Günlük ödülünü zaten aldın.\n\n` +
                    `⏰ Yeniden alabilmek için:\n` +
                    `**${kalanSure(kalan)}** beklemelisin.`
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const odul =
                Math.floor(
                    Math.random() *
                    (GUNLUK_MAX - GUNLUK_MIN + 1)
                ) + GUNLUK_MIN;

            const eskiBakiye = hesap.para;

            paraEkle(hesap, odul);

            hesap.sonGunluk = Date.now();
            hesap.istatistik.gunluk++;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🎁 Günlük Ödül Alındı",
                `Bugünkü günlük ödülünü başarıyla aldın.`
            );

            embed.addFields(
                {
                    name: "🎁 Ödül",
                    value:
                        `**+${paraFormatla(odul)} para**`,
                    inline: true
                },
                {
                    name: "💵 Önceki Bakiye",
                    value:
                        `**${paraFormatla(eskiBakiye)}**`,
                    inline: true
                },
                {
                    name: "💰 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "📅 Sonraki Ödül",
                    value:
                        `Yaklaşık **24 saat** sonra`,
                    inline: false
                }
            );

            kullaniciFooter(
                embed,
                interaction.user
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ÇALIŞ
        // =================================================

        if (komut === "calis") {

            const kalan =
                cooldownKalan(
                    hesap.sonCalisma,
                    CALISMA_COOLDOWN
                );

            if (kalan > 0) {

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "⏳ Çalışma Bekleme Süresi",
                            `Tekrar çalışabilmek için **${kalanSure(kalan)}** beklemelisin.`
                        )
                    ],
                    ephemeral: true
                });
            }

            let meslekBilgisi;

            if (hesap.meslek === "İşsiz") {
                meslekBilgisi = meslekler.issiz;
            } else {
                meslekBilgisi =
                    Object.values(meslekler)
                        .find(x => x.isim === hesap.meslek);
            }

            const kazanc =
                Math.floor(
                    Math.random() *
                    (
                        meslekBilgisi.max -
                        meslekBilgisi.min +
                        1
                    )
                ) +
                meslekBilgisi.min;

            const eskiBakiye = hesap.para;

            paraEkle(hesap, kazanc);

            hesap.sonCalisma = Date.now();

            hesap.gorevler.calisma++;
            hesap.istatistik.calisma++;

            verileriKaydet(data);

            const embed = embedBaslik(
                "💼 Çalışma Tamamlandı",
                `${meslekBilgisi.emoji} **${hesap.meslek}** olarak çalıştın ve para kazandın.`
            );

            embed.addFields(
                {
                    name: "💼 Meslek",
                    value:
                        `**${hesap.meslek}**`,
                    inline: true
                },
                {
                    name: "💰 Kazanç",
                    value:
                        `**+${paraFormatla(kazanc)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "📊 Meslek Gelir Aralığı",
                    value:
                        `${paraFormatla(meslekBilgisi.min)} - ` +
                        `${paraFormatla(meslekBilgisi.max)} para`,
                    inline: false
                },
                {
                    name: "📋 Günlük Çalışma Görevi",
                    value:
                        gorevDurumu(
                            hesap.gorevler.calisma,
                            5
                        ),
                    inline: false
                }
            );

            kullaniciFooter(
                embed,
                interaction.user
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // MESLEK
        // =================================================

        if (komut === "meslek") {

            const sec =
                interaction.options.getString("sec");

            if (!meslekler[sec]) {
                return interaction.reply({
                    content: "❌ Geçersiz meslek.",
                    ephemeral: true
                });
            }

            const yeniMeslek =
                meslekler[sec];

            const eskiMeslek =
                hesap.meslek;

            hesap.meslek =
                yeniMeslek.isim;

            verileriKaydet(data);

            const embed = embedBaslik(
                "💼 Meslek Güncellendi",
                `Ekonomik kariyerin başarıyla güncellendi.`
            );

            embed.addFields(
                {
                    name: "↩️ Eski Meslek",
                    value:
                        `**${eskiMeslek}**`,
                    inline: true
                },
                {
                    name: "💼 Yeni Meslek",
                    value:
                        `${yeniMeslek.emoji} **${yeniMeslek.isim}**`,
                    inline: true
                },
                {
                    name: "💰 Kazanç Aralığı",
                    value:
                        `**${paraFormatla(yeniMeslek.min)}** - ` +
                        `**${paraFormatla(yeniMeslek.max)}**`,
                    inline: true
                },
                {
                    name: "📖 Meslek Açıklaması",
                    value:
                        yeniMeslek.aciklama,
                    inline: false
                }
            );

            kullaniciFooter(
                embed,
                interaction.user
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // TRANSFER
        // =================================================

        if (komut === "transfer") {

            const uye =
                interaction.options.getUser("uye");

            const miktar =
                interaction.options.getInteger("miktar");

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

            if (miktar <= 0) {
                return interaction.reply({
                    content: "❌ Geçersiz para miktarı.",
                    ephemeral: true
                });
            }

            if (hesap.para < miktar) {
                return interaction.reply({
                    content:
                        `❌ Yeterli paran yok.\n\n` +
                        `Gereken: **${paraFormatla(miktar)}**\n` +
                        `Cüzdan: **${paraFormatla(hesap.para)}**`,
                    ephemeral: true
                });
            }

            const hedefHesap =
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            hesap.para -= miktar;
            hedefHesap.para += miktar;

            hesap.toplamHarcanan += miktar;
            hedefHesap.toplamKazanilan += miktar;

            hesap.gorevler.transfer++;
            hesap.istatistik.transfer++;

            verileriKaydet(data);

            const embed = embedBaslik(
                "💸 Para Transferi",
                `Para transferi başarıyla tamamlandı.`
            );

            embed.addFields(
                {
                    name: "👤 Alıcı",
                    value:
                        `${uye}`,
                    inline: true
                },
                {
                    name: "💰 Transfer",
                    value:
                        `**${paraFormatla(miktar)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "📋 Transfer Görevi",
                    value:
                        gorevDurumu(
                            hesap.gorevler.transfer,
                            3
                        ),
                    inline: false
                }
            );

            kullaniciFooter(
                embed,
                interaction.user
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ZENGİNLER
        // =================================================

        if (komut === "zenginler") {

            const sunucu =
                data[guildId] || {};

            const liste =
                Object.entries(sunucu)
                    .map(([id, hesap]) => ({
                        id,
                        toplam:
                            Number(hesap.para || 0) +
                            Number(hesap.banka || 0)
                    }))
                    .filter(x => x.toplam >= 0)
                    .sort(
                        (a, b) =>
                            b.toplam - a.toplam
                    )
                    .slice(0, 10);

            if (liste.length === 0) {
                return interaction.reply({
                    content:
                        "❌ Henüz ekonomi verisi bulunmuyor.",
                    ephemeral: true
                });
            }

            let metin = "";

            for (
                let i = 0;
                i < liste.length;
                i++
            ) {

                const uye =
                    await interaction.client.users
                        .fetch(liste[i].id)
                        .catch(() => null);

                const isim =
                    uye
                        ? uye.username
                        : "Bilinmeyen Kullanıcı";

                const madalya =
                    i === 0
                        ? "🥇"
                        : i === 1
                            ? "🥈"
                            : i === 2
                                ? "🥉"
                                : `**${i + 1}.**`;

                metin +=
                    `${madalya} ${isim}\n` +
                    `└─ 💎 **${paraFormatla(liste[i].toplam)}** para\n\n`;
            }

            const embed = embedBaslik(
                "🏆 Ekonomi • En Zenginler",
                `Sunucunun en yüksek toplam servete sahip kullanıcıları.`
            );

            embed.addFields({
                name: "💎 Servet Sıralaması",
                value: metin
            });

            embed.setFooter({
                text:
                    `${interaction.guild.name} • İlk 10`
            });

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // ENVANTER
        // =================================================

        if (komut === "envanter") {

            const uye =
                interaction.options.getUser("uye") ||
                interaction.user;

            const hedef =
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            const esyalar =
                Object.entries(
                    hedef.envanter
                )
                    .filter(
                        ([, miktar]) =>
                            Number(miktar) > 0
                    );

            if (esyalar.length === 0) {

                const embed =
                    embedBaslik(
                        "🎒 Envanter",
                        `**${uye.username}** adlı kullanıcının envanteri boş.`
                    );

                embed.setThumbnail(
                    uye.displayAvatarURL()
                );

                return interaction.reply({
                    embeds: [embed]
                });
            }

            let metin = "";
            let toplamEsya = 0;
            let toplamDeger = 0;

            for (
                const [anahtar, miktar]
                of esyalar
            ) {

                const item =
                    market[anahtar];

                if (!item) continue;

                const adet =
                    Number(miktar);

                toplamEsya += adet;
                toplamDeger +=
                    item.fiyat * adet;

                metin +=
                    `${item.emoji} **${item.isim}** × **${adet}**\n` +
                    `└─ Birim değer: ${paraFormatla(item.fiyat)}\n` +
                    `└─ Tahmini satış: ${paraFormatla(item.satis * adet)}\n\n`;
            }

            const embed = embedBaslik(
                `🎒 ${uye.username} • Envanter`,
                `Sahip olunan eşyaların detaylı listesi.`
            );

            embed.setThumbnail(
                uye.displayAvatarURL()
            );

            embed.addFields(
                {
                    name: "📦 Eşyalar",
                    value:
                        metin,
                    inline: false
                },
                {
                    name: "🔢 Toplam Adet",
                    value:
                        `**${paraFormatla(toplamEsya)}**`,
                    inline: true
                },
                {
                    name: "💎 Alış Değeri",
                    value:
                        `**${paraFormatla(toplamDeger)}**`,
                    inline: true
                },
                {
                    name: "💰 Tahmini Satış Değeri",
                    value:
                        `**${paraFormatla(
                            esyalar.reduce(
                                (toplam, [anahtar, miktar]) => {
                                    const item =
                                        market[anahtar];

                                    return (
                                        toplam +
                                        (
                                            item?.satis || 0
                                        ) *
                                        Number(miktar)
                                    );
                                },
                                0
                            )
                        )}**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // MARKET
        // =================================================

        if (komut === "market") {

            let metin = "";

            for (
                const [anahtar, item]
                of Object.entries(market)
            ) {

                const kar =
                    item.fiyat - item.satis;

                metin +=
                    `${item.emoji} **${item.isim}**\n` +
                    `└─ 💰 Alış: **${paraFormatla(item.fiyat)}**\n` +
                    `└─ 💵 Satış: **${paraFormatla(item.satis)}**\n` +
                    `└─ 📦 ${item.kategori}\n` +
                    `└─ 📝 ${item.aciklama}\n\n`;
            }

            const embed = embedBaslik(
                "🛒 Ekonomi Marketi",
                `Ekonomi marketindeki mevcut ürünler.`
            );

            embed.addFields({
                name: "🏪 Ürünler",
                value: metin
            });

            embed.setFooter({
                text:
                    "Satış fiyatları alış fiyatının %60'ıdır."
            });

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // SATIN AL
        // =================================================

        if (komut === "satinal") {

            const esya =
                interaction.options.getString("esya");

            const miktar =
                interaction.options.getInteger("miktar");

            const item =
                market[esya];

            if (!item) {
                return interaction.reply({
                    content: "❌ Geçersiz eşya.",
                    ephemeral: true
                });
            }

            const toplam =
                item.fiyat * miktar;

            if (!Number.isSafeInteger(toplam)) {
                return interaction.reply({
                    content: "❌ Geçersiz toplam fiyat.",
                    ephemeral: true
                });
            }

            if (hesap.para < toplam) {

                const eksik =
                    toplam - hesap.para;

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "❌ Yetersiz Bakiye",
                            `Bu alışveriş için yeterli paran bulunmuyor.\n\n` +
                            `💰 Gereken: **${paraFormatla(toplam)}**\n` +
                            `💵 Mevcut: **${paraFormatla(hesap.para)}**\n` +
                            `📉 Eksik: **${paraFormatla(eksik)}**`
                        )
                    ],
                    ephemeral: true
                });
            }

            hesap.para -= toplam;
            hesap.toplamHarcanan += toplam;

            hesap.envanter[esya] =
                Number(
                    hesap.envanter[esya] || 0
                ) + miktar;

            hesap.gorevler.market += miktar;
            hesap.istatistik.satinAlma += miktar;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🛒 Satın Alma Başarılı",
                `${item.emoji} **${item.isim}** envanterine eklendi.`
            );

            embed.addFields(
                {
                    name: "📦 Ürün",
                    value:
                        `**${miktar}x ${item.isim}**`,
                    inline: true
                },
                {
                    name: "💸 Harcanan",
                    value:
                        `**${paraFormatla(toplam)}**`,
                    inline: true
                },
                {
                    name: "💵 Kalan Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "🎒 Envanterindeki Miktar",
                    value:
                        `**${paraFormatla(
                            hesap.envanter[esya]
                        )}x**`,
                    inline: false
                },
                {
                    name: "📋 Market Görevi",
                    value:
                        gorevDurumu(
                            hesap.gorevler.market,
                            5
                        ),
                    inline: false
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // SAT
        // =================================================

        if (komut === "sat") {

            const esya =
                interaction.options.getString("esya");

            const miktar =
                interaction.options.getInteger("miktar");

            const item =
                market[esya];

            if (!item) {
                return interaction.reply({
                    content: "❌ Geçersiz eşya.",
                    ephemeral: true
                });
            }

            const sahip =
                Number(
                    hesap.envanter[esya] || 0
                );

            if (sahip < miktar) {
                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "❌ Yetersiz Eşya",
                            `Envanterinde yeterli **${item.isim}** bulunmuyor.\n\n` +
                            `🎒 Sahip olduğun: **${sahip}**\n` +
                            `📦 İstenen: **${miktar}**`
                        )
                    ],
                    ephemeral: true
                });
            }

            const kazanc =
                item.satis * miktar;

            hesap.envanter[esya] -= miktar;

            if (hesap.envanter[esya] <= 0) {
                delete hesap.envanter[esya];
            }

            hesap.para += kazanc;
            hesap.toplamKazanilan += kazanc;
            hesap.istatistik.satis += miktar;

            verileriKaydet(data);

            const embed = embedBaslik(
                "💰 Eşya Satıldı",
                `${item.emoji} Eşyan başarıyla satıldı.`
            );

            embed.addFields(
                {
                    name: "📦 Satılan",
                    value:
                        `**${miktar}x ${item.isim}**`,
                    inline: true
                },
                {
                    name: "💰 Kazanç",
                    value:
                        `**+${paraFormatla(kazanc)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "📊 Birim Satış Fiyatı",
                    value:
                        `**${paraFormatla(item.satis)}**`,
                    inline: true
                },
                {
                    name: "🎒 Kalan Miktar",
                    value:
                        `**${paraFormatla(
                            Number(
                                hesap.envanter[esya] || 0
                            )
                        )}x**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // BANKA
        // =================================================

        if (komut === "banka") {

            const toplam =
                hesap.para +
                hesap.banka;

            const oran =
                Math.min(
                    100,
                    (hesap.banka / BANKA_LIMITI) * 100
                );

            const faizTahmini =
                Math.floor(
                    hesap.banka *
                    FAIZ_ORANI
                );

            const embed = embedBaslik(
                "🏦 Banka • Finans Merkezi",
                `Banka hesabının detaylı finansal durumu.`
            );

            embed.addFields(
                {
                    name: "💵 Cüzdan",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "🏦 Banka",
                    value:
                        `**${paraFormatla(hesap.banka)}**`,
                    inline: true
                },
                {
                    name: "💎 Toplam Servet",
                    value:
                        `**${paraFormatla(toplam)}**`,
                    inline: true
                },
                {
                    name: "📈 Mevcut Faiz",
                    value:
                        `**%${FAIZ_ORANI * 100}**`,
                    inline: true
                },
                {
                    name: "💰 Tahmini Faiz",
                    value:
                        `**+${paraFormatla(faizTahmini)}**`,
                    inline: true
                },
                {
                    name: "🔒 Banka Limiti",
                    value:
                        `**${paraFormatla(BANKA_LIMITI)}**`,
                    inline: true
                },
                {
                    name: "📊 Limit Kullanımı",
                    value:
                        `${ilerlemeCubugu(
                            hesap.banka,
                            BANKA_LIMITI,
                            14
                        )}\n` +
                        `**${yuzdeFormatla(oran)}** kullanılıyor`,
                    inline: false
                }
            );

            return interaction.reply({
                embeds: [embed]
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
                    content:
                        `❌ Cüzdanında yeterli para yok.\n\n` +
                        `Cüzdan: **${paraFormatla(hesap.para)}**\n` +
                        `Gereken: **${paraFormatla(miktar)}**`,
                    ephemeral: true
                });
            }

            if (
                hesap.banka + miktar >
                BANKA_LIMITI
            ) {
                return interaction.reply({
                    content:
                        `❌ Banka limitini aşamazsın.\n\n` +
                        `Limit: **${paraFormatla(BANKA_LIMITI)}**`,
                    ephemeral: true
                });
            }

            hesap.para -= miktar;
            hesap.banka += miktar;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🏦 Para Yatırıldı",
                `Para başarıyla banka hesabına aktarıldı.`
            );

            embed.addFields(
                {
                    name: "💸 Yatırılan",
                    value:
                        `**${paraFormatla(miktar)}**`,
                    inline: true
                },
                {
                    name: "💵 Cüzdan",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "🏦 Yeni Banka",
                    value:
                        `**${paraFormatla(hesap.banka)}**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
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
                    content:
                        `❌ Bankanda yeterli para yok.\n\n` +
                        `Banka: **${paraFormatla(hesap.banka)}**\n` +
                        `Gereken: **${paraFormatla(miktar)}**`,
                    ephemeral: true
                });
            }

            hesap.banka -= miktar;
            hesap.para += miktar;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🏦 Para Çekildi",
                `Para banka hesabından cüzdanına aktarıldı.`
            );

            embed.addFields(
                {
                    name: "💸 Çekilen",
                    value:
                        `**${paraFormatla(miktar)}**`,
                    inline: true
                },
                {
                    name: "🏦 Kalan Banka",
                    value:
                        `**${paraFormatla(hesap.banka)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Cüzdan",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // FAİZ
        // =================================================

        if (komut === "faiz") {

            const kalan =
                cooldownKalan(
                    hesap.sonFaiz,
                    FAIZ_COOLDOWN
                );

            if (kalan > 0) {

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "⏳ Faiz Hazır Değil",
                            `Bir sonraki faiz ödemesini almak için ` +
                            `**${kalanSure(kalan)}** beklemelisin.`
                        )
                    ],
                    ephemeral: true
                });
            }

            if (hesap.banka <= 0) {
                return interaction.reply({
                    content:
                        "❌ Bankanda faiz kazanacak para bulunmuyor.",
                    ephemeral: true
                });
            }

            const faiz =
                Math.floor(
                    hesap.banka *
                    FAIZ_ORANI
                );

            if (faiz <= 0) {
                return interaction.reply({
                    content:
                        "❌ Banka bakiyen faiz kazanmak için çok düşük.",
                    ephemeral: true
                });
            }

            const eskiBanka =
                hesap.banka;

            hesap.banka =
                Math.min(
                    BANKA_LIMITI,
                    hesap.banka + faiz
                );

            const gercekFaiz =
                hesap.banka - eskiBanka;

            hesap.toplamKazanilan +=
                gercekFaiz;

            hesap.sonFaiz = Date.now();
            hesap.istatistik.faiz++;

            verileriKaydet(data);

            const embed = embedBaslik(
                "📈 Banka Faizi",
                `Banka hesabına günlük faiz işlendi.`
            );

            embed.addFields(
                {
                    name: "🏦 Önceki Bakiye",
                    value:
                        `**${paraFormatla(eskiBanka)}**`,
                    inline: true
                },
                {
                    name: "📈 Faiz Oranı",
                    value:
                        `**%${FAIZ_ORANI * 100}**`,
                    inline: true
                },
                {
                    name: "💰 Kazanç",
                    value:
                        `**+${paraFormatla(gercekFaiz)}**`,
                    inline: true
                },
                {
                    name: "🏦 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.banka)}**`,
                    inline: false
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // KASA
        // =================================================

        if (komut === "kasa") {

            const embed = embedBaslik(
                "🎁 Kasa Sistemi",
                `Ekonomi kasalarını kullanarak rastgele para ödülleri kazanabilirsin.`
            );

            embed.addFields(
                {
                    name: "🎁 Sahip Olduğun Kasa",
                    value:
                        `**${paraFormatla(hesap.kasa)}**`,
                    inline: true
                },
                {
                    name: "💰 Kasa Fiyatı",
                    value:
                        `**${paraFormatla(KASA_FIYAT)}**`,
                    inline: true
                },
                {
                    name: "🎉 Ödül Aralığı",
                    value:
                        `**${paraFormatla(KASA_MIN)}** - ` +
                        `**${paraFormatla(KASA_MAX)}**`,
                    inline: true
                },
                {
                    name: "📊 Beklenen Değer",
                    value:
                        `Yaklaşık **${paraFormatla(
                            (KASA_MIN + KASA_MAX) / 2
                        )}**`,
                    inline: true
                },
                {
                    name: "💵 Cüzdan",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                },
                {
                    name: "🔓 Durum",
                    value:
                        hesap.para >= KASA_FIYAT
                            ? "✅ Kasa açmaya hazırsın."
                            : "❌ Kasa açmak için paran yetersiz.",
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =================================================
        // KASA AÇ
        // =================================================

        if (komut === "kasa-ac") {

            if (hesap.para < KASA_FIYAT) {
                return interaction.reply({
                    content:
                        `❌ Kasa açmak için **${paraFormatla(KASA_FIYAT)}** para gerekiyor.`,
                    ephemeral: true
                });
            }

            const odul =
                Math.floor(
                    Math.random() *
                    (
                        KASA_MAX -
                        KASA_MIN +
                        1
                    )
                ) +
                KASA_MIN;

            hesap.para -= KASA_FIYAT;
            hesap.toplamHarcanan +=
                KASA_FIYAT;

            hesap.para += odul;
            hesap.toplamKazanilan +=
                odul;

            hesap.sonKasa = Date.now();
            hesap.istatistik.kasa++;

            const net =
                odul - KASA_FIYAT;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🎁 Kasa Açıldı!",
                `Kasanı açtın ve içinden rastgele bir para ödülü çıktı.`
            );

            embed.addFields(
                {
                    name: "📦 Kasa Maliyeti",
                    value:
                        `**-${paraFormatla(KASA_FIYAT)}**`,
                    inline: true
                },
                {
                    name: "🎉 Kasa Ödülü",
                    value:
                        `**+${paraFormatla(odul)}**`,
                    inline: true
                },
                {
                    name: "📊 Net Sonuç",
                    value:
                        net >= 0
                            ? `🟢 **+${paraFormatla(net)}**`
                            : `🔴 **${paraFormatla(net)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: false
                }
            );

            return interaction.reply({
                embeds: [embed]
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
                    content:
                        "❌ Hedef kullanıcı bulunamadı.",
                    ephemeral: true
                });
            }

            if (hedefUser.id === userId) {
                return interaction.reply({
                    content:
                        "❌ Kendini soyamazsın.",
                    ephemeral: true
                });
            }

            if (hedefUser.bot) {
                return interaction.reply({
                    content:
                        "❌ Botları soyamazsın.",
                    ephemeral: true
                });
            }

            const kalan =
                cooldownKalan(
                    hesap.sonSoygun,
                    SOYGUN_COOLDOWN
                );

            if (kalan > 0) {
                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "⏳ Soygun Bekleme Süresi",
                            `Bir sonraki soygun için ` +
                            `**${kalanSure(kalan)}** beklemelisin.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const hedef =
                hesapOlustur(
                    data,
                    guildId,
                    hedefUser.id
                );

            hesap.sonSoygun =
                Date.now();

            hesap.istatistik.soygun++;

            if (hedef.para <= 0) {

                verileriKaydet(data);

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "💰 Soygun",
                            `**${hedefUser.username}** kullanıcısının ` +
                            `cüzdanında çalınabilecek para bulunmuyor.`
                        )
                    ]
                });
            }

            const basarili =
                Math.random() < 0.40;

            if (!basarili) {

                const ceza =
                    Math.min(
                        hesap.para,
                        Math.floor(
                            Math.random() *
                            401
                        ) + 100
                    );

                hesap.para -= ceza;
                hesap.toplamHarcanan +=
                    ceza;

                hesap.istatistik.basarisizSoygun++;

                verileriKaydet(data);

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "🚨 Soygun Başarısız",
                            `Soygun girişimin başarısız oldu ve yakalandın.`
                        ).addFields(
                            {
                                name: "💸 Kayıp",
                                value:
                                    `**-${paraFormatla(ceza)}**`,
                                inline: true
                            },
                            {
                                name: "💵 Yeni Bakiye",
                                value:
                                    `**${paraFormatla(hesap.para)}**`,
                                inline: true
                            },
                            {
                                name: "📊 Başarı Şansı",
                                value:
                                    "**%40**",
                                inline: true
                            }
                        )
                    ]
                });
            }

            const miktar =
                Math.min(
                    hedef.para,
                    Math.floor(
                        Math.random() *
                        9001
                    ) + 1000
                );

            hedef.para -= miktar;
            hesap.para += miktar;

            hesap.toplamKazanilan +=
                miktar;

            hesap.istatistik.basari =
                Number(
                    hesap.istatistik.basari || 0
                );

            hesap.istatistik.basari++;

            hesap.istatistik.basariliSoygun++;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💰 Soygun Başarılı!",
                        `Soygun başarıyla tamamlandı.`
                    ).addFields(
                        {
                            name: "🎯 Hedef",
                            value:
                                `${hedefUser}`,
                            inline: true
                        },
                        {
                            name: "💰 Çalınan",
                            value:
                                `**+${paraFormatla(miktar)}**`,
                            inline: true
                        },
                        {
                            name: "💵 Yeni Bakiye",
                            value:
                                `**${paraFormatla(hesap.para)}**`,
                            inline: true
                        },
                        {
                            name: "🎲 Başarı Şansı",
                            value:
                                "**%40**",
                            inline: true
                        },
                        {
                            name: "📊 Başarılı Soygun",
                            value:
                                `**${paraFormatla(
                                    hesap.istatistik.basariliSoygun
                                )}**`,
                            inline: true
                        }
                    )
                ]
            });
        }

        // =================================================
        // GÖREVLER
        // =================================================

        if (komut === "gorevler") {

            const calisma =
                Math.min(
                    hesap.gorevler.calisma,
                    5
                );

            const transfer =
                Math.min(
                    hesap.gorevler.transfer,
                    3
                );

            const marketSayisi =
                Math.min(
                    hesap.gorevler.market,
                    5
                );

            const tamamlanan = [
                calisma >= 5,
                transfer >= 3,
                marketSayisi >= 5
            ].filter(Boolean).length;

            const toplamOdul =
                2000 + 1500 + 1000;

            const embed = embedBaslik(
                "📋 Günlük Görevler",
                `Bugünkü görevlerini tamamlayarak toplam **${paraFormatla(toplamOdul)}** para kazanabilirsin.`
            );

            embed.addFields(
                {
                    name: "💼 Çalış",
                    value:
                        `${gorevDurumu(calisma, 5)}\n` +
                        `🎁 Ödül: **2.000 para**`,
                    inline: true
                },
                {
                    name: "💸 Transfer",
                    value:
                        `${gorevDurumu(transfer, 3)}\n` +
                        `🎁 Ödül: **1.500 para**`,
                    inline: true
                },
                {
                    name: "🛒 Market",
                    value:
                        `${gorevDurumu(marketSayisi, 5)}\n` +
                        `🎁 Ödül: **1.000 para**`,
                    inline: true
                },
                {
                    name: "📊 Günlük İlerleme",
                    value:
                        `**${tamamlanan}/3** görev tamamlandı.\n\n` +
                        `${ilerlemeCubugu(
                            tamamlanan,
                            3,
                            12
                        )}`,
                    inline: false
                },
                {
                    name: "🎁 Ödül Durumu",
                    value:
                        tamamlanan === 3
                            ? "🔥 Tüm görevler tamamlandı! `/ekonomi gorev` kullanabilirsin."
                            : "Görevlerini tamamlamaya devam et.",
                    inline: false
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
            const mesaj = [];

            if (
                hesap.gorevler.calisma >= 5 &&
                !hesap.gorevOdulleri.calisma
            ) {

                hesap.gorevOdulleri.calisma =
                    true;

                odul += 2000;

                mesaj.push(
                    "💼 Çalış görevi → **+2.000**"
                );
            }

            if (
                hesap.gorevler.transfer >= 3 &&
                !hesap.gorevOdulleri.transfer
            ) {

                hesap.gorevOdulleri.transfer =
                    true;

                odul += 1500;

                mesaj.push(
                    "💸 Transfer görevi → **+1.500**"
                );
            }

            if (
                hesap.gorevler.market >= 5 &&
                !hesap.gorevOdulleri.market
            ) {

                hesap.gorevOdulleri.market =
                    true;

                odul += 1000;

                mesaj.push(
                    "🛒 Market görevi → **+1.000**"
                );
            }

            if (odul <= 0) {

                return interaction.reply({
                    embeds: [
                        embedBaslik(
                            "📋 Görev Ödülü",
                            "Şu anda alınabilecek tamamlanmış bir görev ödülün bulunmuyor."
                        )
                    ],
                    ephemeral: true
                });
            }

            hesap.para += odul;
            hesap.toplamKazanilan +=
                odul;

            verileriKaydet(data);

            const embed = embedBaslik(
                "🎁 Görev Ödülleri",
                `Tamamladığın görevlerin ödülleri hesabına aktarıldı.`
            );

            embed.addFields(
                {
                    name: "🏆 Kazanılan Ödüller",
                    value:
                        mesaj.join("\n"),
                    inline: false
                },
                {
                    name: "💰 Toplam Ödül",
                    value:
                        `**+${paraFormatla(odul)}**`,
                    inline: true
                },
                {
                    name: "💵 Yeni Bakiye",
                    value:
                        `**${paraFormatla(hesap.para)}**`,
                    inline: true
                }
            );

            return interaction.reply({
                embeds: [embed]
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

        if (
            yetkiGerekenler.includes(komut) &&
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

        // =================================================
        // GÖREV SIFIRLA
        // =================================================

        if (komut === "gorev-sifirla") {

            const uye =
                interaction.options.getUser("uye");

            if (!uye) {
                return interaction.reply({
                    content:
                        "❌ Kullanıcı bulunamadı.",
                    ephemeral: true
                });
            }

            const hedef =
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            hedef.gorevTarih =
                bugun();

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
                        `**${uye.username}** kullanıcısının günlük görevleri başarıyla sıfırlandı.`
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
                    content:
                        "❌ Botlara ekonomi parası veremezsin.",
                    ephemeral: true
                });
            }

            const hedef =
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            hedef.para += miktar;
            hedef.toplamKazanilan +=
                miktar;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💰 Para Verildi",
                        `Yetkili tarafından ekonomi hesabına para eklendi.`
                    ).addFields(
                        {
                            name: "👤 Kullanıcı",
                            value:
                                `${uye}`,
                            inline: true
                        },
                        {
                            name: "💰 Verilen",
                            value:
                                `**+${paraFormatla(miktar)}**`,
                            inline: true
                        },
                        {
                            name: "💵 Yeni Bakiye",
                            value:
                                `**${paraFormatla(hedef.para)}**`,
                            inline: true
                        },
                        {
                            name: "🛡️ İşlem Yetkilisi",
                            value:
                                `${interaction.user}`,
                            inline: false
                        }
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
                hesapOlustur(
                    data,
                    guildId,
                    uye.id
                );

            const alinabilecek =
                Math.min(
                    hedef.para,
                    miktar
                );

            if (alinabilecek <= 0) {
                return interaction.reply({
                    content:
                        "❌ Kullanıcının cüzdanında alınabilecek para bulunmuyor.",
                    ephemeral: true
                });
            }

            hedef.para -=
                alinabilecek;

            hedef.toplamHarcanan +=
                alinabilecek;

            hesap.para +=
                alinabilecek;

            hesap.toplamKazanilan +=
                alinabilecek;

            verileriKaydet(data);

            return interaction.reply({
                embeds: [
                    embedBaslik(
                        "💸 Para Alındı",
                        `Kullanıcının cüzdanından ekonomi parası alındı.`
                    ).addFields(
                        {
                            name: "👤 Kullanıcı",
                            value:
                                `${uye}`,
                            inline: true
                        },
                        {
                            name: "💸 Alınan",
                            value:
                                `**${paraFormatla(alinabilecek)}**`,
                            inline: true
                        },
                        {
                            name: "💰 Yetkili Cüzdanı",
                            value:
                                `**${paraFormatla(hesap.para)}**`,
                            inline: true
                        },
                        {
                            name: "💵 Kullanıcı Cüzdanı",
                            value:
                                `**${paraFormatla(hedef.para)}**`,
                            inline: true
                        },
                        {
                            name: "🛡️ İşlem Yetkilisi",
                            value:
                                `${interaction.user}`,
                            inline: true
                        }
                    )
                ]
            });
        }

        // =================================================
        // TANIMSIZ
        // =================================================

        return interaction.reply({
            content:
                "❌ Geçersiz ekonomi alt komutu.",
            ephemeral: true
        });

    } catch (error) {

        console.error(
            "❌ Ekonomi komutu hatası:",
            error
        );

        const mesaj =
            "❌ Ekonomi komutunda beklenmeyen bir hata oluştu.";

        if (
            interaction.replied ||
            interaction.deferred
        ) {
            return interaction
                .followUp({
                    content: mesaj,
                    ephemeral: true
                })
                .catch(() => {});
        }

        return interaction
            .reply({
                content: mesaj,
                ephemeral: true
            })
            .catch(() => {});
    }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute
};

