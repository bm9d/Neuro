document.addEventListener('DOMContentLoaded', () => {

    // Self-invoking function to encapsulate all logic and avoid polluting the global scope
    const neurosubApp = (() => {

        // --- CONFIGURATION ---
        const DATA_FILE_PATH = 'data/data.json'; // Path to your new JSON data file
        const ICONS = {
            sun: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
            moon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`,
        };

        // --- STATE ---
        let state = {
            allProducts: [],
            currentLang: 'ar', // Default language is now Arabic
            activeCategory: 'All',
            sortOption: 'default',
            isModalOpen: false,
            theme: 'dark', // default theme, will be overridden by user preference or system setting
        };

        // --- DOM ELEMENTS ---
        const dom = {
            html: document.documentElement,
            productGrid: document.getElementById('product-grid'),
            errorMessage: document.getElementById('error-message'),
            noResultsMessage: document.getElementById('no-results-message'),
            headerBar: document.getElementById('header-bar'),
            scrollingHeaderContent: document.getElementById('scrolling-header-content'),
            scrollingLogo: document.getElementById('scrolling-logo'),
            scrollingName: document.getElementById('scrolling-name'),
            scrollPrompt: document.getElementById('scroll-prompt'),
            langSelectorContainer: document.getElementById('language-selector-container'),
            orderModal: document.getElementById('order-modal'),
            modalContent: document.querySelector('#order-modal .modal-content'),
            modalCancelBtn: document.getElementById('modal-cancel-btn'),
            modalProceedBtn: document.getElementById('modal-proceed-btn'),
            categoryFilters: document.getElementById('category-filters'),
            sortOptions: document.getElementById('sort-options'),
            searchInput: document.getElementById('search-input'),
            clearSearchBtn: document.getElementById('clear-search-btn'),
            backToTopBtn: document.getElementById('back-to-top'),
            productsSection: document.getElementById('products'),
            themeToggleBtn: document.getElementById('theme-toggle'),
        };

        // --- TRANSLATIONS ---
        const translations = {
            en: { contact_us: "Contact Us", scroll_down: "SCROLL DOWN", hero_title: "Your Gateway to Premium Digital Subscriptions", hero_subtitle: "We provide fast, reliable, and affordable access to the digital tools and entertainment you love. Perfect for creators, students, and professionals.", browse_products: "Browse Products", our_products: "Our Products", sort_default: "Sort by...", sort_price_asc: "Price: Low to High", sort_price_desc: "Price: High to Low", sort_name_asc: "Name: A-Z", search_placeholder: "Search for products...", no_products_found: "No products found matching your search.", footer_copyright: "&copy; 2024 neurosub. All Rights Reserved.", follow_us: "Follow Us", modal_title: "Redirecting to Telegram", modal_text: "You will be redirected to our Telegram account to complete your order. Press 'Proceed' to continue.", modal_cancel: "Cancel", modal_proceed: "Proceed", view_details: "View Details", out_of_stock: "Out of Stock", all_category: "All", error_title: "Could Not Load Products!", error_instructions: `<p class="mt-2">We couldn't fetch the product data. Please check if the <code>${DATA_FILE_PATH}</code> file exists and is correctly formatted.</p>`},
            ar: { contact_us: "تواصل معنا", scroll_down: "مرر للأسفل", hero_title: "بوابتك للاشتراكات الرقمية المميزة", hero_subtitle: "نحن نوفر وصولاً سريعًا وموثوقًا وبأسعار معقولة للأدوات الرقمية والترفيه الذي تحبه. مثالي للمبدعين والطلاب والمحترفين.", browse_products: "تصفح المنتجات", our_products: "منتجاتنا", sort_default: "الترتيب حسب...", sort_price_asc: "السعر: من الأقل إلى الأعلى", sort_price_desc: "السعر: من الأعلى إلى الأقل", sort_name_asc: "الاسم: أ-ي", search_placeholder: "ابحث عن المنتجات...", no_products_found: "لم يتم العثور على منتجات تطابق بحثك.", footer_copyright: "&copy; 2024 نيوروسب. كل الحقوق محفوظة.", follow_us: "تابعنا", modal_title: "التوجيه إلى تيليجرام", modal_text: "سيتم توجيهك إلى حسابنا على تيليجرام لإكمال طلبك. اضغط على 'متابعة' للاستمرار.", modal_cancel: "إلغاء", modal_proceed: "متابعة", view_details: "عرض التفاصيل", out_of_stock: "نفدت الكمية", all_category: "الكل", error_title: "تعذر تحميل المنتجات!", error_instructions: `<p class="mt-2 text-right">لم نتمكن من جلب بيانات المنتج. يرجى التحقق من وجود ملف <code>${DATA_FILE_PATH}</code> وأنه مهيأ بشكل صحيح.</p>`}
        };

        // --- UTILITY FUNCTIONS ---
        const debounce = (func, delay) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };

        const storage = {
            get: (key, defaultValue) => localStorage.getItem(key) || defaultValue,
            set: (key, value) => localStorage.setItem(key, value),
        };

        // --- THEME LOGIC ---
        const applyTheme = (theme) => {
            state.theme = theme;
            // Note: We only save the theme to storage when the user *manually* toggles it.
            // This is handled in the toggleTheme function.
            if (theme === 'dark') {
                dom.html.classList.add('dark');
                dom.themeToggleBtn.innerHTML = ICONS.sun;
            } else {
                dom.html.classList.remove('dark');
                dom.themeToggleBtn.innerHTML = ICONS.moon;
            }
        };

        const toggleTheme = () => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            // When user manually toggles, save their preference. This will now override the system setting.
            storage.set('neurosub-theme', newTheme);
            applyTheme(newTheme);
        };

        const initTheme = () => {
            const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

            // This function checks for a user-saved theme, otherwise uses the system theme.
            const decideAndApplyTheme = () => {
                const savedTheme = storage.get('neurosub-theme');
                applyTheme(savedTheme || (systemMedia.matches ? 'dark' : 'light'));
            };

            // Apply the theme on initial load
            decideAndApplyTheme();

            // Add a listener to automatically update the theme when the system preference changes.
            systemMedia.addEventListener('change', decideAndApplyTheme);
        };

        // --- CORE LOGIC ---
        const setLanguage = (lang, isInitial = false) => {
            state.currentLang = lang;
            dom.html.lang = lang;
            dom.html.dir = lang === 'ar' ? 'rtl' : 'ltr';

            document.querySelectorAll('[data-translate]').forEach(el => {
                const key = el.getAttribute('data-translate');
                if (translations[lang][key]) el.innerHTML = translations[lang][key];
            });

            document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
                const key = el.getAttribute('data-translate-placeholder');
                if (translations[lang][key]) el.placeholder = translations[lang][key];
            });

            dom.langSelectorContainer.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });

            if (!isInitial) {
                storage.set('neurosub-lang', lang);
                setupCategoryFilters();
                updateDisplay();
            }
        };

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 50;

            // Scroll Prompt Fade
            dom.scrollPrompt.classList.toggle('opacity-0', scrollPosition > 20);

            // Header Transformation
            if (scrollPosition > scrollThreshold) {
                dom.headerBar.classList.add('opacity-100');
                dom.scrollingHeaderContent.classList.remove('top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', 'flex-col', 'space-y-4');
                dom.scrollingHeaderContent.classList.add('top-4', 'start-6', 'md:start-12', 'flex-row', 'items-center');
                dom.scrollingHeaderContent.querySelector('.flex').classList.add('space-x-4', 'rtl:space-x-reverse');
                dom.scrollingLogo.classList.remove('w-24', 'h-24', 'md:w-32', 'md:h-32');
                dom.scrollingLogo.classList.add('w-8', 'h-8');
                dom.scrollingName.classList.remove('text-4xl', 'md:text-6xl');
                dom.scrollingName.classList.add('text-xl');
                dom.langSelectorContainer.classList.add('hidden');
            } else {
                dom.headerBar.classList.remove('opacity-100');
                dom.scrollingHeaderContent.classList.add('top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', 'flex-col', 'space-y-4');
                dom.scrollingHeaderContent.classList.remove('top-4', 'start-6', 'md:start-12', 'flex-row', 'items-center');
                dom.scrollingHeaderContent.querySelector('.flex').classList.remove('space-x-4', 'rtl:space-x-reverse');
                dom.scrollingLogo.classList.add('w-24', 'h-24', 'md:w-32', 'md:h-32');
                dom.scrollingLogo.classList.remove('w-8', 'h-8');
                dom.scrollingName.classList.add('text-4xl', 'md:text-6xl');
                dom.scrollingName.classList.remove('text-xl');
                dom.langSelectorContainer.classList.remove('hidden');
            }

            // Back to Top Button
            dom.backToTopBtn.classList.toggle('visible', scrollPosition > 300);
        };

        const showModal = (link) => {
            state.isModalOpen = true;
            dom.modalProceedBtn.href = link;
            dom.orderModal.classList.remove('hidden');
            dom.orderModal.style.display = 'flex'; // Make it a flex container to center content
            setTimeout(() => {
                dom.orderModal.classList.remove('opacity-0');
                dom.modalContent.classList.remove('scale-95', 'opacity-0');
                dom.modalProceedBtn.focus();
            }, 10);
        };

        const hideModal = () => {
            state.isModalOpen = false;
            dom.orderModal.classList.add('opacity-0');
            dom.modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                dom.orderModal.classList.add('hidden');
                dom.orderModal.style.display = 'none';
            }, 300);
        };

        const updateDisplay = (shouldScroll = false) => {
            let productsToDisplay = [...state.allProducts];
            const lang = state.currentLang;
            const searchTerm = dom.searchInput.value.toLowerCase();

            // 1. Filter by Category
            const categoryKey = `Category_${lang}`;
            if (state.activeCategory !== 'All' && state.activeCategory !== 'الكل') {
                productsToDisplay = productsToDisplay.filter(p => (p[categoryKey] || p.Category) === state.activeCategory);
            }

            // 2. Filter by Search
            if (searchTerm) {
                productsToDisplay = productsToDisplay.filter(p => {
                    const name = (p[`Name_${lang}`] || p.Name || '').toLowerCase();
                    const description = (p[`Description_${lang}`] || p.Description || '').toLowerCase();

                    if (name.includes(searchTerm) || description.includes(searchTerm)) {
                        return true;
                    }

                    // Also search within options
                    return p.options.some(opt => {
                        const optionName = (lang === 'ar' ? opt.name_ar : opt.name).toLowerCase();
                        const optionInfo = (lang === 'ar' ? opt.info_ar : opt.info).toLowerCase();
                        return optionName.includes(searchTerm) || optionInfo.includes(searchTerm);
                    });
                });
            }

            // 3. Sort
            const sortValue = state.sortOption;
            if (sortValue === 'price-asc') {
                productsToDisplay.sort((a, b) => {
                    const priceA = parseFloat((a.options[0]?.price || '0').replace(/[^0-9.-]+/g, ""));
                    const priceB = parseFloat((b.options[0]?.price || '0').replace(/[^0-9.-]+/g, ""));
                    return priceA - priceB;
                });
            } else if (sortValue === 'price-desc') {
                productsToDisplay.sort((a, b) => {
                    const priceA = parseFloat((a.options[0]?.price || '0').replace(/[^0-9.-]+/g, ""));
                    const priceB = parseFloat((b.options[0]?.price || '0').replace(/[^0-9.-]+/g, ""));
                    return priceB - priceA;
                });
            } else if (sortValue === 'name-asc') {
                productsToDisplay.sort((a, b) => {
                    const nameA = a[`Name_${lang}`] || a.Name || '';
                    const nameB = b[`Name_${lang}`] || b.Name || '';
                    return nameA.localeCompare(nameB, lang === 'ar' ? 'ar-EG' : 'en-US');
                });
            }

            renderProducts(productsToDisplay);

            dom.noResultsMessage.classList.toggle('hidden', productsToDisplay.length > 0 || state.allProducts.length === 0);

            if (shouldScroll) {
                dom.productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        const setupCategoryFilters = () => {
            const lang = state.currentLang;
            const allCatText = translations[lang].all_category;
            const categoryKey = `Category_${lang}`;

            const uniqueCategories = [...new Set(state.allProducts.map(p => p[categoryKey] || p.Category).filter(Boolean))];
            const categories = [allCatText, ...uniqueCategories];

            dom.categoryFilters.innerHTML = '';

            categories.forEach(category => {
                const button = document.createElement('button');
                button.textContent = category;
                button.className = 'filter-btn px-4 py-2 text-sm font-semibold rounded-full transition-colors';

                const isActive = (category === state.activeCategory) || (category === allCatText && (state.activeCategory === 'All' || state.activeCategory === 'الكل'));
                if(isActive) button.classList.add('active');

                button.addEventListener('click', () => {
                    state.activeCategory = category;
                    storage.set('neurosub-category', category);
                    dom.categoryFilters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    updateDisplay(true);
                });
                dom.categoryFilters.appendChild(button);
            });
        };

        const renderProducts = (products) => {
            dom.productGrid.innerHTML = '';

            if (!products || products.length === 0) {
                if (dom.searchInput.value === '' && (state.activeCategory === 'All' || state.activeCategory === 'الكل')) {
                    // Show skeletons only on initial load
                    for (let i = 0; i < 4; i++) {
                        const skeleton = document.createElement('div');
                        skeleton.className = 'product-skeleton rounded-2xl animate-pulse overflow-hidden';
                        skeleton.innerHTML = `<div class="aspect-square w-full" style="background-color: var(--bg-tertiary);"></div><div class="p-4" style="background-color: var(--bg-secondary);"><div class="h-5 rounded w-3/4 mx-auto mb-3" style="background-color: var(--bg-tertiary);"></div><div class="h-3 rounded w-full mb-2" style="background-color: var(--bg-tertiary);"></div><div class="h-3 rounded w-5/6 mx-auto" style="background-color: var(--bg-tertiary);"></div><div class="h-9 rounded-lg mt-4 w-full" style="background-color: var(--accent-primary-glow); opacity: 0.5;"></div></div>`;
                        dom.productGrid.appendChild(skeleton);
                    }
                }
                return;
            }

            products.forEach(product => {
                if (product.Name && product.options.length > 0) {
                    dom.productGrid.appendChild(createProductCard(product));
                }
            });
        };

        const createProductCard = (product) => {
            const card = document.createElement('div');
            card.className = 'backdrop-blur-sm rounded-2xl flex flex-col card-hover-effect fade-in-card overflow-hidden relative';
            card.style.backgroundColor = 'var(--bg-secondary-translucent)';
            card.style.border = '1px solid var(--border-color)';

            const lang = state.currentLang;

            if (!product.options || product.options.length === 0) {
                return document.createDocumentFragment(); // Return empty if no options
            }

            const productName = product[`Name_${lang}`] || product.Name;
            const productDescription = product[`Description_${lang}`] || product.Description || '';
            const isOutOfStock = product.Status && product.Status.toLowerCase() === 'out of stock';
            const productSlug = product.Name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

            let statusBadge = '';
            if (product.Status) {
                const statusClass = 'status-' + product.Status.toLowerCase().replace(/ /g, '-');
                statusBadge = `<div class="status-badge ${statusClass}">${product.Status}</div>`;
            }

            // --- Price Range Logic ---
            const prices = product.options
                .map(opt => parseFloat(String(opt.price).replace(/[^0-9.]+/g, '')))
                .filter(p => !isNaN(p));

            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            // Extract currency symbol/text from the first price string
            const currency = (product.options[0]?.price || '').replace(/[0-9.,\s]/g, '');

            let priceDisplay;
            if (prices.length > 0) {
                if (minPrice === maxPrice) {
                    priceDisplay = `${minPrice} ${currency}`;
                } else {
                    priceDisplay = `${minPrice} - ${maxPrice} ${currency}`;
                }
            } else {
                  priceDisplay = 'N/A'; // Fallback if no valid prices
            }
            // --- End Price Range Logic ---

            const actionButtonHTML = isOutOfStock
                ? `<button disabled class="mt-auto bg-red-500 text-white font-bold py-3 px-4 rounded-lg w-full text-base cursor-not-allowed">${translations[lang].out_of_stock}</button>`
                : `<a href="product-details.html?id=${productSlug}" class="details-btn text-center mt-auto font-bold py-3 px-4 rounded-lg transition-colors w-full text-base block">${translations[lang].view_details}</a>`;

            card.innerHTML = `
                <div class="relative">
                    ${statusBadge}
                    <img src="${product.ImageURL}" alt="Image for ${productName}" loading="lazy" class="w-full aspect-square object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x400/0a0a0a/e5e7eb?text=Image';">
                </div>
                <div class="p-4 flex flex-col flex-grow text-center">
                    <h3 class="text-base md:text-lg font-bold" style="color: var(--text-primary);">${productName}</h3>
                    <p class="text-sm my-2 flex-grow" style="color: var(--text-secondary);">${productDescription}</p>

                    <p class="text-lg md:text-xl font-extrabold text-cyan-400 my-4">${priceDisplay}</p>

                    ${actionButtonHTML}
                </div>
            `;

            return card;
        };

        /**
         * Takes the raw JSON array from the fetch response and processes it
         * into the standard product format used by the application.
         */
        const processJsonData = (rawData) => {
            if (!Array.isArray(rawData)) {
                console.error("Data is not an array:", rawData);
                return [];
            }
            return rawData.map(p => ({ ...p })).filter(p => p && p.Name && p.options && p.options.length > 0);
        };

        const fetchData = async () => {
            renderProducts([]); // Show skeletons while fetching
            console.log("Fetching products from JSON file...");

            try {
                const response = await fetch(DATA_FILE_PATH);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const rawJsonData = await response.json();

                state.allProducts = processJsonData(rawJsonData);
                if (state.allProducts.length === 0) console.warn("JSON file might be empty or formatted incorrectly.");

                dom.errorMessage.classList.add('hidden');
                initAppWithData();

            } catch (error) {
                console.error("Could not load from JSON file:", error);
                const lang = state.currentLang;
                dom.errorMessage.innerHTML = `<strong>${translations[lang].error_title}</strong>${translations[lang].error_instructions}`;
                dom.errorMessage.classList.remove('hidden');

                // Clear products and update display to show no results
                state.allProducts = [];
                initAppWithData();
            }
        };

        const bindEvents = () => {
            window.addEventListener('scroll', debounce(handleScroll, 15));
            dom.themeToggleBtn.addEventListener('click', toggleTheme);
            dom.langSelectorContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn?.dataset.lang) setLanguage(btn.dataset.lang);
            });

            dom.modalCancelBtn.addEventListener('click', hideModal);
            dom.orderModal.addEventListener('click', (e) => { if (e.target === dom.orderModal) hideModal(); });
            dom.modalProceedBtn.addEventListener('click', () => setTimeout(hideModal, 200));

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.isModalOpen) hideModal();
            });

            dom.searchInput.addEventListener('input', debounce(() => {
                dom.clearSearchBtn.classList.toggle('hidden', !dom.searchInput.value);
                updateDisplay();
            }, 300));
            dom.clearSearchBtn.addEventListener('click', () => {
                dom.searchInput.value = '';
                dom.clearSearchBtn.classList.add('hidden');
                updateDisplay(true);
            });

            dom.sortOptions.addEventListener('change', (e) => {
                state.sortOption = e.target.value;
                storage.set('neurosub-sort', e.target.value);
                updateDisplay(true);
            });

            dom.backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.querySelector('.smooth-scroll').addEventListener('click', function(e) {
                e.preventDefault();
                dom.productsSection.scrollIntoView({ behavior: 'smooth' });
            });
        };

        const loadPreferences = () => {
            // UPDATED: Set 'ar' as the fallback language
            state.currentLang = storage.get('neurosub-lang', 'ar');
            state.activeCategory = storage.get('neurosub-category', 'All');
            state.sortOption = storage.get('neurosub-sort', 'default');
            dom.sortOptions.value = state.sortOption;
        };

        const initAppWithData = () => {
            setLanguage(state.currentLang, true);
            setupCategoryFilters();
            updateDisplay();
        };

        // --- INITIALIZATION ---
        const init = () => {
            loadPreferences();
            initTheme(); // Set theme early, based on saved preference or system setting
            bindEvents();
            handleScroll(); // Initial check
            fetchData(); // Fetch from JSON instead of Google Sheet
        };

        return { init };

    })();

    neurosubApp.init();
});
