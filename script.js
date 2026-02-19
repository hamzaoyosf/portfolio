document.addEventListener('DOMContentLoaded', () => {

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
    let activeModalCloseFn = null;

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

                // PUSH STATE FOR BACK BUTTON
                history.pushState({ modalId: modalId }, "");
                activeModalCloseFn = closeModal;

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
            closeBtn.addEventListener('click', () => {
                history.back(); // Triggers popstate
            });
        }

        // Close on Escape key
        modal.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') history.back();
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

            activeModalCloseFn = null;
            isModalBusy = false;
        }
    }

    // Handle back button / history navigation
    window.addEventListener('popstate', (event) => {
        if (activeModalCloseFn) {
            activeModalCloseFn();
        }
    });

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
        { type: 'image', url: 'Media/Images/story.jpg', duration: 5000 }
    ];

    // Single source for hardcoded stories to avoid duplication
    const DEFAULT_STORIES = [...storiesData];

    async function fetchStoriesFromNotion() {
        try {
            const response = await fetch('/api/stories');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            const transformedData = await response.json();

            if (transformedData && transformedData.length > 0) {
                storiesData = transformedData;
                console.log("Successfully synced stories from API:", storiesData);
            }
        } catch (error) {
            console.error("Notion API Fetch Error:", error.message);
            console.log("Falling back to local storiesData.");
            storiesData = DEFAULT_STORIES;
        }
    }

    // Fetch stories on load
    fetchStoriesFromNotion();

    let currentStoryIndex = 0;
    let storyTimer = null;
    let storyDuration = 5000;
    let isStoryPaused = false;
    let pressStartTime = 0;
    let pauseTimeout = null;

    const storiesViewer = document.getElementById('stories-viewer');
    const storyImg = document.getElementById('current-story-img');
    const storyVid = document.getElementById('current-story-vid');
    const storyText = document.getElementById('current-story-text');
    const progressBarsContainer = document.getElementById('story-progress-bars');
    const prevBtn = document.getElementById('story-prev');
    const nextBtn = document.getElementById('story-next');
    const muteToggle = document.getElementById('story-mute-toggle');
    const pauseIndicator = document.getElementById('story-pause-indicator');

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
        isStoryPaused = false;
        storiesViewer.classList.remove('paused');

        // Reset Media visibility
        storiesViewer.className = 'stories-viewer type-' + story.type;

        const startTimer = (duration) => {
            storyDuration = duration;
            storyStartTime = Date.now();
            updateProgressBars(index, duration);
            clearTimeout(storyTimer);
            storyTimer = setTimeout(nextStory, duration);
        };

        if (story.type === 'video') {
            storyVid.src = story.url;
            storyVid.currentTime = 0;

            // Audio by default
            storyVid.muted = false;
            updateMuteUI();

            storyVid.play().catch(e => {
                console.log("Video play error (possibly blocked audio):", e);
                // If blocked by browser, we might need to fallback to muted to at least show the video
                if (e.name === 'NotAllowedError') {
                    storyVid.muted = true;
                    updateMuteUI();
                    storyVid.play();
                }
            });

            // Dynamic duration for video
            if (storyVid.readyState >= 1) { // metadata already loaded
                startTimer(storyVid.duration * 1000);
            } else {
                storyVid.onloadedmetadata = () => {
                    startTimer(storyVid.duration * 1000);
                };
            }
        } else {
            if (story.type === 'image') {
                storyImg.src = story.url;
            } else if (story.type === 'text') {
                storyText.textContent = story.text;
            }
            storyVid.pause();
            startTimer(story.duration || 5000);
        }
    }

    function updateProgressBars(index, duration, remaining = null) {
        const bars = progressBarsContainer.querySelectorAll('.progress-bar-fill');
        bars.forEach((bar, i) => {
            if (i < index) {
                bar.style.width = '100%';
                bar.style.transition = 'none';
            } else if (i === index) {
                if (remaining !== null) {
                    // Resuming
                    bar.style.transition = `width ${remaining}ms linear`;
                    bar.style.width = '100%';
                } else {
                    // Starting fresh
                    bar.style.width = '0%';
                    bar.style.transition = 'none';
                    bar.offsetHeight; // Reflow
                    bar.style.transition = `width ${duration}ms linear`;
                    bar.style.width = '100%';
                }
            } else {
                bar.style.width = '0%';
                bar.style.transition = 'none';
            }
        });
    }

    function togglePause(pause) {
        if (pause && !isStoryPaused) {
            isStoryPaused = true;
            storiesViewer.classList.add('paused');
            clearTimeout(storyTimer);

            // Calculate elapsed time
            const elapsed = Date.now() - storyStartTime;
            storyDuration -= elapsed;

            // Freeze progress bar
            const activeBar = progressBarsContainer.querySelectorAll('.progress-bar-fill')[currentStoryIndex];
            if (activeBar) {
                const computedWidth = window.getComputedStyle(activeBar).width;
                activeBar.style.width = computedWidth;
                activeBar.style.transition = 'none';
            }

            if (storiesData[currentStoryIndex].type === 'video') storyVid.pause();
        } else if (!pause && isStoryPaused) {
            isStoryPaused = false;
            storiesViewer.classList.remove('paused');

            storyStartTime = Date.now();
            updateProgressBars(currentStoryIndex, null, storyDuration);
            storyTimer = setTimeout(nextStory, storyDuration);

            if (storiesData[currentStoryIndex].type === 'video') storyVid.play().catch(() => { });
        }
    }

    function toggleMute() {
        storyVid.muted = !storyVid.muted;
        updateMuteUI();
    }

    function updateMuteUI() {
        const icon = document.getElementById('mute-icon-svg');
        if (icon) {
            icon.querySelector('.unmuted').style.display = storyVid.muted ? 'none' : 'block';
            icon.querySelector('.muted').style.display = storyVid.muted ? 'block' : 'none';
        }
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

    // Single click/tap handler for navigation areas
    const handleNavClick = (direction) => {
        const pressDuration = Date.now() - pressStartTime;
        if (pressDuration < 200) { // Only navigate if it was a short tap
            if (direction === 'next') nextStory();
            else prevStory();
        }
    };

    if (prevBtn) prevBtn.addEventListener('click', () => handleNavClick('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => handleNavClick('next'));

    if (muteToggle) muteToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
    });

    // Hold to Pause Logic
    const startPause = (e) => {
        if (e.target.closest('#story-mute-toggle')) return;
        pressStartTime = Date.now();

        // Delay pause activation slightly to avoid flicker on taps
        pauseTimeout = setTimeout(() => {
            togglePause(true);
        }, 150);
    };

    const endPause = () => {
        clearTimeout(pauseTimeout);
        if (isStoryPaused) {
            togglePause(false);
        }
    };

    storiesViewer.addEventListener('mousedown', startPause);
    storiesViewer.addEventListener('mouseup', endPause);
    storiesViewer.addEventListener('mouseleave', endPause);
    storiesViewer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) startPause(e);
    }, { passive: true });
    storiesViewer.addEventListener('touchend', endPause);

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

