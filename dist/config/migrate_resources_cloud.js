"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const migrate = async () => {
    try {
        console.log('Running migration: Add public_id to resources');
        await db_1.default.query('ALTER TABLE resources ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);');
        console.log('Migration successful');
        process.exit(0);
    }
    catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};
migrate();
