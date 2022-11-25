import Fastify from "fastify";
import cors from '@fastify/cors';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

import { PrismaCustomersRepository } from './infra/database/prisma/repositories/prisma-costumer-repository'
import { PrismaProductsRepository } from "./infra/database/prisma/repositories/prisma-products-repository";
import { PrismaPurchasesRepository } from "./infra/database/prisma/repositories/prisma-purchases-repository";

import { KafkaMessagingAdapter } from '../src/infra/messaging/kafka/adapters/kafka-messaging-adapter';
import { PurchaseProduct } from "./useCases/purchase-product";


const prisma = new PrismaClient({
    log: ['query']
})

async function bootstrap() {
    const fastify = Fastify({
        logger: true,
    })
    await fastify.register(cors, {
        origin: true,
    })
    fastify.get('/', async () => {

        const count = await prisma.product.count()

        return { count }

    })


    fastify.post('/purchases', async (request, reply) => {
        const createPurchase = z.object({
            name: z.string(),
            email: z.string(),
            productId: z.string()
        })

        const { name, email, productId } = createPurchase.parse(request.body)

        const prismaCustomersRepository = new PrismaCustomersRepository();
        const prismaProductsRepository = new PrismaProductsRepository();
        const prismaPurchasesRepository = new PrismaPurchasesRepository();
        const kafkaMessagingAdapter = new KafkaMessagingAdapter()


        const purchaseProductUseCase = new PurchaseProduct(
            prismaCustomersRepository,
            prismaProductsRepository,
            prismaPurchasesRepository,
            kafkaMessagingAdapter
        )


        try {
            await purchaseProductUseCase.execute({
                name,
                email,
                productId,
            })

            return reply.status(201).send();

        } catch (err) {
            console.error(err);

            return reply.status(400).send({
                error: 'Error while creating a new purchase'
            })
        }
    })


    await fastify.listen({ port: 3333 })
}

bootstrap();