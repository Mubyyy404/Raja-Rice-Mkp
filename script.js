// --- script.js (FINAL E-COMMERCE LOGIC) ---

// 1. WEB APP URL (Used for POST request to submit order)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyFqbr-xrafGiA4PIidqI-5cLmRyp0xnlJMLM-d2wA2dXYnsUyyr0CRYWUM4SCkGxq4aw/exec";

// --- STATE MANAGEMENT: Load/Save from localStorage ---

// Load cart and order code from localStorage or initialize new ones
let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
let orderCode = localStorage.getItem('currentOrderCode') || 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

// Utility function to save cart and order code
function saveCartState() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    localStorage.setItem('currentOrderCode', orderCode);
    updateCartCount();
}

// --- INITIALIZATION ---
window.onload = function() {
    updateCartCount();
    // Show offer popup
    document.getElementById('offerPopup').style.display = 'flex';
};

function closeOffer() {
    document.getElementById('offerPopup').style.display = 'none';
}

// --- CART OPERATIONS ---

// Add item to cart
function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });    
    }
    saveCartState();
}

// Update cart count (total quantity of items)
function updateCartCount() {
    let totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').innerText = totalQty;
}

// Open / close cart modal
function openCart() {
    if (cart.length === 0) {
        alert("Your cart is empty. Please add some products!");
        return;
    }
    updateCartTable();
    document.getElementById('orderCodeDisplay').value = orderCode;
    document.getElementById('codOrderCodeDisplay').innerText = orderCode;
    
    // Reset payment sections on open
    document.getElementById('upiSection').style.display = 'none';
    document.getElementById('codSection').style.display = 'none';
    document.getElementById('paymentStatus').innerText = '';
    document.getElementById('codStatus').innerText = '';
    // Uncheck payment radios
    document.querySelectorAll('input[name="payment"]').forEach(radio => radio.checked = false);

    document.getElementById('cartModal').style.display = 'flex';
}
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// Update cart table
function updateCartTable() {
    const tbody = document.querySelector('#cartTable tbody');
    tbody.innerHTML = '';
    let total = 0;
    
    cart.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i.name}</td>
            <td>₹${i.price}</td>
            <td>
                <button onclick="changeQty('${i.id}',-1)">-</button> 
                ${i.quantity} 
                <button onclick="changeQty('${i.id}',1)">+</button>
            </td>
            <td>₹${i.price * i.quantity}</td>
        `;
        tbody.appendChild(tr);
        total += i.price * i.quantity;
    });
    document.getElementById('totalAmount').innerText = 'Total: ₹' + total;
}

// Change quantity
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        // Remove item if quantity is zero or less
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    saveCartState();
    updateCartTable();
}

// --- CHECKOUT & ORDER PLACEMENT (NEW LOGIC) ---

// Toggle payment sections
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', e => {
        if (e.target.value === "UPI") {
            document.getElementById('upiSection').style.display = 'block';
            document.getElementById('codSection').style.display = 'none';
        } else {
            document.getElementById('upiSection').style.display = 'none';
            document.getElementById('codSection').style.display = 'block';
        }
    });
});

// UPI (Simulated Payment)
document.getElementById('payNowBtn').addEventListener('click', () => {
    placeOrder('UPI');
});
// COD button should also call placeOrder('COD')

// Final Order Placement function (Submits data to Google Sheet via POST)
function placeOrder(method) {
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // 1. Construct the final data object to send to the server
    const finalOrderData = {
        orderCode: orderCode, // The unique code generated earlier
        userEmail: document.getElementById('customerEmail') ? document.getElementById('customerEmail').value : 'N/A', // Assuming you have an email input
        total: total,
        payment: method,
        items: cart,
        timestamp: new Date().toISOString()
    };

    // Show processing message immediately
    const statusDiv = method === 'UPI' ? document.getElementById('paymentStatus') : document.getElementById('codStatus');
    statusDiv.innerText = `⏳ Submitting order to shop...`;

    // 2. SEND THE DATA TO THE GOOGLE SHEET VIA POST
    fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 3. Handle successful server submission
        if (data.status === "success") {
            // Save order details locally for the client's bill retrieval page (bill.js uses this!)
            // We use a different key ("latestOrder") now since we no longer track an "allOrders" array.
            localStorage.setItem("latestOrder", JSON.stringify(finalOrderData)); 
            
            // 4. Clear cart and generate NEW code for the next transaction
            cart = [];
            orderCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            saveCartState(); // Saves the empty cart and new order code
            
            // 5. Update status display
            statusDiv.innerText = `✅ Order Placed! Code: ${data.orderCode}. Admin approval required for bill generation.`;

        } else {
            // Server responded with custom error
            statusDiv.innerText = `❌ Failed to place order: ${data.message}`;
        }
    })
    .catch(error => {
        // Connection error
        console.error('Error submitting order:', error);
        statusDiv.innerText = `❌ Connection Error: Could not reach the shop server.`;
    });
}

// --- SEARCH FUNCTIONALITY ---
function filterProducts() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        if (name.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
