from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.user import User, SubscriptionTier
from app.schemas import SubscriptionCheckout, SubscriptionResponse, UserWithUsage
from app.core.security import get_current_active_user
from app.services.payment_service import payment_service
from app.services.email_service import email_service
from app.core.config import settings
from datetime import datetime

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.post("/create-checkout", response_model=SubscriptionResponse)
async def create_checkout_session(
    checkout_data: SubscriptionCheckout,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a Stripe checkout session for subscription."""
    
    if checkout_data.tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create checkout for free tier"
        )
    
    result = await payment_service.create_checkout_session(
        user_id=current_user.id,
        user_email=current_user.email,
        tier=checkout_data.tier,
        success_url=checkout_data.success_url,
        cancel_url=checkout_data.cancel_url
    )
    
    # Save customer ID
    if result.get("customer_id"):
        current_user.stripe_customer_id = result["customer_id"]
        await db.commit()
    
    return SubscriptionResponse(
        session_id=result["session_id"],
        url=result["url"]
    )


@router.post("/portal")
async def create_portal_session(
    return_url: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a Stripe customer portal session."""
    
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription"
        )
    
    url = await payment_service.create_customer_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url=return_url
    )
    
    return {"url": url}


@router.get("/usage", response_model=UserWithUsage)
async def get_usage_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current usage and limits."""
    
    limits = {
        SubscriptionTier.FREE: settings.FREE_TIER_ANALYSES_PER_MONTH,
        SubscriptionTier.BASIC: settings.BASIC_TIER_ANALYSES_PER_MONTH,
        SubscriptionTier.PRO: settings.PRO_TIER_ANALYSES_PER_MONTH,
        SubscriptionTier.ENTERPRISE: -1,  # Unlimited
    }
    
    limit = limits.get(current_user.subscription_tier, 0)
    
    if limit == -1:
        analyses_remaining = -1  # Unlimited
    else:
        analyses_remaining = max(0, limit - current_user.analyses_used_this_month)
    
    can_create_project = analyses_remaining != 0
    
    user_dict = {
        **current_user.__dict__,
        "analyses_remaining": analyses_remaining,
        "can_create_project": can_create_project
    }
    
    return UserWithUsage(**user_dict)


@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events."""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    event = payment_service.verify_webhook_signature(payload, sig_header)
    
    if not event:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event["type"]
    
    # Handle successful checkout
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        
        user_id = int(session["metadata"]["user_id"])
        tier = session["metadata"]["tier"]
        customer_id = session["customer"]
        subscription_id = session["subscription"]
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user:
            user.subscription_tier = SubscriptionTier(tier)
            user.stripe_customer_id = customer_id
            user.stripe_subscription_id = subscription_id
            
            # Reset monthly usage
            user.analyses_used_this_month = 0
            user.last_analysis_reset = datetime.utcnow()
            
            await db.commit()
            
            # Send confirmation email
            try:
                await email_service.send_subscription_confirmation_email(
                    user.email,
                    user.full_name or "there",
                    tier
                )
            except Exception as e:
                print(f"Failed to send subscription email: {e}")
    
    # Handle subscription updates
    elif event_type == "customer.subscription.updated":
        subscription = event["data"]["object"]
        subscription_id = subscription["id"]
        status = subscription["status"]
        
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()
        
        if user and status in ["active", "trialing"]:
            user.subscription_ends_at = datetime.fromtimestamp(
                subscription["current_period_end"]
            )
            await db.commit()
    
    # Handle subscription cancellation
    elif event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        subscription_id = subscription["id"]
        
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.subscription_tier = SubscriptionTier.FREE
            user.stripe_subscription_id = None
            user.subscription_ends_at = None
            await db.commit()
    
    return {"status": "success"}
