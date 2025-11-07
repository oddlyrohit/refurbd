import anthropic
import base64
from pathlib import Path
from typing import Optional, Dict
from app.core.config import settings


class RoomAnalyzer:
    """Analyzes room photos and provides renovation insights using Claude."""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    def _encode_image(self, image_path: str) -> tuple[str, str]:
        """Encode image to base64 and detect media type."""
        with open(image_path, "rb") as image_file:
            image_data = base64.standard_b64encode(image_file.read()).decode("utf-8")
        
        # Detect media type
        suffix = Path(image_path).suffix.lower()
        media_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        media_type = media_types.get(suffix, "image/jpeg")
        
        return image_data, media_type
    
    async def analyze_room(
        self,
        current_room_image: Optional[str],
        inspiration_image: Optional[str],
        room_type: str,
        desired_style: Optional[str],
        square_footage: Optional[float],
        budget_constraint: Optional[float],
        location: Dict[str, str],
    ) -> Dict[str, str]:
        """
        Analyze room and provide comprehensive renovation insights.
        
        Returns:
            Dict with keys: visual_assessment, design_plan, key_recommendations
        """
        
        # Build the prompt
        prompt_parts = [
            f"You are an expert interior designer and renovation consultant. Analyze this {room_type} renovation project."
        ]
        
        if square_footage:
            prompt_parts.append(f"The room is approximately {square_footage} square feet.")
        
        if desired_style:
            prompt_parts.append(f"The desired style is: {desired_style}")
        
        if budget_constraint:
            prompt_parts.append(f"Budget constraint: ${budget_constraint:,.2f}")
        
        if location:
            city = location.get("city", "")
            state = location.get("state", "")
            if city and state:
                prompt_parts.append(f"Location: {city}, {state} (consider local market rates)")
        
        prompt_parts.append("""
Please provide a detailed analysis in the following format:

## VISUAL ASSESSMENT
[If images provided, analyze current condition, layout, lighting, issues, opportunities]
[If no images, work with room type and description]

## DESIGN PLAN
Provide specific, actionable design recommendations:
- Layout modifications (if any)
- Color palette (specific color names/codes)
- Materials and finishes (specific products)
- Flooring recommendations
- Lighting design
- Storage solutions
- Key fixtures and features

## BUDGET BREAKDOWN
Provide realistic cost estimates based on:
- Room type and size
- Scope of work
- Location (if provided)
- Material quality tiers

Break down by:
- Materials: $X - $Y
- Labor: $X - $Y
- Permits/Fees: $X - $Y
- Contingency (10%): $X
- Total: $X - $Y

## TIMELINE
Estimated completion time with phases:
- Planning & Permits: X weeks
- Demolition: X days
- Installation: X weeks
- Finishing: X weeks
Total: X-Y weeks

## KEY RECOMMENDATIONS
Top 3-5 actionable items to maximize value.

Be specific, practical, and consider the budget if provided.""")
        
        # Build message content
        content = []
        
        if current_room_image:
            try:
                image_data, media_type = self._encode_image(current_room_image)
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                })
                content.append({
                    "type": "text",
                    "text": "This is the current room that needs renovation."
                })
            except Exception as e:
                print(f"Error encoding current room image: {e}")
        
        if inspiration_image:
            try:
                image_data, media_type = self._encode_image(inspiration_image)
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                })
                content.append({
                    "type": "text",
                    "text": "This is the inspiration image showing the desired style."
                })
            except Exception as e:
                print(f"Error encoding inspiration image: {e}")
        
        # Add the main prompt
        content.append({
            "type": "text",
            "text": "\n".join(prompt_parts)
        })
        
        # Call Claude API
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            )
            
            full_response = message.content[0].text
            
            # Parse the response into sections
            sections = self._parse_response(full_response)
            
            return sections
            
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            raise
    
    def _parse_response(self, response: str) -> Dict[str, str]:
        """Parse Claude's response into structured sections."""
        sections = {
            "visual_assessment": "",
            "design_plan": "",
            "budget_breakdown": "",
            "timeline_estimate": "",
            "key_recommendations": "",
            "full_analysis": response
        }
        
        # Simple parsing - look for section headers
        lines = response.split("\n")
        current_section = None
        section_content = []
        
        section_markers = {
            "VISUAL ASSESSMENT": "visual_assessment",
            "DESIGN PLAN": "design_plan",
            "BUDGET BREAKDOWN": "budget_breakdown",
            "TIMELINE": "timeline_estimate",
            "KEY RECOMMENDATIONS": "key_recommendations",
        }
        
        for line in lines:
            line_upper = line.strip().upper()
            
            # Check if this line is a section header
            matched_section = None
            for marker, section_key in section_markers.items():
                if marker in line_upper:
                    matched_section = section_key
                    break
            
            if matched_section:
                # Save previous section
                if current_section and section_content:
                    sections[current_section] = "\n".join(section_content).strip()
                
                # Start new section
                current_section = matched_section
                section_content = []
            elif current_section:
                section_content.append(line)
        
        # Save last section
        if current_section and section_content:
            sections[current_section] = "\n".join(section_content).strip()
        
        return sections


# Singleton instance
room_analyzer = RoomAnalyzer()
