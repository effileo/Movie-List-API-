import prismaclient from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [ 'error'],
});

const connectDB = async () => {
    try{
        await prisma.$connect();
        console.log('Database connected successfully');
    }catch(err){
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try{
        await prisma.$disconnect();
        console.log('Database disconnected successfully');
    }catch(err){
        console.error('Database disconnection failed:', err);
        process.exit(1);
    }
};

export { connectDB, disconnectDB };
export default prisma;