import fs from 'fs';
import path from 'path';

const logoBytes = fs.readFileSync('public/Logo.png');
const logoB64 = logoBytes.toString('base64');

const snapchatBytes = fs.readFileSync('public/snapchat.png');
const snapchatB64 = snapchatBytes.toString('base64');

fs.writeFileSync('src/components/logo.ts', `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LOGO_BASE64 = "data:image/png;base64,${logoB64}";
export const SNAPCHAT_BASE64 = "data:image/png;base64,${snapchatB64}";
`);

console.log("Success! Base64 assets generated in src/components/logo.ts");
