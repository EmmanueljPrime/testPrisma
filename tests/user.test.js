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

describe('Product Tests', () => {
    let sellerUser, clientUser;

    beforeAll(async () => {

        await prisma.image.deleteMany();
        await prisma.product.deleteMany();
        await prisma.seller.deleteMany();
        await prisma.client.deleteMany();
        await prisma.user.deleteMany();

        sellerUser = await prisma.user.create({
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
        })

        clientUser = await prisma.user.create({
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
        })
    })

    afterAll(async () => {
        await prisma.image.deleteMany();
        await prisma.product.deleteMany();
        await prisma.seller.deleteMany();
        await prisma.client.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    })

    it('Should Seller create a product', async () => {
        //console.log(sellerUser)
        if (!sellerUser) {
            throw new Error("Seller does not exist");
        }
        const product = await prisma.product.create({
            data: {
                name: 'Sample Product',
                description: 'Sample description',
                price: 99.99,
                stock: 10,
                seller: {connect: { id:sellerUser.seller.id } },
            },
            include: { seller: true },
        });
        //console.log('Create product with data:', product);
        expect(product).toBeDefined();
        expect(product.name).toBe('Sample Product');
        expect(Number(product.price)).toBe(99.99);
        expect(product.stock).toBe(10);
        expect(product.seller.id).toBe(sellerUser.seller.id);
    })
    it('Should fail to create a product', async () => {
        await expect(
            prisma.product.create({
                data: {
                    name: 'Invalid Product',
                    description: 'This should fail',
                    price: 50.00,
                    stock: 5,
                    // Absence de seller: { connect: { id: ... } }, devrait provoquer une erreur
                },
            })
        ).rejects.toThrow();
    })

    it('Should Client fail to create a product', async () => {
        await expect(
            prisma.product.create({
                data: {
                    name: 'Client Product',
                    description: 'A client should not be able to create this',
                    price: 50.00,
                    stock: 10,
                    seller: {
                        connect: {
                            userId: clientUser.id, // Tentative de connecter un client comme vendeur
                        },
                    },
                },
            })
        ).rejects.toMatchObject({
            code: 'P2025', // Code d'erreur attendu de Prisma
            message: expect.stringMatching(/No 'Seller' record/), // Validez une partie du message d'erreur
        });
    });

})