#!/usr/bin/env bash
# GODSPYRE — staged Higgsfield generation pipeline.
# Fires the full visual suite the instant the signed-in Higgsfield
# account has credits. Stills first (cheap), motion film last (pricier).
#
# Usage:
#   ./generate.sh            # run everything (stills + motion film)
#   ./generate.sh --stills   # stills only, skip the video
#
# Requires: higgsfield CLI (npm i -g @higgsfield/cli) + `hf auth login`.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$HERE/assets"
mkdir -p "$OUT"

STILLS_ONLY=false
[ "${1:-}" = "--stills" ] && STILLS_ONLY=true

# --- preflight -------------------------------------------------------
command -v higgsfield >/dev/null 2>&1 || { echo "✗ higgsfield CLI not found. Run: npm i -g @higgsfield/cli"; exit 1; }
higgsfield auth token >/dev/null 2>&1 || { echo "✗ Not authenticated. Run: higgsfield auth login"; exit 1; }

STATUS="$(higgsfield account status 2>&1 || true)"
echo "Account: $STATUS"
# Abort early on a zero balance so we don't fire jobs that will 402.
if echo "$STATUS" | grep -qiE '(^|[^0-9.])0 credits'; then
  echo "✗ 0 credits — top up at higgsfield.ai (account → billing) and re-run."
  exit 2
fi

# --- helper: run one generation, wait, download the first result URL --
# args: <label> <outfile> <job_set_type> [extra generate args...]
gen() {
  local label="$1"; shift
  local outfile="$1"; shift
  local model="$1"; shift
  echo "→ Generating: $label ($model)"
  local json
  json="$(higgsfield generate create "$model" "$@" --wait --json 2>&1)" || {
    echo "  ✗ generation failed:"; echo "$json" | head -5; return 1; }
  # Tolerant URL extraction: first https media URL in the JSON payload.
  local url
  url="$(printf '%s' "$json" | grep -oE 'https://[^"[:space:]]+\.(png|jpg|jpeg|webp|mp4|mov)' | head -1)"
  if [ -z "$url" ]; then
    echo "  ⚠ no result URL parsed — raw JSON saved to $OUT/${outfile%.???}.json"
    printf '%s' "$json" > "$OUT/${outfile%.*}.json"
    return 1
  fi
  curl -sSL "$url" -o "$OUT/$outfile"
  echo "  ✓ saved $OUT/$outfile"
}

# --- prompts ---------------------------------------------------------
SEAL_PROMPT="Premium heraldic emblem logo for a luxury streetwear brand 'GODSPYRE'. A circular coin-die metal seal stamped in antique brass and blackened iron. Centerpiece: a frontal war-god death-mask great-helm with hollow eyes, crowned by a single rising pyre flame, flanked by two furled regimental war banners, with crossed sabres beneath. Fine engraved intaglio line-work, coin relief texture, antique gold and oxblood red accents on warm charcoal ash-black. Perfectly symmetrical, iconic, clean readable silhouette. The word 'GODSPYRE' in engraved imperial serif capitals arched along the bottom inner ring. Dark luxury, mythic, military, centered on plain warm charcoal background, ultra sharp."

HERO_PROMPT="Cinematic editorial fashion photograph, mid-1800s battlefield at dawn drowned in cannon smoke, epic mythic mood. A striking Gen-Z model stands like a war deity, calm and divine, wearing an oversized heavyweight black premium t-shirt with a large distressed antique-gold and oxblood war-god seal printed across the chest. Oil-painting light, volumetric god-rays through smoke, ash falling, distant regimental banners and silhouetted cavalry. Warm charcoal / antique-gold / oxblood palette, single brass key light, 85mm, shallow depth of field, fine film grain, reverent and defiant."

MOCKUP_PROMPT="High-end apparel catalog product shot of a heavyweight 300gsm oversized boxy black premium t-shirt on an invisible mannequin, studio lit on warm charcoal background. Large chest print of an intricate circular war-god seal emblem (great-helm death mask, pyre flame, regimental banners, crossed sabres) in distressed antique gold and oxblood with a vintage engraved aesthetic. Realistic washed cotton texture, premium garment drape, subtle debossed woven neck label, quiet-luxury streetwear, sharp print legibility, soft brass key light, photoreal."

STORYBOARD_PROMPT="A cinematic 6-panel storyboard contact sheet, two rows by three panels, each a film frame with a thin antique-gold border and a small numbered caption 01 to 06, for a luxury streetwear brand film 'GODSPYRE'. Warm charcoal, antique gold and oxblood palette. 01 ember sparks igniting in a black void; 02 a glowing brass war-god seal struck and stamped into metal; 03 close-up of cannon smoke rolling across a mid-1800s battlefield at dawn; 04 a Gen-Z model turning to camera wearing the GODSPYRE tee like a war god; 05 regimental banners rising through ash with the sigil silhouetted; 06 the GODSPYRE wordmark resolving in engraved gold above the tagline 'GODS OF WAR. GODS OF SURVIVAL.'. Storyboard layout, cinematic, ultra detailed."

FILM_PROMPT="Cinematic brand film shot for 'GODSPYRE'. Slow, weighty, forged-metal motion: cannon smoke parts on a 180-degree arc as a Gen-Z war deity turns to camera, ash drifting upward, volumetric brass god-rays, the chest seal catching gold light. No bounce, deliberate and divine. Warm charcoal, antique gold, oxblood. Film grain, epic and reverent."

# --- stills ----------------------------------------------------------
gen "War-god seal"      seal.png       nano_banana_2     --prompt "$SEAL_PROMPT"       --aspect_ratio 1:1  --resolution 4k
gen "Hero campaign"     hero.png       text2image_soul_v2 --prompt "$HERO_PROMPT"       --aspect_ratio 3:4  --quality 2k
gen "Product mockup"    mockup.png     nano_banana_2     --prompt "$MOCKUP_PROMPT"     --aspect_ratio 4:5  --resolution 4k
gen "Storyboard sheet"  storyboard.png nano_banana_2     --prompt "$STORYBOARD_PROMPT" --aspect_ratio 16:9 --resolution 4k

# --- motion film (image-to-video off the hero still) -----------------
if [ "$STILLS_ONLY" = false ]; then
  if [ -f "$OUT/hero.png" ]; then
    gen "Motion film" film.mp4 kling3_0 \
      --prompt "$FILM_PROMPT" --start-image "$OUT/hero.png" \
      --duration 5 --mode pro --aspect_ratio 16:9 --sound on
  else
    echo "⚠ hero.png missing — skipping motion film (it seeds from the hero still)."
  fi
fi

echo
echo "Done. Assets in: $OUT"
ls -la "$OUT"
