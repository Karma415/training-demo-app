import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';

async function test() {
    const creds = JSON.parse(fs.readFileSync('e:\\downloads\\sf-housing-hub-storage-5a258232d29d.json', 'utf8'));
    
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
        ],
    });

    const doc = new GoogleSpreadsheet('1FWbWz9ZhewTrjxCt3IZQ1fIcF-mdDvPleBPbO_CiJlc', serviceAccountAuth);
    try {
        await doc.loadInfo();
        console.log("SUCCESS! Sheet title:", doc.title);
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        console.log("Headers:", sheet.headerValues);
        console.log("Row count:", rows.length);
        if (rows.length > 0) {
            console.log("First row data:", rows[0].toObject());
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
