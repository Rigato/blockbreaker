/**
 * World 1 — "Crystal Vale" trail map.
 *
 * Geometry and approved layer art for the campaign map screen. The SVG markup
 * below is lifted from `docs/design/phase-select-map-mockup.html` (the approved
 * art reference) with namespaced ids and classes so several layers can coexist
 * in the document. Node coordinates use the same 390 x 900 viewBox as the
 * mockup and are converted to percentages by the UI layer.
 */

export const WORLD1_NAME = 'I · CRYSTAL VALE';

export const WORLD1_WIDTH = 390;
export const WORLD1_HEIGHT = 900;
/** The front layer is taller so its bokeh still covers the 1.15x scroll edge. */
export const WORLD1_FRONT_HEIGHT = 1060;

/** Parallax depth per layer. `1` is content speed; higher moves faster. */
export const WORLD1_DEPTHS = {
  far: 0.6,
  mid: 0.8,
  near: 1,
  front: 1.15,
} as const;

export interface WorldNodePoint {
  /** Horizontal centre inside the 390-wide viewBox. */
  readonly x: number;
  /** Vertical centre inside the 900-tall viewBox. */
  readonly y: number;
  /** Which side of the node carries its name plate. */
  readonly labelSide: 'left' | 'right';
}

/** Tutorial plus campaign phases 1..6, in phase index order. */
export const WORLD1_NODE_POINTS: readonly WorldNodePoint[] = [
  { x: 55, y: 782, labelSide: 'right' },
  { x: 135, y: 745, labelSide: 'right' },
  { x: 290, y: 680, labelSide: 'left' },
  { x: 160, y: 580, labelSide: 'right' },
  { x: 88, y: 460, labelSide: 'right' },
  { x: 285, y: 310, labelSide: 'left' },
  { x: 170, y: 150, labelSide: 'right' },
];

/** Defensive fallback for content with an unexpected phase index. */
export const WORLD1_FALLBACK_POINT: WorldNodePoint = { x: 195, y: 450, labelSide: 'right' };

/** Endless sits past P6, on its own dashed branch. */
export const WORLD1_ENDLESS_POINT: WorldNodePoint = { x: 330, y: 100, labelSide: 'left' };

/** Full trail (tutorial -> void threshold), used for the excavated casing. */
export const WORLD1_TRAIL_PATH =
  'M55,782 C78,768 108,756 135,745 C180,726 245,712 290,680 ' +
  'C255,646 210,614 160,580 C138,548 110,505 88,460 ' +
  'C120,415 175,420 215,395 C255,370 275,345 285,310 ' +
  'C272,268 235,215 205,185 C192,172 178,162 170,150';

/**
 * Trail split per node-to-node segment so completed stretches can light up
 * without redrawing the whole path.
 */
export const WORLD1_TRAIL_SEGMENTS: readonly string[] = [
  'M55,782 C78,768 108,756 135,745',
  'M135,745 C180,726 245,712 290,680',
  'M290,680 C255,646 210,614 160,580',
  'M160,580 C138,548 110,505 88,460',
  'M88,460 C120,415 175,420 215,395 C255,370 275,345 285,310',
  'M285,310 C272,268 235,215 205,185 C192,172 178,162 170,150',
];

/** Dashed branch from the void threshold to the endless ring. */
export const WORLD1_ENDLESS_BRANCH = 'M170,150 C215,132 285,115 330,100';

/**
 * Optional callback used by the near layer to receive the dynamic trail
 * overlay group by id.
 */
export const WORLD1_TRAIL_GROUP_ID = 'psm-trail-overlay';

/**
 * Far layer (0.6x): sky, zone gradients, glows, silhouettes, stars, beams and
 * the zone labels.
 */
export const WORLD1_FAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='psm-zones' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#12072E'/><stop offset='0.10' stop-color='#1B0C3D'/><stop offset='0.20' stop-color='#2A1047'/>
      <stop offset='0.24' stop-color='#4A1708'/><stop offset='0.33' stop-color='#5A1F0A'/><stop offset='0.40' stop-color='#3A1408'/>
      <stop offset='0.42' stop-color='#0B2B4A'/><stop offset='0.50' stop-color='#0E3555'/><stop offset='0.55' stop-color='#0A2540'/>
      <stop offset='0.57' stop-color='#1C0D33'/><stop offset='0.65' stop-color='#25114A'/><stop offset='0.70' stop-color='#1E1038'/>
      <stop offset='0.72' stop-color='#2A1A0E'/><stop offset='0.78' stop-color='#33200F'/><stop offset='0.795' stop-color='#0A2530'/>
      <stop offset='0.92' stop-color='#093039'/><stop offset='1' stop-color='#06222C'/>
    </linearGradient>
    <radialGradient id='psm-voidG'><stop offset='0' stop-color='#A46BFF' stop-opacity='.38'/><stop offset='1' stop-color='#A46BFF' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-forgeG'><stop offset='0' stop-color='#FF7A2E' stop-opacity='.30'/><stop offset='1' stop-color='#FF7A2E' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-frostG'><stop offset='0' stop-color='#66D9FF' stop-opacity='.22'/><stop offset='1' stop-color='#66D9FF' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-arcG'><stop offset='0' stop-color='#9A5CFF' stop-opacity='.30'/><stop offset='1' stop-color='#9A5CFF' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-ruinG'><stop offset='0' stop-color='#FFB35C' stop-opacity='.16'/><stop offset='1' stop-color='#FFB35C' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-groveG'><stop offset='0' stop-color='#2FE6C8' stop-opacity='.24'/><stop offset='1' stop-color='#2FE6C8' stop-opacity='0'/></radialGradient>
    <linearGradient id='psm-beam' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='#FFFFFF' stop-opacity='.07'/><stop offset='1' stop-color='#FFFFFF' stop-opacity='0'/></linearGradient>
  </defs>
  <rect width='390' height='900' fill='#070B16'/>
  <rect x='0' y='40' width='390' height='860' fill='url(#psm-zones)'/>
  <ellipse cx='170' cy='150' rx='130' ry='110' fill='url(#psm-voidG)'/>
  <ellipse cx='285' cy='352' rx='150' ry='80' fill='url(#psm-forgeG)'/>
  <ellipse cx='88' cy='470' rx='130' ry='75' fill='url(#psm-frostG)'/>
  <ellipse cx='160' cy='596' rx='140' ry='80' fill='url(#psm-arcG)'/>
  <ellipse cx='290' cy='690' rx='130' ry='65' fill='url(#psm-ruinG)'/>
  <ellipse cx='140' cy='826' rx='170' ry='80' fill='url(#psm-groveG)'/>
  <path d='M0,452 L45,420 L88,444 L130,414 L172,440 L215,418 L262,446 L305,422 L348,444 L390,428 L390,500 L0,500 Z' fill='#05070F' opacity='.5'/>
  <path d='M0,706 L40,688 L84,704 L128,684 L176,702 L222,686 L272,706 L318,688 L364,704 L390,694 L390,760 L0,760 Z' fill='#05070F' opacity='.45'/>
  <g fill='#E5B8FF'>
    <circle class='pm-tw' cx='40' cy='70' r='1.3' style='animation-delay:.3s'/><circle class='pm-tw' cx='95' cy='95' r='1' style='animation-delay:1.4s'/>
    <circle class='pm-tw' cx='150' cy='60' r='1.4' style='animation-delay:.8s'/><circle class='pm-tw' cx='210' cy='88' r='1.1' style='animation-delay:2.1s'/>
    <circle class='pm-tw' cx='262' cy='64' r='1.3' style='animation-delay:1.1s'/><circle class='pm-tw' cx='318' cy='92' r='1' style='animation-delay:2.6s'/>
    <circle class='pm-tw' cx='352' cy='140' r='1.3' style='animation-delay:.5s'/><circle class='pm-tw' cx='60' cy='160' r='1.1' style='animation-delay:1.8s'/>
    <circle class='pm-tw' cx='120' cy='212' r='1.3' style='animation-delay:2.9s'/><circle class='pm-tw' cx='255' cy='206' r='1.1' style='animation-delay:.9s'/>
    <circle class='pm-tw' cx='330' cy='232' r='1.3' style='animation-delay:2.3s'/><circle class='pm-tw' cx='20' cy='120' r='1' style='animation-delay:1.6s'/>
    <circle class='pm-tw' cx='192' cy='42' r='1.2' style='animation-delay:3.1s'/><circle class='pm-tw' cx='300' cy='158' r='1' style='animation-delay:.2s'/>
  </g>
  <polygon class='pm-beam' points='76,54 128,54 216,468 148,486' fill='url(#psm-beam)'/>
  <polygon class='pm-beam' points='246,54 278,54 342,408 300,420' fill='url(#psm-beam)' opacity='.6' style='animation-delay:2.5s'/>
  <g font-size='6.5' letter-spacing='2' fill='#F2FBFF' opacity='.26' font-family='system-ui,sans-serif'>
    <text x='10' y='72'>VOID</text><text x='10' y='258'>EMBERFORGE</text><text x='10' y='400'>FROSTBOUND</text>
    <text x='10' y='534'>ARCANE</text><text x='10' y='662'>RUINS</text><text x='10' y='734'>GROVE</text>
  </g>
</svg>`;

/**
 * Mid layer (0.8x): themed relief, fog banks and particles (embers, snow,
 * arcane twinkles).
 */
export const WORLD1_MID_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <linearGradient id='psm-cryG' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#BFFCF3'/><stop offset='.45' stop-color='#2FE6C8'/><stop offset='1' stop-color='#0A4A56'/></linearGradient>
    <filter id='psm-softM' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='4'/></filter>
  </defs>
  <path d='M206,392 v-44 h13 v44 M242,392 v-62 h16 v62 M292,392 v-50 h12 v50 M330,392 v-70 h18 v70 M364,392 v-54 h12 v54' fill='#170A05' stroke='#FF7A2E' stroke-opacity='.20' stroke-width='1'/>
  <path d='M214,362 q30,14 54,4 q40,-16 72,6' fill='none' stroke='#FF7A2E' stroke-opacity='.55' stroke-width='5' filter='url(#psm-softM)'/>
  <path d='M214,362 q30,14 54,4 q40,-16 72,6' fill='none' stroke='#FFD08A' stroke-opacity='.8' stroke-width='1.6'/>
  <path d='M232,386 q34,-10 62,2' fill='none' stroke='#FF7A2E' stroke-opacity='.4' stroke-width='3' filter='url(#psm-softM)'/>
  <g fill='#FFD08A'>
    <circle class='pm-ember' cx='240' cy='368' r='1.4' style='animation-delay:0s'/><circle class='pm-ember' cx='268' cy='344' r='1.2' style='animation-delay:1.2s'/>
    <circle class='pm-ember' cx='296' cy='360' r='1.5' style='animation-delay:2.4s'/><circle class='pm-ember' cx='322' cy='336' r='1.2' style='animation-delay:.7s'/>
    <circle class='pm-ember' cx='340' cy='352' r='1.3' style='animation-delay:3.2s'/><circle class='pm-ember' cx='255' cy='326' r='1.1' style='animation-delay:4s'/>
    <circle class='pm-ember' cx='306' cy='384' r='1.3' style='animation-delay:1.9s'/>
  </g>
  <polygon points='140,520 162,452 184,520' fill='#0E3555' stroke='#D6F7FF' stroke-opacity='.22' stroke-width='1'/>
  <g fill='#E6FFFF'>
    <circle class='pm-snow' cx='60' cy='420' r='1.2' style='animation-delay:0s'/><circle class='pm-snow' cx='110' cy='470' r='1' style='animation-delay:2s'/>
    <circle class='pm-snow' cx='164' cy='438' r='1.2' style='animation-delay:4s'/><circle class='pm-snow' cx='212' cy='498' r='1' style='animation-delay:1s'/>
    <circle class='pm-snow' cx='256' cy='452' r='1.2' style='animation-delay:5.5s'/><circle class='pm-snow' cx='302' cy='492' r='1' style='animation-delay:3s'/>
    <circle class='pm-snow' cx='346' cy='428' r='1.2' style='animation-delay:6.5s'/><circle class='pm-snow' cx='42' cy='504' r='1' style='animation-delay:7.5s'/>
  </g>
  <circle class='pm-spin' cx='60' cy='604' r='30' fill='none' stroke='#FF5FD2' stroke-opacity='.30' stroke-width='1.5' stroke-dasharray='4 7'/>
  <path d='M300,600 l9,-9 l9,9 l-9,9z' fill='none' stroke='#9A5CFF' stroke-opacity='.55' stroke-width='1.4'/>
  <path d='M66,548 l7,-7 M66,548 l7,7' stroke='#FF5FD2' stroke-opacity='.5' stroke-width='1.4'/>
  <path d='M288,548 a9,9 0 1 1 .1,0 M288,548 v-6' stroke='#9A5CFF' stroke-opacity='.55' stroke-width='1.4' fill='none'/>
  <g fill='#FF5FD2'>
    <circle class='pm-tw' cx='78' cy='566' r='1.3' style='animation-delay:.4s'/><circle class='pm-tw' cx='126' cy='626' r='1.1' style='animation-delay:1.7s'/>
    <circle class='pm-tw' cx='236' cy='604' r='1.3' style='animation-delay:2.5s'/><circle class='pm-tw' cx='290' cy='566' r='1.1' style='animation-delay:.9s'/>
    <circle class='pm-tw' cx='196' cy='642' r='1.2' style='animation-delay:3.3s'/>
  </g>
  <path d='M60,718 v-30 a20,20 0 0 1 40,0 v30' fill='none' stroke='#FFD27A' stroke-opacity='.3' stroke-width='5'/>
  <g fill='#241608' stroke='#FFD27A' stroke-opacity='.28'>
    <path d='M298,720 v-58 l5,-8 l5,6 l5,-4 v64z'/><path d='M334,720 v-70 l5,-6 l5,7 l5,-5 v74z'/>
  </g>
  <rect x='206' y='710' width='72' height='11' rx='3' fill='#241608' stroke='#FFD27A' stroke-opacity='.24' transform='rotate(-6 242 715)'/>
  <g fill='#FFD27A'><circle class='pm-tw' cx='320' cy='668' r='1.1' style='animation-delay:1.2s'/><circle class='pm-tw' cx='250' cy='700' r='1' style='animation-delay:2.8s'/><circle class='pm-tw' cx='60' cy='690' r='1.1' style='animation-delay:.6s'/></g>
  <ellipse cx='44' cy='846' rx='52' ry='26' fill='#2FE6C8' opacity='.10'/>
  <ellipse cx='350' cy='836' rx='52' ry='26' fill='#2FE6C8' opacity='.10'/>
  <g fill='url(#psm-cryG)' stroke='#7EF9FF' stroke-opacity='.5' stroke-width='1'>
    <polygon points='16,864 28,810 40,864'/><polygon points='36,866 46,830 56,866'/><polygon points='56,866 64,842 72,866'/>
    <polygon points='322,862 334,812 346,862'/><polygon points='344,864 354,832 364,864'/><polygon points='364,866 372,844 380,866'/>
  </g>
  <g fill='#2FE6C8'>
    <circle class='pm-tw' cx='100' cy='800' r='1.3' style='animation-delay:.5s'/><circle class='pm-tw' cx='168' cy='772' r='1.1' style='animation-delay:1.9s'/>
    <circle class='pm-tw' cx='230' cy='822' r='1.3' style='animation-delay:3s'/><circle class='pm-tw' cx='300' cy='784' r='1.1' style='animation-delay:1.1s'/>
    <circle class='pm-tw' cx='352' cy='838' r='1.2' style='animation-delay:2.2s'/>
  </g>
  <ellipse class='pm-fog' cx='90' cy='246' rx='130' ry='32' fill='#A46BFF' opacity='.12'/>
  <ellipse class='pm-fog' cx='300' cy='396' rx='120' ry='28' fill='#FF7A2E' opacity='.12' style='animation-delay:3s'/>
  <ellipse class='pm-fog' cx='70' cy='524' rx='110' ry='24' fill='#66D9FF' opacity='.10' style='animation-delay:6s'/>
  <ellipse class='pm-fog' cx='300' cy='652' rx='120' ry='26' fill='#9A5CFF' opacity='.13' style='animation-delay:2s'/>
  <ellipse class='pm-fog' cx='110' cy='726' rx='130' ry='24' fill='#FFB35C' opacity='.10' style='animation-delay:8s'/>
  <ellipse class='pm-fog' cx='160' cy='866' rx='170' ry='32' fill='#2FE6C8' opacity='.12' style='animation-delay:4s'/>
</svg>`;

/**
 * Near layer (1.0x): zone colour bands aligned with the nodes, the void
 * portal, the frost needle and the trail base. Trail overlays are injected at
 * runtime into `#psm-trail-overlay`.
 */
export const WORLD1_NEAR_ART = `
<svg viewBox='0 0 390 900' aria-hidden='true' focusable='false'>
  <defs>
    <radialGradient id='psm-voidCore'><stop offset='0' stop-color='#04060E' stop-opacity='.96'/><stop offset='.7' stop-color='#180A38' stop-opacity='.9'/><stop offset='1' stop-color='#2A1250' stop-opacity='.85'/></radialGradient>
    <linearGradient id='psm-trailGold' gradientUnits='userSpaceOnUse' x1='55' y1='782' x2='290' y2='580'><stop offset='0' stop-color='#E8A94B'/><stop offset='.5' stop-color='#FFC96B'/><stop offset='1' stop-color='#FFE9B8'/></linearGradient>
    <linearGradient id='psm-iceG' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#E6FFFF' stop-opacity='.75'/><stop offset='1' stop-color='#0E3555' stop-opacity='.9'/></linearGradient>
    <linearGradient id='psm-bands' gradientUnits='userSpaceOnUse' x1='0' y1='40' x2='0' y2='900'>
      <stop offset='0' stop-color='#A46BFF' stop-opacity='.16'/><stop offset='.12' stop-color='#A46BFF' stop-opacity='.05'/>
      <stop offset='.24' stop-color='#FF7A2E' stop-opacity='.14'/><stop offset='.36' stop-color='#FF7A2E' stop-opacity='.04'/>
      <stop offset='.42' stop-color='#66D9FF' stop-opacity='.10'/><stop offset='.53' stop-color='#66D9FF' stop-opacity='.03'/>
      <stop offset='.57' stop-color='#FF5FD2' stop-opacity='.12'/><stop offset='.68' stop-color='#FF5FD2' stop-opacity='.04'/>
      <stop offset='.72' stop-color='#FFB35C' stop-opacity='.10'/><stop offset='.80' stop-color='#FFB35C' stop-opacity='.02'/>
      <stop offset='.86' stop-color='#2FE6C8' stop-opacity='.10'/><stop offset='1' stop-color='#2FE6C8' stop-opacity='.03'/>
    </linearGradient>
    <filter id='psm-soft' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='4'/></filter>
  </defs>
  <rect x='0' y='40' width='390' height='860' fill='url(#psm-bands)'/>
  <g>
    <circle cx='170' cy='150' r='62' fill='url(#psm-voidCore)'/>
    <circle cx='170' cy='150' r='60' fill='none' stroke='#A46BFF' stroke-opacity='.55' stroke-width='2'/>
    <circle cx='170' cy='150' r='60' fill='none' stroke='#C9A6FF' stroke-opacity='.16' stroke-width='7' filter='url(#psm-soft)'/>
    <circle class='pm-spin' cx='170' cy='150' r='74' fill='none' stroke='#E5B8FF' stroke-opacity='.32' stroke-width='1.2' stroke-dasharray='2 9'/>
    <path d='M112,150 a58,58 0 0 1 116,0' fill='none' stroke='#C9A6FF' stroke-opacity='.4' stroke-width='3' stroke-linecap='round'/>
  </g>
  <polygon points='40,520 88,404 136,520' fill='url(#psm-iceG)' stroke='#D6F7FF' stroke-opacity='.35' stroke-width='1'/>
  <polygon points='88,404 96,440 84,436' fill='#FFFFFF' opacity='.5'/>
  <g fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <path d='${WORLD1_TRAIL_PATH}' stroke='#04070D' stroke-opacity='.5' stroke-width='42'/>
    <path d='${WORLD1_TRAIL_PATH}' stroke='#22303C' stroke-width='26'/>
    <path d='${WORLD1_TRAIL_PATH}' stroke='#0B141C' stroke-width='18'/>
    <g id='${WORLD1_TRAIL_GROUP_ID}'></g>
    <path d='${WORLD1_ENDLESS_BRANCH}' stroke='#2A3A48' stroke-width='12' stroke-dasharray='4 9' opacity='.75'/>
  </g>
</svg>`;

/** Front layer (1.15x): soft pollen bokeh, taller than the base scene. */
export const WORLD1_FRONT_ART = `
<svg viewBox='0 0 390 ${WORLD1_FRONT_HEIGHT}' aria-hidden='true' focusable='false'>
  <defs>
    <radialGradient id='psm-fgbW'><stop offset='0' stop-color='#FFFFFF' stop-opacity='.9'/><stop offset='.5' stop-color='#FFFFFF' stop-opacity='.26'/><stop offset='1' stop-color='#FFFFFF' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-fgbC'><stop offset='0' stop-color='#BFFCF3' stop-opacity='.9'/><stop offset='.5' stop-color='#2FE6C8' stop-opacity='.24'/><stop offset='1' stop-color='#2FE6C8' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-fgbG'><stop offset='0' stop-color='#FFE9B8' stop-opacity='.9'/><stop offset='.5' stop-color='#FFC96B' stop-opacity='.24'/><stop offset='1' stop-color='#FFC96B' stop-opacity='0'/></radialGradient>
    <radialGradient id='psm-fgbV'><stop offset='0' stop-color='#E5B8FF' stop-opacity='.9'/><stop offset='.5' stop-color='#A46BFF' stop-opacity='.24'/><stop offset='1' stop-color='#A46BFF' stop-opacity='0'/></radialGradient>
  </defs>
  <circle cx='52' cy='96' r='26' fill='url(#psm-fgbV)' opacity='.16'/>
  <circle cx='300' cy='64' r='20' fill='url(#psm-fgbV)' opacity='.14'/>
  <circle cx='188' cy='210' r='30' fill='url(#psm-fgbV)' opacity='.10'/>
  <circle cx='355' cy='180' r='16' fill='url(#psm-fgbC)' opacity='.12'/>
  <circle cx='70' cy='300' r='24' fill='url(#psm-fgbG)' opacity='.14'/>
  <circle cx='250' cy='360' r='18' fill='url(#psm-fgbG)' opacity='.16'/>
  <circle cx='360' cy='286' r='22' fill='url(#psm-fgbG)' opacity='.10'/>
  <circle cx='120' cy='470' r='26' fill='url(#psm-fgbW)' opacity='.14'/>
  <circle cx='330' cy='430' r='18' fill='url(#psm-fgbW)' opacity='.16'/>
  <circle cx='60' cy='560' r='24' fill='url(#psm-fgbV)' opacity='.14'/>
  <circle cx='240' cy='620' r='20' fill='url(#psm-fgbC)' opacity='.14'/>
  <circle cx='350' cy='590' r='16' fill='url(#psm-fgbV)' opacity='.12'/>
  <circle cx='150' cy='700' r='22' fill='url(#psm-fgbG)' opacity='.12'/>
  <circle cx='300' cy='676' r='16' fill='url(#psm-fgbG)' opacity='.14'/>
  <circle cx='90' cy='800' r='28' fill='url(#psm-fgbC)' opacity='.14'/>
  <circle cx='260' cy='850' r='22' fill='url(#psm-fgbC)' opacity='.16'/>
  <circle cx='350' cy='780' r='18' fill='url(#psm-fgbW)' opacity='.12'/>
  <circle cx='120' cy='950' r='26' fill='url(#psm-fgbC)' opacity='.12'/>
  <circle cx='300' cy='1000' r='20' fill='url(#psm-fgbV)' opacity='.10'/>
</svg>`;
