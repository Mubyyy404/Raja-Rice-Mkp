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
    // Optional: Show a brief confirmation message/animation
    // alert(`${name} added to cart!`);
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

// --- CHECKOUT & ORDER PLACEMENT ---

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

// Final Order Placement function
function placeOrder(method) {
    // 1. Create the order object
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const order = {
        code: orderCode,
        items: cart,
        total: total,
        payment: method,
        timestamp: new Date().toISOString()
    };

    // 2. Save the order to localStorage (in a dedicated 'allOrders' array)
    let orders = JSON.parse(localStorage.getItem('allOrders')) || [];
    // Only add if the order code doesn't already exist
    if (!orders.some(o => o.code === orderCode)) {
        orders.push(order);
    }
    localStorage.setItem('allOrders', JSON.stringify(orders));

    // 3. Display status and reset for a new order
    if (method === 'UPI') {
        document.getElementById('paymentStatus').innerText = `✅ Order Placed! Code: ${orderCode}. Admin approval required for bill generation.`;
    } else {
        document.getElementById('codStatus').innerText = `✅ COD Order Placed! Code: ${orderCode}. Awaiting admin approval to process.`;
    }

    // 4. Clear the current cart and generate a NEW order code for the next transaction
    cart = [];
    orderCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    saveCartState(); 
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
