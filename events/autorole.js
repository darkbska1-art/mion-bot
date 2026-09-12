const {
    PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "otorol.json");

function loadData() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "{}", "utf8");
    }

    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return {};
    }
}

function register(client) {

    client.on("guildMemberAdd", async member => {

        try {

            const data = loadData();
            const guildData = data[member.guild.id];

            if (!guildData || guildData.enabled !== true) {
                return;
            }

            const roleId = member.user.bot
                ? guildData.botRole
                : guildData.memberRole;

            if (!roleId) {
                return;
            }

            const role = member.guild.roles.cache.get(roleId);

            if (!role) {
                console.log(
                    `⚠️ Otorol bulunamadı: ${roleId}`
                );
                return;
            }

            const botMember = member.guild.members.me;

            if (!botMember) {
                return;
            }

            if (!botMember.permissions.has(
                PermissionsBitField.Flags.ManageRoles
            )) {
                console.log(
                    `❌ ${member.guild.name} → Botta Rolleri Yönet yetkisi yok.`
                );
                return;
            }

            if (role.managed) {
                console.log(
                    `❌ ${member.guild.name} → ${role.name} yönetilen bir rol.`
                );
                return;
            }

            if (
                role.position >=
                botMember.roles.highest.position
            ) {
                console.log(
                    `❌ ${member.guild.name} → ${role.name} rolü botun rolünün üstünde.`
                );
                return;
            }

            await member.roles.add(
                role,
                "Mion Otorol Sistemi"
            );

            console.log(
                `✅ Otorol verildi: ${member.user.tag} → ${role.name}`
            );

        } catch (error) {

            console.error(
                "❌ Otorol event hatası:",
                error
            );

        }

    });

}

module.exports = {
    register
};