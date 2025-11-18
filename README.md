# 🍔 Swiggy & Instamart Expense Tracker

A Chrome extension with React dashboard to track and analyze your Swiggy, Instamart, Dineout, and Genie expenses.

## 🌐 Live Demo

**Dashboard**: [https://adhishree.tech/swiggy-expense/](https://adhishree.tech/swiggy-expense/)

## 📸 Demo

![Swiggy Expense Tracker Demo](screenshots/demo.gif)

## ✨ Features

### Chrome Extension
- ✅ Auto-detects Swiggy login status
- ✅ Extracts order data from Swiggy API (all services)
- ✅ Supports pagination (fetches all orders)
- ✅ Beautiful popup UI with login indicator

### React Dashboard
- 📊 **4 Key Metrics Cards**
  - Total Spent
  - Total Orders
  - Total Savings (from coupons/discounts)
  - Delivery Fees Paid

- 📈 **Interactive Charts**
  - Monthly Spending Trend (Line Chart)
  - Orders per Month (Bar Chart)
  - Top Restaurants (Pie Chart)
  - Restaurant Breakdown Table

- 📋 **Recent Orders Table**
  - Order ID, Date, Restaurant, Amount, Status
  - Real-time data from Swiggy API

- 💾 **Excel Export**
  - Export all orders to Excel
  - Includes summary sheet with totals
  - Organized by order details

## 🚀 Quick Start

### 1. Install Extension
```bash
1. Open Chrome → chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. Pin extension to toolbar
```

### 2. Run React Dashboard
```bash
cd react-app
npm install
npm run dev
# Opens on http://localhost:5175
```

### 3. Use the Tracker
```bash
1. Login to swiggy.com
2. Click extension icon
3. Click "View Analytics Dashboard"
4. See your real expense data!
```

## 📊 What Data is Tracked

### All Swiggy Services
- 🍔 **Food Delivery** - Restaurant orders
- 🛒 **Instamart** - Grocery orders
- 🍽️ **Dineout** - Restaurant reservations
- 📦 **Genie** - Pickup/Errands

### Order Details
- Order ID, Date, Time
- Restaurant/Store name
- Total amount, Item total
- Delivery fees, Taxes
- Discounts & Savings
- Coupon codes used
- Payment method
- Order items with prices
- Order status

## 🔧 Technical Details

### Extension Stack
- **Manifest V3** Chrome Extension
- **JavaScript** for background workers
- **Chrome APIs**: cookies, storage, scripting
- **Fetch API** for Swiggy orders

### React App Stack
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **XLSX** for Excel export
- **Lucide React** for icons

### API Endpoint Used
```
https://www.swiggy.com/dapi/order/all?order_id={last_order_id}
```
- Returns all service orders (Food, Instamart, Dineout, Genie)
- Supports pagination
- Requires authentication cookies
- Returns last 1 year of orders

## 📁 Project Structure

```
├── extension/                 # Chrome Extension
│   ├── manifest.json         # Extension config
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Popup logic
│   ├── background.js        # API calls & data extraction
│   ├── content.js           # Page monitoring
│   └── icons/               # Extension icons
│
├── react-app/                # React Dashboard
│   ├── src/
│   │   ├── App.jsx          # Main dashboard component
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
├── api-explorer.js           # API endpoint discovery tool
├── instamart-api-explorer.js # Instamart API tester
├── SWIGGY-API-DOCS.md       # Complete API documentation
├── API-SUMMARY.md           # Quick API reference
└── TEST-EXTENSION.md        # Testing guide
```

## 🔍 API Documentation

### Discovered Endpoints
We've documented **19 Swiggy API endpoints**:
- ✅ 10 Working endpoints
- 📝 Complete request/response examples
- 🔑 Authentication details

See `SWIGGY-API-DOCS.md` for full documentation.

### API Explorer Tools
```bash
# Test all Swiggy APIs
node api-explorer.js

# Test Instamart-specific APIs
node instamart-api-explorer.js
```

## 💡 Features Breakdown

### Extension Features
- Login status detection via cookies
- Automatic data extraction with pagination
- Fetches up to 20 pages (~100-200 orders)
- Handles all Swiggy services automatically
- Error handling with fallback to sample data
- Beautiful UI with status indicators

### Dashboard Features
- Real-time data visualization
- 4 metric cards with key statistics
- 4 interactive charts
- Recent orders table (10 latest)
- Restaurant breakdown analysis
- Monthly spending trends
- Excel export with 2 sheets:
  - Detailed orders
  - Summary statistics

## 🎯 Use Cases

### Personal Finance
- Track monthly food expenses
- Analyze spending patterns
- Monitor coupon savings
- Compare Food vs Grocery spending

### Data Analysis
- Most ordered restaurants
- Average order value trends
- Peak ordering times/months
- Delivery fee analysis

### Budgeting
- Set spending limits
- Export to Excel for tax/expense reports
- Historical spending comparison
- Identify cost-saving opportunities

## ⚙️ Configuration

### Change React App Port
Edit `extension/popup.js`:
```javascript
const appUrl = 'http://localhost:5175'; // Change port here
```

Also update `extension/manifest.json`:
```json
"host_permissions": [
  "http://localhost:5175/*"  // Change port here
]
```

### Customize Data Fetching
Edit `extension/background.js`:
```javascript
const maxPages = 20; // Change max pages to fetch
```

## 🐛 Troubleshooting

### Extension shows "Not logged in"
- Solution: Login to swiggy.com first

### Dashboard shows sample data
- Solution: Make sure extension extracted data successfully
- Check extension console for errors
- Verify you clicked "View Analytics Dashboard"

### No orders showing
- You might not have orders in last 1 year
- Check browser console for errors
- Verify Swiggy account has order history

### Charts not loading
- Make sure React app is running on correct port
- Check browser console for errors
- Reload the page

## 📈 Statistics Available

### Financial Metrics
- Total amount spent
- Total savings from discounts
- Total delivery fees paid
- Average order value
- Orders with coupons count

### Ordering Patterns
- Monthly spending trends
- Orders per month
- Top 10 restaurants by spending
- Restaurant-wise order count
- Payment method preferences

### Data Insights
- Most ordered cuisines
- Platform usage (web/app)
- Order type distribution
- Time-based patterns

## 🔒 Privacy & Security

- ✅ All data stays local (no external servers)
- ✅ Uses browser's existing Swiggy session
- ✅ No data is uploaded or shared
- ✅ Open source - inspect the code
- ⚠️ Only for personal use
- ⚠️ Respect Swiggy's terms of service

## 📝 Notes

- Web API only returns **last 1 year** of orders
- Full history available in mobile app
- These are internal Swiggy APIs (not official)
- Endpoints may change without notice
- Use responsibly and don't abuse the API

## 🎉 Success!

You now have a complete expense tracking system for all your Swiggy services with:
- ✅ Real-time data extraction
- ✅ Beautiful visualizations
- ✅ Comprehensive analytics
- ✅ Excel export capability
- ✅ Support for all Swiggy services

## 🤝 Contributing

This is a personal project. Feel free to:
- Fork and modify for your needs
- Report issues
- Suggest improvements
- Share with friends

## 📄 License

This project is for educational and personal use only.

---

**Built with ❤️ using Chrome Extensions API, React, and Swiggy's internal APIs**

Last Updated: 2025-01-05


