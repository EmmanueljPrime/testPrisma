const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Nettoyer la base avant et après les tests
beforeAll(async () => {
    await prisma.client.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('User Tests', () => {
    it('Should create a user as a client', async () => {
        const user = await prisma.user.create({
            data: {
                email: 'client@example.com',
                username: 'clientuser',
                password: 'securepassword',
                role: 'CLIENT',
                client: {
                    create: {
                        firstname: 'John',
                        lastname: 'Doe',
                    },
                },
            },
            include: { client: true },
        });

        // Vérifications
        expect(user.role).toBe('CLIENT');
        expect(user.client).not.toBeNull(); // Relation client doit être présente
        expect(user.client.firstname).toBe('John');
        expect(user.seller).toBeUndefined(); // Relation seller doit être absente
    });

    it('Should create a user as a seller', async () => {
        const user = await prisma.user.create({
            data: {
                email: 'seller@example.com',
                username: 'selleruser',
                password: 'securepassword',
                role: 'SELLER',
                seller: {
                    create: {
                        business_name: 'My Business',
                    },
                },
            },
            include: { seller: true },
        });

        // Vérifications
        expect(user.role).toBe('SELLER');
        expect(user.seller).not.toBeNull(); // Relation seller doit être présente
        expect(user.seller.business_name).toBe('My Business');
        expect(user.client).toBeUndefined(); // Relation client doit être absente
    });

    it('Should fail to create a user without a role', async () => {
        await expect(
            prisma.user.create({
                data: {
                    email: 'norole@example.com',
                    username: 'noroleuser',
                    password: 'securepassword',
                },
            })
        ).rejects.toThrow(); // Doit lever une erreur car le rôle est obligatoire
    });

    it('Should fail to create a user with an invalid role', async () => {
        await expect(
            prisma.user.create({
                data: {
                    email: 'invalidrole@example.com',
                    username: 'invalidroleuser',
                    password: 'securepassword',
                    role: 'INVALID_ROLE', // Rôle non défini dans l'énumération
                },
            })
        ).rejects.toThrow(); // Doit lever une erreur car le rôle est invalide
    });
});