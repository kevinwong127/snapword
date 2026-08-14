// Built-in mock object catalog with hand-drawn SVG "cutout" illustrations.
// Works fully offline — every image is an inline SVG data URI.

import type { Lang } from './i18n'

export type Translations = Record<Lang, string>

export interface CatalogObject {
  id: string
  translations: Translations
  image: string // svg data uri (the "cutout")
}

function svgUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const S = (inner: string, h = 240) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 ${h}'>${inner}</svg>`

const donut = svgUri(
  S(`
  <path fill-rule='evenodd' fill='#e0a060' d='M120 30a90 90 0 1 0 .1 0Z M120 92a28 28 0 1 1-.1 0Z'/>
  <path fill-rule='evenodd' fill='#ff8fb1' d='M120 38a82 82 0 1 0 .1 0Z M120 94a26 26 0 1 1-.1 0Z'/>
  <g stroke-linecap='round' stroke-width='6'>
    <line x1='80' y1='80' x2='94' y2='74' stroke='#fff'/>
    <line x1='150' y1='70' x2='164' y2='78' stroke='#ffe066'/>
    <line x1='60' y1='130' x2='72' y2='140' stroke='#7ec8e3'/>
    <line x1='170' y1='130' x2='182' y2='122' stroke='#fff'/>
    <line x1='90' y1='180' x2='104' y2='186' stroke='#b39ddb'/>
    <line x1='140' y1='178' x2='152' y2='170' stroke='#80e27e'/>
    <line x1='120' y1='52' x2='132' y2='58' stroke='#7ec8e3'/>
  </g>`),
)

const toast = svgUri(
  S(
    `
  <path fill='#c77f3e' d='M58 250V118c0-42 24-66 62-66s62 24 62 66v132c0 6-4 10-10 10H68c-6 0-10-4-10-10Z'/>
  <path fill='#f6d79b' d='M74 244V122c0-32 18-50 46-50s46 18 46 50v122Z'/>
  <ellipse cx='105' cy='150' rx='7' ry='10' fill='#e7bd7a'/>
  <ellipse cx='140' cy='190' rx='6' ry='9' fill='#e7bd7a'/>`,
    262,
  ),
)

const cup = svgUri(
  S(`
  <ellipse cx='120' cy='208' rx='78' ry='14' fill='#e8eef2'/>
  <path fill='#7ec8e3' d='M64 70h112v104c0 18-14 32-32 32H96c-18 0-32-14-32-32Z'/>
  <path fill='none' stroke='#7ec8e3' stroke-width='14' d='M176 96h14c16 0 26 12 26 28s-10 28-26 28h-14'/>
  <path fill='#5aa9c7' d='M64 70h112v18H64Z'/>
  <ellipse cx='120' cy='70' rx='56' ry='10' fill='#a5dcf0'/>
  <rect x='96' y='110' width='14' height='60' rx='7' fill='#ffffff' opacity='.45'/>`),
)

const monstera = svgUri(
  S(
    `
  <path fill='#3d9b5f' d='M120 20c58 0 92 44 92 104 0 70-44 116-92 116s-92-46-92-116c0-60 34-104 92-104Z'/>
  <g stroke='#ffffff' stroke-width='10' stroke-linecap='round' opacity='.9'>
    <path d='M52 96 96 116'/>
    <path d='M46 150l52 8'/>
    <path d='M188 96l-44 20'/>
    <path d='M194 150l-52 8'/>
    <path d='M80 210l28-30'/>
    <path d='M160 210l-28-30'/>
  </g>
  <path d='M120 40v180' stroke='#2e7d4c' stroke-width='8' stroke-linecap='round'/>`,
    262,
  ),
)

const tape = svgUri(
  S(
    `
  <path fill='#f7b733' opacity='.85' d='M132 130l86 22-10 34-86-22Z'/>
  <path fill-rule='evenodd' fill='#f4908b' d='M100 40a70 70 0 1 0 .1 0Z M100 78a32 32 0 1 1-.1 0Z'/>
  <path fill-rule='evenodd' fill='#f7aab0' d='M100 52a58 58 0 1 0 .1 0Z M100 80a30 30 0 1 1-.1 0Z'/>
  <circle cx='100' cy='110' r='30' fill='#fdf0ec'/>`,
    210,
  ),
)

const binderClip = svgUri(
  S(`
  <path fill='none' stroke='#b9c2cc' stroke-width='9' d='M78 66c0-26 84-26 84 0'/>
  <path fill='none' stroke='#cfd6dd' stroke-width='9' d='M84 62 70 108M156 62l14 46'/>
  <path fill='#2b2f36' d='M64 104h112l-10 74c-1 8-8 14-16 14H90c-8 0-15-6-16-14Z'/>
  <rect x='60' y='96' width='120' height='16' rx='8' fill='#454a52'/>`),
)

const rubberDuck = svgUri(
  S(`
  <ellipse cx='112' cy='162' rx='78' ry='52' fill='#ffd93d'/>
  <circle cx='152' cy='92' r='44' fill='#ffd93d'/>
  <path fill='#ff9f1c' d='M188 84l34 10c4 1 4 7 0 9l-34 9c-6 2-12-3-12-9v-10c0-6 6-11 12-9Z'/>
  <circle cx='162' cy='82' r='6' fill='#2b2f36'/>
  <path fill='#f4c430' d='M52 150c-16 4-24 18-16 30 16 2 30-8 32-24Z'/>
  <ellipse cx='128' cy='70' rx='10' ry='6' fill='#ffe98a' transform='rotate(-20 128 70)'/>`),
)

const palmTree = svgUri(
  S(
    `
  <path fill='#a9744f' d='M112 120h18l8 160c0 8-6 14-14 14s-14-6-14-14Z'/>
  <path fill='#8d5f3d' d='M114 150h16M116 190h16M118 230h16' stroke='#8d5f3d' stroke-width='6'/>
  <g fill='#43a05f'>
    <path d='M122 118C90 92 44 92 22 116c30 4 72 14 100 26Z'/>
    <path d='M122 118c32-26 78-26 100-2-30 4-72 14-100 26Z'/>
    <path d='M122 116C104 80 66 62 36 70c24 16 56 40 78 66Z'/>
    <path d='M122 116c18-36 56-54 86-46-24 16-56 40-78 66Z'/>
    <path d='M122 114c-4-38 8-70 34-84-2 28-10 62-22 92Z'/>
  </g>
  <circle cx='112' cy='122' r='12' fill='#7a4f2e'/>
  <circle cx='134' cy='126' r='10' fill='#8d5f3d'/>`,
    300,
  ),
)

const icedTea = svgUri(
  S(
    `
  <rect x='138' y='30' width='12' height='110' rx='6' fill='#ff6b6b' transform='rotate(12 144 85)'/>
  <path fill='#f0f4f8' d='M66 60h108l-12 172c-1 10-9 18-19 18H97c-10 0-18-8-19-18Z'/>
  <path fill='#e8a13c' d='M71 96h98l-10 134c-1 8-7 14-15 14H96c-8 0-14-6-15-14Z'/>
  <rect x='92' y='116' width='34' height='34' rx='8' fill='#ffffff' opacity='.75' transform='rotate(-10 109 133)'/>
  <rect x='122' y='158' width='30' height='30' rx='8' fill='#ffffff' opacity='.7' transform='rotate(14 137 173)'/>`,
    260,
  ),
)

const sandwich = svgUri(
  S(`
  <path fill='#f6d79b' d='M40 190 120 76l80 114c4 6 0 14-8 14H48c-8 0-12-8-8-14Z'/>
  <path fill='#c77f3e' d='M120 76l80 114c4 6 0 14-8 14h-16l-64-92Z' opacity='.35'/>
  <path fill='#7fbf5a' d='M58 172c10-10 20 6 30-4s20 6 30-4 20 6 30-4 20 6 30-4l6 10H52Z'/>
  <rect x='74' y='176' width='92' height='12' rx='6' fill='#ff6b6b'/>
  <path fill='#fbe7b5' d='M48 204h144c6 0 10 4 10 10s-4 10-10 10H48c-6 0-10-4-10-10s4-10 10-10Z'/>`),
)

const plant = svgUri(
  S(
    `
  <path fill='#e2725b' d='M78 168h84l-10 66c-1 8-8 14-16 14h-32c-8 0-15-6-16-14Z'/>
  <rect x='70' y='156' width='100' height='20' rx='8' fill='#c85a44'/>
  <g fill='#43a05f'>
    <ellipse cx='120' cy='106' rx='20' ry='56'/>
    <ellipse cx='88' cy='122' rx='16' ry='44' transform='rotate(-24 88 122)'/>
    <ellipse cx='152' cy='122' rx='16' ry='44' transform='rotate(24 152 122)'/>
  </g>
  <path d='M120 60v92' stroke='#2e7d4c' stroke-width='6' stroke-linecap='round'/>`,
    262,
  ),
)

const book = svgUri(
  S(
    `
  <rect x='48' y='52' width='144' height='140' rx='12' fill='#5b7fe0'/>
  <rect x='48' y='52' width='24' height='140' rx='10' fill='#4163c4'/>
  <rect x='76' y='164' width='108' height='16' rx='6' fill='#ffffff'/>
  <rect x='92' y='86' width='76' height='12' rx='6' fill='#ffffff' opacity='.85'/>
  <rect x='92' y='108' width='52' height='10' rx='5' fill='#ffffff' opacity='.6'/>`,
    220,
  ),
)

export const OBJECTS: CatalogObject[] = [
  { id: 'donut', image: donut, translations: { en: 'Donut', zh: '甜甜圈', ja: 'ドーナツ', ko: '도넛' } },
  { id: 'toast', image: toast, translations: { en: 'Toast', zh: '吐司', ja: 'トースト', ko: '토스트' } },
  { id: 'cup', image: cup, translations: { en: 'Cup', zh: '杯子', ja: 'カップ', ko: '컵' } },
  { id: 'monstera', image: monstera, translations: { en: 'Monstera', zh: '龜背竹', ja: 'モンステラ', ko: '몬스테라' } },
  { id: 'tape', image: tape, translations: { en: 'Tape', zh: '膠帶', ja: 'テープ', ko: '테이프' } },
  { id: 'binder-clip', image: binderClip, translations: { en: 'Binder clip', zh: '長尾夾', ja: 'バインダークリップ', ko: '바인더 클립' } },
  { id: 'rubber-duck', image: rubberDuck, translations: { en: 'Rubber duck', zh: '橡皮鴨', ja: 'ラバーダック', ko: '고무 오리' } },
  { id: 'palm-tree', image: palmTree, translations: { en: 'Palm tree', zh: '棕櫚樹', ja: 'ヤシの木', ko: '야자수' } },
  { id: 'iced-tea', image: icedTea, translations: { en: 'Iced tea', zh: '冰茶', ja: 'アイスティー', ko: '아이스티' } },
  { id: 'sandwich', image: sandwich, translations: { en: 'Sandwich', zh: '三明治', ja: 'サンドイッチ', ko: '샌드위치' } },
  { id: 'plant', image: plant, translations: { en: 'Plant', zh: '盆栽', ja: '観葉植物', ko: '화분' } },
  { id: 'book', image: book, translations: { en: 'Book', zh: '書', ja: '本', ko: '책' } },
]

/** Deterministic mock recognizer: hash the image data so the same photo
 *  always yields the same object (mirrors a stable model output). */
export function recognize(dataUrl: string): CatalogObject {
  let h = 5381
  const step = Math.max(1, Math.floor(dataUrl.length / 512))
  for (let i = 0; i < dataUrl.length; i += step) {
    h = ((h << 5) + h + dataUrl.charCodeAt(i)) | 0
  }
  return OBJECTS[Math.abs(h) % OBJECTS.length]
}

export function findObject(id: string): CatalogObject | undefined {
  return OBJECTS.find((o) => o.id === id)
}
