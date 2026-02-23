from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import os

# Create assets directory if it doesn't exist
if not os.path.exists('assets'):
    os.makedirs('assets')

# Colors
BACKGROUND_COLOR = "#6B46C1"
TEXT_COLOR = "#FFFFFF"

# Function to create an image with text
def create_image(filename, width, height, text, font_size):
    try:
        # Create a new image with the purple background
        image = Image.new('RGB', (width, height), color=BACKGROUND_COLOR)
        draw = ImageDraw.Draw(image)

        # Load a default font. Try loading Arial if possible, otherwise rely on default.
        # This part might fail if fonts aren't easily found, so we'll fallback to a simple load_default() which is small.
        # To make it look better, we'll try to find a ttf
        font = None
        possible_fonts = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "arial.ttf",
            "Arial.ttf"
        ]
        
        for f in possible_fonts:
            try:
                if os.path.exists(f):
                    font = ImageFont.truetype(f, font_size)
                    break 
            except:
                continue

        if font is None:
             font = ImageFont.load_default()
             # Scale up the default font is not directly possible easily with load_default without resizing the image trick.
             # We will just use the default font if no TTF found, but it will be tiny. 
             # However, on Mac usually Helvetica is available.
             
        # Calculate text size using textbbox (newer pillow) or textsize (older)
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except AttributeError:
            text_width, text_height = draw.textsize(text, font=font)

        # Center the text
        x = (width - text_width) / 2
        y = (height - text_height) / 2

        # Draw the text
        draw.text((x, y), text, fill=TEXT_COLOR, font=font)
        
        # Save the image
        image.save(f'assets/{filename}')
        print(f"Created {filename}")
        
    except Exception as e:
        print(f"Error creating {filename}: {e}")

# Create icon.png (1024x1024)
create_image('icon.png', 1024, 1024, "LoanSnap", 150)

# Create splash.png (1242x2436)
create_image('splash.png', 1242, 2436, "LoanSnap", 180)

# Create adaptive-icon.png (1024x1024)
create_image('adaptive-icon.png', 1024, 1024, "LoanSnap", 150)
