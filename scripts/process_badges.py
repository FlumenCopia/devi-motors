import os
from PIL import Image, ImageFilter
import numpy as np

def make_stamp_transparent(input_path, output_path):
    img = Image.open(input_path).convert('RGB')
    width, height = img.size
    
    cx = width / 2.0
    cy = height / 2.0
    radius = min(width, height) * 0.475
    
    data = np.array(img, dtype=np.float32)
    r = data[:, :, 0]
    g = data[:, :, 1]
    b = data[:, :, 2]
    
    # Luminance / Grayscale
    gray = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Purple ink characteristics:
    # 1. Darker than background paper (gray < 105)
    # 2. R > G and B > G
    purple_diff = ((r - g) + (b - g)) / 2.0
    
    # Combined ink darkness and purple saturation
    # Background paper has gray ~120-130, purple_diff ~10
    # Ink has gray ~40-75, purple_diff ~25-45
    ink_strength = (112.0 - gray) + 1.2 * (purple_diff - 8.0)
    
    # Smooth alpha mapping
    alpha = np.clip(ink_strength / 45.0 * 255.0, 0.0, 255.0)
    # Eliminate low noise / paper grain completely
    alpha[alpha < 35.0] = 0.0
    
    # Antialiased outer boundary circle
    y_indices, x_indices = np.indices((height, width))
    dist_from_center = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)
    edge_width = 3.0
    outer_mask = np.clip((radius - dist_from_center) / edge_width, 0.0, 1.0)
    alpha = alpha * outer_mask
    
    # Color: authentic royal purple stamp color (#4c1d6b)
    out_r = np.full_like(r, 76.0)
    out_g = np.full_like(g, 29.0)
    out_b = np.full_like(b, 107.0)
    
    out_data = np.stack([out_r, out_g, out_b, alpha], axis=-1).astype(np.uint8)
    out_img = Image.fromarray(out_data, 'RGBA')
    
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
        
    out_img.save(output_path, 'PNG')
    print(f"Stamp badge created: {output_path}, size: {out_img.size}")

def make_signature_transparent(input_path, output_path):
    img = Image.open(input_path).convert('RGB')
    width, height = img.size
    
    # Crop to signature stroke area
    crop_box = (int(width * 0.20), int(height * 0.25), int(width * 0.70), int(height * 0.60))
    cropped = img.crop(crop_box)
    
    data = np.array(cropped, dtype=np.float32)
    r = data[:, :, 0]
    g = data[:, :, 1]
    b = data[:, :, 2]
    
    gray = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Blue ink characteristics:
    # 1. Darker than paper (paper ~170-210, ink ~30-100)
    # 2. Blue channel is higher than red and green (b - r > 15, b - g > 10)
    blue_diff = b - (r + g) / 2.0
    
    ink_strength = (145.0 - gray) + 1.5 * (blue_diff)
    
    alpha = np.clip(ink_strength / 40.0 * 255.0, 0.0, 255.0)
    alpha[alpha < 40.0] = 0.0
    
    # Rich ballpoint blue ink (#0b3c8c)
    out_r = np.full_like(r, 11.0)
    out_g = np.full_like(g, 60.0)
    out_b = np.full_like(b, 140.0)
    
    out_data = np.stack([out_r, out_g, out_b, alpha], axis=-1).astype(np.uint8)
    out_img = Image.fromarray(out_data, 'RGBA')
    
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
        
    out_img.save(output_path, 'PNG')
    print(f"Signature created: {output_path}, size: {out_img.size}")

if __name__ == '__main__':
    make_stamp_transparent('assets/stamp.jpg', 'assets/stamp_transparent.png')
    make_signature_transparent('assets/signature.jpg', 'assets/signature_transparent.png')
