"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStore = saveStore;
exports.getToken = getToken;
const prismaClient_1 = require("./prismaClient");
async function saveStore(shop, accessToken) {
    return prismaClient_1.prisma.store.upsert({
        where: { shop },
        create: {
            shop,
            accessToken,
        },
        update: {
            accessToken,
        },
    });
}
async function getToken(shop) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop },
        select: { accessToken: true },
    });
    return store?.accessToken ?? null;
}
