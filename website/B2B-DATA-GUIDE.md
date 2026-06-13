# B2B Portal — Data Guide (how to fill in your catalogue)

Your B2B order portal (jaypeesports.in/b2b.html) reads its catalogue from
**9 spreadsheet files** in the `website/data/` folder. Edit those files and the
portal updates — **what you put in the files is exactly what customers see.**

There is **no backend, no database server, nothing to install.** The files are
plain CSV (comma-separated) spreadsheets. They open in **Excel, Google Sheets
or Apple Numbers** by double-clicking.

---

## How to edit and publish (the loop)

1. On github.com open `website/data/`, click a file (e.g. `equipment.csv`),
   then the **pencil ✏️ (Edit)** icon — *or* download it, open in Excel, edit,
   and re-upload.
2. Change the numbers / text you want. **Keep the top header row exactly as it
   is** (don't rename or delete columns).
3. Save / commit. The site refreshes within a minute or two.
4. Open jaypeesports.in/b2b.html — under the title it says
   *"Catalogue loaded from your data files ✓"* when your data is live.

> **Tip — editing in Excel:** download the CSV, open it, edit, then
> **File → Save** (Excel may warn "keep CSV format?" → click **Keep / Yes**).
> Upload the saved file back to `website/data/`, replacing the old one.

### A few formatting rules (important)
- **Lists inside one cell use the `|` (pipe) symbol.** Example: a Sizes cell
  reads `S|M|L|XL|XXL`. Colours: `White|Black|Navy`.
- **Prices are plain numbers** in rupees — `650`, not `₹650` or `650.00`.
- A **price change can be negative** (e.g. a cheaper fabric `-20`).
- If a text cell contains a comma, Excel wraps it in quotes automatically —
  that's fine, leave it.
- Leave a cell **blank** if you don't have the value yet; the portal copes.

---

## The 9 files — what each one controls

### 1. `sports.csv` — the list of sports
One sport per row. These appear as the sport buttons in Sportswear and Equipment.

### 2. `products.csv` — every garment you make
| Column | Meaning |
|---|---|
| Product Type | e.g. Jersey, T-shirt, Tracksuit |
| Section | `Sportswear`, `Corporate`, or `Both` (which menu it shows under) |
| Custom Base Price (INR) | starting price for a custom-made piece |
| Sizes | available sizes, pipe-separated (`S\|M\|L\|XL\|XXL`) |
| Style Label | what the neck/style dropdown is called (e.g. "Neck type") |
| Style Options | the choices, pipe-separated (`Round neck\|V-neck\|Polo collar`) |
| Has Sleeves | `Yes` or `No` (controls sleeve-length + sleeve print options) |

### 3. `equipment.csv` — sports equipment items
Sport, Item Name, Price, a short Description, and an optional Image File
(see "Adding photos" below). Add or remove rows freely.

### 4. `readymade.csv` — in-stock items for the "Ready-made" route
Product Type, Item Name, Price, optional Image File. These are the pre-made
items customers pick before adding prints.

### 5. `fabrics.csv` — fabrics for custom manufacturing
| Column | Meaning |
|---|---|
| Type | `Plain` (solid colour) or `Sublimation` (printed) |
| Fabric Name | e.g. Dry-Fit, Jacquard Knit |
| GSM | fabric weight number |
| Price Change (INR) | added to (or subtracted from) the base price |
| Colors Available | **only for Plain fabrics** — pipe-separated colour names that must also exist in `colors.csv` |

### 6. `colors.csv` — colour swatches
Colour Name + its Hex Code (the on-screen colour). Pick hex codes at
[htmlcolorcodes.com](https://htmlcolorcodes.com) if you need new ones. Any
colour named in `fabrics.csv` should appear here.

### 7. `designs.csv` — sublimation design options
The named designs customers can choose. (The "Request design consultancy"
option is always shown automatically — you don't add it here.)

### 8. `print_areas.csv` — print positions & recommended sizes
The print spots (F1 left chest, B2 centre back, etc.) with the recommended
print size in cm. You can change the recommended sizes; the position **codes**
(F1, B2…) line up with the on-screen mockup, so keep those as they are.

### 9. `settings.csv` — fees and discounts
Key/value pairs:
- `equipment_print_fee`, `print_position_fee`, `name_and_number_fee` — per-piece add-ons
- `custom_min_order_qty` — minimum pieces for custom manufacturing
- `sublimation_panel_fee_front/back/sleeves/full` — panel printing charges
- `quantity_discount_tiers` — bulk discounts as `minQty:percent`, e.g.
  `10:5|50:10|100:15` means 10+ pcs = 5% off, 50+ = 10% off, 100+ = 15% off
- `sleeve_length_options` — the sleeve choices

---

## Adding product photos (optional, recommended)

1. Put image files in `website/assets/products/` (create the folder; upload via
   **Add file → Upload files**). Use small web images (~1000px, JPG/PNG/WebP).
2. In `equipment.csv` / `readymade.csv`, write the filename in the **Image File**
   column, e.g. `cricket-bat.jpg`.
3. The portal shows that photo and — for garments — uses it as the base of the
   live mockup, with print areas drawn on top.

Until a photo is added, the item shows a "Photo coming soon" placeholder, so
nothing breaks if you leave it blank.

---

## If something looks wrong
- The portal always falls back to a built-in sample catalogue, so a bad file
  never takes the page down — it just keeps showing the last good data.
- Most issues are a renamed/removed header row or a missing `|` in a list.
  Compare against the original file (every file shipped pre-filled with working
  examples you can copy).
- Still stuck? Send me the file and I'll fix the format.
