/**
 * World 2 — "Neon Lattice" trail map.
 *
 * Vertical orbital megastructure: flooded docks and neon rain at the base,
 * antenna farms, a maglev span, a substation with arcs, a hardlight weave and
 * the core ring with the contained Void at the top. Same 390 x 900 viewBox and
 * four-layer parallax contract as `world1.ts`; every id and class is prefixed
 * `w2-` so both maps can live in the same document.
 */

export const WORLD2_NAME = 'II · NEON LATTICE';

export const WORLD2_WIDTH = 390;
export const WORLD2_HEIGHT = 900;
/** The front layer is taller so its bokeh still covers the 1.15x scroll edge. */
export const WORLD2_FRONT_HEIGHT = 1060;

/** Parallax depth per layer. `1` is content speed; higher moves faster. */
export const WORLD2_DEPTHS = {
  far: 0.6,
  mid: 0.8,
  near: 1,
  front: 1.15,
} as const;

export type { WorldNodePoint } from './types';
import type { MapDef, WorldNodePoint } from './types';

/** Campaign phases 1..6, in phase index order. */
export const WORLD2_NODE_POINTS: readonly WorldNodePoint[] = [
  { x: 70, y: 800, labelSide: 'right' },
  { x: 284, y: 726, labelSide: 'left' },
  { x: 126, y: 634, labelSide: 'right' },
  { x: 272, y: 526, labelSide: 'left' },
  { x: 118, y: 408, labelSide: 'right' },
  { x: 224, y: 282, labelSide: 'left' },
];

/** Defensive fallback for content with an unexpected phase index. */
export const WORLD2_FALLBACK_POINT: WorldNodePoint = { x: 195, y: 450, labelSide: 'right' };

/** Decorative arrival portal on the dock deck, below phase 1. */
export const WORLD2_ARRIVAL_POINT: WorldNodePoint = { x: 44, y: 862, labelSide: 'right' };

/**
 * Trail split per node-to-node segment so completed stretches can light up
 * without redrawing the whole path.
 */
export const WORLD2_TRAIL_SEGMENTS: readonly string[] = [
  'M70,800 C120,792 220,760 284,726',
  'M284,726 C300,700 200,666 126,634',
  'M126,634 C90,610 190,566 272,526',
  'M272,526 C240,500 150,446 118,408',
  'M118,408 C110,370 150,320 224,282',
];

/** Full trail, derived from the segments so both stay in sync. */
export const WORLD2_TRAIL_PATH: string = WORLD2_TRAIL_SEGMENTS.map((segment, index) =>
  index === 0 ? segment : segment.replace(/^M[\d.,\s]+/, ''),
).join(' ');

/** Short dashed approach from the arrival portal up to the first node. */
export const WORLD2_ARRIVAL_APPROACH = 'M44,862 C52,840 56,818 70,800';

/** Trail overlay group filled at runtime by `PhaseSelect`. */
export const WORLD2_TRAIL_GROUP_ID = 'w2-trail-overlay';

/**
 * Far layer (0.6x): orbital ring, zone gradients and glows, skyline slabs,
 * traffic bands, stars, searchlights and the zone labels.
 */
export const WORLD2_FAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='w2-zones' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#060B12'/><stop offset='.08' stop-color='#0A1620'/>
      <stop offset='.18' stop-color='#0C1C27'/><stop offset='.26' stop-color='#0A1722'/>
      <stop offset='.33' stop-color='#0F2432'/><stop offset='.42' stop-color='#16242E'/>
      <stop offset='.47' stop-color='#1B2436'/><stop offset='.54' stop-color='#122533'/>
      <stop offset='.60' stop-color='#0E2430'/><stop offset='.68' stop-color='#0B1A25'/>
      <stop offset='.74' stop-color='#112430'/><stop offset='.80' stop-color='#1C2318'/>
      <stop offset='.86' stop-color='#0E1B24'/><stop offset='.92' stop-color='#0B1A24'/>
      <stop offset='1' stop-color='#060F16'/>
    </linearGradient>
    <radialGradient id='w2-coreG'><stop offset='0' stop-color='#35E8FF' stop-opacity='.30'/><stop offset='1' stop-color='#35E8FF' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-weaveG'><stop offset='0' stop-color='#FF4D8D' stop-opacity='.22'/><stop offset='1' stop-color='#FF4D8D' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-gridG'><stop offset='0' stop-color='#35E8FF' stop-opacity='.18'/><stop offset='1' stop-color='#35E8FF' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-yardG'><stop offset='0' stop-color='#FFB03A' stop-opacity='.20'/><stop offset='1' stop-color='#FFB03A' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-docksG'><stop offset='0' stop-color='#7DFFC4' stop-opacity='.20'/><stop offset='1' stop-color='#7DFFC4' stop-opacity='0'/></radialGradient>
    <linearGradient id='w2-beam' x1='0' y1='0' x2='.4' y2='1'><stop offset='0' stop-color='#EAF7FF' stop-opacity='.09'/><stop offset='1' stop-color='#EAF7FF' stop-opacity='0'/></linearGradient>
    <linearGradient id='w2-railG' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#35E8FF' stop-opacity='0'/><stop offset='.5' stop-color='#35E8FF' stop-opacity='.30'/><stop offset='1' stop-color='#35E8FF' stop-opacity='0'/></linearGradient>
  </defs>
  <rect width='390' height='900' fill='#0B1720'/>
  <rect x='0' y='40' width='390' height='860' fill='url(#w2-zones)'/>
  <ellipse cx='224' cy='272' rx='168' ry='128' fill='url(#w2-coreG)'/>
  <ellipse cx='120' cy='424' rx='150' ry='86' fill='url(#w2-weaveG)'/>
  <ellipse cx='276' cy='528' rx='150' ry='84' fill='url(#w2-gridG)'/>
  <ellipse cx='286' cy='722' rx='160' ry='82' fill='url(#w2-yardG)'/>
  <ellipse cx='78' cy='806' rx='170' ry='92' fill='url(#w2-docksG)'/>
  <g fill='none'>
    <ellipse cx='215' cy='258' rx='186' ry='60' stroke='#35E8FF' stroke-opacity='.13' transform='rotate(-17 215 258)'/>
    <ellipse cx='215' cy='258' rx='140' ry='140' stroke='#35E8FF' stroke-opacity='.15'/>
    <ellipse cx='215' cy='258' rx='106' ry='32' stroke='#EAF7FF' stroke-opacity='.14' stroke-dasharray='3 8' transform='rotate(23 215 258)'/>
    <ellipse cx='215' cy='258' rx='54' ry='54' stroke='#35E8FF' stroke-opacity='.24'/>
    <path d='M30,470 L390,392' stroke='#A9D7E4' stroke-opacity='.07' stroke-width='9'/>
    <path d='M30,470 L390,392' stroke='#EAF7FF' stroke-opacity='.10' stroke-width='1'/>
  </g>
  <g fill='#071119'>
    <path d='M0,352 L16,352 L16,326 L28,326 L28,346 L44,346 L44,306 L56,306 L56,350 L74,350 L74,322 L86,322 L86,342 L104,342 L104,314 L116,314 L116,352 L140,352 L140,332 L150,332 L150,352 L390,352 L390,400 L0,400 Z' opacity='.66'/>
    <path d='M0,512 L24,512 L24,470 L34,470 L34,500 L58,500 L58,462 L70,462 L70,496 L92,496 L92,452 L104,452 L104,512 L390,512 L390,566 L0,566 Z' opacity='.52'/>
    <path d='M0,706 L30,706 L30,660 L42,660 L42,688 L70,688 L70,646 L82,646 L82,706 L390,706 L390,748 L0,748 Z' opacity='.58'/>
  </g>
  <g stroke='#FFB03A' stroke-opacity='.5' stroke-width='1'>
    <path d='M24,486 v-14 M34,486 v-10 M62,474 v-12 M74,474 v-8 M96,462 v-10 M108,462 v-6'/>
  </g>
  <g stroke='#7DFFC4' stroke-opacity='.5' stroke-width='1'>
    <path d='M306,352 v-16 M316,352 v-12 M346,352 v-18 M356,352 v-10'/>
  </g>
  <g fill='none' stroke-width='1.4' stroke-dasharray='24 20'>
    <path class='w2-flow pm-flow' d='M-10,374 L400,336' stroke='#7DFFC4' stroke-opacity='.22'/>
    <path class='w2-flow pm-flow' d='M-10,486 L400,462' stroke='#35E8FF' stroke-opacity='.18' style='animation-delay:1.4s'/>
    <path class='w2-flow pm-flow' d='M-10,668 L400,640' stroke='#FFB03A' stroke-opacity='.20' style='animation-delay:.7s'/>
    <path class='w2-flow pm-flow' d='M-10,790 L400,768' stroke='#7DFFC4' stroke-opacity='.16' style='animation-delay:2.1s'/>
  </g>
  <rect x='0' y='452' width='390' height='2' fill='url(#w2-railG)' opacity='.7'/>
  <g fill='#EAF7FF'>
    <circle class='w2-tw pm-tw' cx='34' cy='82' r='1.2' style='animation-delay:.3s'/><circle class='w2-tw pm-tw' cx='92' cy='112' r='1' style='animation-delay:1.6s'/>
    <circle class='w2-tw pm-tw' cx='148' cy='66' r='1.3' style='animation-delay:.8s'/><circle class='w2-tw pm-tw' cx='206' cy='96' r='1' style='animation-delay:2.2s'/>
    <circle class='w2-tw pm-tw' cx='258' cy='70' r='1.2' style='animation-delay:1.1s'/><circle class='w2-tw pm-tw' cx='316' cy='104' r='1' style='animation-delay:2.7s'/>
    <circle class='w2-tw pm-tw' cx='356' cy='146' r='1.2' style='animation-delay:.5s'/><circle class='w2-tw pm-tw' cx='58' cy='178' r='1' style='animation-delay:1.9s'/>
    <circle class='w2-tw pm-tw' cx='118' cy='232' r='1.2' style='animation-delay:3s'/><circle class='w2-tw pm-tw' cx='252' cy='210' r='1' style='animation-delay:.9s'/>
    <circle class='w2-tw pm-tw' cx='334' cy='252' r='1.2' style='animation-delay:2.4s'/><circle class='w2-tw pm-tw' cx='18' cy='132' r='1' style='animation-delay:1.5s'/>
    <circle class='w2-tw pm-tw' cx='190' cy='44' r='1.1' style='animation-delay:3.2s'/><circle class='w2-tw pm-tw' cx='298' cy='166' r='1' style='animation-delay:.2s'/>
  </g>
  <g fill='#7DFFC4' opacity='.4'>
    <rect x='60' y='292' width='9' height='1.6' transform='rotate(-18 64 293)'/>
    <rect x='288' y='342' width='7' height='1.4' transform='rotate(-18 291 343)'/>
    <rect x='136' y='392' width='6' height='1.4' transform='rotate(-18 139 393)'/>
  </g>
  <polygon class='w2-beam pm-beam' points='84,58 132,58 214,470 152,486' fill='url(#w2-beam)'/>
  <polygon class='w2-beam pm-beam' points='248,58 276,58 338,412 300,424' fill='url(#w2-beam)' opacity='.6' style='animation-delay:2.5s'/>
  <g font-size='6.5' letter-spacing='2.2' fill='#EAF7FF' opacity='.28' font-family='ui-monospace,monospace'>
    <text x='10' y='312'>CORE</text><text x='10' y='436'>WEAVE</text><text x='10' y='560'>GRID</text>
    <text x='10' y='668'>SPINE</text><text x='10' y='752'>YARD</text><text x='10' y='826'>DOCKS</text>
  </g>
  <g fill='#35E8FF' opacity='.34'>
    <path d='M372,246 h10 v1 h-10 z'/><path d='M372,252 h6 v1 h-6 z'/>
    <path d='M8,596 h12 v1 h-12 z'/><path d='M8,602 h7 v1 h-7 z'/>
  </g>
</svg>`;

/**
 * Mid layer (0.8x): antenna farm, substation arcs, hardlight weave, maglev
 * span, docks gantry, reflections and neon rain.
 */
export const WORLD2_MID_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='w2-holo' gradientUnits='userSpaceOnUse' x1='20' y1='486' x2='390' y2='404'>
      <stop offset='0' stop-color='#FF4D8D' stop-opacity='.60'/><stop offset='.5' stop-color='#35E8FF' stop-opacity='.45'/><stop offset='1' stop-color='#7DFFC4' stop-opacity='.30'/>
    </linearGradient>
  </defs>
  <g fill='none' stroke='#3E5C6B' stroke-width='2' stroke-linecap='round'>
    <path d='M306,392 L306,342 M318,392 L318,356 M332,392 L332,350'/>
    <path d='M306,356 a17,8 -22 0 1 17,7'/>
    <path d='M318,344 a21,10 -22 0 1 21,9'/>
    <path d='M332,350 a14,7 -22 0 1 14,6'/>
    <path d='M290,332 l-8,8 M346,340 l8,7' stroke='#35E8FF' stroke-opacity='.3'/>
  </g>
  <circle class='w2-tw pm-tw' cx='330' cy='350' r='1.6' fill='#7DFFC4'/>
  <ellipse cx='318' cy='336' rx='30' ry='18' fill='#35E8FF' opacity='.06'/>
  <g fill='#132430' stroke='#35E8FF' stroke-opacity='.20'>
    <rect x='34' y='536' width='40' height='30' rx='2'/>
    <rect x='82' y='548' width='26' height='20' rx='2'/>
    <path d='M40,566 v20 M48,566 v20 M56,566 v20 M64,566 v20' stroke-width='2' fill='none'/>
  </g>
  <g stroke='#FFB03A' stroke-opacity='.35' stroke-width='1.6' fill='none'>
    <path d='M44,536 v-14 M54,536 v-20 M64,536 v-12'/>
    <path d='M34,522 q22,-8 44,0' stroke-opacity='.20'/>
    <path d='M82,548 q-16,-26 -30,-34' stroke-opacity='.18'/>
  </g>
  <g fill='none' stroke='#35E8FF' stroke-opacity='.22' stroke-width='2' stroke-linecap='round'>
    <path d='M150,600 v-26 a18,18 0 0 1 36,0 v26'/>
    <path d='M196,600 v-26 a18,18 0 0 1 36,0 v26'/>
    <path d='M150,576 h82' stroke-opacity='.12'/>
  </g>
  <g fill='none' stroke='url(#w2-holo)' stroke-width='1.2'>
    <path d='M28,486 L128,420 L228,478 L328,412 L390,452'/>
    <path d='M28,452 L120,414 L214,462 L318,404 L390,430'/>
    <path d='M88,470 L88,436 M172,450 L172,428 M268,462 L268,432 M344,438 L344,414' stroke-opacity='.55'/>
  </g>
  <g fill='#FF4D8D' opacity='.55'>
    <circle class='w2-tw pm-tw' cx='128' cy='420' r='1.5' style='animation-delay:.6s'/>
    <circle class='w2-tw pm-tw' cx='228' cy='478' r='1.3' style='animation-delay:2s'/>
    <circle class='w2-tw pm-tw' cx='328' cy='412' r='1.4' style='animation-delay:3.1s'/>
  </g>
  <g fill='none' stroke='#2C4655' stroke-width='3'>
    <path d='M188,620 L390,600'/>
    <path d='M200,620 L200,652 M258,613 L258,644 M318,606 L318,638 M372,600 L372,630'/>
    <path d='M200,632 L258,625 M258,625 L318,618 M318,618 L372,612' stroke-width='1.6' stroke-opacity='.7'/>
    <path d='M188,620 q30,-32 58,0 q32,-34 60,0 q30,-32 60,0' stroke='#35E8FF' stroke-opacity='.18'/>
    <path d='M192,616 L390,596' stroke='#FFB03A' stroke-opacity='.22' stroke-width='2' stroke-dasharray='3 9'/>
  </g>
  <rect x='198' y='616' width='8' height='7' fill='#FFB03A' opacity='.55'/>
  <rect x='254' y='610' width='8' height='7' fill='#35E8FF' opacity='.5'/>
  <g fill='none' stroke='#2E4A58' stroke-width='3'>
    <path d='M296,844 L296,770 L374,770 L374,844'/>
    <path d='M308,770 L320,844 M360,770 L348,844'/>
    <path d='M296,788 L374,788'/>
  </g>
  <rect x='318' y='770' width='34' height='10' fill='#1B303C' stroke='#35E8FF' stroke-opacity='.2'/>
  <g stroke='#FFB03A' stroke-opacity='.45' stroke-width='1.4' fill='none'>
    <path d='M326,780 v20 M338,780 v20 M350,780 v20'/>
  </g>
  <g stroke='#A9D7E4' stroke-opacity='.05' stroke-width='14' stroke-linecap='round'>
    <path d='M96,660 v140 M180,672 v128'/>
  </g>
  <g fill='#35E8FF' opacity='.10'>
    <ellipse cx='120' cy='862' rx='26' ry='4'/>
    <ellipse cx='286' cy='852' rx='30' ry='4'/>
    <ellipse cx='214' cy='878' rx='42' ry='5'/>
  </g>
  <g stroke='#BFF3FF' stroke-opacity='.32' stroke-width='1' stroke-linecap='round'>
    <path class='w2-rain pm-snow' d='M36,420 l-4,14' style='animation-delay:0s'/>
    <path class='w2-rain pm-snow' d='M84,368 l-4,14' style='animation-delay:1.2s'/>
    <path class='w2-rain pm-snow' d='M132,452 l-4,14' style='animation-delay:2.4s'/>
    <path class='w2-rain pm-snow' d='M178,384 l-4,14' style='animation-delay:.6s'/>
    <path class='w2-rain pm-snow' d='M226,440 l-4,14' style='animation-delay:3s'/>
    <path class='w2-rain pm-snow' d='M262,352 l-4,14' style='animation-delay:1.8s'/>
    <path class='w2-rain pm-snow' d='M302,436 l-4,14' style='animation-delay:4.2s'/>
    <path class='w2-rain pm-snow' d='M348,388 l-4,14' style='animation-delay:2.7s'/>
    <path class='w2-rain pm-snow' d='M58,560 l-4,14' style='animation-delay:3.6s'/>
    <path class='w2-rain pm-snow' d='M108,620 l-4,14' style='animation-delay:1.4s'/>
    <path class='w2-rain pm-snow' d='M196,584 l-4,14' style='animation-delay:4.8s'/>
    <path class='w2-rain pm-snow' d='M244,656 l-4,14' style='animation-delay:.9s'/>
    <path class='w2-rain pm-snow' d='M342,600 l-4,14' style='animation-delay:2.1s'/>
    <path class='w2-rain pm-snow' d='M374,512 l-4,14' style='animation-delay:5.4s'/>
  </g>
  <ellipse class='w2-mist pm-fog' cx='92' cy='742' rx='120' ry='26' fill='#7DFFC4' opacity='.10'/>
  <ellipse class='w2-mist pm-fog' cx='300' cy='824' rx='130' ry='30' fill='#FFB03A' opacity='.09' style='animation-delay:3s'/>
  <ellipse class='w2-mist pm-fog' cx='256' cy='462' rx='120' ry='24' fill='#FF4D8D' opacity='.08' style='animation-delay:6s'/>
</svg>`;

/**
 * Near layer (1.0x): zone bands, the contained core ring at the summit, the
 * arrival portal, the wet dock deck, marker posts and the trail base. Trail
 * overlays are injected at runtime into `#w2-trail-overlay`.
 */
export const WORLD2_NEAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <radialGradient id='w2-coreWell'><stop offset='0' stop-color='#040B12' stop-opacity='.96'/><stop offset='.7' stop-color='#08222E' stop-opacity='.90'/><stop offset='1' stop-color='#0B3340' stop-opacity='.85'/></radialGradient>
    <linearGradient id='w2-bands' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#35E8FF' stop-opacity='.10'/><stop offset='.16' stop-color='#35E8FF' stop-opacity='.02'/>
      <stop offset='.24' stop-color='#FF4D8D' stop-opacity='.10'/><stop offset='.36' stop-color='#FF4D8D' stop-opacity='.02'/>
      <stop offset='.44' stop-color='#35E8FF' stop-opacity='.08'/><stop offset='.56' stop-color='#35E8FF' stop-opacity='.02'/>
      <stop offset='.62' stop-color='#7DFFC4' stop-opacity='.07'/><stop offset='.72' stop-color='#7DFFC4' stop-opacity='.02'/>
      <stop offset='.76' stop-color='#FFB03A' stop-opacity='.08'/><stop offset='.86' stop-color='#FFB03A' stop-opacity='.02'/>
      <stop offset='.88' stop-color='#35E8FF' stop-opacity='.07'/><stop offset='1' stop-color='#35E8FF' stop-opacity='.02'/>
    </linearGradient>
    <linearGradient id='w2-portal' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#35E8FF'/><stop offset='1' stop-color='#FF4D8D'/></linearGradient>
    <linearGradient id='w2-deck' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#132C38' stop-opacity='.92'/><stop offset='1' stop-color='#07141C'/></linearGradient>
    <filter id='w2-soft' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='3.5'/></filter>
  </defs>
  <rect x='0' y='40' width='390' height='860' fill='url(#w2-bands)'/>
  <g>
    <circle cx='224' cy='282' r='44' fill='url(#w2-coreWell)'/>
    <circle cx='224' cy='282' r='44' fill='none' stroke='#35E8FF' stroke-opacity='.45' stroke-width='2'/>
    <circle cx='224' cy='282' r='44' fill='none' stroke='#7DFFC4' stroke-opacity='.14' stroke-width='7' filter='url(#w2-soft)'/>
    <circle class='w2-spin pm-spin' cx='224' cy='282' r='57' fill='none' stroke='#EAF7FF' stroke-opacity='.30' stroke-width='1.2' stroke-dasharray='2 9'/>
    <path d='M180,282 a44,44 0 0 1 88,0' fill='none' stroke='#FF4D8D' stroke-opacity='.38' stroke-width='3' stroke-linecap='round'/>
    <g stroke='#35E8FF' stroke-opacity='.30' stroke-width='2' stroke-linecap='round'>
      <path d='M190,254 l14,11 M258,254 l-14,11 M190,310 l14,-11 M258,310 l-14,-11'/>
    </g>
  </g>
  <path d='M0,844 L390,832 L390,900 L0,900 Z' fill='url(#w2-deck)'/>
  <g stroke='#7DFFC4' stroke-opacity='.16' stroke-width='1'>
    <path d='M0,856 L390,844'/><path d='M0,872 L390,860'/><path d='M0,888 L390,876'/>
  </g>
  <g stroke='#35E8FF' stroke-opacity='.18' stroke-width='2'>
    <path d='M18,846 v16 M102,844 v16 M196,842 v16 M286,840 v16 M372,838 v16'/>
  </g>
  <g fill='#EAF7FF' opacity='.22'>
    <rect x='110' y='850' width='28' height='2' transform='rotate(-2 124 851)'/>
    <rect x='238' y='846' width='34' height='2' transform='rotate(-2 255 847)'/>
  </g>
  <g>
    <path d='M134,846 v-30 M356,842 v-28' stroke='#2C4655' stroke-width='3'/>
    <path d='M128,816 h12 M350,814 h12' stroke='#2C4655' stroke-width='4'/>
    <circle cx='134' cy='813' r='10' fill='#FFB03A' opacity='.14'/>
    <circle cx='356' cy='813' r='10' fill='#35E8FF' opacity='.12'/>
    <circle cx='134' cy='813' r='2.4' fill='#FFD08A'/>
    <circle cx='356' cy='813' r='2.4' fill='#7DFFC4'/>
    <ellipse cx='134' cy='852' rx='15' ry='3' fill='#FFB03A' opacity='.18'/>
    <ellipse cx='356' cy='848' rx='15' ry='3' fill='#35E8FF' opacity='.16'/>
  </g>
  <g>
    <circle cx='44' cy='862' r='30' fill='#35E8FF' opacity='.10'/>
    <circle cx='44' cy='862' r='22' fill='#06131B' stroke='url(#w2-portal)' stroke-width='2.5'/>
    <circle class='w2-spin pm-spin' cx='44' cy='862' r='27' fill='none' stroke='#7DFFC4' stroke-opacity='.45' stroke-width='1' stroke-dasharray='3 7'/>
    <path d='M28,876 a24,24 0 0 1 32,-28' fill='none' stroke='#35E8FF' stroke-opacity='.55' stroke-width='1.5'/>
  </g>
  <g stroke='#35E8FF' stroke-opacity='.40' stroke-width='2' stroke-linecap='round'>
    <path d='M318,742 v20'/><path d='M160,676 v20'/><path d='M244,562 v20'/><path d='M74,444 v20'/>
  </g>
  <g fill='#7DFFC4'>
    <circle class='w2-tw pm-tw' cx='318' cy='740' r='2.4' style='animation-delay:.4s'/>
    <circle class='w2-tw pm-tw' cx='160' cy='674' r='2.2' style='animation-delay:1.6s'/>
    <circle class='w2-tw pm-tw' cx='244' cy='560' r='2.2' style='animation-delay:2.8s'/>
    <circle class='w2-tw pm-tw' cx='74' cy='442' r='2.2' style='animation-delay:1s'/>
  </g>
  <g fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <path d='${WORLD2_TRAIL_PATH}' stroke='#040A10' stroke-opacity='.55' stroke-width='40'/>
    <path d='${WORLD2_TRAIL_PATH}' stroke='#1C3440' stroke-width='25'/>
    <path d='${WORLD2_TRAIL_PATH}' stroke='#0A1A22' stroke-width='17'/>
    <g id='${WORLD2_TRAIL_GROUP_ID}'></g>
    <path d='${WORLD2_TRAIL_PATH}' stroke='#7DFFC4' stroke-opacity='.26' stroke-width='2' stroke-dasharray='8 14' class='w2-flow pm-flow'/>
    <path d='${WORLD2_ARRIVAL_APPROACH}' stroke='#35E8FF' stroke-opacity='.30' stroke-width='2' stroke-dasharray='4 8'/>
  </g>
</svg>`;

/** Front layer (1.15x): neon droplet and lamp bokeh, taller than the scene. */
export const WORLD2_FRONT_ART = `
<svg viewBox='0 0 390 ${WORLD2_FRONT_HEIGHT}' aria-hidden='true' focusable='false'>
  <defs>
    <radialGradient id='w2-fgbC'><stop offset='0' stop-color='#7DFFC4' stop-opacity='.90'/><stop offset='.5' stop-color='#35E8FF' stop-opacity='.24'/><stop offset='1' stop-color='#35E8FF' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-fgbW'><stop offset='0' stop-color='#EAF7FF' stop-opacity='.90'/><stop offset='.5' stop-color='#EAF7FF' stop-opacity='.22'/><stop offset='1' stop-color='#EAF7FF' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-fgbA'><stop offset='0' stop-color='#FFD79A' stop-opacity='.90'/><stop offset='.5' stop-color='#FFB03A' stop-opacity='.22'/><stop offset='1' stop-color='#FFB03A' stop-opacity='0'/></radialGradient>
    <radialGradient id='w2-fgbM'><stop offset='0' stop-color='#FFA8C4' stop-opacity='.90'/><stop offset='.5' stop-color='#FF4D8D' stop-opacity='.22'/><stop offset='1' stop-color='#FF4D8D' stop-opacity='0'/></radialGradient>
  </defs>
  <circle cx='44' cy='88' r='26' fill='url(#w2-fgbC)' opacity='.15'/>
  <circle cx='296' cy='58' r='20' fill='url(#w2-fgbW)' opacity='.12'/>
  <circle cx='180' cy='196' r='30' fill='url(#w2-fgbM)' opacity='.10'/>
  <circle cx='352' cy='176' r='16' fill='url(#w2-fgbC)' opacity='.13'/>
  <circle cx='66' cy='292' r='24' fill='url(#w2-fgbA)' opacity='.12'/>
  <circle cx='250' cy='356' r='18' fill='url(#w2-fgbA)' opacity='.14'/>
  <circle cx='358' cy='282' r='22' fill='url(#w2-fgbC)' opacity='.10'/>
  <circle cx='118' cy='466' r='26' fill='url(#w2-fgbW)' opacity='.13'/>
  <circle cx='330' cy='428' r='18' fill='url(#w2-fgbC)' opacity='.15'/>
  <circle cx='58' cy='556' r='24' fill='url(#w2-fgbM)' opacity='.12'/>
  <circle cx='238' cy='616' r='20' fill='url(#w2-fgbC)' opacity='.13'/>
  <circle cx='348' cy='586' r='16' fill='url(#w2-fgbM)' opacity='.11'/>
  <circle cx='148' cy='698' r='22' fill='url(#w2-fgbA)' opacity='.12'/>
  <circle cx='300' cy='672' r='16' fill='url(#w2-fgbA)' opacity='.14'/>
  <circle cx='88' cy='796' r='28' fill='url(#w2-fgbC)' opacity='.13'/>
  <circle cx='258' cy='846' r='22' fill='url(#w2-fgbC)' opacity='.15'/>
  <circle cx='348' cy='778' r='18' fill='url(#w2-fgbW)' opacity='.11'/>
  <circle cx='118' cy='946' r='26' fill='url(#w2-fgbC)' opacity='.11'/>
  <circle cx='298' cy='1002' r='20' fill='url(#w2-fgbM)' opacity='.09'/>
  <circle cx='54' cy='1032' r='18' fill='url(#w2-fgbA)' opacity='.10'/>
</svg>`;

/** Complete map definition consumed by `PhaseSelect`. */
export const WORLD2_MAP: MapDef = {
  id: 'w2',
  numeral: 'II',
  name: WORLD2_NAME,
  accent: '#35e8ff',
  width: WORLD2_WIDTH,
  height: WORLD2_HEIGHT,
  frontHeight: WORLD2_FRONT_HEIGHT,
  depths: WORLD2_DEPTHS,
  nodePoints: WORLD2_NODE_POINTS,
  fallbackPoint: WORLD2_FALLBACK_POINT,
  arrivalPoint: WORLD2_ARRIVAL_POINT,
  trailPath: WORLD2_TRAIL_PATH,
  trailSegments: WORLD2_TRAIL_SEGMENTS,
  trailGroupId: WORLD2_TRAIL_GROUP_ID,
  farArt: WORLD2_FAR_ART,
  midArt: WORLD2_MID_ART,
  nearArt: WORLD2_NEAR_ART,
  frontArt: WORLD2_FRONT_ART,
  trailColors: {
    doneSoft: '#7DFFC4',
    doneGradient: '#35E8FF',
    doneGlow: '#EAF7FF',
    locked: '#2A3A48',
  },
};
