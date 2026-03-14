import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoDb, isMongoConfigured, getMongoClient } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const configured = isMongoConfigured();
    const client = await getMongoClient();
    const db = await getMongoDb();
    
    res.json({
      configured,
      connected: !!client,
      dbName: db?.databaseName || 'N/A',
      env: {
        hasUri: !!process.env.MONGODB_URI,
        uriLength: process.env.MONGODB_URI?.length || 0,
        dbEnv: process.env.MONGODB_DB || 'N/A',
        node_env: process.env.NODE_ENV
      },
      message: client ? 'Successfully connected to MongoDB!' : 'Failed to connect. Check Vercel logs for error details.'
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Debug endpoint failed', 
      details: error.message,
      stack: error.stack
    });
  }
}
