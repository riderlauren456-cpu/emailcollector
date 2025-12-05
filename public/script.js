document.getElementById('collectorForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const consent = document.getElementById('consent').checked;
    const btn = document.getElementById('submitBtn');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Lütfen geçerli bir e-posta adresi giriniz.');
        return;
    }

    if (!consent) {
        alert('Devam etmek için lütfen KVKK metnini onaylayın.');
        return;
    }

    btn.textContent = 'İşleniyor...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, email, consent })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirect;
        } else {
            alert(data.message || 'Bir şeyler ters gitti.');
            btn.textContent = 'Hemen Eriş';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Sunucuya bağlanılamadı.');
        btn.textContent = 'Hemen Eriş';
        btn.disabled = false;
    }
});
