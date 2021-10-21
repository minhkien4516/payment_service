import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { CreateCustomerDto } from '../DTO/create-customer.dto';
import { CreditCardDto } from '../DTO/credit-card.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  constructor(
    @Inject('StripeClient') private stripeClient: Stripe,
    private configService: ConfigService,
  ) {}

  public async charge(
    amount: number,
    paymentMethodId: string,
    customerId: string,
  ) {
    return this.stripe.paymentIntents.create({
      amount,
      customer: customerId,
      payment_method: paymentMethodId,
      currency: this.configService.get('STRIPE_CURRENCY'),
      confirm: true,
    });
  }

  async createCard(customerId: string, card: CreditCardDto): Promise<void> {
    const {
      number = '',
      cvc = '',
      name: cardholder = '',
      expYear = '',
      expMonth = '',
    } = card;
    const token = await this.stripeClient.tokens.create({
      card: {
        number,
        cvc,
        name: cardholder,
        exp_month: expMonth,
        exp_year: expYear,
      },
    });

    if (!token) {
      throw new BadRequestException('Token is not created');
    }

    const defaultCard = await this.stripeClient.customers.createSource(
      customerId,
      {
        source: token.id,
      },
    );

    if (!defaultCard) {
      throw new BadRequestException('Default card is not created');
    }
  }

  async createCustomer(
    dto: CreateCustomerDto,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    const { card = null, email, name, description } = dto || {};

    if (!card) {
      throw new BadRequestException('Card information is not found');
    }

    const { data } = await this.stripeClient.customers.list({
      email,
    });
    console.log(data.length);

    // if (data.length > 0) {
    //   throw new BadRequestException('Customer email is found');
    // }

    const newCustomer = await this.stripeClient.customers.create({
      email,
      name,
      description,
    });
    if (!newCustomer) {
      throw new BadRequestException('Customer is not created');
    }

    await this.createCard(newCustomer.id, card);
    return newCustomer;
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    const customer = await this.stripeClient.customers.retrieve(customerId);

    if (customer.deleted) {
      return null;
    }

    const { lastResponse, ...rest } = customer;
    return rest as Stripe.Customer;
  }

  async findAllCustomers(): Promise<Stripe.Customer[]> {
    const customers = await this.stripeClient.customers.list();
    return customers.data;
  }

  async findCustomer(id: string): Promise<Stripe.Customer | any> {
    const customer = await this.stripeClient.customers.retrieve(id);
    return customer;
  }

  // async createCustomer(
  //   customerInfo: Stripe.customers.ICustomerCreationOptions,
  // ): Promise<Stripe.customers.ICustomer> {
  //   const customer = await this.stripe.customers.create(customerInfo);
  //   return customer;
  // }

  // async updateCustomer(
  //   id: string,
  //   customerInfo: Stripe.customers.ICustomerUpdateOptions,
  // ): Promise<Stripe.customers.ICustomer> {
  //   const customer = await this.stripe.customers.update(id, customerInfo);
  //   return customer;
  // }

  // async deleteCustomer(id: string): Promise<Stripe.IDeleteConfirmation> {
  //   const deletetionConfirmation = await this.stripe.customers.del(id);
  //   return deletetionConfirmation;
  // }
}
