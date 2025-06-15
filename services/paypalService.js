const { client } = require('../config/paypal');
const paypal = require('@paypal/checkout-server-sdk');

class PayPalService {
  // Create subscription plans
  static async createSubscriptionPlans() {
    const plans = [
      {
        id: 'pro-monthly',
        name: 'Pro Creator',
        description: 'Unlimited video generations with premium features',
        price: '19.00',
        interval: 'MONTH'
      },
      {
        id: 'agency-monthly',
        name: 'Agency Plan',
        description: 'Everything in Pro plus white-label and API access',
        price: '49.00',
        interval: 'MONTH'
      }
    ];

    for (const plan of plans) {
      await this.createPlan(plan);
    }
  }

  static async createPlan(planData) {
    const request = new paypal.billing.PlansCreateRequest();
    request.requestBody({
      product_id: await this.createProduct(planData.name, planData.description),
      name: planData.name,
      description: planData.description,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: planData.interval,
          interval_count: 1
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: planData.price,
            currency_code: 'USD'
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    });

    try {
      const response = await client.execute(request);
      console.log(`Plan created: ${response.result.id}`);
      return response.result;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  static async createProduct(name, description) {
    const request = new paypal.catalogs.ProductsCreateRequest();
    request.requestBody({
      name: name,
      description: description,
      type: 'SERVICE',
      category: 'SOFTWARE'
    });

    try {
      const response = await client.execute(request);
      return response.result.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async createSubscription(planId, userId) {
    const request = new paypal.billing.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: planId,
      subscriber: {
        name: {
          given_name: 'User',
          surname: 'Name'
        }
      },
      application_context: {
        brand_name: 'AI Marketing Creator',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
      }
    });

    try {
      const response = await client.execute(request);
      return response.result;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async getSubscription(subscriptionId) {
    const request = new paypal.billing.SubscriptionsGetRequest(subscriptionId);
    
    try {
      const response = await client.execute(request);
      return response.result;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId, reason) {
    const request = new paypal.billing.SubscriptionsCancelRequest(subscriptionId);
    request.requestBody({
      reason: reason || 'User requested cancellation'
    });

    try {
      const response = await client.execute(request);
      return response.result;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}

module.exports = PayPalService;
