const { z } = require('zod');

// Auth Schemas
const registerSchema = z.object({
    name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır').max(100),
    phone: z.string().regex(/^(05\d{9})$/, 'Geçerli bir Türkiye telefon numarası giriniz (05xxxxxxxxx)'),
    password: z.string()
        .min(6, 'Şifre en az 6 karakter olmalıdır')
        .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
        .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().or(z.literal('')),
    consent: z.boolean().refine(val => val === true, 'Üyelik sözleşmesini kabul etmelisiniz')
});

const loginSchema = z.object({
    identifier: z.string().min(1, 'Telefon veya E-posta gereklidir'),
    password: z.string().min(1, 'Şifre gereklidir')
});

// Product Schemas
const createProductSchema = z.object({
    name: z.string().min(1, 'Ürün adı gereklidir').max(200),
    description: z.string().max(5000).optional().default(''),
    price: z.preprocess((val) => parseFloat(val), z.number().positive('Fiyat pozitif olmalıdır')),
    categoryId: z.preprocess((val) => parseInt(val), z.number().int().positive('Kategori seçilmelidir')),
    stock: z.preprocess((val) => parseInt(val), z.number().int().min(0).default(0)),
    isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
    sku: z.string().max(50).optional().or(z.literal('')),
    barcode: z.string().max(50).optional().or(z.literal('')),
    lowStockThreshold: z.preprocess((val) => val ? parseInt(val) : 5, z.number().int().min(0).default(5)),
});

// Order Schemas
const createOrderSchema = z.object({
    items: z.array(z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().positive()
    })).min(1, 'Sepet boş olamaz'),
    fullName: z.string().min(2, 'Ad Soyad gereklidir'),
    phoneNumber: z.string().min(10, 'Telefon numarası gereklidir'),
    email: z.string().email().optional().or(z.literal('')),
    note: z.string().max(500).optional(),
    pickupRequestedTime: z.string().optional(),
    couponCode: z.string().optional()
});

// Settings Schema
const updateSettingsSchema = z.record(z.string(), z.any()); // Simple record check, specific keys checked in controller logic if needed

// Bulk Import Row Schema
const bulkProductRowSchema = z.object({
    name: z.string().min(1, 'Ürün adı gereklidir'),
    description: z.string().optional().default(''),
    price: z.preprocess((val) => parseFloat(val), z.number().positive('Fiyat pozitif olmalıdır')),
    categoryName: z.string().min(1, 'Kategori adı gereklidir'),
    stock: z.preprocess((val) => parseInt(val) || 0, z.number().int().min(0).default(0)),
    sku: z.string().optional().or(z.literal('')),
    barcode: z.string().optional().or(z.literal('')),
    lowStockThreshold: z.preprocess((val) => val ? parseInt(val) : 5, z.number().int().min(0).default(5)),
});

module.exports = {
    registerSchema,
    loginSchema,
    createProductSchema,
    createOrderSchema,
    updateSettingsSchema,
    bulkProductRowSchema
};
