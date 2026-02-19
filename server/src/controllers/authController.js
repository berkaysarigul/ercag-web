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

        // 2FA Check
        if (user.twoFactorEnabled && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'STAFF')) {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorCode: code, twoFactorCodeExpires: expires }
            });

            try {
                // Send email
                const { sendEmail } = require('../services/notificationService');
                if (user.email) {
                    await sendEmail(
                        user.email,
                        'Giriş Doğrulama Kodu (2FA)',
                        `<p>Giriş kodunuz: <strong>${code}</strong></p><p>Bu kod 10 dakika geçerlidir.</p>`
                    );
                } else {
                    // If no email, maybe fallback to something else or just error?
                    // For now, let's assume admin has email.
                    return res.status(400).json({ message: '2FA aktif ancak email adresi tanımlı değil. Yönetici ile iletişime geçin.' });
                }
            } catch (emailError) {
                console.error('2FA Email Error:', emailError);
                return res.status(500).json({ message: 'Doğrulama kodu gönderilemedi.' });
            }

            return res.json({ require2FA: true, userId: user.id, message: 'Doğrulama kodu email adresinize gönderildi.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Audit Log
        const { logAudit } = require('../services/auditService');
        await logAudit(user.id, 'auth.login', 'User', user.id, 'Başarılı giriş', req.ip);

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;

        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        if (user.twoFactorCode !== code || !user.twoFactorCodeExpires || new Date() > user.twoFactorCodeExpires) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
        }

        // Clear code
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorCodeExpires: null }
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        // Audit Log
        const { logAudit } = require('../services/auditService');
        await logAudit(user.id, 'auth.login_2fa', 'User', user.id, '2FA ile başarılı giriş', req.ip);

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const toggle2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { enabled } = req.body;

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: enabled }
        });

        // Audit
        const { logAudit } = require('../services/auditService');
        await logAudit(userId, 'auth.toggle_2fa', 'User', userId, { enabled }, req.ip);

        res.json({ message: `İki faktörlü doğrulama ${enabled ? 'açıldı' : 'kapatıldı'}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'İşlem başarısız' });
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

        await sendEmail(
            email,
            'Şifre Sıfırlama Kodu',
            `<p>Şifre sıfırlama kodunuz: <strong>${resetCode}</strong></p><p>Bu kod 15 dakika geçerlidir.</p>`
        );

        res.json({ message: 'Eğer bu email kayıtlıysa, şifre sıfırlama kodu gönderildi.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.resetPasswordToken !== code || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
        }

        res.json({ message: 'Kod doğrulandı.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.resetPasswordToken !== code || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
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

        res.json({ message: 'Şifreniz başarıyla güncellendi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, verify2FA, toggle2FA, forgotPassword, verifyResetCode, resetPassword };
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
