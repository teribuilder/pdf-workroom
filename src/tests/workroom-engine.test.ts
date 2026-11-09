// @vitest-environment node
import {it, expect, vi} from 'vitest';
import fs from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
vi.mock('../js/editcore/engine-loader.js', async () => {
 const {default:createModule} = await import('bentopdf-pdfium');
 return {ENGINE_BUILD:'real-wasm-node-test',createEngineModule:(opts:any)=>createModule({...opts,wasmBinary:fs.readFileSync('node_modules/bentopdf-pdfium/editcore.wasm')})};
});
import {PdfEngine} from '../js/editcore/core.js';
it('edits Korean existing text and preserves it after saving and reopening with the actual WASM engine',async()=>{
 const fontBytes=fs.readFileSync('public/fonts/NotoSansCJKkr-Regular.otf');
 const doc=await PDFDocument.create(); doc.registerFontkit(fontkit);
 const font=await doc.embedFont(fontBytes,{subset:true});
 doc.addPage([595,842]).drawText('비긴업 금액 10000원',{x:60,y:740,size:18,font});
 const bytes=await doc.save();
 fs.mkdirSync('../evidence',{recursive:true});fs.writeFileSync('../evidence/korean-before.pdf',bytes);
 PdfEngine.fallbackFonts.set('kor',new Uint8Array(fontBytes));
 const engine=await PdfEngine.create(); engine.open(bytes);
 const model=engine.buildModel();
 console.log('model',JSON.stringify(model).slice(0,2500));
 const p=model.find((p:any)=>p.runs?.some((r:any)=>r.text?.includes('10000')));
 expect(p).toBeTruthy();
 const runs=p.runs.map((r:any)=>({...r,text:r.text.replace('10000','25000')}));
 engine.commitParagraph(p.id,runs,p.fmt||p.format||{align:0,lineSpacing:1.2});
 const saved=engine.save();expect(saved.length).toBeGreaterThan(100);
 fs.writeFileSync('../evidence/korean-after.pdf',saved);
 engine.open(saved);const re=JSON.stringify(engine.buildModel());
 expect(re).toContain('25000');expect(re).not.toContain('10000');engine.close();
},30000);
