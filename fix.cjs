const fs = require('fs');
const path = require('path');

function fixFiles(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixFiles(fullPath);
        } else if (file.endsWith('.tsx') && !fullPath.includes('HomeScreen') && !fullPath.includes('AccountDetailScreen')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // First, completely revert all text-white inside h1, h2, h3 to text-slate-800
            content = content.replace(
                /<h([123])([^>]*?)text-white([^>]*?)>/g,
                '<h$1$2text-slate-800$3>'
            );

            // Now, ONLY replace the one inside the header.
            // The header always looks like: <div className="... bg-slate-900 ... justify-between ... 
            // Followed closely by a button and an h2/h1.
            
            // We use a regex to find the bg-slate-900 header div and the FIRST h1/h2 inside it.
            // A more straightforward way is to split by `bg-slate-900 shadow-md` (or similar) and only replace the first occurrence of `text-slate-800` in the header block.
            
            let parts = content.split('bg-slate-900');
            if (parts.length > 1) {
                // parts[1] contains the header internals until the next bg-slate-900 (none usually)
                // but let's just replace the FIRST text-slate-800 inside an h1/h2/h3 we find in parts[1] up to the first </div></div>
                let headerContent = parts[1];
                let endOfHeader = headerContent.indexOf('</div>\n      </div>');
                if (endOfHeader === -1) endOfHeader = headerContent.indexOf('</div>\n        </div>');
                if (endOfHeader === -1) endOfHeader = 500; // limit 
                
                let headerText = headerContent.substring(0, endOfHeader);
                let restText = headerContent.substring(endOfHeader);
                
                headerText = headerText.replace(
                    /<h([123])([^>]*?)text-slate-800([^>]*?)>/g,
                    '<h$1$2text-white$3>'
                );
                
                parts[1] = headerText + restText;
                content = parts.join('bg-slate-900');
            }

            // Also, ReceiptScreen uses `bg-slate-900` ... oh wait, we just made all headers `bg-slate-900 shadow-md relative z-10 w-full` ...
            // Wait, we need to check if there are other `bg-slate-900` instances. Buttons have `bg-slate-900`!
            // Let's refine the split to `bg-slate-900 shadow-md` because headers uniquely have `bg-slate-900 shadow-md`.
            
            content = original; // Reset
            
            content = content.replace(
                /<h([123])([^>]*?)text-white([^>]*?)>/g,
                '<h$1$2text-slate-800$3>'
            );
            
            let hParts = content.split('bg-slate-900 shadow-md');
            if(hParts.length > 1) {
                // Usually there is only 1 header.
                for (let i = 1; i < hParts.length; i++) {
                    let endIndex = hParts[i].indexOf('</div>\n      </div>');
                    if (endIndex === -1) endIndex = hParts[i].indexOf('</div>\n        </div>\n      </div>');
                    if (endIndex === -1) endIndex = 600;
                    
                    let insideHeader = hParts[i].substring(0, endIndex);
                    let outsideHeader = hParts[i].substring(endIndex);
                    
                    insideHeader = insideHeader.replace(
                        /<h([123])([^>]*?)text-slate-800([^>]*?)>/g,
                        '<h$1$2text-white$3>'
                    );
                    
                    hParts[i] = insideHeader + outsideHeader;
                }
                content = hParts.join('bg-slate-900 shadow-md');
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', file);
            }
        }
    });

    // Special fix for AmountInputScreen since we just set it up differently:
    let amtInput = path.join(dirPath, 'AmountInputScreen.tsx');
    if (fs.existsSync(amtInput)) {
        let content = fs.readFileSync(amtInput, 'utf8');
        // If there's any text-slate-800 that shouldn't be... wait, we WANT text-slate-800 in the Confirm modal 
        fs.writeFileSync(amtInput, content, 'utf8');
    }
}
fixFiles('./src/components/screens');
