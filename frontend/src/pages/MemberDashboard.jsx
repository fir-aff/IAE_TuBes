import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useLazyQuery, gql } from '@apollo/client';

// 1. UPDATE QUERY: Ambil hotelName dan type
const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id
      flightCode
      hotelName      # <--- BARU
      type           # <--- BARU
      passengerName
      status
    }
  }
`;

const CHECK_PROMO = gql`
  query CheckPromo($code: String!) {
    checkPromo(code: $code) {
      code
      discount
    }
  }
`;

const CREATE_BOOKING = gql`
  mutation CreateBooking($flightCode: String!, $passengerName: String!) {
    createBooking(flightCode: $flightCode, passengerName: $passengerName) {
      id
      status
    }
  }
`;

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
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activeDiscount, setActiveDiscount] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_MY_BOOKINGS, {
    pollInterval: 1000,
    fetchPolicy: "network-only"
  });

  const [checkPromo, { loading: checkingPromo }] = useLazyQuery(CHECK_PROMO, {
    onCompleted: (data) => {
      setActiveDiscount(data.checkPromo.discount);
      alert(`🎉 Promo Berhasil! Hemat Rp ${data.checkPromo.discount.toLocaleString()}`);
    },
    onError: () => {
      setActiveDiscount(0);
      alert("❌ Kode Promo Salah / Kadaluarsa!");
    }
  });

  const [createBooking, { loading: creating }] = useMutation(CREATE_BOOKING, {
    onCompleted: () => {
      alert("✅ Tiket Berhasil Dibuat!");
      setFormData({ flightCode: '', passengerName: '' });
      refetch();
    },
    onError: (err) => alert(err.message)
  });

  const [payBooking] = useMutation(PAY_BOOKING, {
    onCompleted: () => {
      alert("✅ Pembayaran Berhasil! Status PAID.");
      refetch();
    },
    onError: (err) => alert("Gagal Bayar: " + err.message)
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.flightCode || !formData.passengerName) return;
    createBooking({ variables: formData });
  };

  const handleApplyPromo = () => {
    if (!promoCodeInput) return;
    checkPromo({ variables: { code: promoCodeInput } });
  };

  const handlePay = (booking) => {
    // LOGIKA HARGA:
    // Kalau Hotel, kita anggap harganya standard dulu (misal 1jt) atau hardcode
    // Kalau Pesawat, 1.5jt.
    // (Di real app, harga harusnya disimpan di database Booking saat create)
    
    let basePrice = 1500000; 
    if (booking.type === 'HOTEL') basePrice = 750000; // Contoh harga rata-rata hotel

    const finalPrice = basePrice - activeDiscount;

    if (window.confirm(`Bayar Booking ID ${booking.id}?\n\nItem: ${booking.type === 'HOTEL' ? booking.hotelName : booking.flightCode}\nHarga: Rp ${basePrice.toLocaleString()}\nDiskon: -Rp ${activeDiscount.toLocaleString()}\n--------------------------\nTOTAL: Rp ${finalPrice.toLocaleString()}`)) {
      payBooking({ 
        variables: { 
          bookingId: booking.id, 
          amount: finalPrice, 
          method: "OVO" 
        } 
      });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-8 text-blue-600 font-bold text-xl">
          <span className="material-symbols-outlined">flight_takeoff</span>
          TravelApp
        </div>
        <nav className="flex flex-col gap-2">
          <div onClick={() => navigate('/home')} className="p-3 text-slate-500 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-semibold flex items-center gap-3 cursor-pointer transition-all">
            <span className="material-symbols-outlined">home</span> Home
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg font-semibold flex items-center gap-3 cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </div>
          <div onClick={() => navigate('/hotels')} className="p-3 text-slate-500 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-semibold flex items-center gap-3 cursor-pointer transition-all">
            <span className="material-symbols-outlined">hotel</span> Hotels
          </div>
          <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-3 text-left w-full mt-auto">
            <span className="material-symbols-outlined">logout</span> Logout
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 md:ml-64">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Member Dashboard</h1>
          <p className="text-slate-500">Manage your bookings</p>
        </header>

        {/* PROMO */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8 shadow-lg">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">local_offer</span> 
            Punya Kode Promo?
          </h3>
          <div className="flex gap-2 max-w-md">
            <input 
              type="text" placeholder="Masukkan kode (contoh: HEMAT100)" 
              className="flex-1 p-2 rounded text-slate-900 outline-none font-bold uppercase"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
            />
            <button onClick={handleApplyPromo} disabled={checkingPromo} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded font-bold transition-colors">
              {checkingPromo ? "Cek..." : "Pakai"}
            </button>
          </div>
          {activeDiscount > 0 && (
            <div className="mt-3 bg-white/20 p-2 rounded inline-block">
              🎉 Diskon Aktif: <b>Rp {activeDiscount.toLocaleString()}</b>
            </div>
          )}
        </div>

        {/* FORM FLIGHT */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Booking Tiket Pesawat (Manual)</h2>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <input type="text" placeholder="Kode Penerbangan (ex: GA-123)" className="p-3 border rounded-lg bg-slate-50 outline-blue-500" value={formData.flightCode} onChange={(e) => setFormData({...formData, flightCode: e.target.value})}/>
            <input type="text" placeholder="Nama Penumpang" className="p-3 border rounded-lg bg-slate-50 outline-blue-500" value={formData.passengerName} onChange={(e) => setFormData({...formData, passengerName: e.target.value})}/>
            <button disabled={creating} className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Buat Tiket</button>
          </form>
        </div>

        {/* LIST BOOKING */}
        <h3 className="text-xl font-bold mb-4 text-slate-800">Riwayat Perjalanan</h3>
        <div className="grid gap-4 max-w-4xl">
          {data && data.myBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                
                {/* LOGIKA IKON & JUDUL */}
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${booking.type === 'HOTEL' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  <span className="material-symbols-outlined">
                    {booking.type === 'HOTEL' ? 'hotel' : 'airplane_ticket'}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-slate-800">
                    {/* Kalau Hotel, tampilkan Nama Hotel. Kalau Flight, tampilkan Kode Flight */}
                    {booking.type === 'HOTEL' ? booking.hotelName : booking.flightCode}
                  </h4>
                  <p className="text-slate-500 text-sm">{booking.passengerName}</p>
                  <p className="text-xs text-slate-400">ID: {booking.id} • {booking.type}</p>
                </div>

              </div>
              
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  booking.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status}
                </span>

                {booking.status === 'BOOKED' && (
                  <button onClick={() => handlePay(booking)} className="block mt-2 text-sm font-bold text-blue-600 hover:underline">
                    Bayar Sekarang
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}