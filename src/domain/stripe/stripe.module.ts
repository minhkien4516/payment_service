import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

const StripeClientProvider = {
  provide: 'StripeClient',
  inject: [ConfigService],
  useFactory: (service: ConfigService) => {
    const secretKey = service.get<string>(
      process.env.STRIPE_AUTHENTICATE_KEY,
      process.env.STRIPE_SECRET_KEY,
    );
    const stripe = new Stripe(secretKey, {
      apiVersion: '2020-08-27',
    });
    return stripe;
  },
};
@Module({
  controllers: [StripeController],
  providers: [StripeService, StripeClientProvider],
})
export class StripeModule {}
