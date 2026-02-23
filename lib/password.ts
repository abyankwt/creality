import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hash a password using scrypt and return a combined string: `salt:hash`
 */
export const hashPassword = (password: string): string => {
    const salt = randomBytes(SALT_LENGTH).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
};

/**
 * Verify a password against a stored `salt:hash` string
 */
export const verifyPassword = (password: string, stored: string): boolean => {
    const [salt, storedHash] = stored.split(":");
    if (!salt || !storedHash) return false;

    const hash = scryptSync(password, salt, KEY_LENGTH);
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (hash.length !== storedBuffer.length) return false;
    return timingSafeEqual(hash, storedBuffer);
};
