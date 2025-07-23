async function fetchAuthRequest() {
    try {
        const response = await fetch('/api/sign-in');
        const authRequest = await response.json();
        
        // Create Universal Link
        const linkData = `iden3comm://?i_m=${btoa(JSON.stringify(authRequest))}`;
        
        // Create button for Universal Link
        const button = document.createElement('a');
        button.href = linkData;
        button.className = 'verify-button';
        button.textContent = 'Verify with Privado ID';
        document.getElementById('universal-link-button').appendChild(button);
        
        // Generate QR Code
        const qrCodeContainer = document.getElementById('qr-code');
        qrCodeContainer.innerHTML = ''; // Clear previous QR code if any
        new QRCode(qrCodeContainer, linkData);
        console.log('QR Code generated successfully!');
        
    } catch (error) {
        console.error('Error fetching auth request:', error);
    }
}

// Load when page loads
document.addEventListener('DOMContentLoaded', fetchAuthRequest);