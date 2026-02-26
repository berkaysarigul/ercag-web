const nodemailer = require('nodemailer');
const axios = require('axios');

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
        if (!process.env.NETGSM_USERCODE || !process.env.NETGSM_PASSWORD) {
            console.log('======== SMS MOCK ========');
            console.log(`To: ${phone}`);
            console.log(`Message: ${message}`);
            console.log('==========================');
            return { success: true, mock: true };
        }

        // Telefon numarasını normalize et
        let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '90' + normalizedPhone.substring(1);
        }
        if (!normalizedPhone.startsWith('90')) {
            normalizedPhone = '90' + normalizedPhone;
        }

        const params = new URLSearchParams({
            usercode: process.env.NETGSM_USERCODE,
            password: process.env.NETGSM_PASSWORD,
            gsmno: normalizedPhone,
            message: message,
            msgheader: process.env.NETGSM_HEADER || 'ERCAGKIRT',
            dil: 'TR'
        });

        const response = await axios.get(
            `https://api.netgsm.com.tr/sms/send/get?${params.toString()}`
        );

        // NetGSM başarılı yanıtlar "00" veya "01" ile başlar
        const resultCode = String(response.data).split(' ')[0];
        if (['00', '01', '02'].includes(resultCode)) {
            console.log(`SMS sent to ${normalizedPhone}: ${resultCode}`);
            return { success: true };
        } else {
            console.error(`SMS failed: ${response.data}`);
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('SMS Error:', error.message);
        return { success: false, error: error.message };
    }
};

const emailTemplate = (title, content, ctaText = null, ctaUrl = null) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#264a3d,#1b3529);border-radius:16px 16px 0 0;padding:30px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">Erçağ Kırtasiye</h1>
      <p style="color:rgba(255,255,255,0.7);margin:5px 0 0;font-size:13px;">Tıkla & Gel Al</p>
    </div>
    <div style="background:white;padding:30px;border:1px solid #e2e8f0;border-top:none;">
      <h2 style="color:#0f172a;margin:0 0 15px;font-size:20px;">${title}</h2>
      ${content}
      ${ctaText && ctaUrl ? `
        <div style="text-align:center;margin:25px 0;">
          <a href="${ctaUrl}" style="background-color:#264a3d;color:white;padding:12px 30px;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;display:inline-block;">${ctaText}</a>
        </div>
      ` : ''}
    </div>
    <div style="border-radius:0 0 16px 16px;background:#f2f7f5;padding:20px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
      <p style="color:#64748b;font-size:12px;margin:0;">Erçağ Kırtasiye</p>
      <p style="color:#94a3b8;font-size:11px;margin:5px 0 0;">Bu email otomatik gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`;

const sendOrderStatusNotification = async (orderId, status, userEmail, userPhone, pickupCode) => {
    let title, content, smsMessage;

    switch (status) {
        case 'PREPARING':
            title = 'Siparişiniz Hazırlanıyor 📦';
            content = `<p style="color:#334155;">Sipariş <strong>#${orderId}</strong> onaylandı ve ekibimiz tarafından hazırlanmaya başlandı.</p>
                       <p style="color:#334155;">Hazır olduğunda size tekrar bilgi vereceğiz.</p>`;
            smsMessage = `Siparisiniz #${orderId} hazirlaniyor. Hazir olunca haber verecegiz. - Ercag Kirtasiye`;
            break;
        case 'READY':
            title = 'Siparişiniz HAZIR! ✅';
            content = `<p style="color:#334155;">Sipariş <strong>#${orderId}</strong> hazırlandı ve sizi bekliyor!</p>
                       <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                         <p style="color:#64748b;font-size:13px;margin:0 0 5px;">Teslimat Kodunuz</p>
                         <p style="color:#059669;font-size:36px;font-weight:800;letter-spacing:4px;margin:0;">${pickupCode}</p>
                       </div>
                       <p style="color:#334155;">Bu kodu mağaza kasasında göstererek ürünlerinizi teslim alabilirsiniz.</p>`;
            smsMessage = `Siparisiniz #${orderId} HAZIR! Teslim kodunuz: ${pickupCode}. Magazamizdan teslim alabilirsiniz. - Ercag Kirtasiye`;
            break;
        case 'COMPLETED':
            title = 'Siparişiniz Teslim Edildi 🎉';
            content = `<p style="color:#334155;">Sipariş <strong>#${orderId}</strong> başarıyla teslim edildi.</p>
                       <p style="color:#334155;">Bizi tercih ettiğiniz için teşekkür ederiz! Ürünlerimizi değerlendirmeyi unutmayın.</p>`;
            smsMessage = `Siparisiniz #${orderId} teslim edildi. Bizi tercih ettiginiz icin tesekkurler! - Ercag Kirtasiye`;
            break;
        case 'CANCELLED':
            title = 'Siparişiniz İptal Edildi';
            content = `<p style="color:#334155;">Sipariş <strong>#${orderId}</strong> iptal edildi.</p>
                       <p style="color:#334155;">Herhangi bir sorunuz varsa mağazamızla iletişime geçebilirsiniz.</p>`;
            smsMessage = `Siparisiniz #${orderId} iptal edildi. Sorulariniz icin magazamizi arayabilirsiniz. - Ercag Kirtasiye`;
            break;
        default:
            title = `Sipariş Durumu: ${status}`;
            content = `<p style="color:#334155;">Sipariş <strong>#${orderId}</strong> durumu güncellendi: ${status}</p>`;
            smsMessage = `Siparisiniz #${orderId} durumu: ${status}. - Ercag Kirtasiye`;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Email gönder
    if (userEmail) {
        const html = emailTemplate(title, content, 'Siparişimi Görüntüle', `${frontendUrl}/profile?tab=orders`);
        await sendEmail(userEmail, title, html);
    }

    // SMS gönder
    if (userPhone) {
        await sendSMS(userPhone, smsMessage);
    }
};

const sendStockAlertNotification = async (productName, userEmail) => {
    const title = `Stok Geldi: ${productName}`;
    const content = `<p style="color:#334155;">Beklediğiniz <strong>${productName}</strong> tekrar stoklarımıza girdi.</p>
                     <p style="color:#334155;">Tükenmeden almak için hemen sitemizi ziyaret edin.</p>`;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const html = emailTemplate(title, content, 'Ürüne Git', `${frontendUrl}/products`);

    await sendEmail(userEmail, title, html);
};

module.exports = {
    sendEmail,
    sendSMS,
    sendOrderStatusNotification,
    sendStockAlertNotification
};
