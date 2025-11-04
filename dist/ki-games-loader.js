/**
 * ki-games-loader.js
 * * This script identifies which KI game custom elements are present on the page
 * and dynamically loads the corresponding game's JavaScript file.
 * * IMPORTANT: This assumes all individual game files are in a 'games/' directory
 * relative to the host of this loader file.
 */

(function() {
    // --- Configuration ---
    const GAME_TAG_PREFIX = 'ki-games-';
    const GAMES_DIRECTORY = 'games/'; // Directory where individual game JS files are stored

    // --- Dynamic Loader Function ---
    function loadGameScript(tagName) {
        // 1. Convert the tag name (e.g., 'ki-games-invaders') to a file name (e.g., 'ki-games-invaders.js')
        const fileName = `${tagName}.js`;
        // 2. Construct the full path
        const scriptPath = GAMES_DIRECTORY + fileName;

        // 3. Check if the script has already been loaded
        if (document.querySelector(`script[src*="${fileName}"]`)) {
            return;
        }

        console.log(`[KI Games Loader] Found <${tagName}>. Dynamically loading ${scriptPath}`);

        // 4. Create and append the new script tag
        const script = document.createElement('script');
        script.src = scriptPath;
        script.type = 'text/javascript';
        script.async = true;
        
        // This is important: The browser will now fetch and execute the game's JS file,
        // which contains the customElements.define(...) call.
        document.head.appendChild(script);
    }

    // --- Main Discovery Logic ---
    function discoverAndLoadGames() {
        const uniqueGameTags = new Set();
        
        // Find all elements on the page that start with the custom prefix
        const elements = document.querySelectorAll(`[is]`); // Look for potential custom elements
        
        // Also explicitly check the tags themselves in case the element hasn't been upgraded yet
        const allElements = [...document.getElementsByTagName('*')];
        
        // Combine all tags found
        allElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            if (tagName.startsWith(GAME_TAG_PREFIX)) {
                uniqueGameTags.add(tagName);
            }
        });
        
        // Iterate over the discovered tags and load the corresponding script
        uniqueGameTags.forEach(loadGameScript);
    }

    // Start the discovery process once the DOM is fully parsed
    // (though Web Components are designed to work even if the tag is present before the definition)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', discoverAndLoadGames);
    } else {
        discoverAndLoadGames();
    }

})();
