function initShredder() {
    // 1. Check dictionary
    if (typeof morphemeMap === 'undefined') {
        console.error("Dictionary missing!");
        return;
    }

    const sortedKeys = Object.keys(morphemeMap).sort((a, b) => b.length - a.length);

    // 2. The Translator Logic
    function translateEntireString(text) {
        let remaining = text;
        let result = "";
        
        while (remaining.length > 0) {
            let found = false;
            let lowerRemaining = remaining.toLowerCase();

            for (const key of sortedKeys) {
                if (lowerRemaining.startsWith(key)) {
                    result += morphemeMap[key];
                    remaining = remaining.slice(key.length);
                    found = true;
                    break;
                }
            }

            if (!found) {
                result += remaining[0]; // Keep spaces/newlines/unknowns
                remaining = remaining.slice(1);
            } else {
                found = false; // Reset for next loop
            }
        }
        return result;
    }

    // 3. Function to Process a Single Node
    function processNode(node) {
        // Validation: Must be text, not empty, and parent tag allowed
        if (node.nodeType !== 3) return;
        const text = node.nodeValue;
        if (!text.trim()) return;

        const parentTag = node.parentElement ? node.parentElement.tagName : "";
        if (["SCRIPT", "STYLE", "CODE", "TEXTAREA", "NOSCRIPT", "INPUT"].includes(parentTag)) return;

        // Check if it's already translated (optimization)
        // If the text contains Chinese/Chaos characters, we assume we already hit it
        // (This prevents infinite loops where the observer sees us change text and fires again)
        // We do this by checking if there is still significant English/Number content left
        if (!/[a-zA-Z0-9]/.test(text)) return; 

        const newText = translateEntireString(text);
        if (newText !== text) {
            node.nodeValue = newText;
        }
    }

    // 4. The Initial Sweep (For what's already on screen)
    function walkAndShred(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            processNode(node);
        }
    }

    // 5. The "Security Camera" (MutationObserver)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // If the new thing is just text, process it
                if (node.nodeType === 3) {
                    processNode(node);
                } 
                // If it's a whole container (like a new email body), walk inside it
                else if (node.nodeType === 1) {
                    walkAndShred(node);
                }
            });
        });
    });

    // Start Everything
    console.log("Shredder Active: Watching for new text...");
    walkAndShred(document.body); // Attack current text
    
    // Attack future text
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Run immediately
initShredder();