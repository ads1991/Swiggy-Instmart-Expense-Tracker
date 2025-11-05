// Background service worker for the extension

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLogin') {
    checkSwiggyLogin().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'extractOrders') {
    extractOrdersData().then(sendResponse);
    return true; // Keep channel open for async response
  }
});

// Check if user is logged in to Swiggy by making an API call
async function checkSwiggyLogin() {
  try {
    // Make actual API call to verify login status
    const response = await fetch('https://www.swiggy.com/dapi/order/all?order_id=', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        '__fetch_req__': 'true'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return { isLoggedIn: false };
    }

    const data = await response.json();

    // Check if the response indicates user is logged in
    // If not logged in, Swiggy returns statusCode 401 or no data
    if (data.statusCode === 401 || data.statusCode === 403) {
      return { isLoggedIn: false };
    }

    // Check if we have valid order data (indicates logged in)
    const hasOrders = data?.data?.orders !== undefined;

    return { isLoggedIn: hasOrders };
  } catch (error) {
    console.error('Error checking login:', error);
    return { isLoggedIn: false, error: error.message };
  }
}

// Fetch user profile data from Swiggy
async function fetchUserProfile() {
  try {
    const response = await fetch('https://www.swiggy.com/dapi/restaurants/list/v5?lat=12.9715987&lng=77.5945627', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        '__fetch_req__': 'true'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      // Extract user info from response if available
      if (data?.data?.cards) {
        const userCard = data.data.cards.find(card => card?.card?.card?.userInfo);
        if (userCard) {
          return userCard.card.card.userInfo;
        }
      }
    }

    // Try account endpoint
    const accountResponse = await fetch('https://www.swiggy.com/dapi/order/all?order_id=', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        '__fetch_req__': 'true'
      },
      credentials: 'include'
    });

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      if (accountData?.data?.user) {
        return accountData.data.user;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Extract orders data from Swiggy API with pagination
async function extractOrdersData() {
  try {
    const allOrders = [];
    let lastOrderId = '';
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 20; // Limit to prevent infinite loops (20 pages = ~100-200 orders)
    let userProfile = null;

    // Get all cookies for authentication
    const cookies = await chrome.cookies.getAll({ domain: '.swiggy.com' });

    if (cookies.length === 0) {
      console.log('No cookies found, using sample data');
      throw new Error('Not logged in to Swiggy');
    }

    // Build cookie string
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    console.log('Using cookies for authentication:', cookies.map(c => c.name).join(', '));

    // Fetch user profile first
    userProfile = await fetchUserProfile();

    // Fetch orders with pagination
    while (hasMore && pageCount < maxPages) {
      const apiUrl = `https://www.swiggy.com/dapi/order/all?order_id=${lastOrderId}`;

      console.log(`📡 Fetching from: ${apiUrl}`);
      console.log(`🔑 Using ${cookies.length} cookies`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          '__fetch_req__': 'true'
        },
        credentials: 'include'
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        console.error('❌ API response not OK:', response.status);
        console.error('Response text:', await response.text());
        break;
      }

      const data = await response.json();
      console.log('✅ Swiggy API response:', data);

      if (!data || !data.data) {
        console.error('❌ Invalid response structure:', data);
        break;
      }

      // Check if we have orders in the response
      if (data && data.data && data.data.orders && data.data.orders.length > 0) {
        const orders = data.data.orders;

        // Log sample order to inspect structure
        if (pageCount === 0 && orders.length > 0) {
          console.log('📦 Sample order structure:', orders[0]);
          console.log('🏷️ Order type field:', orders[0].order_type);
          console.log('🏪 Restaurant type:', orders[0].restaurant_type);
          console.log('📋 All order keys:', Object.keys(orders[0]));
        }

        // Parse and add orders with comprehensive data
        orders.forEach(order => {
          // Handle different date formats
          let orderDate;
          try {
            if (order.order_time) {
              // Check if it's already in milliseconds or seconds
              const timestamp = order.order_time.toString().length > 10 ? order.order_time : order.order_time * 1000;
              orderDate = new Date(timestamp).toISOString();
            } else if (order.pg_response_time) {
              orderDate = new Date(order.pg_response_time).toISOString();
            } else {
              orderDate = new Date().toISOString();
            }
          } catch (e) {
            console.warn('Date parsing error for order:', order.order_id, e);
            orderDate = new Date().toISOString();
          }

          allOrders.push({
            id: order.order_id || order.order_number || `ORD_${allOrders.length}`,
            date: orderDate,
            deliveryTime: order.delivery_time_in_seconds || null,
            restaurant: order.restaurant_name || 'Unknown',
            restaurantId: order.restaurant_id || null,
            restaurantCity: order.restaurant_city_name || order.restaurant_area_name || '',
            cuisine: order.restaurant_cuisine || '',

            // Pricing details (amounts are already in rupees, not paise)
            amount: (order.order_total_with_tip || order.order_total || order.grand_total || 0),
            itemTotal: (order.item_total || 0),
            deliveryFee: (order.delivery_fee || 0),
            discount: (order.total_discount || order.discount || 0),
            taxes: (order.taxes || order.tax_amount || 0),
            tip: (order.tip || 0),

            // Coupon & Offers
            couponApplied: order.coupon_applied || false,
            couponCode: order.coupon_code || null,
            offerApplied: order.free_del_break_up_message || null,

            // Order items
            items: order.order_items?.map(item => ({
              name: item.name,
              quantity: item.quantity || 1,
              price: (item.price || item.final_price || 0),
              isVeg: item.is_veg || false
            })) || [],

            // Status & Payment
            status: order.order_status || 'delivered',
            paymentMethod: order.payment_method_type || order.payment_method || order.on_time || 'N/A',
            isPaid: order.is_paid || true,

            // Additional info
            orderType: order.order_type || 'delivery', // delivery, pickup, dineout, instamart
            platform: order.mweb ? 'mobile web' : order.app_version ? 'app' : 'web',
            rainMode: order.rain_mode || false
          });
        });

        // Get last order ID for pagination
        const lastOrder = orders[orders.length - 1];
        lastOrderId = lastOrder.order_id || lastOrder.order_number;

        // Check if there are more orders
        hasMore = orders.length >= 5; // Swiggy typically returns 5-10 orders per page
        pageCount++;

        console.log(`Fetched page ${pageCount}, total orders: ${allOrders.length}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        hasMore = false;
      }
    }

    if (allOrders.length > 0) {
      return {
        success: true,
        data: {
          orders: allOrders,
          user: userProfile,
          extractedAt: new Date().toISOString(),
          source: 'swiggy_api',
          totalOrders: allOrders.length
        }
      };
    } else {
      throw new Error('No orders found');
    }
  } catch (error) {
    console.error('❌ Error extracting orders:', error);
    console.error('Error details:', error.message, error.stack);

    // Return sample data on error
    return {
      success: true,
      data: {
        orders: generateSampleOrders(),
        extractedAt: new Date().toISOString(),
        source: 'sample_data_fallback',
        error: error.message,
        errorDetails: 'Check extension console for details. Make sure you are logged in to Swiggy.'
      }
    };
  }
}


// Generate sample orders for testing
function generateSampleOrders() {
  const restaurants = [
    'Pizza Hut', 'Dominos', 'KFC', 'McDonalds', 'Burger King',
    'Subway', 'Starbucks', 'Cafe Coffee Day', 'Haldirams', 'Barbeque Nation'
  ];

  const orders = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const orderDate = new Date(now);
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const amount = Math.floor(Math.random() * 800) + 150;
    const itemCount = Math.floor(Math.random() * 5) + 1;

    orders.push({
      id: `ORD${1000 + i}`,
      date: orderDate.toISOString(),
      restaurant: restaurants[Math.floor(Math.random() * restaurants.length)],
      amount: amount,
      items: Array(itemCount).fill(null).map((_, j) => ({
        name: `Item ${j + 1}`,
        price: Math.floor(amount / itemCount)
      })),
      status: 'delivered',
      paymentMethod: Math.random() > 0.5 ? 'Online' : 'COD'
    });
  }

  return orders;
}
