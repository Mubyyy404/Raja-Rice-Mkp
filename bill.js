// --- bill.js ---

// ⚠️ IMPORTANT: REPLACE THIS URL with your deployed Web App URL!
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzPTxPe48-udI8qaj3e93qZ4lsQOuANZN4cljrXFZjLtqBVipieq9Y5lyLsQ_Mbi8v21g/exec"; 

// Function to fetch the approved codes from the Google Sheet API
async function fetchApprovedCodes() {
    try {
        const response = await fetch(https://script.google.com/macros/s/AKfycbzPTxPe48-udI8qaj3e93qZ4lsQOuANZN4cljrXFZjLtqBVipieq9Y5lyLsQ_Mbi8v21g/exec); 
        if (!response.ok) {
            throw new Error('Failed to fetch central approved codes.');
        }
        return response.json(); // Returns the array of codes from the sheet
    } catch (error) {
        console.error("Error fetching approved codes:", error);
        return []; 
    }
}

// Main Bill Fetch Function
async function fetchBill() {
    const code = document.getElementById('enterCode').value.trim().toUpperCase();
    const billStatus = document.getElementById('billStatus');
    
    // 1. Fetch the order details saved locally when the client placed the order
    const allOrders = JSON.parse(localStorage.getItem("allOrders")) || [];
    const orderToBill = allOrders.find(order => order.code === code);
    
    // Reset display
    document.getElementById('billContainer').style.display = 'none';
    document.getElementById('downloadBtn').style.display = 'none';

    if (!orderToBill) {
        billStatus.className = 'bill-status';
        billStatus.innerText = "❌ Error: Order code not found. Please ensure you've placed the order on this device.";
        return;
    }

    billStatus.innerText = "⏳ Checking approval status...";
    
    // 2. Fetch the APPROVED codes from the shared Google Sheet API
    const approvedCodes = await fetchApprovedCodes();

    if (approvedCodes.includes(code)) {
        billStatus.className = 'bill-status status-message';
        billStatus.innerText = "✅ Order approved! Generating bill...";
        generateBill(orderToBill); 
    } else {
        billStatus.className = 'bill-status';
        billStatus.innerText = "🕒 Order is awaiting admin approval. Please try again later.";
    }
}

// Function to generate and display the bill
function generateBill(order) {
    const billDiv = document.getElementById('billContainer');
    billDiv.style.display = 'block';

    let itemsHTML = '<table><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr>';
    
    order.items.forEach(i => {
        itemsHTML += `<tr><td>${i.name}</td><td>₹${i.price}</td><td>${i.quantity}</td><td>₹${i.price * i.quantity}</td></tr>`;
    });
    itemsHTML += '</table>';

    billDiv.innerHTML = `
        <h3>Raja Rice & Grocery - Final Bill</h3>
        ${itemsHTML}
        <p class="cart-total"><strong>Payment Method:</strong> ${order.payment}</p>
        <p class="cart-total"><strong>Total Amount:</strong> ₹${order.total}</p>
        <p class="cart-total"><strong>Order Code:</strong> ${order.code}</p>
        <p style="text-align:center; margin-top:20px;">*Thank you for shopping with us!*</p>
    `;
    document.getElementById('downloadBtn').style.display = 'inline-block';
}

// PDF Download
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const billElement = document.getElementById('billContainer');
    
    html2canvas(billElement, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps= doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`RajaRice_Bill_${document.getElementById('enterCode').value.trim()}.pdf`);
    });
}
