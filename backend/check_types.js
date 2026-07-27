const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

const faqEntrySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    question: String,
    answer: String,
    createdAt: Date
});
const FaqEntry = mongoose.model('FaqEntry', faqEntrySchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const faqs = await FaqEntry.find().sort({_id: -1}).limit(5);
    faqs.forEach(f => {
        console.log(`Q: ${f.question}`);
        console.log(`createdAt: ${f.createdAt} (type: ${typeof f.createdAt})`);
    });
    process.exit(0);
}
check();
