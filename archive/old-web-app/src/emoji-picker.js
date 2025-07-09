class EmojiPicker {
    constructor() {
        this.isOpen = false;
        this.items = [];
        this.container = null;
        this.targetElement = null;
        this.categories = {
            'Custom': [],
            'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
            'Food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍤', '🍙', '🍚', '🍘', '🍥', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾'],
            'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
            'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🧽', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓']
        };
    }

    async loadImages() {
        // List all your custom images here
        const imageFiles = [
            'ChickenNuggets.png',
            'FishSticks.png',
            'fish_sticks.png',
            'Fusion.png',
            'GoldenRetriever.png',
            'GoldfishCrackers.png',
            'kart.png',
            'lambo.png',
            'RAV4.png',
            'Swingset.png',
        ];
        
        const customImages = imageFiles.map(filename => ({
            type: 'image',
            name: filename.replace('.png', '').replace(/_/g, ' '),
            src: `image_library/${filename}`,
            alt: filename.replace('.png', '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
        }));
        
        this.categories['Custom'] = customImages;
        
        // Flatten all items for easy searching
        this.items = [];
        Object.entries(this.categories).forEach(([category, items]) => {
            items.forEach(item => {
                if (typeof item === 'string') {
                    this.items.push({ type: 'emoji', emoji: item, category });
                } else {
                    this.items.push({ ...item, category });
                }
            });
        });
    }

    createPicker() {
        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.innerHTML = `
            <div class="emoji-picker-header">
                <input type="text" class="emoji-search" placeholder="Search...">
                <button class="emoji-picker-close">×</button>
            </div>
            <div class="emoji-picker-tabs"></div>
            <div class="emoji-picker-content"></div>
        `;
        
        this.createTabs(picker);
        this.showCategory('Custom', picker);
        
        picker.querySelector('.emoji-picker-close').addEventListener('click', () => this.close());
        picker.querySelector('.emoji-search').addEventListener('input', (e) => this.filterEmojis(e.target.value));
        
        return picker;
    }
    
    createTabs(picker) {
        const tabsContainer = picker.querySelector('.emoji-picker-tabs');
        
        Object.keys(this.categories).forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'emoji-tab';
            tab.textContent = category;
            tab.addEventListener('click', () => this.showCategory(category, picker));
            tabsContainer.appendChild(tab);
        });
    }
    
    showCategory(categoryName, picker) {
        const content = picker.querySelector('.emoji-picker-content');
        content.innerHTML = '';
        
        // Update active tab
        picker.querySelectorAll('.emoji-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === categoryName);
        });
        
        const grid = document.createElement('div');
        grid.className = 'emoji-picker-grid';
        
        const items = this.categories[categoryName];
        items.forEach(item => {
            const element = document.createElement('div');
            element.className = 'emoji-picker-item';
            
            if (typeof item === 'string') {
                element.textContent = item;
                element.addEventListener('click', () => this.selectEmoji({ type: 'emoji', emoji: item }));
            } else {
                element.innerHTML = `<img src="${item.src}" alt="${item.alt}" title="${item.alt}">`;
                element.addEventListener('click', () => this.selectEmoji(item));
            }
            
            grid.appendChild(element);
        });
        
        content.appendChild(grid);
    }

    open(targetElement) {
        if (this.isOpen) return;
        
        this.targetElement = targetElement;
        
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'emoji-picker-backdrop';
        this.backdrop.addEventListener('click', () => this.close());
        document.body.appendChild(this.backdrop);
        
        // Create picker
        this.container = this.createPicker();
        document.body.appendChild(this.container);
        
        // Trigger animations
        requestAnimationFrame(() => {
            this.backdrop.classList.add('emoji-picker-backdrop--visible');
            this.container.classList.add('emoji-picker--open');
        });
        
        this.isOpen = true;
    }

    close() {
        if (!this.isOpen) return;
        
        // Remove animations
        if (this.container) {
            this.container.classList.remove('emoji-picker--open');
        }
        if (this.backdrop) {
            this.backdrop.classList.remove('emoji-picker-backdrop--visible');
        }
        
        // Wait for animation to complete
        setTimeout(() => {
            if (this.container) {
                this.container.remove();
                this.container = null;
            }
            if (this.backdrop) {
                this.backdrop.remove();
                this.backdrop = null;
            }
        }, 300);
        
        this.isOpen = false;
        this.onSelect = null; // Clear custom handler
    }


    selectEmoji(item) {
        // If there's a custom onSelect handler, use it
        if (this.onSelect) {
            this.onSelect(item);
            this.close();
            return;
        }
        
        if (this.targetElement) {
            if (this.targetElement.tagName === 'INPUT' || this.targetElement.tagName === 'TEXTAREA') {
                const start = this.targetElement.selectionStart;
                const end = this.targetElement.selectionEnd;
                const text = this.targetElement.value;
                
                if (item.type === 'emoji') {
                    this.targetElement.value = text.substring(0, start) + item.emoji + text.substring(end);
                    this.targetElement.selectionStart = this.targetElement.selectionEnd = start + item.emoji.length;
                } else {
                    this.targetElement.value = text.substring(0, start) + `[${item.name}]` + text.substring(end);
                    this.targetElement.selectionStart = this.targetElement.selectionEnd = start + item.name.length + 2;
                }
            } else if (this.targetElement.classList && this.targetElement.classList.contains('activity-emoji')) {
                // Special handling for activity emoji div
                if (item.type === 'emoji') {
                    this.targetElement.textContent = item.emoji;
                } else {
                    // For custom images, display the actual image
                    this.targetElement.innerHTML = `<img src="${item.src}" alt="${item.alt}" style="width: 100%; height: 100%; object-fit: contain;">`;
                    this.targetElement.dataset.customImage = item.src;
                }
            } else {
                if (item.type === 'emoji') {
                    const span = document.createElement('span');
                    span.textContent = item.emoji;
                    this.targetElement.appendChild(span);
                } else {
                    const img = document.createElement('img');
                    img.src = item.src;
                    img.alt = item.alt;
                    img.className = 'inline-emoji';
                    this.targetElement.appendChild(img);
                }
            }
        }
        
        this.close();
    }

    filterEmojis(searchTerm) {
        const term = searchTerm.toLowerCase();
        
        if (term === '') {
            this.showCategory('Custom', this.container);
            return;
        }
        
        const content = this.container.querySelector('.emoji-picker-content');
        content.innerHTML = '';
        
        const grid = document.createElement('div');
        grid.className = 'emoji-picker-grid';
        
        const matchingItems = this.items.filter(item => {
            if (item.type === 'emoji') {
                return item.emoji.includes(term) || item.category.toLowerCase().includes(term);
            } else {
                return item.name.toLowerCase().includes(term) || item.alt.toLowerCase().includes(term);
            }
        });
        
        matchingItems.forEach(item => {
            const element = document.createElement('div');
            element.className = 'emoji-picker-item';
            
            if (item.type === 'emoji') {
                element.textContent = item.emoji;
                element.addEventListener('click', () => this.selectEmoji(item));
            } else {
                element.innerHTML = `<img src="${item.src}" alt="${item.alt}" title="${item.alt}">`;
                element.addEventListener('click', () => this.selectEmoji(item));
            }
            
            grid.appendChild(element);
        });
        
        content.appendChild(grid);
    }
}

window.EmojiPicker = EmojiPicker;