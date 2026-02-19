const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ message: 'Lütfen Telefon, Ad Soyad ve Şifre giriniz.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu telefon numarası ile kayıtlı kullanıcı var.' });
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Bu email adresi ile kayıtlı kullanıcı var.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email || null,
                password: hashedPassword,
                name,
                phone,
            },
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        let { identifier, email, phone, password } = req.body; // identifier can be email or phone
        identifier = identifier || email || phone;

        if (!identifier) {
            return res.status(400).json({ message: 'Lütfen Email veya Telefon giriniz.' });
        }

        // Try to find user by Email or Phone
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı bulunamadı (Telefon veya Email kontrol edin)' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Geçersiz şifre' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const crypto = require('crypto');
const { sendEmail } = require('../services/notificationService');

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email adresi gerekli.' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Security: Don't reveal if user exists. Just say email sent.
            // But for simple usability, let's just return success anyway.
            return res.json({ message: 'Eğer bu email kayıtlıysa, şifre sıfırlama kodu gönderildi.' });
        }

        // Generate 6-digit code
        const resetCode = crypto.randomInt(100000, 999999).toString();
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetCode,
                resetPasswordExpires: resetExpires
            }
        });

        // Send Email
        const emailSubject = 'Şifre Sıfırlama Kodu - Erçağ Kırtasiye';
        const emailBody = `
            <h2>Şifre Sıfırlama Talebi</h2>
            <p>Merhaba ${user.name},</p>
            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Kodunuz: <strong style="font-size: 24px;">${resetCode}</strong></p>
            <p>Bu kod 15 dakika geçerlidir.</p>
        `;

        await sendEmail(user.email, emailSubject, emailBody);

        res.json({ message: 'Sıfırlama kodu email adresinize gönderildi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'İşlem başarısız.' });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Bilgiler eksik.' });

        const user = await prisma.user.findFirst({
            where: {
                email,
                resetPasswordToken: code,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
        }

        res.json({ message: 'Kod doğrulandı.', valid: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Doğrulama hatası.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) return res.status(400).json({ message: 'Tüm alanlar gerekli.' });

        const user = await prisma.user.findFirst({
            where: {
                email,
                resetPasswordToken: code,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz işlem veya süresi dolmuş.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Şifre sıfırlama hatası.' });
    }
};

module.exports = { register, login, forgotPassword, verifyResetCode, resetPassword };
