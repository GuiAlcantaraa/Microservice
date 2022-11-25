import { Customer } from '../domain/customer';
import { Purchase } from '../domain/purchase';

import { CustomersRepository } from '../repositories/customers-repository'
import { PurchasesRepository } from '../repositories/purchases-repository'
import { ProductsRepository } from '../repositories/products-repository'

interface PurchaseProductRequest {
    name: string;
    email: string;
    productId: string;
}


export class PurchaseProduct {
    constructor(
        private customersRepository: CustomersRepository,
        private productsRepository: ProductsRepository,
        private purchasesRepository: PurchasesRepository,
    ) { }

    async execute({ name, email, productId }: PurchaseProductRequest): Promise<void> {
        const product = await this.productsRepository.findById(productId);

        const productExists = !!product;

        if (!productExists) {
            throw new Error('Products does not exists');
        }

        const customer = new Customer({
            name,
            email,
        })

        await this.customersRepository.create(customer);

        const purchase = new Purchase({
            customerId: customer.id,
            productId,
            createdAt: new Date(),
        })

        await this.purchasesRepository.create(purchase);

        console.log('compra criada')
        /**
         * This SHOULD NOT be here
         */

        // await this.messagingAdapter.sendMessage('purchases.new-purchase', {
        //     product: {
        //         id: product.id,
        //         title: product.title,
        //     },
        //     customer: {
        //         name: customer.name,
        //         email: customer.email,
        //     },
        //     purchaseId: purchase.id,
        // })
    }
}