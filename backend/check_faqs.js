const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

const faqEntrySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    question: String,
    answer: String
});
const FaqEntry = mongoose.model('FaqEntry', faqEntrySchema);

const userSchema = new mongoose.Schema({
    fullName: String
});
const User = mongoose.model('User', userSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to", process.env.MONGODB_URI.substring(0, 30) + "...");
    
    try {
        const count = await FaqEntry.countDocuments();
        console.log("Total FAQ entries:", count);
        
        const faqs = await FaqEntry.find().populate('author').limit(5);
        console.log("Sample FAQs retrieved:", faqs.length);
        faqs.forEach(f => {
            console.log(`Q: ${f.question}`);
            console.log(`Author Name: ${f.author ? f.author.fullName : 'NULL'}`);
        });
    } catch (e) {
        console.error("ERROR during check:", e);
    }
    process.exit(0);
}
check();
