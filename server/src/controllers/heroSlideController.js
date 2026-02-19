const prisma = require('../lib/prisma');
const fs = require('fs/promises');
const path = require('path');

const getAllSlides = async (req, res) => {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(slides);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch slides' });
    }
};

const getActiveSlides = async (req, res) => {
    try {
        const slides = await prisma.heroSlide.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
        res.json(slides);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch active slides' });
    }
};

const createSlide = async (req, res) => {
    try {
        const { title, subtitle, description, link, order, isActive } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const slide = await prisma.heroSlide.create({
            data: {
                title,
                subtitle,
                description,
                link,
                imageUrl: file.filename,
                order: order ? parseInt(order) : 0,
                isActive: isActive === 'true' || isActive === true
            }
        });
        res.status(201).json(slide);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create slide' });
    }
};

const updateSlide = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, description, link, order, isActive } = req.body;
        const file = req.file;

        const data = {
            title,
            subtitle,
            description,
            link,
            order: order ? parseInt(order) : undefined,
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined
        };

        if (file) {
            data.imageUrl = file.filename;
            // Optionally delete old image here
        }

        const slide = await prisma.heroSlide.update({
            where: { id: parseInt(id) },
            data
        });
        res.json(slide);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update slide' });
    }
};

const deleteSlide = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.heroSlide.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Slide deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete slide' });
    }
};

module.exports = { getAllSlides, getActiveSlides, createSlide, updateSlide, deleteSlide };
