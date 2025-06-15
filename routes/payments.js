const express = require('express');
const router = express.Router();
const PayPalService = require('../services/paypalService');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

// Create subscription
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Validate plan
    const validPlans = ['pro-monthly', 'agency-monthly'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // Create PayPal subscription
    const subscription = await PayPalService.createSubscription(planId, req.user.id);
    
    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        approvalUrl: subscription.links.find(link => link.rel === 'approve').href
      }
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// Handle subscription approval
router.post('/subscription/approve', protect, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    // Get subscription details from PayPal
    const paypalSubscription = await PayPalService.getSubscription(subscriptionId);
    
    if (paypalSubscription.status === 'ACTIVE') {
      // Update user subscription
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.status': 'active',
        'subscription.paypalSubscriptionId': subscriptionId,
        'subscription.type': paypalSubscription.plan_id === 'pro-monthly' ? 'pro' : 'agency',
        'subscription.currentPeriodEnd': new Date(paypalSubscription.billing_info.next_billing_time),
        'subscription.videoLimit': paypalSubscription.plan_id === 'pro-monthly' ? 999999 : 999999
      });

      // Create subscription record
      await Subscription.create({
        user: req.user.id,
        paypalSubscriptionId: subscriptionId,
        planId: paypalSubscription.plan_id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(paypalSubscription.billing_info.next_billing_time)
      });

      res.json({
        success: true,
        message: 'Subscription activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Subscription not active'
      });
    }
  } catch (error) {
    console.error('Subscription approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate subscription'
    });
  }
});

// Cancel subscription
router.post('/subscription/cancel', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.subscription.paypalSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel PayPal subscription
    await PayPalService.cancelSubscription(
      user.subscription.paypalSubscriptionId,
      'User requested cancellation'
    );

    // Update user subscription
    await User.findByIdAndUpdate(req.user.id, {
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': new Date()
    });

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { paypalSubscriptionId: user.subscription.paypalSubscriptionId },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Get subscription status
router.get('/subscription/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let subscriptionDetails = null;
    if (user.subscription.paypalSubscriptionId) {
      subscriptionDetails = await PayPalService.getSubscription(
        user.subscription.paypalSubscriptionId
      );
    }

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        paypalDetails: subscriptionDetails
      }
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
});

module.exports = router;
