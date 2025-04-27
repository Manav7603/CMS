// src/components/pages/PremiumPage.jsx
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth'; // Import Firebase auth
import '../../styles/Premium.css';
import { SERVER_URL } from '../../Urls';

function loadRazorpay(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

const PremiumPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    // Get current Firebase user
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user has premium
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch(`${SERVER_URL}/api/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          console.log('Premium status:', data.isPremium);
          setIsPremium(data.isPremium);
        } catch (error) {
          console.error('Error checking premium status:', error);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const handlePayment = async () => {
    setLoading(true);
    
    try {
      if (!user) {
        alert('You must be logged in to purchase premium');
        window.location.href = '/login';
        return;
      }
      
      const res = await loadRazorpay('https://checkout.razorpay.com/v1/checkout.js');

      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Create order using your backend API
      const orderData = await fetch(`${SERVER_URL}/api/payments/create-order`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
      });

      const options = {
        key: 'rzp_test_7fKV0KbLoMjeCL', // Razorpay Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CMS Premium',
        description: 'Unlock Premium Features',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Get a fresh token
            const verifyToken = await user.getIdToken(true);
            
            const verifyRes = await fetch(`${SERVER_URL}/api/payments/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${verifyToken}`,
              },
              body: JSON.stringify({
                orderId: orderData.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            }).then(res => res.json());

            if (verifyRes.status === 'success') {
              // Show stylish success notification instead of alert
              setShowSuccess(true);
              setIsPremium(true);
              
              // Redirect after 3 seconds
              setTimeout(() => {
                window.location.href = '/home';
              }, 3000);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Something went wrong. Please contact support.');
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#4C6FFF"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success notification component
  const SuccessNotification = () => (
    <div className="success-notification">
      <div className="success-icon">✓</div>
      <h2>Payment Successful!</h2>
      <p>Your premium features are now unlocked.</p>
      <p>Redirecting to home page...</p>
    </div>
  );

  // If user already has premium, show a different message
  if (isPremium && !showSuccess) {
    return (
      <div className="premium-page">
        <div className="premium-container">
          <h1 className="premium-title">You Already Have Premium!</h1>
          <div className="premium-active">
            <div className="premium-icon">👑</div>
            <h2>Premium Active</h2>
            <p>You're already enjoying all premium features.</p>
            <button className="back-button" onClick={() => window.location.href = '/home'}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page">
      {showSuccess ? (
        <SuccessNotification />
      ) : (
        <div className="premium-container">
          <h1 className="premium-title">Upgrade to Premium</h1>
          
          <div className="premium-features">
            <div className="feature">
              <div className="feature-icon">✨</div>
              <h3>Advanced Templates</h3>
              <p>Access our library of professional templates</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Unlimited Projects</h3>
              <p>Create as many projects as you need</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🚀</div>
              <h3>Priority Support</h3>
              <p>Get help when you need it most</p>
            </div>
          </div>
          
          <div className="pricing">
            <h2>$9.99<span>/month</span></h2>
          </div>
          
          <button 
            className={`premium-button ${loading ? 'loading' : ''}`}
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
          
          <p className="guarantee">30-day money-back guarantee</p>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;