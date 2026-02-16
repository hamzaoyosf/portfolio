document.addEventListener('DOMContentLoaded', () => {

    window.back = () => window.history.back();

    // ==========================================
    // PART 1: TYPEWRITER ANIMATION (RESTORED)
    // ==========================================

    const el = document.getElementById("typewriter");

    // Check if the element exists to prevent errors
    if (el) {
        const suffixes = [
            "a QA Analyst",
            "ChatBot/LLM Tester",
            "Accessibility Tester",
            "Errors Hunter",
            "UX Tester",
        ];

        let index = 0;
        let isDeleting = false;
        let text = "";

        // SPEED SETTINGS
        const speeds = {
            typing: 70,    // Typing speed
            deleting: 40,  // Deleting speed
            pause: 2000    // Pause at end of word
        };

        function type() {
            const currentFullText = suffixes[index];

            if (isDeleting) {
                text = currentFullText.substring(0, text.length - 1);
            } else {
                text = currentFullText.substring(0, text.length + 1);
            }

            el.textContent = text;

            let currentDelay = isDeleting ? speeds.deleting : speeds.typing;

            if (!isDeleting && text === currentFullText) {
                // Pause when word is complete
                isDeleting = true;
                currentDelay = speeds.pause;
            } else if (isDeleting && text === "") {
                // Move to next word immediately
                isDeleting = false;
                index = (index + 1) % suffixes.length;
                currentDelay = 100;
            }

            setTimeout(type, currentDelay);
        }

        // Start the loop
        type();
    }


    // ==========================================
    // PART 2: ACCESSIBLE MODALS (POP-UPS)
    // ==========================================

    /* --- HELPER: CALCULATE AGE --- */
    function updateAge(popupContext) {
        const ageSpan = popupContext.querySelector(".age");
        if (!ageSpan) return;

        const birthDate = new Date(1999, 3, 15);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthdayThisYear =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

        if (!hasHadBirthdayThisYear) {
            calculatedAge--;
        }
        ageSpan.textContent = calculatedAge;
    }

    /* --- CORE: MODAL HANDLER --- */
    let isModalBusy = false;

    function setupModalTrigger(triggerId, modalId) {
        const triggerBtn = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const mainPage = document.getElementById('main-page');

        if (!triggerBtn || !modal) return;

        const closeBtn = modal.querySelector('.close-button button');

        triggerBtn.addEventListener('click', function () {
            if (isModalBusy) return;
            isModalBusy = true;

            // 1. PLAY LOADING ANIMATION
            const styleId = `style-${triggerId}`;
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @keyframes loading-${triggerId} {
                    100% {
                        stroke: #55ff00;
                        stroke-dasharray: ${triggerId === 'profile-picture' ? '10' : '8'};
                        transform: rotate(210deg);
                    }
                }
                #${triggerId} .svg-circle {
                    animation: loading-${triggerId} 1500ms ease-in-out;
                }
            `;
            document.head.appendChild(style);
            triggerBtn.classList.add('dynamic-class');

            // 2. OPEN MODAL AFTER ANIMATION
            setTimeout(() => {
                // Remove animation style
                const existingStyle = document.getElementById(styleId);
                if (existingStyle) existingStyle.remove();

                // Show Modal
                modal.classList.add('active');
                mainPage.classList.remove('active');

                // Accessibility updates
                mainPage.setAttribute('aria-hidden', 'true');
                modal.setAttribute('aria-hidden', 'false');
                triggerBtn.setAttribute('aria-expanded', 'true');

                // Update dynamic content
                updateAge(modal);

                // Focus management
                if (closeBtn) closeBtn.focus();
                modal.addEventListener('keydown', trapFocus);

                // 3. START SKILLS ANIMATIONS IF IT'S THE SKILLS POP-UP
                if (modalId === 'my-skills-pop-up') {
                    animateBusinessSkills(modal);
                }

                // 4. START STORIES IF IT'S THE STORIES POP-UP
                if (modalId === 'story-pop-up') {
                    startStories();
                }

            }, 1200);
        });

        function animateBusinessSkills(popup) {
            const skills = popup.querySelectorAll('.business-skill');
            const circumference = 2 * Math.PI * 54; // r=54

            skills.forEach((skill, index) => {
                const target = parseInt(skill.getAttribute('data-target'));
                const progressCircle = skill.querySelector('.progress');
                const percentText = skill.querySelector('.business-skills-percentage');

                // Reset state
                progressCircle.style.strokeDashoffset = circumference;
                percentText.textContent = '0';

                // Delay each skill slightly for a staggered effect
                setTimeout(() => {
                    // Animate Circle
                    const offset = circumference - (target / 100) * circumference;
                    progressCircle.style.strokeDashoffset = offset;

                    // Animate Number
                    let currentNum = 0;
                    const duration = 1500; // Match CSS transition
                    const increment = target / (duration / 16); // ~60fps

                    const counter = setInterval(() => {
                        currentNum += increment;
                        if (currentNum >= target) {
                            percentText.textContent = target;
                            clearInterval(counter);
                        } else {
                            percentText.textContent = Math.floor(currentNum);
                        }
                    }, 16);
                }, index * 150);
            });
        }

        // 3. CLOSE LOGIC
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Close on Escape key
        modal.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        function closeModal() {
            modal.classList.remove('active');
            mainPage.classList.add('active');

            mainPage.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-hidden', 'true');
            triggerBtn.setAttribute('aria-expanded', 'false');

            modal.removeEventListener('keydown', trapFocus);
            triggerBtn.focus();

            if (modalId === 'story-pop-up') {
                stopStories();
            }

            window.back();
            isModalBusy = false;
        }
    }

    /* --- FOCUS TRAP (ACCESSIBILITY) --- */
    function trapFocus(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        if (!isTabPressed) return;

        const modal = e.currentTarget;
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    // --- INITIALIZE ALL TRIGGERS ---
    setupModalTrigger('profile-picture', 'story-pop-up');
    setupModalTrigger('about-me', 'about-me-pop-up');
    setupModalTrigger('my-work', 'my-work-pop-up');
    setupModalTrigger('my-skills', 'my-skills-pop-up');

    // --- INFINITE LOGO SWIPE (JS DUPLICATION) ---
    const toolsContent = document.querySelector('.tools-content');
    if (toolsContent) {
        const logos = toolsContent.querySelector('.logos');
        // Duplicate multiple times to ensure the screen is always filled
        for (let i = 0; i < 5; i++) {
            const clone = logos.cloneNode(true);
            toolsContent.appendChild(clone);
        }
    }

    // --- STORIES LOGIC ---
    let storiesData = [
        { type: 'image', url: 'Media/Images/story.jpg', duration: 5000 },
        // { type: 'image', url: 'Media/Images/CSVJSON.jpg', duration: 5000 },
        // { type: 'image', url: 'Media/Images/DNChecker.jpg', duration: 5000 },
        // { type: 'image', url: 'Media/Images/hamzaoyosf-about-me-img.png', duration: 5000 }
    ];

    async function fetchStoriesFromNotion() {
        // const NOTION_ID = "30938f129e8180a7a01ff74ec2c42cb3";
        const API_URL = `https://notion-api.splitbee.io/v1/table/30938f129e8180a7a01ff74ec2c42cb3`;

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch stories");
            const data = await response.json();

            // Transform Notion data to our format
            const transformedData = data
                .filter(item => item.Status === "Published")
                .map(item => ({
                    type: (item.Type || 'image').toLowerCase(),
                    url: (item.Media && item.Media.length > 0) ? item.Media[0].url : '',
                    text: item.TextContent || '',
                    duration: item.Duration || 5000
                }));

            if (transformedData.length > 0) {
                storiesData = transformedData;
                console.log("Stories updated from Notion:", storiesData);
            }
        } catch (error) {
            console.error("Notion Fetch Error:", error);
            // Fallback to hardcoded storiesData already defined
        }
    }

    // Fetch stories on load
    fetchStoriesFromNotion();

    let currentStoryIndex = 0;
    let storyTimer = null;
    let storyStartTime = null;
    let storyDuration = 5000;
    let isStoryPaused = false;

    const storiesViewer = document.getElementById('stories-viewer');
    const storyImg = document.getElementById('current-story-img');
    const storyVid = document.getElementById('current-story-vid');
    const storyText = document.getElementById('current-story-text');
    const progressBarsContainer = document.getElementById('story-progress-bars');
    const prevBtn = document.getElementById('story-prev');
    const nextBtn = document.getElementById('story-next');

    function startStories() {
        currentStoryIndex = 0;
        setupProgressBars();
        showStory(currentStoryIndex);
    }

    function setupProgressBars() {
        progressBarsContainer.innerHTML = '';
        storiesData.forEach((_, index) => {
            const barBg = document.createElement('div');
            barBg.className = 'progress-bar-bg';
            const barFill = document.createElement('div');
            barFill.className = 'progress-bar-fill';
            barBg.appendChild(barFill);
            progressBarsContainer.appendChild(barBg);
        });
    }

    function showStory(index) {
        if (index < 0 || index >= storiesData.length) {
            closeStoryPopup();
            return;
        }

        currentStoryIndex = index;
        const story = storiesData[index];
        storyDuration = story.duration || 5000;

        // Reset Media visibility via class on storiesViewer
        storiesViewer.className = 'stories-viewer type-' + story.type;

        // Handle Media Loading
        if (story.type === 'video') {
            storyVid.src = story.url;
            storyVid.currentTime = 0;
            storyVid.play().catch(e => console.log("Video play error:", e));
        } else if (story.type === 'image') {
            storyImg.src = story.url;
            storyVid.pause();
        } else if (story.type === 'text') {
            storyText.textContent = story.text;
            storyVid.pause();
        }

        // Update progress bars state
        const bars = progressBarsContainer.querySelectorAll('.progress-bar-fill');
        bars.forEach((bar, i) => {
            if (i < index) {
                bar.style.width = '100%';
                bar.style.transition = 'none';
            } else if (i === index) {
                bar.style.width = '0%';
                bar.style.transition = 'none';
                // Trigger reflow
                bar.offsetHeight;
                bar.style.transition = `width ${storyDuration}ms linear`;
                bar.style.width = '100%';
            } else {
                bar.style.width = '0%';
                bar.style.transition = 'none';
            }
        });

        clearTimeout(storyTimer);
        storyTimer = setTimeout(nextStory, storyDuration);
    }

    function nextStory() {
        if (currentStoryIndex < storiesData.length - 1) {
            showStory(currentStoryIndex + 1);
        } else {
            closeStoryPopup();
        }
    }

    function prevStory() {
        if (currentStoryIndex > 0) {
            showStory(currentStoryIndex - 1);
        } else {
            showStory(0); // Restart first story
        }
    }

    function stopStories() {
        clearTimeout(storyTimer);
        storyVid.pause();
        const bars = progressBarsContainer.querySelectorAll('.progress-bar-fill');
        bars.forEach(bar => {
            bar.style.width = '0%';
            bar.style.transition = 'none';
        });
    }

    function closeStoryPopup() {
        const modal = document.getElementById('story-pop-up');
        const closeBtn = modal.querySelector('.close-button button');
        if (closeBtn) closeBtn.click();
    }

    if (prevBtn) prevBtn.addEventListener('click', prevStory);
    if (nextBtn) nextBtn.addEventListener('click', nextStory);

    // Pause functionality (optional but good)
    if (storyImg) {
        storyImg.addEventListener('mousedown', () => {
            clearTimeout(storyTimer);
            const activeBar = progressBarsContainer.querySelectorAll('.progress-bar-fill')[currentStoryIndex];
            if (activeBar) {
                const computedStyle = window.getComputedStyle(activeBar);
                activeBar.style.width = computedStyle.width;
                activeBar.style.transition = 'none';
            }
        });

        storyImg.addEventListener('mouseup', () => {
            // For simplicity, just restart current story from where it was or just next
            // Real implementation would track remaining time. Let's just resume with next for now or restart.
            showStory(currentStoryIndex);
        });
    }

    // --- READ MORE LOGIC ---
    document.querySelectorAll('.read-more-btn').forEach(button => {
        button.addEventListener('click', function () {
            const project = this.closest('.project');
            project.classList.toggle('expanded');

            // Update button text
            if (project.classList.contains('expanded')) {
                this.textContent = 'Show Less';
                this.style.border = '1px solid #ac0000ff';
            } else {
                this.textContent = 'Read More';
                this.style.border = 'solid #008f07 1px';
            }
        });
    });
});

