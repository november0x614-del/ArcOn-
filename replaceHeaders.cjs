const fs = require('fs');
const path = require('path');

function replaceHeaders(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceHeaders(fullPath);
        } else if (file.endsWith('.tsx') && !fullPath.includes('HomeScreen')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Find our standard header pattern
            const headerStartPattern = /<div className="flex items-center px-4 pt-6 pb-3 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full justify-between">/;
            
            if (headerStartPattern.test(content)) {
                 // Replace the specific container
                 content = content.replace(
                     /<div className="flex items-center px-4 pt-6 pb-3 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full justify-between">/g,
                     '<div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">'
                 );
                 // The easiest way to replace the styling inside this header is to locate the button and text class names
                 // But wait, there might be other ArrowLeft and text-slate-800 elsewhere.
                 // Actually this file is usually pretty small, but to be safe let's match the specific button and h2
                 
                 content = content.replace(
                     /className="p-2 hover:bg-slate-100 rounded-full transition-colors active:bg-slate-200 cursor-pointer border-0 bg-transparent"/g,
                     'className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"'
                 );
                 
                 content = content.replace(
                     /<ArrowLeft size=\{20\} className="text-slate-800" \/>/g,
                     '<ArrowLeft size={20} className="text-white" />'
                 );
                 
                 content = content.replace(
                     /<h2 className="font-bold text-\[16px\] text-slate-800 ml-2">/g,
                     '<h2 className="font-bold text-[16px] text-white ml-2">'
                 );
                 
                 content = content.replace(
                     /<h1 className="font-bold text-\[16px\] text-slate-800 ml-2">/g,
                     '<h1 className="font-bold text-[16px] text-white ml-2">'
                 );

                 content = content.replace(
                     /<h1 className="font-bold text-\[16px\] text-slate-800 tracking-tight leading-tight">/g,
                     '<h1 className="font-bold text-[16px] text-white tracking-tight leading-tight">'
                 );

                  // also ReceiptScreen shares
                 content = content.replace(
                    /<Download size=\{20\} className="text-slate-800" \/>/g,
                    '<Download size={20} className="text-white" />'
                 );

                 content = content.replace(
                     /<Share2 size=\{20\} className="text-slate-800" \/>/g,
                     '<Share2 size={20} className="text-white" />'
                 );
                 
                 // search header in Ecommerce screen uses text-slate-800 instead of white, wait. I changed it to:
                 content = content.replace(
                     /<div className={`bg-white px-4 pt-6 pb-3 shadow-sm relative z-10 w-full transition-all duration-300 (\$\{viewState !== 'list' \? 'hidden' : 'block'\})`}>/g,
                     '<div className={`bg-slate-900 px-4 pt-6 pb-3 shadow-md relative z-10 w-full transition-all duration-300 ${viewState !== \'list\' ? \'hidden\' : \'block\'}`}>'
                 );

                 // Search icon in Ecommerce
                 content = content.replace(
                     /<Search size=\{22\} className="text-slate-800" \/>/g,
                     '<Search size={22} className="text-white" />'
                 );

                 content = content.replace(
                     /<ShoppingCart size=\{22\} className="text-slate-800" \/>/g,
                     '<ShoppingCart size={22} className="text-white" />'
                 );

                 // Settings screen
                 content = content.replace(
                     /<ArrowLeft size=\{24\} className="text-slate-800" \/>/g,
                     '<ArrowLeft size={24} className="text-white" />'
                 );
                 
                 // Special text in Faucet
                 content = content.replace(
                    /<p className="text-\[10px\] text-slate-500 font-bold uppercase tracking-wider">Testnet Token<\/p>/g,
                    '<p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Testnet Token</p>'
                 );
                 
                 // Special name in AmountInput screen
                 content = content.replace(
                    /<h2 className="text-slate-800 font-bold text-\[15px\] uppercase tracking-tight leading-tight">\{contact\.name\}<\/h2>/g,
                    '<h2 className="text-white font-bold text-[15px] uppercase tracking-tight leading-tight">{contact.name}</h2>'
                 );
                 content = content.replace(
                    /<p className="text-slate-500 text-\[11px\] mt-\[1px\]">\{contact\.bank \|\| contact\.network\} - \{contact\.account\}<\/p>/g,
                    '<p className="text-slate-300 text-[11px] mt-[1px]">{contact.bank || contact.network} - {contact.account}</p>'
                 );

                 fs.writeFileSync(fullPath, content, 'utf8');
                 console.log('Updated:', file);
            }
        }
    });
}
replaceHeaders('./src');
