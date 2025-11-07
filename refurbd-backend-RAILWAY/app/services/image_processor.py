"""Image processing utilities for thumbnails and optimization."""
from PIL import Image
import os
import logging

logger = logging.getLogger(__name__)


def create_thumbnail(
    image_path: str,
    thumbnail_size: tuple = (300, 300),
    quality: int = 85
) -> str:
    """
    Create a thumbnail for an image.
    
    Args:
        image_path: Path to original image
        thumbnail_size: Size of thumbnail (width, height)
        quality: JPEG quality (1-100)
    
    Returns:
        Path to thumbnail image, or None if failed
    """
    try:
        if not os.path.exists(image_path):
            logger.error(f"Image not found: {image_path}")
            return None
        
        # Open image
        img = Image.open(image_path)
        
        # Convert RGBA to RGB if necessary (for JPEG compatibility)
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        # Create thumbnail (maintains aspect ratio)
        img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
        
        # Generate thumbnail path
        directory = os.path.dirname(image_path)
        filename = os.path.basename(image_path)
        name, ext = os.path.splitext(filename)
        thumbnail_path = os.path.join(directory, f"{name}_thumb{ext}")
        
        # Save thumbnail
        if ext.lower() in ['.jpg', '.jpeg']:
            img.save(thumbnail_path, format='JPEG', quality=quality, optimize=True)
        else:
            img.save(thumbnail_path, format='PNG', optimize=True)
        
        logger.info(f"Thumbnail created: {thumbnail_path}")
        return thumbnail_path
    
    except Exception as e:
        logger.error(f"Error creating thumbnail: {e}")
        return None


def optimize_image(
    image_path: str,
    max_size: tuple = (1920, 1920),
    quality: int = 90
) -> bool:
    """
    Optimize an image by reducing size and quality.
    
    Args:
        image_path: Path to image to optimize
        max_size: Maximum dimensions (width, height)
        quality: JPEG quality (1-100)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        img = Image.open(image_path)
        
        # Resize if larger than max_size
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert RGBA to RGB for JPEG
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        # Save optimized version
        ext = os.path.splitext(image_path)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            img.save(image_path, format='JPEG', quality=quality, optimize=True)
        else:
            img.save(image_path, format='PNG', optimize=True)
        
        logger.info(f"Image optimized: {image_path}")
        return True
    
    except Exception as e:
        logger.error(f"Error optimizing image: {e}")
        return False
