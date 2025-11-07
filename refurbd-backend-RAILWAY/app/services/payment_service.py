import stripe
from typing import Dict, Optional
from datetime import datetime
from app.core.config import settings
from app.db.models.user import SubscriptionTier

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    """Handle Stripe payments and subscriptions."""
    
    PRICE_IDS = {
        SubscriptionTier.BASIC: settings.STRIPE_PRICE_ID_BASIC,
        SubscriptionTier.PRO: settings.STRIPE_PRICE_ID_PRO,
    }
    
    async def create_checkout_session(
        self,
        user_id: int,
        user_email: str,
        tier: SubscriptionTier,
        success_url: str,
        cancel_url: str,
    ) -> Dict[str, str]:
        """
        Create a Stripe Checkout session for subscription.
        
        Returns:
            Dict with session_id and url
        """
        
        try:
            # Get or create Stripe customer
            customers = stripe.Customer.list(email=user_email, limit=1)
            
            if customers.data:
                customer = customers.data[0]
            else:
                customer = stripe.Customer.create(
                    email=user_email,
                    metadata={"user_id": user_id}
                )
            
            # Get price ID for tier
            price_id = self.PRICE_IDS.get(tier)
            if not price_id:
                raise ValueError(f"No price ID configured for tier: {tier}")
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user_id,
                    "tier": tier.value,
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url,
                "customer_id": customer.id,
            }
            
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            raise
    
    async def create_customer_portal_session(
        self,
        customer_id: str,
        return_url: str,
    ) -> str:
        """
        Create a Stripe Customer Portal session for subscription management.
        
        Returns:
            Portal URL
        """
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session.url
        except Exception as e:
            print(f"Error creating portal session: {e}")
            raise
    
    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription at period end."""
        try:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return True
        except Exception as e:
            print(f"Error canceling subscription: {e}")
            return False
    
    async def get_subscription_info(self, subscription_id: str) -> Optional[Dict]:
        """Get subscription details from Stripe."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": subscription.cancel_at_period_end,
            }
        except Exception as e:
            print(f"Error retrieving subscription: {e}")
            return None
    
    def verify_webhook_signature(self, payload: bytes, sig_header: str) -> Optional[dict]:
        """Verify Stripe webhook signature and return event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            print(f"Invalid payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            print(f"Invalid signature: {e}")
            return None


# Singleton instance
payment_service = PaymentService()
