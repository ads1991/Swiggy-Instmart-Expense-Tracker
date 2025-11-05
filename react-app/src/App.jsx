import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Download, RefreshCw, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';

function App() {
  const [ordersData, setOrdersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedService, setSelectedService] = useState('all'); // all, food, instamart, dineout, genie

  useEffect(() => {
    loadOrdersData();
  }, []);

  const loadOrdersData = async () => {
    try {
      // Method 1: Check URL hash (passed from extension)
      const hash = window.location.hash;
      if (hash && hash.startsWith('#data=')) {
        console.log('🔵 Loading data from URL hash');
        const dataString = hash.substring(6); // Remove '#data='
        const data = JSON.parse(decodeURIComponent(dataString));
        console.log('✅ Data loaded from URL:', data);
        console.log('📊 Total orders:', data.orders?.length || 0);
        console.log('🔖 Data source:', data.source);
        processOrders(data);
        return;
      }

      // Method 2: Try to get data from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');

      if (dataParam) {
        console.log('🔵 Loading data from URL parameter');
        const data = JSON.parse(decodeURIComponent(dataParam));
        console.log('✅ Data loaded:', data);
        processOrders(data);
        return;
      }

      // Method 3: Try localStorage (data passed from extension)
      const storedData = localStorage.getItem('swiggyOrdersData');
      if (storedData) {
        console.log('🔵 Loading data from localStorage');
        const data = JSON.parse(storedData);
        console.log('✅ Data loaded:', data);
        processOrders(data);
        localStorage.removeItem('swiggyOrdersData');
        return;
      }

      // Method 4: Fallback to sample data
      console.log('⚠️ No real data found, using sample data');
      console.log('💡 To see real data:');
      console.log('   1. Make sure you are logged in to Swiggy');
      console.log('   2. Click the extension icon');
      console.log('   3. Click "View Analytics Dashboard"');
      loadSampleData();
    } catch (error) {
      console.error('❌ Error loading data:', error);
      loadSampleData();
    }
  };

  const loadSampleData = () => {
    const restaurants = ['Pizza Hut', 'Dominos', 'KFC', 'McDonalds', 'Burger King', 'Subway', 'Starbucks', 'Cafe Coffee Day', 'Haldirams', 'Barbeque Nation'];
    const orders = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      const amount = Math.floor(Math.random() * 800) + 150;

      orders.push({
        id: `ORD${1000 + i}`,
        date: orderDate.toISOString(),
        restaurant: restaurants[Math.floor(Math.random() * restaurants.length)],
        amount: amount,
        items: [{ name: 'Item 1', price: amount }],
        status: 'delivered',
        paymentMethod: Math.random() > 0.5 ? 'Online' : 'COD'
      });
    }

    processOrders({ orders });
  };

  const processOrders = (data) => {
    if (!data || !data.orders) {
      loadSampleData();
      return;
    }

    setOrdersData(data);
    calculateStats(data.orders);
    setLoading(false);
  };

  const calculateStats = (allOrders) => {
    // Filter orders based on selected service
    let orders = allOrders;
    if (selectedService !== 'all') {
      orders = allOrders.filter(order => {
        const type = (order.orderType || '').toLowerCase();
        if (selectedService === 'food') {
          return type === 'delivery' || type === '' || !type;
        }
        return type === selectedService;
      });
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate savings and additional stats
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
    const totalDeliveryFees = orders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const ordersWithCoupons = orders.filter(order => order.couponApplied).length;

    // Service breakdown
    const serviceBreakdown = {
      food: allOrders.filter(o => {
        const type = (o.orderType || '').toLowerCase();
        return type === 'delivery' || type === '' || !type;
      }).length,
      instamart: allOrders.filter(o => (o.orderType || '').toLowerCase() === 'instamart').length,
      dineout: allOrders.filter(o => (o.orderType || '').toLowerCase() === 'dineout').length,
      genie: allOrders.filter(o => (o.orderType || '').toLowerCase() === 'genie').length
    };

    const monthlyData = groupByMonth(orders);
    const restaurantData = groupByRestaurant(orders);
    const itemData = groupByItems(orders);
    const recentOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

    setStats({
      totalSpent,
      totalOrders,
      avgOrderValue,
      totalDiscount,
      totalDeliveryFees,
      ordersWithCoupons,
      serviceBreakdown,
      monthlyData,
      restaurantData,
      itemData,
      recentOrders
    });
  };

  // Recalculate stats when service filter changes
  useEffect(() => {
    if (ordersData && ordersData.orders) {
      calculateStats(ordersData.orders);
    }
  }, [selectedService]);

  const groupByMonth = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const date = new Date(order.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: monthName, amount: 0, orders: 0 };
      }
      grouped[monthKey].amount += order.amount;
      grouped[monthKey].orders += 1;
    });

    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
  };

  const groupByRestaurant = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      if (!grouped[order.restaurant]) {
        grouped[order.restaurant] = { name: order.restaurant, amount: 0, orders: 0 };
      }
      grouped[order.restaurant].amount += order.amount;
      grouped[order.restaurant].orders += 1;
    });

    return Object.values(grouped).sort((a, b) => b.amount - a.amount).slice(0, 10);
  };

  const groupByItems = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemName = item.name;
          if (!grouped[itemName]) {
            grouped[itemName] = { name: itemName, count: 0, totalSpent: 0 };
          }
          grouped[itemName].count += parseInt(item.quantity) || 1;
          grouped[itemName].totalSpent += parseFloat(item.price) * (parseInt(item.quantity) || 1);
        });
      }
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 10);
  };

  const exportToExcel = () => {
    if (!ordersData || !ordersData.orders) return;

    const worksheet = XLSX.utils.json_to_sheet(
      ordersData.orders.map(order => ({
        'Order ID': order.id,
        'Date': new Date(order.date).toLocaleDateString(),
        'Restaurant': order.restaurant,
        'Amount': order.amount,
        'Status': order.status,
        'Payment Method': order.paymentMethod || 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const summaryData = [
      { Metric: 'Total Orders', Value: stats.totalOrders },
      { Metric: 'Total Spent', Value: `₹${stats.totalSpent.toFixed(2)}` },
      { Metric: 'Average Order Value', Value: `₹${stats.avgOrderValue.toFixed(2)}` }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    XLSX.writeFile(workbook, `Swiggy_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const COLORS = ['#fc8019', '#ff6b35', '#f7931e', '#ffa500', '#ff8c00', '#ff7f50'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Swiggy Expense Tracker</h1>
          <p className="text-gray-600">Analyze your food delivery expenses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-800">₹{stats.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Average Order</p>
                <p className="text-3xl font-bold text-gray-800">₹{stats.avgOrderValue.toFixed(0)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Restaurants</p>
                <p className="text-3xl font-bold text-gray-800">{stats.restaurantData?.length || 0}</p>
              </div>
              <MapPin className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Spending Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#fc8019" strokeWidth={2} name="Amount (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Orders per Month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Restaurants</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.restaurantData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {stats.restaurantData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurant Breakdown</h2>
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Restaurant</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Orders</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.restaurantData.map((restaurant, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-800">{restaurant.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{restaurant.orders}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                        ₹{restaurant.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🍕 Most Ordered Items</h2>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item Name</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Times Ordered</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {stats.itemData && stats.itemData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {item.count}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                      ₹{item.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order History ({stats.recentOrders.length} orders)</h2>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Restaurant</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order, index) => {
                  const orderType = (order.orderType || 'delivery').toLowerCase();
                  const serviceBadge = {
                    'instamart': { emoji: '🛒', text: 'Instamart', color: 'bg-green-100 text-green-800' },
                    'dineout': { emoji: '🍽️', text: 'Dineout', color: 'bg-purple-100 text-purple-800' },
                    'genie': { emoji: '📦', text: 'Genie', color: 'bg-blue-100 text-blue-800' },
                    'delivery': { emoji: '🍔', text: 'Food', color: 'bg-orange-100 text-orange-800' }
                  };
                  const badge = serviceBadge[orderType] || serviceBadge['delivery'];

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-mono">{order.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${badge.color} inline-flex items-center gap-1`}>
                          <span>{badge.emoji}</span>
                          <span>{badge.text}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{order.restaurant}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                        ₹{order.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={exportToExcel}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
