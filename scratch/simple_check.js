import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

console.log("Checking tr content:");
if (pp.taggedTabResponse) {
  const tr = pp.taggedTabResponse;
  console.log("tr string:", JSON.stringify(tr).substring(0, 2000));
}
