"""Generate the default social share image (public/og/emmaforyou-og.png). Run: python3 scripts/make-og-image.py"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H = 1200, 630
INK = (11, 13, 36)
img = Image.new("RGB", (W, H), INK)
glow = Image.new("RGB", (W, H), INK)
ImageDraw.Draw(glow).ellipse((620, -420, 1500, 420), fill=(88, 72, 230))
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(160)), 0.55)
d = ImageDraw.Draw(img)
for x in range(0, W, 64):
    d.line([(x, 0), (x, H)], fill=(24, 27, 62), width=1)
for y in range(0, H, 64):
    d.line([(0, y), (W, y)], fill=(24, 27, 62), width=1)
P = "/usr/share/fonts/truetype/google-fonts/"
head = ImageFont.truetype(P + "Poppins-Bold.ttf", 64)
logo = ImageFont.truetype(P + "Poppins-Bold.ttf", 40)
body = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Regular.otf", 30)
small = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Medium.otf", 24)
d.text((80, 72), "EmmaForYou", font=logo, fill="white")
lw = d.textlength("EmmaForYou", font=logo)
d.ellipse((80 + lw + 6, 104, 80 + lw + 18, 116), fill=(109, 91, 255))
y = 190
for line in ["AI automation, websites", "and growth systems for", "ambitious businesses."]:
    d.text((80, y), line, font=head, fill="white")
    y += 82
d.text((80, y + 20), "Websites · Ecommerce · AI chat & booking · Email · Ads · SEO", font=body, fill=(179, 184, 220))
url = "emmaforyou.lovable.app"
tw = d.textlength(url, font=small)
d.rounded_rectangle((80, 540, 80 + tw + 48, 586), radius=23, fill=(109, 91, 255))
d.text((104, 550), url, font=small, fill="white")
img.save("public/og/emmaforyou-og.png", optimize=True)
print("saved")
