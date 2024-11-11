// controllers/chatController.js
const Product = require('../models/Product');
const { Conversation } = require('../models/Chat');

const searchMappings = {
    watch: ["watch", "smartwatch", "wearable"],
    headphone: ["earbuds", "headphones", "earphones"],
    power: ["charger", "battery", "power bank"],
    deal: ["sale", "discount", "offer"],
    audio: ["earbuds", "headphones", "sound", "music"],
    // Add more mappings based on your categories
};

const findRelevantProducts = async (query) => {
    const searchTerms = query.toLowerCase().split(" ");
    const productMatches = new Set();

    for (const term of searchTerms) {
        const cleanTerm = term.replace(/[.,!?]/g, "").trim();
        if (
            cleanTerm.length < 2 ||
            ["show", "me", "a", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by"].includes(cleanTerm)
        ) {
            continue;
        }

        const mappedTerms = Object.entries(searchMappings).find(([key]) =>
            cleanTerm.includes(key) || key.includes(cleanTerm)
        )?.[1] || [];

        // Modified to work with your schema
        const products = await Product.find({
            isDeleted: false,
            $or: [
                { title: { $regex: cleanTerm, $options: 'i' } },
                { description: { $regex: cleanTerm, $options: 'i' } }
            ]
        }).populate('category').populate('brand');

        products.forEach(product => productMatches.add(product));
    }

    return Array.from(productMatches);
};

const findDiscountedProducts = async (query) => {
    const searchTerms = query.toLowerCase().split(" ");
    const productMatches = new Set();

    for (const term of searchTerms) {
        const cleanTerm = term.replace(/[.,!?]/g, "").trim();
        if (cleanTerm.length < 2) continue;

        const products = await Product.find({
            isDeleted: false,
            discountPercentage: { $gt: 0 },
            $or: [
                { title: { $regex: cleanTerm, $options: 'i' } },
                { description: { $regex: cleanTerm, $options: 'i' } }
            ]
        }).populate('category').populate('brand');

        products.forEach(product => productMatches.add(product));
    }

    return Array.from(productMatches);
};

const generateResponse = (query, products, discountedProducts) => {
    const searchTerms = query.toLowerCase();

    if (searchTerms.includes("deal") || searchTerms.includes("sale") || searchTerms.includes("discount")) {
        return discountedProducts.length > 0
            ? `I found ${discountedProducts.length} products with special discounts that might interest you! Check these out:`
            : `I don't see any current deals matching your search, but let me show you our available products instead.`;
    }

    if (products.length > 0) {
        return `I found ${products.length} ${products.length === 1 ? "item" : "items"} that might interest you! ${
            products.length === 1
                ? `The ${products[0].title} would be perfect for you.`
                : `Here are some items that match what you're looking for.`
        } Let me know if you'd like more details about any of them.`;
    }

    return "I couldn't find exact matches for your search, but I'd be happy to help you explore other options. Could you tell me more about what specific features or type of product you're looking for?";
};

exports.handleChat = async (req, res) => {
    try {
        const { message, userId } = req.body;

        const relevantProducts = await findRelevantProducts(message);
        const discountedProducts = await findDiscountedProducts(message);

        const response = generateResponse(message, relevantProducts, discountedProducts);

        // Save conversation
        const conversation = await Conversation.findOne({ userId }).sort({ createdAt: -1 });
        if (conversation) {
            conversation.messages.push(
                { content: message, role: 'user' },
                { content: response, role: 'assistant' }
            );
            conversation.lastUpdated = new Date();
            await conversation.save();
        } else {
            await Conversation.create({
                userId,
                messages: [
                    { content: message, role: 'user' },
                    { content: response, role: 'assistant' }
                ]
            });
        }

        res.json({
            message: response,
            products: relevantProducts,
            discountedProducts: discountedProducts
        });
    } catch (error) {
        console.error('Error in chat handler:', error);
        res.status(500).json({
            message: "I'm sorry, I encountered an error. Please try again.",
            products: [],
            discountedProducts: []
        });
    }
};