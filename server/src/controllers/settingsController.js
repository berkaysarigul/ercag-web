const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert array to object for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expects object like { "storeOpen": "true", "prepTime": "20" }

        const promises = Object.keys(updates).map(key =>
            prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(updates[key]) },
                create: { key, value: String(updates[key]) }
            })
        );

        await Promise.all(promises);

        res.json({ message: 'Ayarlar güncellendi' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
