/**
 * Generate Swedish Postal Code to County (Län) mapping from GeoNames data
 * Run this script to update the postal code database
 * 
 * Usage: node scripts/generate-postal-code-data.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INPUT_FILE = path.join(__dirname, '../public/data/SE.txt');
const OUTPUT_FILE = path.join(__dirname, '../src/data/postal-code-mapping.json');

async function generateMapping() {
  console.log('🇸🇪 Generating Swedish Postal Code to County mapping...');
  console.log(`📖 Reading from: ${INPUT_FILE}`);

  const mapping = {};
  const countyStats = {};

  const fileStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    const parts = line.split('\t');
    
    if (parts.length < 5) continue;
    
    const postalCode = parts[1].replace(/\s/g, ''); // Remove spaces
    const county = parts[3]; // AdminName1 = Län
    
    if (!postalCode || !county || postalCode.length !== 5) continue;
    
    // Get first 2 digits for mapping
    const prefix = postalCode.substring(0, 2);
    
    // Store the county for this prefix
    if (!mapping[prefix]) {
      mapping[prefix] = county + ' län';
    }
    
    // Track statistics
    if (!countyStats[county]) {
      countyStats[county] = 0;
    }
    countyStats[county]++;
  }

  console.log(`✅ Processed ${lineCount} lines`);
  console.log(`📊 Found ${Object.keys(mapping).length} postal code prefixes`);
  console.log('\n📍 Counties found:');
  Object.entries(countyStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([county, count]) => {
      console.log(`   ${county}: ${count} postal codes`);
    });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write mapping to JSON file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(mapping, null, 2),
    'utf8'
  );

  console.log(`\n💾 Saved mapping to: ${OUTPUT_FILE}`);
  console.log('✅ Done!');
}

generateMapping().catch(console.error);

