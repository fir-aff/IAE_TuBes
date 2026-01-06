import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

// 1. QUERY: Ambil daftar booking milik user sendiri
const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id
      flightCode
      passengerName
      status
      # createdAt
    }
  }
`;

// 2. MUTATION: Bikin booking baru
const CREATE_BOOKING = gql`
  mutation CreateBooking($flightCode: String!, $passengerName: String!) {
    createBooking(flightCode: $flightCode, passengerName: $passengerName) {
      id
      status
    }
  }
`;

// 3. MUTATION: Bayar Tiket
const PAY_BOOKING = gql`
  mutation PayBooking($bookingId: String!, $amount: Int!, $method: String!) {
    payBooking(bookingId: $bookingId, amount: $amount, method: $method) {
      id
      status
    }
  }
`;

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ flightCode: '', passengerName: '' });

  // Cek Login
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/'; // Redirect paksa jika tidak ada token
  }

  // Hook untuk mengambil data booking (Load otomatis saat halaman dibuka)
 const { data, loading, error, refetch } = useQuery(GET_MY_BOOKINGS, {
    pollInterval: 500,
    fetchPolicy: "network-only" 
  });

  // Hook untuk create booking
  const [createBooking, { loading: creating }] = useMutation(CREATE_BOOKING, {
    onCompleted: () => {
      alert("Ticket Created Successfully! ✅");
      setFormData({ flightCode: '', passengerName: '' }); // Reset form
      refetch(); // Refresh tabel otomatis tanpa reload page
    },
    onError: (err) => {
      alert("Failed to create ticket: " + err.message);
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.flightCode || !formData.passengerName) {
      alert("Please fill all fields");
      return;
    }
    createBooking({ 
      variables: { 
        flightCode: formData.flightCode, 
        passengerName: formData.passengerName 
      } 
    });
  };

  const [payBooking, { loading: paying }] = useMutation(PAY_BOOKING, {
    onCompleted: () => {
      alert("Payment Successful! 💸");
      
      // KITA KASIH JEDA 0.5 DETIK SEBELUM REFRESH DATA
      setTimeout(() => {
        refetch(); 
      }, 500); 
    },
    onError: (err) => {
      alert("Payment Failed: " + err.message);
    }
  });

  // Fungsi yang dipanggil saat tombol Pay Now diklik
  const handlePay = (id) => {
    // Data Dummy (Sesuai Postman kamu)
    const amount = 1500000;
    const method = "OVO";

    if (window.confirm(`Pay Rp 1.500.000 via OVO for Ticket ID: ${id}?`)) {
      payBooking({ 
        variables: { 
          bookingId: id,   // <-- Variabel 1
          amount: amount,  // <-- Variabel 2 (WAJIB ADA)
          method: method   // <-- Variabel 3 (WAJIB ADA)
        } 
      });
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex font-display text-slate-900 dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-8 text-primary font-bold text-xl">
          <span className="material-symbols-outlined">flight_takeoff</span>
          TravelApp
        </div>
        <nav className="flex flex-col gap-2">
          <div className="p-3 bg-primary/10 text-primary rounded-lg font-semibold flex items-center gap-3 cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </div>
          <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-3 text-left w-full mt-auto">
            <span className="material-symbols-outlined">logout</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Member Dashboard</h1>
            <p className="text-slate-500">Manage your trips and bookings</p>
          </div>
        </header>

        {/* --- FORM CREATE BOOKING --- */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            Manual Flight Booking
          </h2>
          
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold mb-1">Flight Code</label>
              <input 
                type="text" 
                placeholder="e.g. GA-123" 
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                value={formData.flightCode}
                onChange={(e) => setFormData({...formData, flightCode: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Passenger Name</label>
              <input 
                type="text" 
                placeholder="Full Legal Name" 
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                value={formData.passengerName}
                onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={creating}
              className="bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              {creating ? "Processing..." : "Create Ticket"}
            </button>
          </form>
        </div>

        {/* --- LIST BOOKING (Supaya terlihat hasilnya) --- */}
        <div className="max-w-4xl">
          <h3 className="text-xl font-bold mb-4">Your Booking History</h3>
          
          {loading && <p>Loading data...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          
          <div className="grid gap-4">
            {data && data.myBookings.length === 0 && (
              <p className="text-slate-500 italic">No bookings found. Try creating one above!</p>
            )}

            {data && data.myBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">airplane_ticket</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{booking.flightCode}</h4>
                    <p className="text-sm text-slate-500">{booking.passengerName}</p>
                    <p className="text-xs text-slate-400">ID: {booking.id}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    booking.status === 'PAID' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                  
                  {booking.status === 'BOOKED' && (
                    <button 
                      onClick={() => handlePay(booking.id)}
                      disabled={paying}
                      className="block mt-2 text-sm text-secondary font-bold hover:underline disabled:opacity-50"
                    >
                      {paying ? "Paying..." : "Pay Now"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}