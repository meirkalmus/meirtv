/**
 * WordPress → PostgreSQL Migration Script (v2 - bulk insert)
 * Run: node scripts/migrate-from-wordpress.js
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['error'] });

const WP_PREFIX = 'ywn_';

function safeInt(v) { const n = parseInt(v, 10); return isNaN(n) ? null : n; }
function safeDate(v) {
  if (!v || v === '0000-00-00 00:00:00' || v === '0000-00-00') return null;
  try { const d = new Date(v); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}
function log(msg) { process.stdout.write(msg + '\n'); }

async function getDb() {
  return mysql.createPool({
    socketPath: '/var/run/mysqld/mysqld.sock',
    user: 'phtczdsuws',
    password: 'NkAmj7jbHD',
    database: 'phtczdsuws',
    charset: 'utf8mb4',
    connectionLimit: 3,
    connectTimeout: 60000,
    idleTimeout: 600000,
  });
}

async function main() {
  log('🔌 Connecting to MySQL...');
  const db = await getDb();
  log('✅ Connected\n');

  // ── Step 1: Taxonomies (skip if already done) ─────────────────────────────

  const existingRabbis = await prisma.rabbi.count();
  if (existingRabbis === 0) {
    log('📚 Migrating rabbis...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug, tt.description FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='rabbis'`);
    const ids = rows.map(r => r.term_id);
    const picMap = {};
    if (ids.length) {
      const [pics] = await db.query(`SELECT term_id, meta_value FROM ${WP_PREFIX}termmeta WHERE term_id IN (${ids.join(',')}) AND meta_key='rabbi-picture'`);
      pics.forEach(p => picMap[p.term_id] = String(p.meta_value));
    }
    await prisma.rabbi.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `rabbi-${r.term_id}`, description: r.description || null, picture: picMap[r.term_id] || null })), skipDuplicates: true });
    log(`✅ ${rows.length} rabbis`);
  } else { log(`⏭️  Rabbis already migrated (${existingRabbis})`); }

  const existingSeries = await prisma.series.count();
  if (existingSeries === 0) {
    log('📺 Migrating series...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug, tt.description, tt.parent FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='shiurim-series' ORDER BY tt.parent ASC, t.term_id ASC`);
    await prisma.series.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `series-${r.term_id}`, description: r.description || null })), skipDuplicates: true });
    log(`✅ ${rows.length} series`);
  } else { log(`⏭️  Series already migrated (${existingSeries})`); }

  const existingTags = await prisma.tag.count();
  if (existingTags === 0) {
    log('🏷️  Migrating tags...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='shiurim-tags'`);
    await prisma.tag.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `tag-${r.term_id}` })), skipDuplicates: true });
    log(`✅ ${rows.length} tags`);
  } else { log(`⏭️  Tags already migrated (${existingTags})`); }

  const existingParashas = await prisma.parasha.count();
  if (existingParashas === 0) {
    log('📖 Migrating parashas...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug, tt.description FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='parasha'`);
    await prisma.parasha.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `parasha-${r.term_id}`, description: r.description || null })), skipDuplicates: true });
    log(`✅ ${rows.length} parashas`);
  } else { log(`⏭️  Parashas already migrated (${existingParashas})`); }

  const existingMoadim = await prisma.moed.count();
  if (existingMoadim === 0) {
    log('🕍 Migrating moadim...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug, tt.description FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='moadim'`);
    await prisma.moed.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `moed-${r.term_id}`, description: r.description || null })), skipDuplicates: true });
    log(`✅ ${rows.length} moadim`);
  } else { log(`⏭️  Moadim already migrated (${existingMoadim})`); }

  const existingMadorim = await prisma.mador.count();
  if (existingMadorim === 0) {
    log('🏛️  Migrating madorim...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='mador'`);
    await prisma.mador.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `mador-${r.term_id}` })), skipDuplicates: true });
    log(`✅ ${rows.length} madorim`);
  } else { log(`⏭️  Madorim already migrated (${existingMadorim})`); }

  const existingCats = await prisma.category.count();
  if (existingCats === 0) {
    log('📁 Migrating categories...');
    const [rows] = await db.query(`SELECT t.term_id, t.name, t.slug, tt.description FROM ${WP_PREFIX}terms t JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id=tt.term_id WHERE tt.taxonomy='shiurim-category'`);
    await prisma.category.createMany({ data: rows.map(r => ({ wpTermId: r.term_id, name: r.name, slug: r.slug || `cat-${r.term_id}`, description: r.description || null })), skipDuplicates: true });
    log(`✅ ${rows.length} categories`);
  } else { log(`⏭️  Categories already migrated (${existingCats})`); }

  // ── Step 2: Build lookup maps from PostgreSQL ─────────────────────────────
  log('\n🗺️  Building lookup maps...');
  const [allRabbis, allSeries, allTags, allParashas, allMoadim, allMadorim, allCats] = await Promise.all([
    prisma.rabbi.findMany({ select: { id: true, wpTermId: true } }),
    prisma.series.findMany({ select: { id: true, wpTermId: true } }),
    prisma.tag.findMany({ select: { id: true, wpTermId: true } }),
    prisma.parasha.findMany({ select: { id: true, wpTermId: true } }),
    prisma.moed.findMany({ select: { id: true, wpTermId: true } }),
    prisma.mador.findMany({ select: { id: true, wpTermId: true } }),
    prisma.category.findMany({ select: { id: true, wpTermId: true } }),
  ]);
  const rMap = Object.fromEntries(allRabbis.map(r => [r.wpTermId, r.id]));
  const sMap = Object.fromEntries(allSeries.map(r => [r.wpTermId, r.id]));
  const tMap = Object.fromEntries(allTags.map(r => [r.wpTermId, r.id]));
  const pMap = Object.fromEntries(allParashas.map(r => [r.wpTermId, r.id]));
  const mMap = Object.fromEntries(allMoadim.map(r => [r.wpTermId, r.id]));
  const dMap = Object.fromEntries(allMadorim.map(r => [r.wpTermId, r.id]));
  const cMap = Object.fromEntries(allCats.map(r => [r.wpTermId, r.id]));
  log('✅ Maps ready\n');

  // ── Step 3: Migrate Shiurim in bulk ───────────────────────────────────────
  log('🎬 Migrating shiurim...');
  const BATCH = 1000;
  let offset = 0;
  let totalShiurim = 0;
  let errors = 0;

  while (true) {
    const [posts] = await db.query(`
      SELECT ID, post_title, post_name, post_content, post_excerpt,
             post_status, post_date
      FROM ${WP_PREFIX}posts
      WHERE post_type='shiurim' AND post_status IN ('publish','draft','private')
      ORDER BY ID
      LIMIT ${BATCH} OFFSET ${offset}
    `);
    if (posts.length === 0) break;

    const postIds = posts.map(p => p.ID);
    const ph = postIds.join(',');

    const [metas] = await db.query(`
      SELECT post_id, meta_key, meta_value FROM ${WP_PREFIX}postmeta
      WHERE post_id IN (${ph})
      AND meta_key IN ('vimeo_file','vimeo_pic_file','youtube_file','mp4_file','mp3_file',
                       'vtt_file','transcription','episode','lessonlength','video-duration',
                       'pdf-mekorot','hebrewrecorddate','recorddate','hidden')
    `);
    const metaByPost = {};
    for (const m of metas) {
      if (!metaByPost[m.post_id]) metaByPost[m.post_id] = {};
      metaByPost[m.post_id][m.meta_key] = m.meta_value;
    }

    const [termRels] = await db.query(`
      SELECT tr.object_id, t.term_id, tt.taxonomy
      FROM ${WP_PREFIX}term_relationships tr
      JOIN ${WP_PREFIX}term_taxonomy tt ON tr.term_taxonomy_id=tt.term_taxonomy_id
      JOIN ${WP_PREFIX}terms t ON tt.term_id=t.term_id
      WHERE tr.object_id IN (${ph})
        AND tt.taxonomy IN ('rabbis','shiurim-series','shiurim-tags','parasha','moadim','mador','shiurim-category')
    `);
    const termsByPost = {};
    for (const r of termRels) {
      if (!termsByPost[r.object_id]) termsByPost[r.object_id] = {};
      if (!termsByPost[r.object_id][r.taxonomy]) termsByPost[r.object_id][r.taxonomy] = [];
      termsByPost[r.object_id][r.taxonomy].push(r.term_id);
    }

    // Bulk insert shiurim (no relations yet)
    const shiurData = posts.map(post => {
      const meta = metaByPost[post.ID] || {};
      const postSlug = post.post_name || `shiur-${post.ID}`;
      return {
        wpId: post.ID,
        slug: postSlug,
        title: post.post_title || '(ללא כותרת)',
        content: post.post_content || null,
        excerpt: post.post_excerpt || null,
        status: post.post_status,
        vimeoId: meta['vimeo_file'] || null,
        vimeoThumbnail: meta['vimeo_pic_file'] || null,
        youtubeId: meta['youtube_file'] || null,
        mp4Url: meta['mp4_file'] || null,
        mp3Url: meta['mp3_file'] || null,
        vttUrl: meta['vtt_file'] || null,
        transcriptionUrl: meta['transcription'] || null,
        episodeNumber: safeInt(meta['episode']),
        lessonLength: safeInt(meta['lessonlength']),
        videoDuration: safeInt(meta['video-duration']),
        pdfMekorot: meta['pdf-mekorot'] || null,
        hebrewDate: meta['hebrewrecorddate'] || null,
        recordDate: safeDate(meta['recorddate']),
        hidden: meta['hidden'] === '1',
        publishedAt: safeDate(post.post_date),
      };
    });

    try {
      await prisma.shiur.createMany({ data: shiurData, skipDuplicates: true });
    } catch (e) {
      log(`  ⚠️  Batch insert error at offset ${offset}: ${e.message}`);
      errors++;
    }

    // Now insert relations for this batch
    const insertedShiurim = await prisma.shiur.findMany({
      where: { wpId: { in: postIds } },
      select: { id: true, wpId: true },
    });
    const shiurIdMap = Object.fromEntries(insertedShiurim.map(s => [s.wpId, s.id]));

    const rabbiRels = [], seriesRels = [], tagRels = [], parashaRels = [], moedRels = [], madorRels = [], catRels = [];

    for (const post of posts) {
      const sid = shiurIdMap[post.ID];
      if (!sid) continue;
      const terms = termsByPost[post.ID] || {};
      (terms['rabbis'] || []).forEach((tid, i) => { if (rMap[tid]) rabbiRels.push({ shiurId: sid, rabbiId: rMap[tid], isPrimary: i === 0 }); });
      (terms['shiurim-series'] || []).forEach(tid => { if (sMap[tid]) seriesRels.push({ shiurId: sid, seriesId: sMap[tid] }); });
      (terms['shiurim-tags'] || []).forEach(tid => { if (tMap[tid]) tagRels.push({ shiurId: sid, tagId: tMap[tid] }); });
      (terms['parasha'] || []).forEach(tid => { if (pMap[tid]) parashaRels.push({ shiurId: sid, parashaId: pMap[tid] }); });
      (terms['moadim'] || []).forEach(tid => { if (mMap[tid]) moedRels.push({ shiurId: sid, moedId: mMap[tid] }); });
      (terms['mador'] || []).forEach(tid => { if (dMap[tid]) madorRels.push({ shiurId: sid, madorId: dMap[tid] }); });
      (terms['shiurim-category'] || []).forEach(tid => { if (cMap[tid]) catRels.push({ shiurId: sid, categoryId: cMap[tid] }); });
    }

    await Promise.all([
      rabbiRels.length  && prisma.shiurRabbi.createMany({ data: rabbiRels, skipDuplicates: true }),
      seriesRels.length && prisma.shiurSeries.createMany({ data: seriesRels, skipDuplicates: true }),
      tagRels.length    && prisma.shiurTag.createMany({ data: tagRels, skipDuplicates: true }),
      parashaRels.length && prisma.shiurParasha.createMany({ data: parashaRels, skipDuplicates: true }),
      moedRels.length   && prisma.shiurMoadim.createMany({ data: moedRels, skipDuplicates: true }),
      madorRels.length  && prisma.shiurMador.createMany({ data: madorRels, skipDuplicates: true }),
      catRels.length    && prisma.shiurCategory.createMany({ data: catRels, skipDuplicates: true }),
    ].filter(Boolean));

    totalShiurim += posts.length;
    log(`  ↳ ${totalShiurim} shiurim processed...`);
    offset += BATCH;
  }

  await db.end().catch(() => {});
  await prisma.$disconnect();

  const finalCount = await prisma.shiur.count().catch(() => 0);
  log('\n🎉 Migration complete!');
  log(`   Shiurim in DB: ${finalCount}`);
  log(`   Errors: ${errors}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
