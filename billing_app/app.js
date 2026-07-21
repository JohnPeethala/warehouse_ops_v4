document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        items: [
            { id: 1, desc: 'General Service', count: 1, repairCharges: 500, visitCharges: 250 },
            { id: 2, desc: 'Part Replacement', count: 2, repairCharges: 1200, visitCharges: 0 }
        ]
    };

    // DOM Elements
    const form = document.getElementById('invoice-form');
    const itemsList = document.getElementById('items-list');
    const addItemBtn = document.getElementById('add-item-btn');
    const printBtn = document.getElementById('print-btn');
    const templateSelector = document.getElementById('template-selector');
    
    // Inputs
    const inputs = {
        bizName: document.getElementById('biz-name'),
        bizAddress: document.getElementById('biz-address'),
        bizContact: document.getElementById('biz-contact'),
        custName: document.getElementById('cust-name'),
        custAddress: document.getElementById('cust-address'),
        invoiceDate: document.getElementById('invoice-date'),
        invoiceNumber: document.getElementById('invoice-number'),
    };

    // Set default date to today
    inputs.invoiceDate.valueAsDate = new Date();
    
    // Render the input list
    function renderInputItems() {
        itemsList.innerHTML = '';
        state.items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <input type="text" placeholder="Description" value="${item.desc}" data-id="${item.id}" data-field="desc" style="flex: 2; min-width: 150px;">
                <input type="number" placeholder="Count" value="${item.count}" min="1" data-id="${item.id}" data-field="count" style="flex: 1; min-width: 70px;">
                <input type="number" placeholder="Repair Chg" value="${item.repairCharges}" min="0" step="0.01" data-id="${item.id}" data-field="repairCharges" style="flex: 1; min-width: 90px;">
                <input type="number" placeholder="Visit Chg" value="${item.visitCharges}" min="0" step="0.01" data-id="${item.id}" data-field="visitCharges" style="flex: 1; min-width: 90px;">
                <button type="button" class="remove-btn" data-id="${item.id}">✕</button>
            `;
            itemsList.appendChild(row);
        });

        // Add event listeners to new inputs/buttons
        itemsList.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', handleItemInput);
        });
        itemsList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeItem(parseInt(e.target.dataset.id)));
        });
        
        updatePreview();
    }

    // Handle Excel Paste
    itemsList.addEventListener('paste', (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedData = clipboardData.getData('Text');
        
        // If it has tabs, it's likely from Excel/Spreadsheet
        if (pastedData && pastedData.includes('\t')) {
            e.preventDefault();
            
            const rows = pastedData.trim().split('\n');
            let startId = state.items.length > 0 ? Math.max(...state.items.map(i => i.id)) + 1 : 1;
            
            const newItems = [];
            rows.forEach(row => {
                const cols = row.split('\t');
                if (cols.length > 0 && cols[0].trim() !== '') { // Ensure it's not a completely empty row
                    newItems.push({
                        id: startId++,
                        desc: cols[0]?.trim() || '',
                        count: parseInt(cols[1]) || 1,
                        repairCharges: parseFloat(cols[2]) || 0,
                        visitCharges: parseFloat(cols[3]) || 0
                    });
                }
            });
            
            if (newItems.length > 0) {
                // If the user pasted into an empty default row, we can optionally clear it, but appending is safest.
                state.items.push(...newItems);
                renderInputItems();
            }
        }
    });

    // Handle input change on items
    function handleItemInput(e) {
        const id = parseInt(e.target.dataset.id);
        const field = e.target.dataset.field;
        const val = e.target.value;
        
        const item = state.items.find(i => i.id === id);
        if (item) {
            item[field] = field === 'desc' ? val : Number(val);
            updatePreview(); // Update instantly
        }
    }

    // Add new item
    addItemBtn.addEventListener('click', () => {
        const newId = state.items.length > 0 ? Math.max(...state.items.map(i => i.id)) + 1 : 1;
        state.items.push({ id: newId, desc: '', count: 1, repairCharges: 0, visitCharges: 0 });
        renderInputItems();
    });

    // Remove item
    function removeItem(id) {
        state.items = state.items.filter(i => i.id !== id);
        renderInputItems();
    }

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    }

    // Format date
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }

    // Generate Preview HTML
    function updatePreview() {
        let subtotal = 0;
        
        const itemsHtml = state.items.map(item => {
            const total = (item.repairCharges || 0) + (item.visitCharges || 0);
            subtotal += total;
            return `
                <tr>
                    <td>${item.desc || '<em>Item description</em>'}</td>
                    <td>${item.count || 0}</td>
                    <td>${formatCurrency(item.repairCharges || 0)}</td>
                    <td>${formatCurrency(item.visitCharges || 0)}</td>
                    <td>${formatCurrency(total)}</td>
                </tr>
            `;
        }).join('');

        const previewHtml = `
            <div class="invoice-header">
                <div class="invoice-branding" style="max-width: 60%;">
                    <h1>${inputs.bizName.value || 'Business Name'}</h1>
                    <p>${inputs.bizAddress.value || 'Address'}</p>
                    <p>${inputs.bizContact.value || 'Contact'}</p>
                </div>
                <div class="invoice-meta">
                    <h2>INVOICE</h2>
                    <div class="meta-grid">
                        <span class="meta-label">Invoice #</span>
                        <span class="meta-value">${inputs.invoiceNumber.value || 'Draft'}</span>
                        
                        <span class="meta-label">Date</span>
                        <span class="meta-value">${formatDate(inputs.invoiceDate.value) || 'Today'}</span>
                    </div>
                </div>
            </div>

            <div class="bill-to">
                <h3>Bill To:</h3>
                <div class="customer-name">${inputs.custName.value || 'Customer Name'}</div>
                <p style="max-width: 60%;">${inputs.custAddress.value || 'Customer Address'}</p>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Product Count</th>
                        <th>Repair Charges</th>
                        <th>Visit Charges</th>
                        <th>Amount Payable</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                <!-- Additional rows for tax/discount can be added here if needed in future -->
                <div class="total-row grand-total">
                    <span>Amount Payable</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
            </div>
        `;

        const currentTemplate = templateSelector ? templateSelector.value : 'template-classic';
        const previewElement = document.getElementById('invoice-preview');
        
        previewElement.innerHTML = previewHtml;
        previewElement.className = `invoice-paper ${currentTemplate}`;
        
        // Also update the print container
        document.getElementById('print-container').innerHTML = `
            <div class="invoice-paper ${currentTemplate}">
                ${previewHtml}
            </div>
        `;
    }

    // Listen to form inputs for live updates
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', updatePreview);
    });
    
    if(templateSelector) {
        templateSelector.addEventListener('change', updatePreview);
    }

    // Handle Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Initial render
    renderInputItems();
});
