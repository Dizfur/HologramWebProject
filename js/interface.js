        const ws = new WebSocket('ws://192.168.0.222:3000'); // Connect to WebSocket server
        let selectedVideo = ''; // Variable to hold the selected video
		let selectedIcon = null; // Variable to keep track of the selected icon
		
        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

		function toggleIcon(iconElement, type, video) {
			// Check if the clicked icon is already selected
			if (selectedIcon === iconElement) {
				// Unselect the icon
				selectedIcon.classList.remove('selected'); // Remove selected class
				selectedIcon = null; // Clear the selected icon
				document.getElementById('preview-box').innerHTML = `<div class="default-preview"><p>Welcome to Hologram Projection Interface.</p><p>Select an energy type to preview details here.</p></div>`;
				selectedVideo = ''; // Clear the selected video
			} else {
				// Select the new icon
				if (selectedIcon) {
					selectedIcon.classList.remove('selected'); // Deselect the previously selected icon
				}
				selectedIcon = iconElement; // Set the new selected icon
				selectedIcon.classList.add('selected'); // Add selected class

				// Show the preview for the selected energy type
				showPreview(type, video);
			}
		}

        function showPreview(type, video) {
            const previewBox = document.getElementById('preview-box');
            let content = '';

            if (type === 'solar') {
                content = `
                    <h3>Solar Energy</h3>
                    <p>Solar energy is a renewable power source that harnesses the sun's energy. 
                    It is environmentally friendly, reduces carbon emissions, and is widely used for homes and industrial applications.</p>
					<p>The energy the sun provides to Earth for just one hour could meet the global energy demand for an entire year!</p> 
					<p>Fun Fact: Solar panels can last up to 25 years!</p>
                `;
            } else if (type === 'wind') {
                content = `
                    <h3>Wind Energy</h3>
                    <p>Wind energy converts the kinetic energy of moving air into electricity using wind turbines. 
                    <p> It is sustainable and produces no greenhouse gases during operation.</p>
                    <p> Wind turbines can reach heights of over 260 feet, which is taller than most skyscrapers.</p>
                    <p> A single modern wind turbine can generate enough electricity to power over 1,000 homes for a year</p>
                    <p>Did You Know? The largest wind turbine can power 1,400 homes!</p>
                `;
            } else if (type === 'hydropower') {
                content = `
                    <h3>Hydropower</h3>
                    <p>Hydropower generates electricity by harnessing the flow of water in rivers or dams.</p> 
                    <p> It is reliable and provides a significant portion of global renewable energy.</p>
                    <p>Hydropower is one of the oldest sources of energy, dating back to Ancient Greece, where water wheels were used to grind grain.</p>
                    <p>The Three Gorges Dam in China is the largest hydropower plant in the world, capable of producing 22,500 MW of power.</p>
                    <p>Interesting Fact: Hydropower accounts for 16% of global electricity production.</p>
                `;
            } else if (type === 'geothermal') {
                content = `
                    <h3>Geothermal Energy</h3>
                    <p> Geothermal energy is heat within the earth. The word geothermal comes from the Greek words geo (earth) and therme (heat).</p>
                    <p> Geothermal energy is a renewable energy source because heat is continuously produced inside the earth.</p>
					<p> We have about 100 geothermal locations in Malaysia</p>
                    <p> 60 in Peninsular Malaysia and more than 20 in the Sabah and Sarawak regions in East  Malaysia.</p>
                    <p> Majority of the geothermal sites in Malaysia are non-volcanic in origin</p>
                `;
            }

            previewBox.innerHTML = content;
            selectedVideo = video; // Set the selected video based on user interaction
        }

		function playAnimation() {
			if (selectedVideo) {
				// Send a message to all connected clients to play the selected video
				const message = {
					action: 'play',
					video: selectedVideo // The path to the video file
				};
				const jsonmessage = JSON.stringify(message);
				console.log(jsonmessage);
				ws.send(jsonmessage);

				// Update last played video info
				const lastPlayedInfo = document.getElementById('last-played-info');
				lastPlayedInfo.innerHTML = `${selectedVideo.split('/').pop()}`; // Extracts the video filename from the path
			} else {
				alert('Please select an energy type first.');
			}
		}

        function zoomInOut() {
            alert('Zoom functionality will be implemented here.');
        }
		
        function generateReport() {
            // Show the report modal
            document.getElementById('report-modal').style.display = 'flex';
        }

        function closeReportModal() {
            // Close the report modal
            document.getElementById('report-modal').style.display = 'none';
        }