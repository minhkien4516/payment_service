import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import Stripe from 'stripe';

import { CreateCustomerDto } from '../DTO/create-customer.dto';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('customer')
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Stripe.Response<Stripe.Customer>> {
    return this.stripeService.createCustomer(createCustomerDto);
  }

  @Get('customer')
  async getCustomer(@Query('customerId') customerId: string) {
    return this.stripeService.getCustomer(customerId);
  }

  @Get()
  async getCustomers() {
    return this.stripeService.findAllCustomers();
  }

  @Get()
  async getCustomerById(@Query('id') id: string) {
    return this.stripeService.findCustomer(id);
  }
}
