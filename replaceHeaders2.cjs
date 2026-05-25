const fs = require('fs');
const path = require('path');

function processAllHeaders(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processAllHeaders(fullPath);
        } else if (file.endsWith('.tsx') && !fullPath.includes('HomeScreen') && !fullPath.includes('AccountDetailScreen') && !fullPath.includes('ArcBirdScreen')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Many screens have: <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white border-b border-slate-100 shadow-sm relative z-10 w-full shrink-0">
            // Let's replace the common bg-white headers that haven't been replaced yet.
            
            // 1. TransactionHistoryScreen, TransferScreen, DepositQRScreen etc.
            content = content.replace(
                /<div className="flex items-center([a-zA-Z0-9\s-]*?) px-4 pt-12 pb-4 bg-white border-b border-slate-\d00 shadow-[a-z]+ relative z-10( w-full)?( shrink-0)?">/g,
                '<div className="flex items-center$1 px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full shrink-0 justify-between">'
            );

            // 2. ScanQRScreen
            content = content.replace(
                /<div className="flex items-center justify-between px-4 pt-12 pb-4 relative z-10 w-full">/g,
                '<div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full">'
            );
            
            // 3. SettingsScreen
            content = content.replace(
                /<div className="w-full pt-12 pb-4 px-4 flex items-center justify-between bg-slate-900 text-white relative z-10 shadow-sm">/g,
                '<div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 text-white relative z-10 shadow-md w-full">'
            );

            // 4. InboxScreen
            content = content.replace(
                /<div className="w-full pt-12 pb-4 px-4 bg-slate-900 text-white shadow-sm flex items-center shrink-0">/g,
                '<div className="w-full pt-6 pb-3 px-4 bg-slate-900 text-white shadow-md flex items-center shrink-0 justify-between">'
            );

            // In all those transformed headers, replace button styles and text colors.
            // Wait, standardizing the button first:
            content = content.replace(
                /className="(p-[12] )?hover:bg-slate-100 rounded-full transition-colors( active:bg-slate-200)?( cursor-pointer)?( border-0 bg-transparent)?"/g,
                'className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"'
            );
            content = content.replace(
                /className="p-2 hover:bg-white\/10 rounded-full transition-colors active:bg-white\/20 active:bg-white\/20/g,
                'className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20'
            );
            
            // Text color inside h2/h3
            content = content.replace(
                /<h([23]) (className="[^"]*?)text-slate-800([^"]*?")>/g,
                // Replace text-slate-800 with text-white
                (match, p1, p2, p3) => `<h${p1} ${p2}text-white${p3}>`
            );

            // ArrowLeft color
            content = content.replace(
                /<ArrowLeft size=\{24\} className="text-slate-[78]00" \/>/g,
                '<ArrowLeft size={20} className="text-white" />'
            );
            content = content.replace(
                /<ArrowLeft className="text-slate-[78]00" size=\{24\} \/>/g,
                '<ArrowLeft size={20} className="text-white" />'
            );

            // X icon
            content = content.replace(
                /<X size=\{[0-9]+\} className="text-slate-[78]00"([^>]*)>/g,
                '<X size={20} className="text-white"$1>'
            );

            // Search icon in TransactionHistory
            content = content.replace(
                /<Search size=\{[0-9]+\} className="text-slate-[78]00"/g,
                '<Search size={20} className="text-white"'
            );
            
            // ListFilter
            content = content.replace(
                /<ListFilter size=\{[0-9]+\} className="text-slate-[78]00"/g,
                '<ListFilter size={20} className="text-white"'
            );
            
            // UserPlus
            content = content.replace(
                /<UserPlus size=\{[0-9]+\} className="text-slate-[78]00"/g,
                '<UserPlus size={20} className="text-white"'
            );

            // MapPin
            content = content.replace(
                /<MapPin size=\{[0-9]+\} className="text-slate-[78]00"/g,
                '<MapPin size={20} className="text-white"'
            );
            
            // QRCode
            content = content.replace(
                /<QrCode size=\{[0-9]+\} className="text-slate-[78]00"/g,
                '<QrCode size={20} className="text-white"'
            );

            // Replace E-Commerce search header if it uses justify-between natively
            if (file.includes('EcommerceScreen')) {
                content = content.replace(
                    /<div className={`bg-white px-4 pt-12 pb-4 shadow-sm relative z-10 w-full/g,
                    '<div className={`bg-slate-900 px-4 pt-6 pb-3 shadow-md relative z-10 w-full'
                );
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Processed missing header:', file);
            }
        }
    });
}
processAllHeaders('./src');
