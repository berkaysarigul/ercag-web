const prisma = require('../lib/prisma');

const getAllSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

const getPublicSettings = async (req, res) => {
    try {
        // Filter sensitive settings if needed, or stick to generic ones
        const settings = await prisma.systemSetting.findMany();
        // Convert array to key-value object for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, key2: value2 } or array

        // Handle array of updates or object
        const updatePromises = Object.keys(updates).map(key => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(updates[key]) },
                create: {
                    key,
                    value: String(updates[key]),
                    type: 'text', // Default, logic to refine type needed if critical
                    group: 'general'
                }
            });
        });

        await Promise.all(updatePromises);
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

// Seeding/Initializing defaults if missing
const initializeDefaults = async () => {
    const defaults = [
        { key: 'site_title', value: 'Erçağ Kırtasiye', group: 'general' },
        { key: 'site_phone', value: '0212 123 45 67', group: 'contact' },
        { key: 'site_address', value: 'Atatürk Caddesi No: 123, Merkez, İstanbul', group: 'contact' },
        { key: 'social_instagram', value: 'https://instagram.com/ercag', group: 'social' },
    ];

    for (const d of defaults) {
        await prisma.systemSetting.upsert({
            where: { key: d.key },
            update: {},
            create: d
        });
    }
};

const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        // Update or create site_logo setting
        await prisma.systemSetting.upsert({
            where: { key: 'site_logo' },
            update: { value: logoUrl },
            create: {
                key: 'site_logo',
                value: logoUrl,
                type: 'image',
                group: 'general'
            }
        });

        res.json({ message: 'Logo uploaded successfully', logoUrl });
    } catch (error) {
        console.error('Logo Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
};

module.exports = { getAllSettings, getPublicSettings, updateSettings, initializeDefaults, uploadLogo };
