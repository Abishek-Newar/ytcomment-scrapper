document.addEventListener('DOMContentLoaded', function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const fetchButton = document.getElementById('fetchButton');
  const resultDiv = document.getElementById('result');

  fetchButton.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value;
    
    if (!apiUrl) {
      resultDiv.textContent = 'Please enter an API URL';
      return;
    }

    try {
      fetchButton.disabled = true;
      fetchButton.textContent = 'Loading...';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      resultDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      resultDiv.textContent = `Error: ${error.message}`;
    } finally {
      fetchButton.disabled = false;
      fetchButton.textContent = 'Fetch Data';
    }
  });
});