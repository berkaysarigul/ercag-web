const nodemailer = require('nodemailer');

// Configure transporter
// In production, these should come from process.env
// For now we will use console log if envs are missing
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log('======== EMAIL MOCK (No Credentials Provided) ========');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('--- Content ---');
            console.log(htmlContent);
            console.log('============================');
            return true;
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Erçağ Kırtasiye" <noreply@ercagkirtasiye.com>',
            to,
            subject,
            html: htmlContent,
        });

        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendSMS = async (phone, message) => {
    try {
        // Placeholder for Netgsm or other SMS provider
        if (!process.env.SMS_API_KEY) {
            console.log('======== SMS MOCK ========');
            console.log(`To: ${phone}`);
            console.log(`Message: ${message}`);
            console.log('==========================');
            return true;
        }

        // Implementation for real SMS provider would go here using axios
        // await axios.post('https://api.netgsm.com.tr/...', { ... });
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

const sendOrderStatusNotification = async (orderId, status, userEmail, userPhone) => {
    let subject = `Sipariş Durumu: ${status}`;
    let message = `Siparişiniz ${status} durumuna güncellendi.`;

    // Customize messages based on status
    switch (status) {
        case 'CONFIRMED':
            message = `Siparişiniz (#${orderId}) onaylandı ve hazırlanıyor.`;
            break;
        case 'READY':
            message = `Siparişiniz (#${orderId}) HAZIR! Mağazamızdan teslim alabilirsiniz.`;
            subject = 'SİPARİŞİNİZ HAZIR! 📦';
            break;
        case 'COMPLETED':
            message = `Siparişiniz (#${orderId}) teslim edildi. Bizi tercih ettiğiniz için teşekkürler!`;
            subject = 'Sipariş Teslim Edildi ✅';
            break;
    }

    // Send Email
    const html = `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #2563EB;">${subject}</h2>
        <p>${message}</p>
        <p>Sipariş Detayları için hesabınızı ziyaret edin.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Erçağ Kırtasiye</p>
    </div>`;

    await sendEmail(userEmail, subject, html);

    // Send SMS (Short message)
    if (userPhone) {
        await sendSMS(userPhone, message);
    }
};

const sendStockAlertNotification = async (productName, userEmail) => {
    const subject = `Stok Geldi: ${productName}`;
    const html = `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #10B981;">Beklediğiniz Ürün Stokta! 🎉</h2>
        <p><strong>${productName}</strong> tekrar stoklarımıza girdi.</p>
        <p>Tükenmeden almak için hemen sitemizi ziyaret edin.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ürüne Git</a>
    </div>`;

    await sendEmail(userEmail, subject, html);
};

module.exports = {
    sendEmail,
    sendSMS,
    sendOrderStatusNotification,
    sendStockAlertNotification
};
