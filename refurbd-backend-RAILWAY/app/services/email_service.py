from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import List, Optional
from app.core.config import settings


class EmailService:
    """Send emails using SendGrid."""
    
    def __init__(self):
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = Email(settings.FROM_EMAIL)
    
    async def send_welcome_email(self, to_email: str, user_name: str):
        """Send welcome email to new users."""
        
        subject = "Welcome to Home Renovation AI! 🏠"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Welcome to Home Renovation AI!</h1>
                
                <p>Hi {user_name or 'there'},</p>
                
                <p>We're excited to help you transform your space! Here's what you can do with your free account:</p>
                
                <ul>
                    <li>✅ 2 room analyses per month</li>
                    <li>✅ AI-powered design recommendations</li>
                    <li>✅ Budget estimates based on your location</li>
                    <li>✅ Timeline planning</li>
                    <li>✅ Basic renderings of your renovated space</li>
                </ul>
                
                <p><strong>Ready to get started?</strong></p>
                
                <div style="margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/projects/new" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Create Your First Project
                    </a>
                </div>
                
                <p>Need more features? Check out our <a href="{settings.FRONTEND_URL}/pricing">Premium Plans</a>.</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                    Questions? Reply to this email or visit our 
                    <a href="{settings.FRONTEND_URL}/help">Help Center</a>.
                </p>
            </div>
        </body>
        </html>
        """
        
        await self._send_email(to_email, subject, html_content)
    
    async def send_analysis_complete_email(
        self,
        to_email: str,
        user_name: str,
        project_name: str,
        project_id: int,
    ):
        """Send notification when analysis is complete."""
        
        subject = f"Your {project_name} Analysis is Ready! 🎨"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Your Renovation Plan is Ready!</h1>
                
                <p>Hi {user_name or 'there'},</p>
                
                <p>Great news! We've completed the analysis for your <strong>{project_name}</strong> project.</p>
                
                <p>Your personalized plan includes:</p>
                <ul>
                    <li>📊 Detailed design recommendations</li>
                    <li>💰 Location-based budget breakdown</li>
                    <li>⏱️ Timeline with phases</li>
                    <li>🎨 Photorealistic rendering of your renovated space</li>
                </ul>
                
                <div style="margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/projects/{project_id}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Your Renovation Plan
                    </a>
                </div>
                
                <p>You can make edits to the rendering or export your plan to PDF.</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                    Happy renovating! 🛠️
                </p>
            </div>
        </body>
        </html>
        """
        
        await self._send_email(to_email, subject, html_content)
    
    async def send_subscription_confirmation_email(
        self,
        to_email: str,
        user_name: str,
        tier: str,
    ):
        """Send subscription confirmation email."""
        
        subject = f"Welcome to {tier.title()} Plan! 🎉"
        
        features = {
            "basic": [
                "10 room analyses per month",
                "High-resolution renderings (1024x1024)",
                "Detailed design plans",
                "Location-based pricing",
                "Unlimited rendering edits",
                "Email support",
            ],
            "pro": [
                "Unlimited room analyses",
                "Ultra-HD renderings (1792x1024)",
                "Premium design consultation",
                "3D floor plans",
                "Contractor matching",
                "Priority support",
                "PDF export",
            ]
        }
        
        feature_list = features.get(tier.lower(), features["basic"])
        features_html = "".join([f"<li>✅ {feature}</li>" for feature in feature_list])
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Welcome to {tier.title()} Plan!</h1>
                
                <p>Hi {user_name or 'there'},</p>
                
                <p>Thank you for upgrading! You now have access to:</p>
                
                <ul>
                    {features_html}
                </ul>
                
                <div style="margin: 30px 0;">
                    <a href="{settings.FRONTEND_URL}/projects/new" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Start New Project
                    </a>
                </div>
                
                <p>Your subscription will renew automatically. You can manage your subscription 
                   in your <a href="{settings.FRONTEND_URL}/account">account settings</a>.</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                    Questions? We're here to help at support@yourdomain.com
                </p>
            </div>
        </body>
        </html>
        """
        
        await self._send_email(to_email, subject, html_content)
    
    async def _send_email(self, to_email: str, subject: str, html_content: str):
        """Internal method to send email via SendGrid."""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            response = self.client.send(message)
            
            if response.status_code not in [200, 201, 202]:
                print(f"SendGrid error: {response.status_code} - {response.body}")
            
        except Exception as e:
            print(f"Error sending email: {e}")
            # Don't raise - email failures shouldn't break the app


# Singleton instance
email_service = EmailService()
