import openai
import httpx
import time
from pathlib import Path
from typing import Optional
from app.core.config import settings


class ImageGenerator:
    """Generates and edits renovation renderings using DALL-E 3."""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_rendering(
        self,
        design_description: str,
        room_type: str,
        style: str,
        image_size: str = "1024x1024",
        save_path: Optional[str] = None,
    ) -> tuple[str, float]:
        """
        Generate a photorealistic rendering of the renovated space.
        
        Args:
            design_description: Detailed description from the design plan
            room_type: Type of room
            style: Design style
            image_size: "512x512", "1024x1024", or "1792x1024"
            save_path: Path to save the image
        
        Returns:
            tuple of (image_path, generation_time_seconds)
        """
        
        # Build comprehensive prompt
        prompt = self._build_rendering_prompt(design_description, room_type, style)
        
        start_time = time.time()
        
        try:
            # Generate image with DALL-E 3
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=image_size,
                quality="hd" if image_size != "512x512" else "standard",
                n=1,
            )
            
            image_url = response.data[0].url
            
            # Download and save image
            if save_path:
                async with httpx.AsyncClient() as client:
                    img_response = await client.get(image_url)
                    img_response.raise_for_status()
                    
                    # Ensure directory exists
                    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(save_path, "wb") as f:
                        f.write(img_response.content)
            
            generation_time = time.time() - start_time
            
            return save_path or image_url, generation_time
            
        except Exception as e:
            print(f"Error generating image: {e}")
            raise
    
    async def edit_rendering(
        self,
        original_image_path: str,
        edit_instructions: str,
        image_size: str = "1024x1024",
        save_path: Optional[str] = None,
    ) -> tuple[str, float]:
        """
        Edit an existing rendering based on user feedback.
        
        Note: DALL-E 3 doesn't support direct image editing, so we'll regenerate
        with the edit instructions incorporated into the prompt.
        
        Args:
            original_image_path: Path to the original rendering
            edit_instructions: What to change
            image_size: Output size
            save_path: Path to save the new image
        
        Returns:
            tuple of (image_path, generation_time_seconds)
        """
        
        # For now, we'll regenerate with modified prompt
        # In a production system, you might use img2img models
        prompt = f"""Professional interior design photography of a renovated space.

MODIFICATIONS REQUESTED:
{edit_instructions}

Maintain photorealistic quality, professional lighting, and interior design magazine aesthetic.
8K resolution, natural lighting, bright and airy atmosphere."""
        
        start_time = time.time()
        
        try:
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=image_size,
                quality="hd" if image_size != "512x512" else "standard",
                n=1,
            )
            
            image_url = response.data[0].url
            
            if save_path:
                async with httpx.AsyncClient() as client:
                    img_response = await client.get(image_url)
                    img_response.raise_for_status()
                    
                    Path(save_path).parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(save_path, "wb") as f:
                        f.write(img_response.content)
            
            generation_time = time.time() - start_time
            
            return save_path or image_url, generation_time
            
        except Exception as e:
            print(f"Error editing image: {e}")
            raise
    
    def _build_rendering_prompt(
        self,
        design_description: str,
        room_type: str,
        style: str,
    ) -> str:
        """Build a detailed prompt for DALL-E 3."""
        
        prompt = f"""Professional interior design photography of a beautifully renovated {room_type}.

STYLE: {style}

DESIGN SPECIFICATIONS:
{design_description}

TECHNICAL REQUIREMENTS:
- Camera: Wide-angle interior photography, eye-level perspective
- Quality: Photorealistic, 8K resolution, professional interior design magazine
- Lighting: Natural lighting, bright and airy, well-lit space
- Atmosphere: Inviting, clean, modern, aspirational
- Details: Show textures, materials, fixtures clearly
- Composition: Showcase the full room layout and key design features

The image should look like it could be featured in Architectural Digest or Elle Decor."""
        
        return prompt[:4000]  # Truncate if too long


# Singleton instance
image_generator = ImageGenerator()
