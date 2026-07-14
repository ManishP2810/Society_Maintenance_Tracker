const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/society_maintenance_tracker';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Define temporary schemas to execute delete queries
    const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
    const Notice = mongoose.model('Notice', new mongoose.Schema({}, { strict: false }));

    // 1. Delete database entries
    console.log('Deleting all complaints from database...');
    const complaintResult = await Complaint.deleteMany({});
    console.log(`✅ Deleted ${complaintResult.deletedCount} complaints.`);

    console.log('Deleting all notices from database...');
    const noticeResult = await Notice.deleteMany({});
    console.log(`✅ Deleted ${noticeResult.deletedCount} notices.`);

    // 2. Delete static files inside backend/uploads/ (retaining .gitkeep)
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`Checking uploads directory: ${uploadsDir}`);
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFilesCount++;
        }
      }
      console.log(`✅ Deleted ${deletedFilesCount} uploaded image files.`);
    }

    console.log('\n🎉 Database and uploads reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    process.exit(1);
  }
};

clearDatabase();
