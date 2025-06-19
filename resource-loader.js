/**
 * TATIL Resource Loader
 * Mobile-optimized resource loader for TATIL Insurance Raters
 * 
 * This file implements progressive loading strategies based on 
 * connection speed detection to optimize performance on mobile data
 */

class TATILResourceLoader {
    constructor() {
        this.resources = [];
        this.loadedResources = 0;
        this.errors = 0;
        this.connectionType = 'unknown';
        this.effectiveType = '4g';
        this.timeoutDuration = 15000; // Default timeout: 15 seconds
        this.maxRetries = 3;
        this.cdnBase = 'https://cdn.jsdelivr.net/gh/Kelsean868/TATILraters@main/';
        this.localBase = './';
        this.useCDN = true;
        this.offlineMode = false;

        // Resource definitions for the application
        this.coreResources = [
            { type: 'script', path: 'js/rater-core.min.js', loaded: false, required: true, retries: 0 },
            { type: 'style', path: 'css/rater-styles.min.css', loaded: false, required: true, retries: 0 }
        ];

        this.secondaryResources = [
            { type: 'script', path: 'js/motor-rater.min.js', loaded: false, required: false, retries: 0 },
            { type: 'script', path: 'js/property-rater.min.js', loaded: false, required: false, retries: 0 },
            { type: 'script', path: 'js/marine-rater.min.js', loaded: false, required: false, retries: 0 },
            { type: 'script', path: 'js/liability-rater.min.js', loaded: false, required: false, retries: 0 },
            { type: 'style', path: 'css/themes.min.css', loaded: false, required: false, retries: 0 }
        ];

        this.enhancementResources = [
            { type: 'script', path: 'js/animations.min.js', loaded: false, required: false, retries: 0 },
            { type: 'script', path: 'js/analytics.min.js', loaded: false, required: false, retries: 0 },
            { type: 'script', path: 'js/charts.min.js', loaded: false, required: false, retries: 0 }
        ];
    }

    /**
     * Initialize the resource loader
     */
    initialize() {
        // Display loading screen
        this.updateLoadingStatus('Initializing resource loader...');

        // First, check online status
        if (!navigator.onLine) {
            this.offlineMode = true;
            this.updateLoadingStatus('Working offline. Loading cached resources...');
            this.setupOfflineListeners();
        }

        // Detect connection capabilities
        this.detectConnection().then(() => {
            // Set timeout duration based on connection type
            this.adjustForConnectionSpeed();

            // Prepare resources list based on connection speed
            this.prepareResourcesList();

            // Start loading resources
            this.updateLoadingStatus('Loading essential resources...');
            this.loadNextBatch();
        });
    }

    /**
     * Detect connection capabilities
     */
    async detectConnection() {
        return new Promise((resolve) => {
            // Use Network Information API if available
            if ('connection' in navigator) {
                const connection = navigator.connection;
                this.connectionType = connection.type || 'unknown';
                this.effectiveType = connection.effectiveType || '4g';
                this.downlink = connection.downlink || 10;
                this.rtt = connection.rtt || 50;

                // Setup event listener for connection changes
                connection.addEventListener('change', this.handleConnectionChange.bind(this));

                this.updateConnectionIndicator();
                this.updateLoadingStatus(`Connection detected: ${this.effectiveType} (${this.downlink} Mbps)`);

                resolve();
            } else {
                // Fallback: Use performance timing to estimate connection
                const startTime = performance.now();

                // Load a tiny resource to test connection speed
                fetch(this.getResourceUrl('ping.json'))
                    .then(response => response.json())
                    .then(() => {
                        const endTime = performance.now();
                        const duration = endTime - startTime;

                        // Estimate connection type based on response time
                        if (duration < 100) {
                            this.effectiveType = '4g';
                            this.downlink = 10;
                        } else if (duration < 500) {
                            this.effectiveType = '3g';
                            this.downlink = 1.5;
                        } else {
                            this.effectiveType = 'slow-2g';
                            this.downlink = 0.5;
                        }

                        this.updateConnectionIndicator();
                        this.updateLoadingStatus(`Connection estimated: ${this.effectiveType}`);

                        resolve();
                    })
                    .catch(() => {
                        // Assume slowest connection if test fails
                        this.effectiveType = 'slow-2g';
                        this.downlink = 0.5;
                        this.updateConnectionIndicator();
                        this.updateLoadingStatus('Connection test failed, assuming slow connection');

                        resolve();
                    });
            }
        });
    }

    /**
     * Handle connection changes
     */
    handleConnectionChange() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.connectionType = connection.type || 'unknown';
            this.effectiveType = connection.effectiveType || '4g';
            this.downlink = connection.downlink || 10;
            this.rtt = connection.rtt || 50;

            this.updateConnectionIndicator();

            // Adjust loading strategy if connection speed changes significantly
            this.adjustForConnectionSpeed();
        }
    }

    /**
     * Update the connection indicator UI
     */
    updateConnectionIndicator() {
        const indicator = document.getElementById('connectionIndicator');
        const connectionText = document.getElementById('connectionText');

        if (indicator && connectionText) {
            // Remove all existing classes
            indicator.classList.remove('connection-slow', 'connection-medium', 'connection-fast');

            // Set text and class based on connection type
            if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
                connectionText.textContent = `Slow Connection (${this.effectiveType})`;
                indicator.classList.add('connection-slow');
            } else if (this.effectiveType === '3g') {
                connectionText.textContent = `Medium Connection (${this.effectiveType})`;
                indicator.classList.add('connection-medium');
            } else {
                connectionText.textContent = `Fast Connection (${this.effectiveType})`;
                indicator.classList.add('connection-fast');
            }

            indicator.style.display = 'block';
        }
    }

    /**
     * Adjust settings based on connection speed
     */
    adjustForConnectionSpeed() {
        // Set timeout durations based on connection speed
        if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
            this.timeoutDuration = 30000; // 30 seconds for very slow connections
            this.useCDN = true; // Always use CDN for slow connections
        } else if (this.effectiveType === '3g') {
            this.timeoutDuration = 20000; // 20 seconds for 3G
            this.useCDN = true;
        } else {
            this.timeoutDuration = 15000; // 15 seconds for 4G and better
            this.useCDN = true;
        }
    }

    /**
     * Prepare the resources list based on connection speed
     */
    prepareResourcesList() {
        // Always load core resources
        this.resources = [...this.coreResources];

        // For 3G and better, add secondary resources
        if (this.effectiveType !== 'slow-2g' && this.effectiveType !== '2g') {
            this.resources = [...this.resources, ...this.secondaryResources];
        }

        // For 4G and better, add enhancement resources
        if (this.effectiveType === '4g' || this.effectiveType === '5g') {
            this.resources = [...this.resources, ...this.enhancementResources];
        }
    }

    /**
     * Get the appropriate URL for a resource (CDN or local)
     */
    getResourceUrl(path) {
        return this.useCDN ? this.cdnBase + path : this.localBase + path;
    }

    /**
     * Load the next batch of resources
     */
    loadNextBatch() {
        const unloadedResources = this.resources.filter(resource => !resource.loaded);

        if (unloadedResources.length === 0) {
            // All resources are loaded
            this.finishLoading();
            return;
        }

        // For slow connections, load resources sequentially
        if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
            // Find the first unloaded resource
            const resource = unloadedResources[0];
            this.loadResource(resource);
        } else {
            // For faster connections, load resources in parallel
            unloadedResources.forEach(resource => {
                this.loadResource(resource);
            });
        }
    }

    /**
     * Load a single resource with timeout and error handling
     */
    loadResource(resource) {
        const url = this.getResourceUrl(resource.path);

        // Update loading status
        this.updateLoadingStatus(`Loading: ${resource.path.split('/').pop()}`);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Loading ${resource.path} timed out after ${this.timeoutDuration}ms`));
            }, this.timeoutDuration);
        });

        // Create element based on resource type
        let element;
        if (resource.type === 'script') {
            element = document.createElement('script');
            element.src = url;
            element.async = true;
        } else if (resource.type === 'style') {
            element = document.createElement('link');
            element.rel = 'stylesheet';
            element.href = url;
        }

        // Create the loading promise
        const loadPromise = new Promise((resolve, reject) => {
            element.onload = () => {
                resource.loaded = true;
                this.loadedResources++;
                resolve();
            };

            element.onerror = (error) => {
                reject(error);
            };

            document.head.appendChild(element);
        });

        // Race the loading against the timeout
        Promise.race([loadPromise, timeoutPromise])
            .catch(error => {
                console.error(`Error loading ${resource.path}:`, error);

                // Increment retry count
                resource.retries++;

                if (resource.retries < this.maxRetries) {
                    // If using CDN and it failed, try local fallback
                    if (this.useCDN) {
                        console.log(`Retrying ${resource.path} with local fallback`);
                        this.useCDN = false;
                        this.loadResource(resource);
                    } else {
                        console.log(`Retrying ${resource.path} (attempt ${resource.retries + 1}/${this.maxRetries})`);
                        setTimeout(() => {
                            this.loadResource(resource);
                        }, 1000); // Wait 1 second before retrying
                    }
                } else if (resource.required) {
                    // If a required resource fails after all retries, show error
                    this.errors++;
                    this.showError(`Failed to load required resource: ${resource.path}`);
                } else {
                    // Non-required resources can be skipped
                    console.warn(`Skipping non-essential resource: ${resource.path}`);
                    resource.loaded = true;
                    this.loadNextBatch();
                }
            })
            .then(() => {
                // If all resources are loaded, finish
                if (this.resources.every(r => r.loaded)) {
                    this.finishLoading();
                } else if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
                    // For slow connections, continue loading sequentially
                    this.loadNextBatch();
                }
            });
    }

    /**
     * Finish the loading process and initialize the app
     */
    finishLoading() {
        this.updateLoadingStatus('Finalizing...');

        // Short delay to ensure all scripts are evaluated
        setTimeout(() => {
            // Hide loading screen
            document.getElementById('loadingScreen').style.display = 'none';

            // Show main content
            document.getElementById('mainContent').style.display = 'block';

            // Initialize the application
            if (typeof window.initTATILRaters === 'function') {
                window.initTATILRaters();
            } else {
                console.error('TATIL Raters initialization function not found');
                this.showError('Application initialization failed');
            }

            // Preload secondary resources if they weren't loaded initially
            this.preloadRemainingResources();
        }, 500);
    }

    /**
     * Preload remaining resources after the app is initialized
     */
    preloadRemainingResources() {
        // For slow connections, preload secondary resources
        if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
            const remainingResources = [
                ...this.secondaryResources,
                ...this.enhancementResources
            ].filter(r => !this.resources.some(loaded => loaded.path === r.path));

            // Add these to the resources list with lower priority
            this.resources = [...this.resources, ...remainingResources];
            this.loadNextBatch();
        }
    }

    /**
     * Update the loading status displayed to the user
     */
    updateLoadingStatus(message) {
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingStatus) {
            loadingStatus.textContent = message;
        }
    }

    /**
     * Show error message to the user
     */
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const loadingScreen = document.getElementById('loadingScreen');

        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.style.display = 'block';

            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } else {
            alert(`Error: ${message}`);
        }
    }

    /**
     * Setup offline/online event listeners
     */
    setupOfflineListeners() {
        window.addEventListener('online', () => {
            this.offlineMode = false;
            document.getElementById('offlineIndicator').style.display = 'none';

            // Reload any resources that failed when offline
            const failedResources = this.resources.filter(r => !r.loaded);
            if (failedResources.length > 0) {
                failedResources.forEach(resource => {
                    resource.retries = 0; // Reset retry counter
                    this.loadResource(resource);
                });
            }
        });

        window.addEventListener('offline', () => {
            this.offlineMode = true;
            document.getElementById('offlineIndicator').style.display = 'block';
        });
    }
}
