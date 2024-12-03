const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Nettoyer la base avant et après les tests
beforeAll(async () => {
    await prisma.client.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
});

beforeEach(async () => {
    await prisma.client.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Create User Tests', () => {
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

    it('Should fail to create a user with an existing email', async () => {
        const user1 = await prisma.user.create({
            data: {
                email: 'client@example.com',
                username: 'clientuser1',
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

        await expect(
            prisma.user.create({
                data: {
                    email: 'client@example.com',
                    username: 'clientuser2',
                    password: 'securepassword',
                    role: 'CLIENT',
                    client: {
                        create: {
                            firstname: 'Johnny',
                            lastname: 'Dowee',
                        },
                    },
                },
            include: { client: true },
            })
        ).rejects.toThrow(/Unique constraint failed on the fields: \(`email`\)/);

    })

    it('Should fail to create a user with an existing username', async () => {
        const user1 = await prisma.user.create({
            data: {
                email: 'client1@example.com',
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

        await expect(
            prisma.user.create({
                data: {
                    email: 'client2@example.com',
                    username: 'clientuser',
                    password: 'securepassword',
                    role: 'CLIENT',
                    client: {
                        create: {
                            firstname: 'Johnny',
                            lastname: 'Dowee',
                        },
                    },
                },
                include: { client: true },
            })
        ).rejects.toThrow(/Unique constraint failed on the fields: \(`username`\)/);
    })

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

describe('Get User Tests', () => {
    it('Should return a list of users', async () => {

        await prisma.user.createMany({
            data: [
                { email: 'user1@example.com', username: 'user1', password: 'securepassword', role: 'CLIENT' },
                { email: 'user2@example.com', username: 'user2', password: 'securepassword', role: 'SELLER' },
            ],
        });

        const users = await prisma.user.findMany();

        expect(users).not.toBeNull();
        expect(users.length).toBeGreaterThanOrEqual(2);
        expect(users[0]).toHaveProperty('email');
        expect(users[1]).toHaveProperty('username');
    })
    it('Should return a user by is id', async () => {

        const user = await prisma.user.create({
            data: { email: 'user3@example.com', username: 'user3', password: 'securepassword', role: 'CLIENT' },
        });

        const foundUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        expect(foundUser).not.toBeNull();
        expect(foundUser.email).toBe('user3@example.com');
        expect(foundUser.username).toBe('user3');
    })
    it('Should return a user by is email', async () => {

        const user = await prisma.user.create({
            data: { email: 'user4@example.com', username: 'user4', password: 'securepassword', role: 'SELLER' },
        });

        const foundUser = await prisma.user.findUnique({
            where: { email: 'user4@example.com' },
        });

        expect(foundUser).not.toBeNull();
        expect(foundUser.username).toBe('user4');
    })
    it('Should return a user by is username', async () => {

        const user = await prisma.user.create({
            data: { email: 'user5@example.com', username: 'user5', password: 'securepassword', role: 'CLIENT' },
        });

        const foundUser = await prisma.user.findUnique({
            where: { username: 'user5' },
        });

        expect(foundUser).not.toBeNull();
        expect(foundUser.email).toBe('user5@example.com');
    })
    it('Should retrieve the client profile associated with th user', async () => {

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

        const foundUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { client: true },
        });

        expect(foundUser.client).not.toBeNull();
        expect(foundUser.client.firstname).toBe('John');
        expect(foundUser.client.lastname).toBe('Doe');
    })
    it('Should retrieve the seller profile associated with th user', async () => {

        const user = await prisma.user.create({
            data: {
                email: 'seller@example.com',
                username: 'selleruser',
                password: 'securepassword',
                role: 'SELLER',
                seller: {
                    create: {
                        business_name: 'SellerCorp',
                    },
                },
            },
            include: { seller: true },
        });

        const foundUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { seller: true },
        });

        expect(foundUser.seller).not.toBeNull();
        expect(foundUser.seller.business_name).toBe('SellerCorp');
    })
})
