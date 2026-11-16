/**
 * World 3 — "Rustwake" trail map.
 *
 * A dead steelworks: slag yard with sodium floodlights and scrap at the base,
 * a rail yard, a foundry with stacks, boiler house, cooling tower and a
 * suspended motor with a red beacon at the summit. Same 390 x 900 viewBox and
 * four-layer parallax contract as `world1.ts`; every id and class is prefixed
 * `w3-` so all maps can share a document.
 */

export const WORLD3_NAME = 'III · RUSTWAKE';

export const WORLD3_WIDTH = 390;
export const WORLD3_HEIGHT = 900;
/** The front layer is taller so its bokeh still covers the 1.15x scroll edge. */
export const WORLD3_FRONT_HEIGHT = 1060;

/** Parallax depth per layer. `1` is content speed; higher moves faster. */
export const WORLD3_DEPTHS = {
  far: 0.6,
  mid: 0.8,
  near: 1,
  front: 1.15,
} as const;

export type { WorldNodePoint } from './types';
import type { MapDef, WorldNodePoint } from './types';

/** Campaign phases 1..6, in phase index order. */
export const WORLD3_NODE_POINTS: readonly WorldNodePoint[] = [
  { x: 66, y: 806, labelSide: 'right' },
  { x: 298, y: 708, labelSide: 'left' },
  { x: 118, y: 596, labelSide: 'right' },
  { x: 300, y: 480, labelSide: 'left' },
  { x: 112, y: 346, labelSide: 'right' },
  { x: 262, y: 168, labelSide: 'left' },
];

/** Defensive fallback for content with an unexpected phase index. */
export const WORLD3_FALLBACK_POINT: WorldNodePoint = { x: 195, y: 450, labelSide: 'right' };

/** Decorative arrival portal on the slag yard track, below phase 1. */
export const WORLD3_ARRIVAL_POINT: WorldNodePoint = { x: 58, y: 868, labelSide: 'right' };

/**
 * Trail split per node-to-node segment so completed stretches can light up
 * without redrawing the whole path.
 */
export const WORLD3_TRAIL_SEGMENTS: readonly string[] = [
  'M66,806 C130,800 236,742 298,708',
  'M298,708 C314,676 200,628 118,596',
  'M118,596 C86,556 214,516 300,480',
  'M300,480 C286,432 160,390 112,346',
  'M112,346 C104,300 180,230 262,168',
];

/** Full trail, derived from the segments so both stay in sync. */
export const WORLD3_TRAIL_PATH: string = WORLD3_TRAIL_SEGMENTS.map((segment, index) =>
  index === 0 ? segment : segment.replace(/^M[\d.,\s]+/, ''),
).join(' ');

/** Short dashed approach from the arrival portal up to the first node. */
export const WORLD3_ARRIVAL_APPROACH = 'M58,868 C60,850 62,828 66,806';

/** Trail overlay group filled at runtime by `PhaseSelect`. */
export const WORLD3_TRAIL_GROUP_ID = 'w3-trail-overlay';

/**
 * Far layer (0.6x): smoke sky and zone gradients, plumes, distant stacks,
 * sodium floodlight cones, freight lines and stencil zone labels.
 */
export const WORLD3_FAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='w3-zones' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#120F0B'/><stop offset='.08' stop-color='#1A1712'/>
      <stop offset='.16' stop-color='#16130F'/><stop offset='.24' stop-color='#1D1914'/>
      <stop offset='.34' stop-color='#191510'/><stop offset='.44' stop-color='#1E1913'/>
      <stop offset='.54' stop-color='#17130F'/><stop offset='.63' stop-color='#1D1712'/>
      <stop offset='.72' stop-color='#1A1510'/><stop offset='.80' stop-color='#241C14'/>
      <stop offset='.88' stop-color='#1C1712'/><stop offset='1' stop-color='#120F0B'/>
    </linearGradient>
    <radialGradient id='w3-motorG'><stop offset='0' stop-color='#C8452C' stop-opacity='.22'/><stop offset='1' stop-color='#C8452C' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-coolG'><stop offset='0' stop-color='#7E786C' stop-opacity='.16'/><stop offset='1' stop-color='#7E786C' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-boilG'><stop offset='0' stop-color='#D9A441' stop-opacity='.18'/><stop offset='1' stop-color='#D9A441' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-foundG'><stop offset='0' stop-color='#C8452C' stop-opacity='.22'/><stop offset='1' stop-color='#C8452C' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-yardG'><stop offset='0' stop-color='#8C4A32' stop-opacity='.18'/><stop offset='1' stop-color='#8C4A32' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-slagG'><stop offset='0' stop-color='#D9A441' stop-opacity='.20'/><stop offset='1' stop-color='#D9A441' stop-opacity='0'/></radialGradient>
    <linearGradient id='w3-flood' x1='0' y1='1' x2='.2' y2='0'><stop offset='0' stop-color='#D9A441' stop-opacity='.26'/><stop offset='1' stop-color='#D9A441' stop-opacity='0'/></linearGradient>
    <linearGradient id='w3-plume' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#7E786C' stop-opacity='.16'/><stop offset='1' stop-color='#7E786C' stop-opacity='0'/></linearGradient>
  </defs>
  <rect width='390' height='900' fill='#16130F'/>
  <rect x='0' y='40' width='390' height='860' fill='url(#w3-zones)'/>
  <ellipse cx='262' cy='200' rx='150' ry='110' fill='url(#w3-motorG)'/>
  <ellipse cx='112' cy='356' rx='150' ry='86' fill='url(#w3-coolG)'/>
  <ellipse cx='300' cy='490' rx='150' ry='86' fill='url(#w3-boilG)'/>
  <ellipse cx='118' cy='606' rx='150' ry='86' fill='url(#w3-foundG)'/>
  <ellipse cx='298' cy='718' rx='160' ry='82' fill='url(#w3-yardG)'/>
  <ellipse cx='66' cy='816' rx='170' ry='92' fill='url(#w3-slagG)'/>
  <g fill='url(#w3-plume)'>
    <path d='M40,330 C18,268 66,240 58,188 C50,140 96,124 88,80 L150,80 C160,130 116,150 126,198 C136,248 94,272 104,330 Z'/>
    <path d='M286,280 C272,222 320,196 312,150 C304,108 348,92 340,52 L390,52 C394,100 356,122 366,168 C376,214 336,240 344,280 Z'/>
    <path d='M180,214 C170,178 206,158 198,128 C192,100 222,88 218,64 L250,64 C256,96 230,112 236,142 C242,176 212,190 220,214 Z' opacity='.7'/>
  </g>
  <g fill='#0F0C09'>
    <path d='M14,474 c16,-40 28,-72 32,-94 h44 c4,22 16,54 32,94 z'/>
    <path d='M52,474 c10,-30 17,-52 20,-68 h20 c3,16 10,38 20,68 z' opacity='.6'/>
    <path d='M128,474 c10,-30 17,-52 20,-64 h30 c3,12 10,34 20,64 z' opacity='.85'/>
    <path d='M292,438 v-158 l9,-7 h11 l9,7 v158 z'/>
    <path d='M328,438 v-112 l7,-6 h10 l7,6 v112 z'/>
    <path d='M208,492 v-88 l6,-5 h8 l6,5 v88 z'/>
  </g>
  <g stroke='#8C4A32' stroke-opacity='.28' stroke-width='1'>
    <path d='M26,424 h88 M22,450 h88 M292,368 h29 M292,326 h29 M328,382 h24'/>
  </g>
  <g stroke='#D9A441' stroke-opacity='.5'>
    <path d='M292,300 h29' stroke-width='2'/><path d='M46,380 h44' stroke-width='2'/>
  </g>
  <ellipse cx='66' cy='384' rx='46' ry='16' fill='#D9A441' opacity='.05'/>
  <ellipse cx='308' cy='262' rx='44' ry='14' fill='#D9A441' opacity='.05'/>
  <g fill='none' stroke='#0B0907' stroke-width='2' opacity='.8'>
    <path d='M0,556 L390,540'/><path d='M0,572 L390,556'/><path d='M0,588 L390,572'/>
  </g>
  <g stroke='#7E786C' stroke-opacity='.12' stroke-width='1'>
    <path d='M0,600 L390,584'/><path d='M0,616 L390,600'/>
  </g>
  <polygon points='26,876 78,876 196,606 134,594' fill='url(#w3-flood)' opacity='.7'/>
  <polygon points='330,884 380,884 262,646 218,660' fill='url(#w3-flood)' opacity='.55'/>
  <ellipse cx='56' cy='872' rx='40' ry='16' fill='#D9A441' opacity='.12'/>
  <ellipse cx='352' cy='878' rx='34' ry='14' fill='#D9A441' opacity='.10'/>
  <g fill='#F2C879' opacity='.55'>
    <circle class='w3-tw pm-tw' cx='58' cy='844' r='2' style='animation-delay:.4s'/>
    <circle class='w3-tw pm-tw' cx='352' cy='850' r='1.8' style='animation-delay:1.8s'/>
  </g>
  <g fill='#E4DCC8' opacity='.20'>
    <circle class='w3-tw pm-tw' cx='86' cy='92' r='1' style='animation-delay:.9s'/><circle class='w3-tw pm-tw' cx='164' cy='62' r='1.1' style='animation-delay:2.2s'/>
    <circle class='w3-tw pm-tw' cx='240' cy='104' r='1' style='animation-delay:1.4s'/><circle class='w3-tw pm-tw' cx='312' cy='74' r='1.1' style='animation-delay:3s'/>
    <circle class='w3-tw pm-tw' cx='352' cy='132' r='1' style='animation-delay:.6s'/><circle class='w3-tw pm-tw' cx='44' cy='146' r='1.1' style='animation-delay:2.6s'/>
  </g>
  <g font-size='6.5' letter-spacing='3' fill='#E4DCC8' opacity='.24' font-family='ui-monospace,monospace'>
    <text x='10' y='148'>MOTOR</text><text x='10' y='336'>COOLING</text><text x='10' y='500'>BOILER</text>
    <text x='10' y='626'>FOUNDRY</text><text x='10' y='736'>YARD</text><text x='10' y='826'>SLAG</text>
  </g>
  <g fill='#C8452C' opacity='.45'>
    <path d='M366,686 h14 v2 h-14 z'/><path d='M366,692 h9 v2 h-9 z'/>
  </g>
  <g fill='#D9A441' opacity='.30'>
    <path d='M8,378 h12 v1 h-12 z'/><path d='M8,384 h7 v1 h-7 z'/>
  </g>
</svg>`;

/**
 * Mid layer (0.8x): gantry cranes, boiler tanks, pipe runs, sagging cables,
 * scrap heaps, ash fall and steam banks.
 */
export const WORLD3_MID_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <g fill='none' stroke='#3A3228' stroke-width='3' stroke-linecap='round'>
    <path d='M18,818 L18,700 L106,700 L106,742'/>
    <path d='M18,700 L60,666 L106,700'/>
    <path d='M60,666 L60,700'/>
    <path d='M60,700 v16'/>
    <path d='M32,818 L18,758 M88,818 L106,758'/>
    <path d='M310,702 v-58 h72'/>
    <path d='M310,644 l36,-24 l38,24'/>
    <path d='M380,644 v24'/>
    <path d='M332,702 v-52 M362,702 v-52'/>
  </g>
  <path d='M60,716 v16 a6,6 0 1 0 6,7' fill='none' stroke='#8C4A32' stroke-width='2'/>
  <path d='M380,668 v14' fill='none' stroke='#8C4A32' stroke-width='2'/>
  <g fill='#1B1712' stroke='#3A3228'>
    <rect x='34' y='596' width='30' height='42' rx='3'/>
    <path d='M34,604 h30 M34,620 h30 M34,632 h30' stroke='#8C4A32' stroke-opacity='.25' fill='none'/>
    <rect x='96' y='668' width='22' height='34' rx='2'/>
  </g>
  <g fill='none' stroke='#3A3228' stroke-width='6'>
    <path d='M364,306 v330 q0,16 -16,16 h-62'/>
    <path d='M338,324 v300' stroke-width='4'/>
  </g>
  <g fill='none' stroke='#8C4A32' stroke-opacity='.45' stroke-width='1.5'>
    <path d='M358,364 h12 M358,424 h12 M358,484 h12 M358,544 h12 M358,604 h12'/>
  </g>
  <rect x='286' y='636' width='62' height='18' rx='2' fill='#241E17' stroke='#8C4A32' stroke-opacity='.3'/>
  <g fill='none' stroke='#241E17' stroke-width='2'>
    <path d='M0,232 C90,268 190,196 300,244 C336,260 366,250 390,238'/>
    <path d='M0,452 C80,486 170,430 260,468 C306,486 352,476 390,462' stroke-opacity='.8'/>
  </g>
  <g stroke='#8C4A32' stroke-width='2'>
    <path d='M96,252 v10 M188,232 v12 M292,246 v10 M150,462 v12 M240,466 v10'/>
  </g>
  <g fill='none' stroke='#3A3228' stroke-width='4'>
    <path d='M26,700 v-72 M90,700 v-92'/>
    <path d='M26,650 L90,632'/>
  </g>
  <g fill='#241E17' stroke='#8C4A32' stroke-opacity='.28'>
    <path d='M118,844 l26,-24 l18,10 l16,-16 l28,30 z'/>
    <path d='M258,838 l22,-18 l14,8 l12,-12 l24,22 z'/>
    <path d='M170,860 l18,-14 l12,6 l10,-8 l18,16 z'/>
  </g>
  <g fill='#B9B0A0'>
    <circle class='w3-ash pm-snow' cx='70' cy='430' r='1.2' style='animation-delay:0s'/>
    <circle class='w3-ash pm-snow' cx='126' cy='486' r='1' style='animation-delay:1.5s'/>
    <circle class='w3-ash pm-snow' cx='182' cy='544' r='1.2' style='animation-delay:3s'/>
    <circle class='w3-ash pm-snow' cx='238' cy='502' r='1' style='animation-delay:4.5s'/>
    <circle class='w3-ash pm-snow' cx='294' cy='560' r='1.2' style='animation-delay:2.2s'/>
    <circle class='w3-ash pm-snow' cx='346' cy='512' r='1' style='animation-delay:5.4s'/>
    <circle class='w3-ash pm-snow' cx='42' cy='666' r='1.2' style='animation-delay:3.8s'/>
    <circle class='w3-ash pm-snow' cx='210' cy='712' r='1' style='animation-delay:6s'/>
    <circle class='w3-ash pm-snow' cx='312' cy='752' r='1.1' style='animation-delay:1.1s'/>
    <circle class='w3-ash pm-snow' cx='158' cy='800' r='1' style='animation-delay:4s'/>
  </g>
  <ellipse class='w3-steam pm-fog' cx='92' cy='352' rx='96' ry='24' fill='#7E786C' opacity='.13'/>
  <ellipse class='w3-steam pm-fog' cx='306' cy='470' rx='100' ry='26' fill='#B9B0A0' opacity='.10' style='animation-delay:3s'/>
  <ellipse class='w3-steam pm-fog' cx='110' cy='650' rx='90' ry='22' fill='#7E786C' opacity='.10' style='animation-delay:6s'/>
  <ellipse class='w3-steam pm-fog' cx='288' cy='820' rx='120' ry='26' fill='#8C4A32' opacity='.09' style='animation-delay:2s'/>
  <g fill='#D9A441' opacity='.5'>
    <circle class='w3-spark pm-ember' cx='252' cy='672' r='1.2' style='animation-delay:.4s'/>
    <circle class='w3-spark pm-ember' cx='276' cy='700' r='1' style='animation-delay:2.4s'/>
    <circle class='w3-spark pm-ember' cx='300' cy='676' r='1.3' style='animation-delay:4.2s'/>
  </g>
</svg>`;

/**
 * Near layer (1.0x): zone bands, slag terrain, ballast track and sleepers, the
 * stairs, the suspended motor with its beacon, the arrival portal and the trail
 * base. Trail overlays are injected at runtime into `#w3-trail-overlay`.
 */
export const WORLD3_NEAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='w3-bands' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#C8452C' stop-opacity='.08'/><stop offset='.10' stop-color='#C8452C' stop-opacity='.02'/>
      <stop offset='.16' stop-color='#7E786C' stop-opacity='.09'/><stop offset='.30' stop-color='#7E786C' stop-opacity='.02'/>
      <stop offset='.35' stop-color='#D9A441' stop-opacity='.08'/><stop offset='.48' stop-color='#D9A441' stop-opacity='.02'/>
      <stop offset='.50' stop-color='#C8452C' stop-opacity='.08'/><stop offset='.60' stop-color='#C8452C' stop-opacity='.02'/>
      <stop offset='.64' stop-color='#8C4A32' stop-opacity='.08'/><stop offset='.78' stop-color='#8C4A32' stop-opacity='.02'/>
      <stop offset='.80' stop-color='#D9A441' stop-opacity='.09'/><stop offset='.92' stop-color='#D9A441' stop-opacity='.02'/>
      <stop offset='1' stop-color='#8C4A32' stop-opacity='.03'/>
    </linearGradient>
    <radialGradient id='w3-portalG'><stop offset='0' stop-color='#2A1E12'/><stop offset='1' stop-color='#0E0B07'/></radialGradient>
    <radialGradient id='w3-beaconG'><stop offset='0' stop-color='#FF6A46' stop-opacity='.55'/><stop offset='1' stop-color='#C8452C' stop-opacity='0'/></radialGradient>
    <linearGradient id='w3-terrain' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#241E17'/><stop offset='1' stop-color='#120F0B'/></linearGradient>
  </defs>
  <rect x='0' y='40' width='390' height='860' fill='url(#w3-bands)'/>
  <path d='M0,838 C56,828 118,846 186,836 C250,828 328,846 390,834 L390,900 L0,900 Z' fill='url(#w3-terrain)'/>
  <path d='M0,846 C60,836 120,852 190,842 C252,834 330,850 390,840' fill='none' stroke='#3A3228' stroke-width='2'/>
  <g fill='#2A241C'>
    <path d='M0,864 L390,850 L390,900 L0,900 Z'/>
  </g>
  <g fill='#4A4034'>
    <path d='M0,874 L390,860 L390,900 L0,900 Z' opacity='.55'/>
  </g>
  <g stroke='#2A241C' stroke-width='5' stroke-linecap='round'>
    <path d='M10,862 l3,16 M38,861 l3,16 M66,860 l3,16 M94,859 l3,16 M122,858 l3,16 M150,857 l3,16 M178,856 l3,16'/>
    <path d='M206,855 l3,16 M234,854 l3,16 M262,853 l3,16 M290,852 l3,16 M318,851 l3,16 M346,850 l3,16 M374,849 l3,16'/>
  </g>
  <g stroke='#5A4E3E' stroke-width='2.5'>
    <path d='M0,858 L390,845'/><path d='M0,876 L390,863'/>
  </g>
  <g fill='#241E17' stroke='#4A4034' stroke-width='1'>
    <path d='M300,752 h52 v7 h-52 z'/>
    <path d='M306,762 h46 v7 h-46 z'/>
    <path d='M312,772 h40 v7 h-40 z'/>
    <path d='M318,782 h34 v7 h-34 z'/>
  </g>
  <g stroke='#8C4A32' stroke-width='2' fill='none' stroke-opacity='.6'>
    <path d='M300,752 l8,-18 M352,752 l8,-18'/>
  </g>
  <g>
    <path d='M230,44 l-2,62 M294,44 l2,62' fill='none' stroke='#3A3228' stroke-width='2' stroke-dasharray='3 3'/>
    <rect x='222' y='104' width='80' height='7' rx='2' fill='#241E17' stroke='#7E786C' stroke-opacity='.3'/>
    <rect x='228' y='111' width='68' height='36' rx='3' fill='#2A241C' stroke='#D9A441' stroke-opacity='.20'/>
    <g stroke='#7E786C' stroke-opacity='.35' stroke-width='1.5'>
      <path d='M238,113 v32 M248,113 v32 M258,113 v32 M268,113 v32 M278,113 v32'/>
    </g>
    <path d='M228,147 h68' stroke='#8C4A32' stroke-width='3'/>
    <path d='M262,111 v-12' stroke='#3A3228' stroke-width='2'/>
    <circle cx='262' cy='95' r='14' fill='url(#w3-beaconG)'/>
    <circle class='w3-beacon pm-tw' cx='262' cy='95' r='3.4' fill='#E4553A'/>
    <circle cx='262' cy='95' r='6' fill='none' stroke='#C8452C' stroke-opacity='.35' stroke-width='1'/>
  </g>
  <path d='M0,838 C56,828 118,846 186,836 C250,828 328,846 390,834' fill='none' stroke='#3A3228' stroke-width='1.5' stroke-opacity='.7'/>
  <g>
    <circle cx='58' cy='868' r='32' fill='#D9A441' opacity='.10'/>
    <circle cx='58' cy='868' r='23' fill='url(#w3-portalG)' stroke='#D9A441' stroke-width='2.5'/>
    <circle class='w3-spin pm-spin' cx='58' cy='868' r='28' fill='none' stroke='#F2C879' stroke-opacity='.45' stroke-width='1' stroke-dasharray='3 7'/>
    <path d='M40,880 a26,26 0 0 1 36,-30' fill='none' stroke='#C8452C' stroke-opacity='.65' stroke-width='2'/>
    <g stroke='#C8452C' stroke-opacity='.55' stroke-width='1.5'>
      <path d='M44,856 l5,5 M46,862 l5,5 M72,878 l-5,-5'/>
    </g>
  </g>
  <g fill='#241E17' stroke='#8C4A32' stroke-opacity='.4'>
    <rect x='336' y='612' width='16' height='12' rx='2'/>
    <rect x='54' y='710' width='14' height='10' rx='2'/>
    <rect x='246' y='588' width='12' height='9' rx='2'/>
  </g>
  <g fill='#D9A441' opacity='.45'>
    <circle class='w3-tw pm-tw' cx='344' cy='618' r='1.6' style='animation-delay:.8s'/>
    <circle class='w3-tw pm-tw' cx='61' cy='715' r='1.4' style='animation-delay:2.4s'/>
    <circle class='w3-tw pm-tw' cx='252' cy='592' r='1.4' style='animation-delay:1.6s'/>
  </g>
  <g fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <path d='${WORLD3_TRAIL_PATH}' stroke='#0B0907' stroke-opacity='.6' stroke-width='40'/>
    <path d='${WORLD3_TRAIL_PATH}' stroke='#3A3228' stroke-width='25'/>
    <path d='${WORLD3_TRAIL_PATH}' stroke='#120F0B' stroke-width='17'/>
    <g id='${WORLD3_TRAIL_GROUP_ID}'></g>
    <path d='${WORLD3_TRAIL_PATH}' stroke='#D9A441' stroke-opacity='.24' stroke-width='2' stroke-dasharray='7 15' class='w3-flow pm-flow'/>
    <path d='${WORLD3_ARRIVAL_APPROACH}' stroke='#D9A441' stroke-opacity='.30' stroke-width='2' stroke-dasharray='4 8'/>
  </g>
</svg>`;

/**
 * Front layer (1.15x): near cable, dust motes and sodium bokeh, taller than the
 * base scene.
 */
export const WORLD3_FRONT_ART = `
<svg viewBox='0 0 390 ${WORLD3_FRONT_HEIGHT}' aria-hidden='true' focusable='false'>
  <defs>
    <radialGradient id='w3-fgbA'><stop offset='0' stop-color='#F2C879' stop-opacity='.90'/><stop offset='.5' stop-color='#D9A441' stop-opacity='.22'/><stop offset='1' stop-color='#D9A441' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-fgbW'><stop offset='0' stop-color='#EFE6D2' stop-opacity='.85'/><stop offset='.5' stop-color='#EFE6D2' stop-opacity='.20'/><stop offset='1' stop-color='#EFE6D2' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-fgbR'><stop offset='0' stop-color='#E87A5A' stop-opacity='.90'/><stop offset='.5' stop-color='#C8452C' stop-opacity='.20'/><stop offset='1' stop-color='#C8452C' stop-opacity='0'/></radialGradient>
    <radialGradient id='w3-fgbG'><stop offset='0' stop-color='#A8A294' stop-opacity='.85'/><stop offset='.5' stop-color='#7E786C' stop-opacity='.18'/><stop offset='1' stop-color='#7E786C' stop-opacity='0'/></radialGradient>
  </defs>
  <path d='M-10,74 C86,150 246,28 400,106' fill='none' stroke='#0D0A07' stroke-width='9' stroke-linecap='round'/>
  <path d='M-10,74 C86,150 246,28 400,106' fill='none' stroke='#4A4034' stroke-width='1' opacity='.5'/>
  <g stroke='#241E17' stroke-width='2.5'>
    <path d='M112,128 v14 M232,82 v12 M330,98 v14'/>
  </g>
  <g stroke='#8C4A32' stroke-width='1.5' stroke-opacity='.6'>
    <path d='M112,142 h8 M232,94 h8 M330,112 h8'/>
  </g>
  <circle cx='46' cy='88' r='26' fill='url(#w3-fgbA)' opacity='.15'/>
  <circle cx='296' cy='58' r='20' fill='url(#w3-fgbW)' opacity='.11'/>
  <circle cx='180' cy='196' r='30' fill='url(#w3-fgbR)' opacity='.09'/>
  <circle cx='352' cy='176' r='16' fill='url(#w3-fgbA)' opacity='.12'/>
  <circle cx='66' cy='292' r='24' fill='url(#w3-fgbG)' opacity='.12'/>
  <circle cx='250' cy='356' r='18' fill='url(#w3-fgbA)' opacity='.13'/>
  <circle cx='358' cy='282' r='22' fill='url(#w3-fgbG)' opacity='.10'/>
  <circle cx='118' cy='466' r='26' fill='url(#w3-fgbW)' opacity='.11'/>
  <circle cx='330' cy='428' r='18' fill='url(#w3-fgbA)' opacity='.14'/>
  <circle cx='58' cy='556' r='24' fill='url(#w3-fgbR)' opacity='.10'/>
  <circle cx='238' cy='616' r='20' fill='url(#w3-fgbA)' opacity='.12'/>
  <circle cx='348' cy='586' r='16' fill='url(#w3-fgbG)' opacity='.11'/>
  <circle cx='148' cy='698' r='22' fill='url(#w3-fgbA)' opacity='.12'/>
  <circle cx='300' cy='672' r='16' fill='url(#w3-fgbR)' opacity='.12'/>
  <circle cx='88' cy='796' r='28' fill='url(#w3-fgbA)' opacity='.13'/>
  <circle cx='258' cy='846' r='22' fill='url(#w3-fgbG)' opacity='.13'/>
  <circle cx='348' cy='778' r='18' fill='url(#w3-fgbW)' opacity='.10'/>
  <circle cx='118' cy='946' r='26' fill='url(#w3-fgbA)' opacity='.10'/>
  <circle cx='298' cy='1002' r='20' fill='url(#w3-fgbR)' opacity='.08'/>
  <circle cx='54' cy='1032' r='18' fill='url(#w3-fgbG)' opacity='.10'/>
</svg>`;

/** Complete map definition consumed by `PhaseSelect`. */
export const WORLD3_MAP: MapDef = {
  id: 'w3',
  numeral: 'III',
  name: WORLD3_NAME,
  accent: '#d9a441',
  width: WORLD3_WIDTH,
  height: WORLD3_HEIGHT,
  frontHeight: WORLD3_FRONT_HEIGHT,
  depths: WORLD3_DEPTHS,
  nodePoints: WORLD3_NODE_POINTS,
  fallbackPoint: WORLD3_FALLBACK_POINT,
  arrivalPoint: WORLD3_ARRIVAL_POINT,
  trailPath: WORLD3_TRAIL_PATH,
  trailSegments: WORLD3_TRAIL_SEGMENTS,
  trailGroupId: WORLD3_TRAIL_GROUP_ID,
  farArt: WORLD3_FAR_ART,
  midArt: WORLD3_MID_ART,
  nearArt: WORLD3_NEAR_ART,
  frontArt: WORLD3_FRONT_ART,
  trailColors: {
    doneSoft: '#C9A36A',
    doneGradient: '#D9A441',
    doneGlow: '#F2C879',
    locked: '#4B463E',
  },
};
