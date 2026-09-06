import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.trim() === '') {
        console.log('\n===========================================================');
        console.log('⚠️  [MongoDB Notice]: MONGODB_URI is not configured in server/.env');
        console.log('👉 Please paste your MongoDB Atlas connection string in server/.env:');
        console.log('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/capgemini_exceller');
        console.log('   (Server running in offline/standby DB mode)');
        console.log('===========================================================\n');
        return false;
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8000,
        });

        console.log(`\n✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
        console.log('👉 Please check your IP whitelist in MongoDB Atlas Network Access and credentials in server/.env.\n');
        return false;
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB Runtime Error: ${err.message}`);
});
