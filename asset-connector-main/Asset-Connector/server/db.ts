import { MongoClient, Collection, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "tiryaq";

let _db: Db | null = null;
let _connectPromise: Promise<Db> | null = null;

async function _connect(): Promise<Db> {
  const client = new MongoClient(MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  await client.connect();
  const database = client.db(DB_NAME);
  await _ensureIndexes(database);
  console.log("[MongoDB] Connected to", DB_NAME);
  return database;
}

async function _ensureIndexes(database: Db) {
  const otps = database.collection("otps");
  await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await otps.createIndex({ phone: 1 });

  const users = database.collection("users");
  await users.createIndex({ phone: 1 }, { unique: true });

  const links = database.collection("telegram_links");
  await links.createIndex({ phone: 1 }, { unique: true });
  await links.createIndex({ chatId: 1 }, { unique: true });
}

export function connectDB(): Promise<Db> {
  if (_db) return Promise.resolve(_db);
  if (_connectPromise) return _connectPromise;
  _connectPromise = _connect().then((db) => {
    _db = db;
    return db;
  });
  return _connectPromise;
}

export async function getDB(): Promise<Db> {
  return connectDB();
}

export async function getUsersCol(): Promise<Collection> {
  const db = await getDB();
  return db.collection("users");
}

export async function getOtpsCol(): Promise<Collection> {
  const db = await getDB();
  return db.collection("otps");
}

export async function getTelegramLinksCol(): Promise<Collection> {
  const db = await getDB();
  return db.collection("telegram_links");
}
