document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchVideos');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfoSpan = document.getElementById('pageInfo');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    
    let currentPage = 1;
    const itemsPerPage = 12;
    let totalPages = 1;
    
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
            // Show loading indicator
            loadingDiv.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            resultsDiv.innerHTML = '';
            
            // Fetch videos from our API
            const response = await fetch(`/api/videos?page=${page}&itemsPerPage=${itemsPerPage}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
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
            errorDiv.textContent = `Error fetching videos: ${error.message}`;
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
        
        // Create video cards
        data.items.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            
            const thumbnailUrl = video.thumbnailUrl || 'https://via.placeholder.com/280x160?text=No+Thumbnail';
            
            videoCard.innerHTML = `
                <img src="${thumbnailUrl}" alt="${video.title}" class="thumbnail">
                <div class="video-info">
                    <div class="video-title">${video.title || 'Untitled'}</div>
                    <div class="video-meta">
                        <div>Date: ${formatDate(video.dateUploaded)}</div>
                        <div>Length: ${formatDuration(video.length)}</div>
                        <div>Storage: ${formatFileSize(video.storageSize)}</div>
                    </div>
                </div>
            `;
            
            videoGrid.appendChild(videoCard);
        });
        
        resultsDiv.appendChild(videoGrid);
        
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