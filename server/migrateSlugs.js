const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({ slug: { $exists: false } });
        console.log(`Found ${products.length} products to migrate`);

        for (const product of products) {
            // The pre-validate hook will handle slug generation if we just save it
            // but we need to trigger it.
            await product.save();
            console.log(`Migrated: ${product.title} -> ${product.slug}`);
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
