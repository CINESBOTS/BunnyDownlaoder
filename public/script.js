document.addEventListener('DOMContentLoaded', () => {
    // Configuration form
    const configForm = document.getElementById('configForm');
    const configStatus = document.getElementById('configStatus');
    const fillDefaultValues = document.getElementById('fillDefaultValues');
    const libraryIdInput = document.getElementById('libraryId');
    const accessKeyInput = document.getElementById('accessKey');
    const collectionInput = document.getElementById('collection');
    
    // Video fetcher elements
    const fetchButton = document.getElementById('fetchVideos');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfoSpan = document.getElementById('pageInfo');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    let currentPage = 1;
    const itemsPerPage = 100;
    let totalPages = 1;

    // Load saved credentials from localStorage if they exist
    function loadSavedCredentials() {
        const savedCredentials = localStorage.getItem('bunnyCdnCredentials');
        if (savedCredentials) {
            try {
                const credentials = JSON.parse(savedCredentials);
                libraryIdInput.value = credentials.libraryId || '';
                accessKeyInput.value = credentials.accessKey || '';
                collectionInput.value = credentials.collection || '';
            } catch (error) {
                console.error('Error loading saved credentials:', error);
            }
        }
    }
    
    // Load saved credentials on page load
    loadSavedCredentials();
    
    // Fill form with default values
    fillDefaultValues.addEventListener('click', (e) => {
        e.preventDefault();
        libraryIdInput.value = '391954';
        accessKeyInput.value = '10ebd9a0-af89-4244-ba0bffee63ee-e9c5-4409';
        collectionInput.value = 'de812570-9819-411a-b993-c4dee56a6ed4';
    });
    
    // Handle configuration form submission
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const credentials = {
            libraryId: libraryIdInput.value.trim(),
            accessKey: accessKeyInput.value.trim(),
            collection: collectionInput.value.trim()
        };
        
        // Validate inputs
        if (!credentials.libraryId || !credentials.accessKey) {
            configStatus.textContent = 'Error: Library ID and Access Key are required';
            configStatus.className = 'status error';
            return;
        }
        
        try {
            // Save to localStorage
            localStorage.setItem('bunnyCdnCredentials', JSON.stringify(credentials));
            
            configStatus.textContent = 'Configuration saved successfully!';
            configStatus.className = 'status success';
            
            // Hide the success message after 3 seconds
            setTimeout(() => {
                configStatus.className = 'hidden';
            }, 3000);
            
        } catch (error) {
            configStatus.textContent = `Error: ${error.message}`;
            configStatus.className = 'status error';
        }
    });
    
    // Video fetcher functionality
    fetchButton.addEventListener('click', () => fetchVideos(currentPage));
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchVideos(currentPage);
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchVideos(currentPage);
        }
    });
    
    async function fetchVideos(page) {
        try {
            // Get credentials from localStorage
            const savedCredentials = localStorage.getItem('bunnyCdnCredentials');
            if (!savedCredentials) {
                throw new Error('API credentials not configured. Please set them in the configuration section.');
            }
            
            const credentials = JSON.parse(savedCredentials);
            
            if (!credentials.libraryId || !credentials.accessKey) {
                throw new Error('Invalid API credentials. Please check your configuration.');
            }
            
            // Show loading indicator
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            resultsDiv.innerHTML = '';
            
            // Fetch videos from our API
            const queryParams = new URLSearchParams({
                page,
                libraryId: credentials.libraryId,
                accessKey: credentials.accessKey
            });
            
            if (credentials.collection) {
                queryParams.append('collection', credentials.collection);
            }
            
            const response = await fetch(`/api/videos?${queryParams.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Hide loading indicator
            loadingDiv.classList.add('hidden');
            
            // Calculate total pages
            if (data.totalItems) {
                totalPages = Math.ceil(data.totalItems / itemsPerPage);
            }
            
            // Update pagination controls
            updatePagination();
            
            // Display results
            displayVideos(data);
            
        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = `Error: ${error.message}`;
            console.error('Error:', error);
        }
    }
    
    function displayVideos(data) {
        if (!data.items || data.items.length === 0) {
            resultsDiv.innerHTML = '<p>No videos found.</p>';
            return;
        }
        
        const videoGrid = document.createElement('div');
        videoGrid.className = 'video-grid';
        
        // Format date function
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };
        
    
        
        // Add JSON output
        const jsonOutput = document.createElement('pre');
        jsonOutput.style.marginTop = '20px';
        jsonOutput.style.padding = '10px';
        jsonOutput.style.backgroundColor = '#f5f5f5';
        jsonOutput.style.overflow = 'auto';
        jsonOutput.textContent = JSON.stringify(data, null, 2);
        
        resultsDiv.appendChild(jsonOutput);
    }
    
    function updatePagination() {
        pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
    }
    
    function formatDuration(seconds) {
        if (!seconds) return 'N/A';
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '0 MB';
        
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        return `${mb} MB`;
    }
});
