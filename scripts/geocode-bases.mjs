/**
 * geocode-bases.mjs
 *
 * 用途：优先通过高德「地点搜索 · 关键字搜索」v5（POI）获取 GCJ-02 坐标，
 *       未命中时再回退到 v3 地理编码；结果写回 public/data/bases.json
 *
 * 文档：
 *   - https://lbs.amap.com/api/webservice/guide/api-advanced/newpoisearch
 *
 * 使用前提：
 *   1. 在 https://console.amap.com/dev/key/app 创建 Web 服务 Key（需开通「搜索」相关权限）
 *   2. 命令行传入 Key：
 *
 *   node scripts/geocode-bases.mjs --key=你的高德Key
 *
 * 可选参数：
 *   --region=广州市   限定城市（默认：广州市）
 *
 * 速率限制：每次请求间隔 1.1s，避免触发 QPS 限制
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASES_PATH = resolve(__dirname, '../public/data/bases.json');

const argvKey = process.argv.find((a) => a.startsWith('--key='))?.split('=')[1];
const argvRegion = process.argv.find((a) => a.startsWith('--region='))?.split('=')[1];

const API_KEY =
  argvKey ??
  (() => {
    throw new Error('请通过 --key=你的高德Key 传入 API Key\n例：node scripts/geocode-bases.mjs --key=your_key');
  })();

const DEFAULT_REGION = argvRegion ?? '广州市';

const PLACE_TEXT_V5 = 'https://restapi.amap.com/v5/place/text';
const GEOCODE_V3 = 'https://restapi.amap.com/v3/geocode/geo';

/**
 * 高德 v5 关键字搜索：返回 POI 列表，取第一条的 location（GCJ-02）
 * @see https://restapi.amap.com/v5/place/text
 */
async function placeTextSearch(keywords, region = DEFAULT_REGION) {
  const q = String(keywords ?? '').trim();
  if (!q) return null;

  const url = new URL(PLACE_TEXT_V5);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('keywords', q);
  url.searchParams.set('region', region);
  url.searchParams.set('page_size', '5');
  url.searchParams.set('page_num', '1');

  const resp = await fetch(url.toString());
  const data = await resp.json();

  if (data.status !== '1' || !data.pois?.length) {
    return null;
  }

  const p = data.pois[0];
  const loc = p.location;
  if (!loc || typeof loc !== 'string') return null;

  const parts = loc.split(',');
  if (parts.length < 2) return null;

  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  return {
    lng,
    lat,
    source: 'place/text',
    poiName: p.name,
    poiAddress: p.address,
    poiId: p.id,
  };
}

/** v3 地理编码兜底（门牌级，精度常弱于 POI） */
async function geocodeGeo(address) {
  const url = new URL(GEOCODE_V3);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('address', address);
  url.searchParams.set('city', '广州');
  url.searchParams.set('output', 'JSON');

  const resp = await fetch(url.toString());
  const data = await resp.json();

  if (data.status === '1' && data.geocodes?.length > 0) {
    const g = data.geocodes[0];
    const [lng, lat] = g.location.split(',').map(Number);
    return {
      lng,
      lat,
      source: 'geocode/geo',
      level: g.level,
      district: g.district,
      township: g.township,
    };
  }
  return null;
}

function buildKeywords(base) {
  const addr = (base.address ?? '').trim();
  const name = (base.name ?? '').trim();
  // 与网页检索一致：完整地址通常最能命中校区/场馆 POI
  if (addr) return addr;
  return name;
}

async function resolvePosition(base) {
  const keywords = buildKeywords(base);

  const place = await placeTextSearch(keywords);
  if (place) return place;

  const fallbackAddr = keywords || base.name;
  if (fallbackAddr) {
    const geo = await geocodeGeo(fallbackAddr);
    if (geo) return geo;
  }

  return null;
}

async function main() {
  const raw = readFileSync(BASES_PATH, 'utf-8');
  const bases = JSON.parse(raw);

  console.log(`\n[geocode-bases] 共 ${bases.length} 个基地，region=${DEFAULT_REGION}`);
  console.log('  优先：v5 place/text → 兜底：v3 geocode/geo\n');
  console.log('─'.repeat(70));

  const corrected = [];

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const [oldLng, oldLat] = base.position ?? [];

    process.stdout.write(`[${i + 1}/${bases.length}] ${base.name} ... `);

    await new Promise((r) => setTimeout(r, 1100));

    const result = await resolvePosition(base);

    if (result) {
      corrected.push({ ...base, position: [result.lng, result.lat] });
      const extra = result.source === 'place/text' ? ` POI: ${result.poiName ?? ''}` : ` level=${result.level ?? ''}`;
      console.log(`✅ [${result.lng}, ${result.lat}] (${result.source})${extra}`);
      console.log(`   旧坐标: [${oldLng}, ${oldLat}]`);
    } else {
      console.log(`⚠️  未命中，保留原坐标 [${oldLng}, ${oldLat}]`);
      corrected.push(base);
    }
  }

  writeFileSync(BASES_PATH, JSON.stringify(corrected, null, 2), 'utf-8');

  console.log('\n' + '─'.repeat(70));
  console.log(`\n✅ 校正完成，数据已写入 ${BASES_PATH}\n`);
}

main().catch(console.error);
