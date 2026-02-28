const axios = require('axios');

const sendWhatsAppMessage = async (phone, message, templateName = null) => {
    try {
        if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.log('======== WHATSAPP MOCK ========');
            console.log(`To: ${phone}`);
            console.log(`Message: ${message}`);
            console.log('================================');
            return true;
        }

        // Telefon numarasını normalize et (05xx -> 905xx)
        let normalizedPhone = phone.replace(/\s|-|\(|\)/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '90' + normalizedPhone.substring(1);
        }
        if (!normalizedPhone.startsWith('90')) {
            normalizedPhone = '90' + normalizedPhone;
        }

        // Template mesajı veya serbest mesaj
        const payload = templateName ? {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'tr' },
                components: [{ type: 'body', parameters: [{ type: 'text', text: message }] }]
            }
        } : {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'text',
            text: { body: message }
        };

        await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            payload,
            { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`, 'Content-Type': 'application/json' } }
        );

        console.log(`WhatsApp sent to ${normalizedPhone}`);
        return true;
    } catch (error) {
        console.error('WhatsApp Error:', error?.response?.data || error.message);
        return false;
    }
};

// Hazır mesaj şablonları
const sendOrderConfirmation = async (phone, orderId, pickupCode) => {
    const message = `🛒 Siparişiniz alındı!\n\nSipariş No: #${orderId}\nTeslimat Kodu: ${pickupCode}\n\nSiparişiniz hazır olduğunda size tekrar bilgi vereceğiz.\n\n— Erçağ Kırtasiye`;
    return sendWhatsAppMessage(phone, message);
};

const sendOrderReady = async (phone, orderId, pickupCode) => {
    const message = `✅ Siparişiniz HAZIR!\n\nSipariş No: #${orderId}\nTeslimat Kodu: ${pickupCode}\n\nMağazamıza gelip kodunuzu göstererek teslim alabilirsiniz.\n\n— Erçağ Kırtasiye`;
    return sendWhatsAppMessage(phone, message);
};

const sendOrderCompleted = async (phone, orderId) => {
    const message = `🎉 Sipariş #${orderId} teslim edildi.\n\nBizi tercih ettiğiniz için teşekkür ederiz! Ürünlerimizi değerlendirmeyi unutmayın.\n\n— Erçağ Kırtasiye`;
    return sendWhatsAppMessage(phone, message);
};

const sendSpinCode = async (phone, orderId, code, spinUrl) => {
    const message = `🎁 Tebrikler!\n\nSiparişiniz (#${orderId}) üzerinden Hediye Çarkı çevirme hakkı kazandınız!\n\nÇark Kodunuz: ${code}\nHemen Çevir: ${spinUrl}\n\n— Erçağ Kırtasiye`;
    return sendWhatsAppMessage(phone, message);
};

module.exports = { sendWhatsAppMessage, sendOrderConfirmation, sendOrderReady, sendOrderCompleted, sendSpinCode };
