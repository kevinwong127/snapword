// Expanded everyday-object vocabulary for zero-shot (CLIP) classification.
// Merges the 80 COCO classes (translations from coco-i18n.ts) with ~220
// additional common objects & scenes. zh = Traditional Chinese.

import { COCO_I18N } from './coco-i18n'
import type { Translations } from './objects'

export interface VocabEntry {
  /** canonical English label sent to CLIP, e.g. "stapler" */
  label: string
  /** display form, e.g. "Stapler" */
  word: string
  translations: Translations
}

type Extra = [label: string, zh: string, ja: string, ko: string]

const EXTRA: Extra[] = [
  // food & drink
  ['rice', '米飯', 'ご飯', '밥'],
  ['noodles', '麵條', '麺', '국수'],
  ['bread', '麵包', 'パン', '빵'],
  ['egg', '雞蛋', '卵', '달걀'],
  ['milk', '牛奶', '牛乳', '우유'],
  ['cheese', '起司', 'チーズ', '치즈'],
  ['butter', '奶油', 'バター', '버터'],
  ['yogurt', '優格', 'ヨーグルト', '요거트'],
  ['coffee', '咖啡', 'コーヒー', '커피'],
  ['tea', '茶', 'お茶', '차'],
  ['juice', '果汁', 'ジュース', '주스'],
  ['beer', '啤酒', 'ビール', '맥주'],
  ['wine', '紅酒', 'ワイン', '와인'],
  ['soda', '汽水', 'ソーダ', '소다'],
  ['cookie', '餅乾', 'クッキー', '쿠키'],
  ['chocolate', '巧克力', 'チョコレート', '초콜릿'],
  ['candy', '糖果', 'キャンディ', '사탕'],
  ['ice cream', '冰淇淋', 'アイスクリーム', '아이스크림'],
  ['dumpling', '餃子', '餃子', '만두'],
  ['sushi', '壽司', '寿司', '초밥'],
  ['ramen', '拉麵', 'ラーメン', '라면'],
  ['salad', '沙拉', 'サラダ', '샐러드'],
  ['soup', '湯', 'スープ', '수프'],
  ['steak', '牛排', 'ステーキ', '스테이크'],
  ['shrimp', '蝦', 'エビ', '새우'],
  ['pancake', '鬆餅', 'パンケーキ', '팬케이크'],
  ['waffle', '格子鬆餅', 'ワッフル', '와플'],
  ['cereal', '麥片', 'シリアル', '시리얼'],
  ['potato', '馬鈴薯', 'じゃがいも', '감자'],
  ['tomato', '番茄', 'トマト', '토마토'],
  ['cucumber', '小黃瓜', 'きゅうり', '오이'],
  ['onion', '洋蔥', '玉ねぎ', '양파'],
  ['garlic', '大蒜', 'にんにく', '마늘'],
  ['mushroom', '蘑菇', 'きのこ', '버섯'],
  ['corn', '玉米', 'とうもろこし', '옥수수'],
  ['strawberry', '草莓', 'いちご', '딸기'],
  ['watermelon', '西瓜', 'スイカ', '수박'],
  ['grapes', '葡萄', 'ぶどう', '포도'],
  ['lemon', '檸檬', 'レモン', '레몬'],
  ['peach', '桃子', '桃', '복숭아'],
  ['pear', '梨子', '梨', '배'],
  ['mango', '芒果', 'マンゴー', '망고'],
  ['pineapple', '鳳梨', 'パイナップル', '파인애플'],
  ['cherry', '櫻桃', 'さくらんぼ', '체리'],
  ['avocado', '酪梨', 'アボカド', '아보카도'],
  ['hamburger', '漢堡', 'ハンバーガー', '햄버거'],
  ['french fries', '薯條', 'フライドポテト', '감자튀김'],
  ['fried chicken', '炸雞', 'フライドチキン', '치킨'],
  // kitchen
  ['plate', '盤子', '皿', '접시'],
  ['chopsticks', '筷子', '箸', '젓가락'],
  ['cutting board', '砧板', 'まな板', '도마'],
  ['pot', '鍋子', '鍋', '냄비'],
  ['frying pan', '平底鍋', 'フライパン', '프라이팬'],
  ['kettle', '水壺', 'ケトル', '주전자'],
  ['blender', '果汁機', 'ミキサー', '블렌더'],
  ['spatula', '鍋鏟', 'ヘラ', '뒤집개'],
  ['ladle', '湯勺', 'おたま', '국자'],
  ['sponge', '海綿', 'スポンジ', '스펀지'],
  ['trash can', '垃圾桶', 'ゴミ箱', '쓰레기통'],
  ['dish soap', '洗碗精', '食器用洗剤', '주방세제'],
  ['mug', '馬克杯', 'マグカップ', '머그컵'],
  ['water bottle', '水瓶', '水筒', '물병'],
  // furniture & home
  ['table', '桌子', 'テーブル', '테이블'],
  ['desk', '書桌', '机', '책상'],
  ['lamp', '檯燈', 'ランプ', '램프'],
  ['bookshelf', '書架', '本棚', '책장'],
  ['wardrobe', '衣櫃', 'ワードローブ', '옷장'],
  ['cabinet', '櫃子', 'キャビネット', '수납장'],
  ['stool', '凳子', 'スツール', '스툴'],
  ['pillow', '枕頭', '枕', '베개'],
  ['blanket', '毯子', '毛布', '담요'],
  ['curtain', '窗簾', 'カーテン', '커튼'],
  ['rug', '地毯', 'ラグ', '러그'],
  ['mirror', '鏡子', '鏡', '거울'],
  ['fan', '電風扇', '扇風機', '선풍기'],
  ['heater', '暖爐', 'ヒーター', '히터'],
  ['air conditioner', '冷氣', 'エアコン', '에어컨'],
  ['hanger', '衣架', 'ハンガー', '옷걸이'],
  ['candle', '蠟燭', 'ろうそく', '촛불'],
  ['light bulb', '燈泡', '電球', '전구'],
  // electronics
  ['tablet', '平板電腦', 'タブレット', '태블릿'],
  ['computer', '電腦', 'コンピュータ', '컴퓨터'],
  ['monitor', '螢幕', 'モニター', '모니터'],
  ['printer', '印表機', 'プリンター', '프린터'],
  ['camera', '相機', 'カメラ', '카메라'],
  ['headphones', '耳機', 'ヘッドホン', '헤드폰'],
  ['speaker', '喇叭', 'スピーカー', '스피커'],
  ['microphone', '麥克風', 'マイク', '마이크'],
  ['charger', '充電器', '充電器', '충전기'],
  ['battery', '電池', '電池', '배터리'],
  ['cable', '傳輸線', 'ケーブル', '케이블'],
  ['router', '路由器', 'ルーター', '공유기'],
  ['projector', '投影機', 'プロジェクター', '프로젝터'],
  ['calculator', '計算機', '電卓', '계산기'],
  ['watch', '手錶', '腕時計', '손목시계'],
  ['smartwatch', '智慧手錶', 'スマートウォッチ', '스마트워치'],
  ['drone', '無人機', 'ドローン', '드론'],
  ['game controller', '遊戲手把', 'ゲームコントローラー', '게임 컨트롤러'],
  ['power bank', '行動電源', 'モバイルバッテリー', '보조배터리'],
  // clothing & accessories
  ['shirt', '襯衫', 'シャツ', '셔츠'],
  ['t-shirt', 'T恤', 'Tシャツ', '티셔츠'],
  ['pants', '長褲', 'ズボン', '바지'],
  ['jeans', '牛仔褲', 'ジーンズ', '청바지'],
  ['jacket', '夾克', 'ジャケット', '재킷'],
  ['coat', '外套', 'コート', '코트'],
  ['dress', '洋裝', 'ドレス', '드레스'],
  ['skirt', '裙子', 'スカート', '치마'],
  ['sweater', '毛衣', 'セーター', '스웨터'],
  ['hoodie', '連帽衫', 'パーカー', '후드티'],
  ['socks', '襪子', '靴下', '양말'],
  ['shoes', '鞋子', '靴', '신발'],
  ['sneakers', '運動鞋', 'スニーカー', '운동화'],
  ['boots', '靴子', 'ブーツ', '부츠'],
  ['sandals', '涼鞋', 'サンダル', '샌들'],
  ['hat', '帽子', '帽子', '모자'],
  ['scarf', '圍巾', 'マフラー', '목도리'],
  ['gloves', '手套', '手袋', '장갑'],
  ['belt', '皮帶', 'ベルト', '벨트'],
  ['glasses', '眼鏡', 'メガネ', '안경'],
  ['sunglasses', '太陽眼鏡', 'サングラス', '선글라스'],
  ['wallet', '錢包', '財布', '지갑'],
  // plants & animals
  ['flower', '花', '花', '꽃'],
  ['rose', '玫瑰', 'バラ', '장미'],
  ['sunflower', '向日葵', 'ひまわり', '해바라기'],
  ['tree', '樹', '木', '나무'],
  ['cactus', '仙人掌', 'サボテン', '선인장'],
  ['leaf', '葉子', '葉', '잎'],
  ['rabbit', '兔子', 'ウサギ', '토끼'],
  ['hamster', '倉鼠', 'ハムスター', '햄스터'],
  ['turtle', '烏龜', 'カメ', '거북이'],
  ['parrot', '鸚鵡', 'オウム', '앵무새'],
  ['frog', '青蛙', 'カエル', '개구리'],
  ['squirrel', '松鼠', 'リス', '다람쥐'],
  ['fox', '狐狸', 'キツネ', '여우'],
  ['deer', '鹿', '鹿', '사슴'],
  ['monkey', '猴子', 'サル', '원숭이'],
  ['panda', '熊貓', 'パンダ', '판다'],
  ['lion', '獅子', 'ライオン', '사자'],
  ['tiger', '老虎', 'トラ', '호랑이'],
  ['penguin', '企鵝', 'ペンギン', '펭귄'],
  ['owl', '貓頭鷹', 'フクロウ', '부엉이'],
  ['duck', '鴨子', 'アヒル', '오리'],
  ['pig', '豬', '豚', '돼지'],
  ['butterfly', '蝴蝶', '蝶', '나비'],
  ['bee', '蜜蜂', 'ハチ', '벌'],
  // stationery & office
  ['pen', '筆', 'ペン', '펜'],
  ['pencil', '鉛筆', '鉛筆', '연필'],
  ['eraser', '橡皮擦', '消しゴム', '지우개'],
  ['ruler', '尺', '定規', '자'],
  ['notebook', '筆記本', 'ノート', '공책'],
  ['stapler', '訂書機', 'ホッチキス', '스테이플러'],
  ['paper clip', '迴紋針', 'クリップ', '클립'],
  ['marker', '麥克筆', 'マーカー', '마커'],
  ['highlighter', '螢光筆', '蛍光ペン', '형광펜'],
  ['crayon', '蠟筆', 'クレヨン', '크레용'],
  ['paintbrush', '畫筆', '絵筆', '붓'],
  ['glue', '膠水', 'のり', '풀'],
  ['folder', '資料夾', 'フォルダー', '폴더'],
  ['envelope', '信封', '封筒', '봉투'],
  ['sticker', '貼紙', 'シール', '스티커'],
  // vehicles
  ['scooter', '滑板車', 'キックスクーター', '킥보드'],
  ['taxi', '計程車', 'タクシー', '택시'],
  ['ambulance', '救護車', '救急車', '구급차'],
  ['fire truck', '消防車', '消防車', '소방차'],
  ['police car', '警車', 'パトカー', '경찰차'],
  ['helicopter', '直升機', 'ヘリコプター', '헬리콥터'],
  ['rocket', '火箭', 'ロケット', '로켓'],
  ['ship', '輪船', '船', '배'],
  ['sailboat', '帆船', 'ヨット', '요트'],
  ['van', '廂型車', 'バン', '밴'],
  // sports
  ['basketball', '籃球', 'バスケットボール', '농구공'],
  ['soccer ball', '足球', 'サッカーボール', '축구공'],
  ['volleyball', '排球', 'バレーボール', '배구공'],
  ['tennis ball', '網球', 'テニスボール', '테니스공'],
  ['golf ball', '高爾夫球', 'ゴルフボール', '골프공'],
  ['badminton', '羽毛球', 'バドミントン', '배드민턴'],
  ['yoga mat', '瑜珈墊', 'ヨガマット', '요가 매트'],
  ['dumbbell', '啞鈴', 'ダンベル', '덤벨'],
  ['helmet', '安全帽', 'ヘルメット', '헬멧'],
  // bathroom
  ['toothpaste', '牙膏', '歯磨き粉', '치약'],
  ['soap', '肥皂', '石けん', '비누'],
  ['shampoo', '洗髮精', 'シャンプー', '샴푸'],
  ['towel', '毛巾', 'タオル', '수건'],
  ['toilet paper', '衛生紙', 'トイレットペーパー', '휴지'],
  ['comb', '梳子', '櫛', '빗'],
  ['razor', '刮鬍刀', 'かみそり', '면도기'],
  ['bathtub', '浴缸', '浴槽', '욕조'],
  // tools
  ['hammer', '鐵鎚', 'ハンマー', '망치'],
  ['screwdriver', '螺絲起子', 'ドライバー', '드라이버'],
  ['wrench', '扳手', 'レンチ', '렌치'],
  ['drill', '電鑽', 'ドリル', '드릴'],
  ['saw', '鋸子', 'のこぎり', '톱'],
  ['ladder', '梯子', 'はしご', '사다리'],
  ['toolbox', '工具箱', '工具箱', '공구함'],
  ['flashlight', '手電筒', '懐中電灯', '손전등'],
  ['rope', '繩子', 'ロープ', '밧줄'],
  ['lock', '鎖', '鍵', '자물쇠'],
  ['key', '鑰匙', '鍵', '열쇠'],
  // toys
  ['doll', '玩偶', '人形', '인형'],
  ['balloon', '氣球', '風船', '풍선'],
  ['puzzle', '拼圖', 'パズル', '퍼즐'],
  ['building blocks', '積木', '積み木', '블록'],
  ['toy car', '玩具車', 'おもちゃの車', '장난감 자동차'],
  ['rubber duck', '橡皮鴨', 'ラバーダック', '고무 오리'],
  // nature & scenes
  ['beach', '海灘', 'ビーチ', '해변'],
  ['mountain', '山', '山', '산'],
  ['forest', '森林', '森', '숲'],
  ['lake', '湖泊', '湖', '호수'],
  ['river', '河流', '川', '강'],
  ['sunset', '日落', '夕日', '석양'],
  ['rainbow', '彩虹', '虹', '무지개'],
  ['snow', '雪', '雪', '눈'],
  ['ocean', '海洋', '海', '바다'],
  ['desert', '沙漠', '砂漠', '사막'],
  ['park', '公園', '公園', '공원'],
  ['garden', '花園', '庭', '정원'],
  ['bridge', '橋', '橋', '다리'],
  ['building', '建築物', '建物', '건물'],
  ['house', '房子', '家', '집'],
  ['skyscraper', '摩天大樓', '高層ビル', '고층 빌딩'],
  // misc
  ['money', '錢', 'お金', '돈'],
  ['coin', '硬幣', 'コイン', '동전'],
  ['credit card', '信用卡', 'クレジットカード', '신용카드'],
  ['passport', '護照', 'パスポート', '여권'],
  ['map', '地圖', '地図', '지도'],
  ['newspaper', '報紙', '新聞', '신문'],
  ['magazine', '雜誌', '雑誌', '잡지'],
  ['gift', '禮物', 'プレゼント', '선물'],
  ['phone case', '手機殼', 'スマホケース', '폰 케이스'],
  ['tissue', '面紙', 'ティッシュ', '티슈'],
  ['mask', '口罩', 'マスク', '마스크'],
  ['medicine', '藥', '薬', '약'],
  ['bandage', 'OK繃', 'ばんそうこう', '반창고'],
  ['thermometer', '體溫計', '体温計', '체온계'],
]

function prettify(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const byLabel = new Map<string, VocabEntry>()

// COCO classes first (canonical 80)
for (const [label, tr] of Object.entries(COCO_I18N)) {
  byLabel.set(label, {
    label,
    word: prettify(label),
    translations: { en: prettify(label), zh: tr.zh, ja: tr.ja, ko: tr.ko },
  })
}

// extended vocabulary (skipped if already covered by COCO)
for (const [label, zh, ja, ko] of EXTRA) {
  if (byLabel.has(label)) continue
  byLabel.set(label, {
    label,
    word: prettify(label),
    translations: { en: prettify(label), zh, ja, ko },
  })
}

export const VOCAB: VocabEntry[] = [...byLabel.values()]
export const VOCAB_LABELS: string[] = VOCAB.map((v) => v.label)

export function vocabEntry(label: string): VocabEntry | undefined {
  return byLabel.get(label)
}
